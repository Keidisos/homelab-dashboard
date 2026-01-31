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

## API Configuration

### Proxmox VE

Steps to retrieve the API credentials:

1. Navigate to the Proxmox portal, click on **Datacenter**
2. Expand **Permissions**, click on **Groups**
3. Click the **Create** button
4. Name the group something informative, like `api-users`
5. Click on the **Permissions** "folder"
6. Click **Add** -> **Group Permission**
   - Path: `/`
   - Group: group from Step 4
   - Role: `PVEAuditor`
   - Propagate: ✅ Checked
7. Expand **Permissions**, click on **Users**
8. Click the **Add** button
   - User name: something informative like `api`
   - Realm: `Proxmox VE authentication server`
   - Password: create a secure password
   - Group: group from Step 4
9. Expand **Permissions**, click on **API Tokens**
10. Click the **Add** button
    - User: user from Step 8
    - Token ID: something informative like `dashboard`
    - Privilege Separation: ❌ **Unchecked**
11. **Copy the Secret** shown - it is only displayed once!
12. Go back to the **Permissions** menu
13. Click **Add** -> **API Token Permission**
    - Path: `/`
    - API Token: select the API token created in Step 10
    - Role: `PVEAuditor`
    - Propagate: ✅ Checked

Your environment variables will look like:
```
PROXMOX_HOST=https://192.168.1.100:8006
PROXMOX_TOKEN_ID=api@pve!dashboard
PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

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
