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

    // Build power sensor map: switch.plug_name -> watts
    const powerSensorMap = new Map<string, number>();
    for (const s of rawStates) {
      if (s.entity_id.startsWith('sensor.') && s.entity_id.endsWith('_power')) {
        const watts = parseFloat(s.state);
        if (!isNaN(watts)) {
          const slug = s.entity_id.replace('sensor.', '').replace('_power', '');
          powerSensorMap.set(`switch.${slug}`, watts);
          powerSensorMap.set(`light.${slug}`, watts);
        }
      }
    }

    // Filter to lights and switches only
    const relevantDomains = ['light', 'switch'];
    const relevantStates = rawStates.filter((s) =>
      relevantDomains.includes(s.entity_id.split('.')[0])
    );

    // Transform to our types
    const transformEntity = (raw: RawState): HomeAssistantEntity => {
      const domain = raw.entity_id.split('.')[0] as 'light' | 'switch';
      return {
        entity_id: raw.entity_id,
        domain,
        state: raw.state,
        friendly_name: (raw.attributes?.friendly_name as string) || raw.entity_id,
        brightness: domain === 'light' ? (raw.attributes?.brightness as number | undefined) : undefined,
        power_consumption: powerSensorMap.get(raw.entity_id),
        last_changed: raw.last_changed,
      };
    };

    // Group by area
    const areaGroups = new Map<string, { area_id: string; area_name: string; entities: HomeAssistantEntity[] }>();

    for (const raw of relevantStates) {
      const entity = transformEntity(raw);
      const areaInfo = entityAreaMap.get(raw.entity_id);
      const key = areaInfo?.area_id || '__unassigned__';
      const name = areaInfo?.area_name || 'Non assigné';

      if (!areaGroups.has(key)) {
        areaGroups.set(key, { area_id: key, area_name: name, entities: [] });
      }
      areaGroups.get(key)!.entities.push(entity);
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
