# LeadGen Content Engine

AI-powered social media content generator for LinkedIn & Facebook lead generation.

## Features

- **AI Content Generation**: uses the OpenRouter API to generate platform-optimized posts via Claude, GPT-4o, Gemini, Llama, and more
- **Build Radar**: scans for trending, data-attachable topics and pairs each with a real public dataset and a weekend build idea
- **Source-notes mode**: posts can be written strictly from your real notes, so the engine never invents first-person experience
- **AI Image Generation**: GPT Image 1, FLUX 1.1 Pro, Gemini Flash, Stable Diffusion 3.5, FLUX Schnell
- **Branded Image Cards**: canvas-based stat, quote, carousel, and data chart cards (bar/line) in your brand colors
- **Content Calendar**: weekly posting schedule with an operating checklist
- **Engagement Studio**: paste post comments, get parsed leads and templated DMs
- **Brand Presets**: ships with a personal-brand preset; customize for any business
- **Live/Demo Mode**: works without an API key (demo mode) or with your OpenRouter key (live AI)
- **Save & Export**: archive generated posts, export as JSON or text

## Quick Start

```bash
# Clone the repo
git clone https://github.com/pikeskaikru/leadgen-content-engine.git
cd leadgen-content-engine

# Install dependencies
npm install

# Add your API key
cp .env.example .env
# Edit .env and add your OpenRouter API key

# Start dev server
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_OPENROUTER_API_KEY` | Your OpenRouter API key. Get one at [openrouter.ai/keys](https://openrouter.ai/keys). Leave empty for demo mode. |

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- OpenRouter API (text + image generation)
- Canvas API (branded image cards)

## Project Structure

```
leadgen-content-engine/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ArchivePage.jsx
│   │   ├── BuildRadarPage.jsx
│   │   ├── CalendarPage.jsx
│   │   ├── EngagementPage.jsx
│   │   ├── GeneratePage.jsx
│   │   ├── Header.jsx
│   │   ├── Icon.jsx
│   │   ├── ImageStudioPage.jsx
│   │   ├── NavBar.jsx
│   │   ├── SettingsPage.jsx
│   │   └── Toast.jsx
│   ├── hooks/
│   │   └── useToast.js
│   ├── presets/
│   │   ├── blank.js
│   │   ├── databricks.js
│   │   └── mockPosts.js
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   ├── imageGenerator.js
│   │   └── openrouter.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## AI Models Available

### Text Models
- Claude Sonnet 4 (Premium)
- GPT-4o (Premium)
- Gemini 2.5 Pro (Premium)
- Claude Haiku 4 (Budget)
- GPT-4o Mini (Budget)
- Llama 4 Maverick (Budget)

### Image Models
- GPT Image 1 (Best quality)
- Gemini Flash Image (Fast + cheap)
- FLUX 1.1 Pro (Photorealistic)
- FLUX Schnell (Fastest)
- Stable Diffusion 3.5 Large

## Build for Production

```bash
npm run build
npm run preview
```

## License

MIT
