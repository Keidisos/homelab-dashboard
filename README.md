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

### Portainer

1. Log in to your Portainer instance
2. Click on your username in the top-right corner
3. Select **My Account**
4. Scroll down to **Access Tokens**
5. Click **Add access token**
6. Enter a description (e.g., `homelab-dashboard`)
7. Click **Create access token**
8. **Copy the token** - it is only displayed once!

```
PORTAINER_HOST=https://192.168.1.100:9443
PORTAINER_API_KEY=ptr_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Jellyfin

1. Log in to your Jellyfin server as an administrator
2. Go to **Dashboard** (Admin menu)
3. Navigate to **API Keys** (under Advanced)
4. Click the **+** button to create a new API key
5. Enter an app name (e.g., `homelab-dashboard`)
6. Click **OK**
7. Copy the generated API key

```
JELLYFIN_HOST=http://192.168.1.100:8096
JELLYFIN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Jellyseerr

1. Log in to your Jellyseerr instance as an administrator
2. Go to **Settings** (gear icon)
3. Navigate to **General** settings
4. Scroll down to find the **API Key** section
5. Copy the API key (or generate a new one)

```
JELLYSEERR_HOST=http://192.168.1.100:5055
JELLYSEERR_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### qBittorrent

qBittorrent uses username/password authentication for its Web UI:

1. Open qBittorrent Web UI
2. Go to **Tools** -> **Options** (or **Preferences**)
3. Navigate to **Web UI** tab
4. Note your username and password
5. Make sure **Bypass authentication for clients on localhost** is disabled if accessing remotely

```
QBITTORRENT_HOST=http://192.168.1.100:8080
QBITTORRENT_USERNAME=admin
QBITTORRENT_PASSWORD=your-password
```

### Pterodactyl

You can use either a **Client API Key** or an **Application API Key**:

#### Option 1: Client API Key (Recommended)
1. Log in to your Pterodactyl panel
2. Click on your username in the top-right corner
3. Go to **API Credentials**
4. Click **Create API Key**
5. Enter a description and optionally restrict allowed IPs
6. Click **Create**
7. Copy the API key (starts with `ptlc_`)

#### Option 2: Application API Key (Admin only)
1. Log in to the Pterodactyl admin area
2. Go to **Application API** (under Configuration)
3. Click **Create New**
4. Enter a description
5. Set permissions (at minimum: Servers - Read)
6. Click **Create Credentials**
7. Copy the API key (starts with `ptla_`)

```
PTERODACTYL_HOST=https://panel.example.com
PTERODACTYL_API_KEY=ptlc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
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
