# OM APP STORE 🚀

A ready-to-deploy Node.js Android APK store with a public storefront and protected admin upload panel.

## Features
- APK upload up to 300 MB
- App name, version, category and description
- App icon upload
- Search and category filtering
- Public APK download links
- Admin publish/delete controls
- SQLite database
- Render persistent disk support
- `/healthz` health-check endpoint

## Deploy with GitHub + Render

### 1. Create a GitHub repository
Create a new empty repository, then upload/push the contents of this folder.

Do **not** upload `.env`, `data/store.db`, APKs, or `node_modules`.

### 2. Deploy on Render
In Render, choose **New → Blueprint** and select your GitHub repository. Render will detect `render.yaml` and create the web service.

The Blueprint configures:
- Node.js build: `npm ci`
- Start command: `npm start`
- Health check: `/healthz`
- Secret `ADMIN_KEY` generated automatically
- Persistent disk mounted at `/var/data`
- Database stored under `/var/data/store.db`
- APK/icon uploads stored under `/var/data/uploads`

### 3. Open the site
After deployment:
- Store: `/`
- Admin: `/admin.html`

Your generated `ADMIN_KEY` is available in the Render service environment variables. Enter it in the Admin Key field when publishing or deleting an app.

## Local development

```bash
npm install
ADMIN_KEY="your-long-secret" npm start
```

Open `http://localhost:3000`.

## Important
Render persistent disks are required if uploaded APKs and the SQLite database must survive deploys/restarts. The included Blueprint uses a persistent disk, which may require a paid Render service depending on Render's current plan availability.

Never expose `ADMIN_KEY` in GitHub source code or commit your `.env` file.
