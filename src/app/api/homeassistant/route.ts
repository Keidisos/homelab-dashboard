import { NextResponse } from 'next/server';
import type { ApiResponse, HomeAssistantData, HomeAssistantEntity, HomeAssistantArea } from '@/types';
import { fetchInsecure, parseApiError } from '@/lib/fetch-ssl';

// Jinja2 template that returns area-to-entity mappings as JSON
const AREA_TEMPLATE = `{%- set ns = namespace(result=[]) -%}
{%- for area_id in areas() -%}
  {%- set entities = area_entities(area_id) -%}
  {%- set ns.result = ns.result + [{"area_id": area_id, "name": area_name(area_id), "entities": entities | list}] -%}
{%- endfor -%}
{{ ns.result | tojson }}`;

interface RawState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

interface RawArea {
  area_id: string;
  name: string;
  entities: string[];
}

async function fetchStates(host: string, token: string): Promise<RawState[]> {
  const res = await fetchInsecure(`${host}/api/states`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Home Assistant API error: ${res.status}`);
  return res.json() as Promise<RawState[]>;
}

async function fetchAreas(host: string, token: string): Promise<RawArea[]> {
  const res = await fetchInsecure(`${host}/api/template`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template: AREA_TEMPLATE }),
  });
  if (!res.ok) throw new Error(`Home Assistant template API error: ${res.status}`);
  const text = await res.text();
  return JSON.parse(text) as RawArea[];
}

// Suffixes for power consumption sensors (W)
const POWER_SUFFIXES = ['_current_power', '_power', '_wattage'];
// Suffixes for monthly energy sensors (kWh)
const ENERGY_SUFFIXES = ['_month_energy', '_monthly_energy', '_energy_monthly'];
// Suffixes for temperature sensors
const TEMPERATURE_SUFFIXES = ['_temperature', '_temp'];

function matchSensorToDevice(
  sensorId: string,
  suffixes: string[]
): { slug: string; suffix: string } | null {
  const sensorSlug = sensorId.replace('sensor.', '');
  for (const suffix of suffixes) {
    if (sensorSlug.endsWith(suffix)) {
      return { slug: sensorSlug.slice(0, -suffix.length), suffix };
    }
  }
  return null;
}

export async function GET(): Promise<NextResponse<ApiResponse<HomeAssistantData>>> {
  try {
    const host = process.env.HOMEASSISTANT_HOST;
    const token = process.env.HOMEASSISTANT_TOKEN;

    if (!host || !token) {
      throw new Error('Home Assistant configuration missing');
    }

    const [rawStates, rawAreas] = await Promise.all([
      fetchStates(host, token),
      fetchAreas(host, token),
    ]);

    // Build entity_id -> area info map
    const entityAreaMap = new Map<string, { area_id: string; area_name: string }>();
    for (const area of rawAreas) {
      for (const entityId of area.entities) {
        entityAreaMap.set(entityId, { area_id: area.area_id, area_name: area.name });
      }
    }

    // Build sensor maps from sensor.* entities
    const powerSensorMap = new Map<string, number>();
    const energySensorMap = new Map<string, number>();
    const temperatureSensors: RawState[] = [];

    for (const s of rawStates) {
      if (!s.entity_id.startsWith('sensor.')) continue;
      const value = parseFloat(s.state);
      if (isNaN(value)) continue;

      // Try matching as power sensor
      const powerMatch = matchSensorToDevice(s.entity_id, POWER_SUFFIXES);
      if (powerMatch) {
        powerSensorMap.set(`switch.${powerMatch.slug}`, value);
        powerSensorMap.set(`light.${powerMatch.slug}`, value);
        continue;
      }

      // Try matching as energy sensor
      const energyMatch = matchSensorToDevice(s.entity_id, ENERGY_SUFFIXES);
      if (energyMatch) {
        energySensorMap.set(`switch.${energyMatch.slug}`, value);
        energySensorMap.set(`light.${energyMatch.slug}`, value);
        continue;
      }

      // Check if it's a temperature sensor (standalone entity)
      const unit = s.attributes?.unit_of_measurement as string | undefined;
      const deviceClass = s.attributes?.device_class as string | undefined;
      const tempMatch = matchSensorToDevice(s.entity_id, TEMPERATURE_SUFFIXES);
      if (deviceClass === 'temperature' || unit === '°C' || unit === '°F' || tempMatch) {
        temperatureSensors.push(s);
      }
    }

    // Filter to lights, switches
    const relevantStates = rawStates.filter((s) => {
      const domain = s.entity_id.split('.')[0];
      return domain === 'light' || domain === 'switch';
    });

    // Transform light/switch entity
    const transformEntity = (raw: RawState): HomeAssistantEntity => {
      const domain = raw.entity_id.split('.')[0] as 'light' | 'switch';
      return {
        entity_id: raw.entity_id,
        domain,
        state: raw.state,
        friendly_name: (raw.attributes?.friendly_name as string) || raw.entity_id,
        brightness: domain === 'light' ? (raw.attributes?.brightness as number | undefined) : undefined,
        power_consumption: powerSensorMap.get(raw.entity_id),
        monthly_energy: energySensorMap.get(raw.entity_id),
        last_changed: raw.last_changed,
      };
    };

    // Transform temperature sensor entity
    const transformTemperatureSensor = (raw: RawState): HomeAssistantEntity => {
      const temp = parseFloat(raw.state);
      return {
        entity_id: raw.entity_id,
        domain: 'sensor',
        state: raw.state,
        friendly_name: (raw.attributes?.friendly_name as string) || raw.entity_id,
        temperature: isNaN(temp) ? undefined : temp,
        unit_of_measurement: (raw.attributes?.unit_of_measurement as string) || '°C',
        last_changed: raw.last_changed,
      };
    };

    // Group by area
    const areaGroups = new Map<string, { area_id: string; area_name: string; entities: HomeAssistantEntity[] }>();

    const addToArea = (entityId: string, entity: HomeAssistantEntity) => {
      const areaInfo = entityAreaMap.get(entityId);
      const key = areaInfo?.area_id || '__unassigned__';
      const name = areaInfo?.area_name || 'Non assigné';

      if (!areaGroups.has(key)) {
        areaGroups.set(key, { area_id: key, area_name: name, entities: [] });
      }
      areaGroups.get(key)!.entities.push(entity);
    };

    for (const raw of relevantStates) {
      addToArea(raw.entity_id, transformEntity(raw));
    }

    for (const raw of temperatureSensors) {
      addToArea(raw.entity_id, transformTemperatureSensor(raw));
    }

    // Sort areas alphabetically, "Non assigné" last
    const areas: HomeAssistantArea[] = Array.from(areaGroups.values()).sort((a, b) => {
      if (a.area_id === '__unassigned__') return 1;
      if (b.area_id === '__unassigned__') return -1;
      return a.area_name.localeCompare(b.area_name, 'fr');
    });

    // Compute summary
    const allEntities = areas.flatMap((a) => a.entities);
    const lights = allEntities.filter((e) => e.domain === 'light');
    const switches = allEntities.filter((e) => e.domain === 'switch');

    const summary = {
      totalLights: lights.length,
      lightsOn: lights.filter((e) => e.state === 'on').length,
      totalSwitches: switches.length,
      switchesOn: switches.filter((e) => e.state === 'on').length,
      totalPowerConsumption: Math.round(
        allEntities.reduce((acc, e) => acc + (e.power_consumption || 0), 0) * 10
      ) / 10,
      totalMonthlyEnergy: Math.round(
        allEntities.reduce((acc, e) => acc + (e.monthly_energy || 0), 0) * 100
      ) / 100,
    };

    return NextResponse.json({
      success: true,
      data: { areas, summary },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Home Assistant API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: parseApiError(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
