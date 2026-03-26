# SnapBackground 🪄

> Remove image backgrounds in seconds. No signup, no downloads, completely free.

**Live Demo**: https://snap-background.pages.dev

## Features

- ✨ One-click background removal
- 📤 Drag & drop or click to upload
- 🔒 No image storage - processed in memory
- 📱 Mobile-friendly responsive design
- ⬇️ Direct PNG download

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Deployment**: Cloudflare Pages
- **API**: Cloudflare Workers + Remove.bg API
- **Styling**: Pure CSS (no framework)

## Setup

### Prerequisites

1. Node.js 18+
2. Cloudflare account
3. Remove.bg API key ([Get one here](https://www.remove.bg/api))

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Deploy to Cloudflare Pages

```bash
# Build the project
npm run build

# Deploy
npm run deploy
```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

### Environment Variables

Set these in Cloudflare Pages dashboard:

| Variable | Value |
|----------|-------|
| `REMOVE_BG_API_KEY` | Your Remove.bg API key |

## API Limits

- **Max file size**: 12MB (Remove.bg free tier)
- **Rate limit**: 50 requests/hour (Remove.bg free tier)

## Project Structure

```
snap-background/
├── app/
│   ├── api/
│   │   └── remove-background/
│   │       └── route.ts      # API endpoint
│   ├── globals.css           # Styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page
├── wrangler.toml             # Cloudflare config
├── next.config.ts
├── package.json
└── README.md
```

## License

MIT
