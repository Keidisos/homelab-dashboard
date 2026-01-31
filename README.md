# HomeLab Dashboard

A modern, self-hosted dashboard for monitoring your homelab services. Built with Next.js, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)

## Features

- **Proxmox VE** - Monitor nodes, VMs, and LXC containers
- **Docker/Portainer** - View all running containers
- **Jellyfin** - Active streams monitoring
- **Jellyseerr** - Recent media requests with posters
- **qBittorrent** - Active downloads with progress
- **Pterodactyl** - Game servers status
- **Quick Bookmarks** - Fast access to all your services

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Glassmorphism design
- **UI Components**: shadcn/ui
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React

## Quick Start with Docker

### 1. Clone the repository

```bash
git clone https://github.com/Keidisos/homelab-dashboard.git
cd homelab-dashboard
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your service credentials.

### 3. Build and run

```bash
docker-compose up -d --build
```

### 4. Access the dashboard

Open `http://your-server:3000` in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROXMOX_HOST` | Proxmox VE URL (https://ip:8006) |
| `PROXMOX_TOKEN_ID` | API Token ID (user@pam!tokenname) |
| `PROXMOX_TOKEN_SECRET` | API Token Secret |
| `PORTAINER_HOST` | Portainer URL |
| `PORTAINER_API_KEY` | Portainer API Key |
| `JELLYFIN_HOST` | Jellyfin server URL |
| `JELLYFIN_API_KEY` | Jellyfin API Key |
| `JELLYSEERR_HOST` | Jellyseerr URL |
| `JELLYSEERR_API_KEY` | Jellyseerr API Key |
| `QBITTORRENT_HOST` | qBittorrent Web UI URL |
| `QBITTORRENT_USERNAME` | qBittorrent username |
| `QBITTORRENT_PASSWORD` | qBittorrent password |
| `PTERODACTYL_HOST` | Pterodactyl panel URL |
| `PTERODACTYL_API_KEY` | Pterodactyl API Key |

See `.env.example` for the complete list including public URLs for bookmarks.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## License

MIT
