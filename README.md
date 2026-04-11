# LeadGen Content Engine

AI-powered social media content generator for LinkedIn & Facebook lead generation.

## Features

- **AI Content Generation** — Uses OpenRouter API to generate platform-optimized posts via Claude, GPT-4o, Gemini, Llama, and more
- **AI Image Generation** — Generate images with GPT Image 1, FLUX 1.1 Pro, Gemini Flash, Stable Diffusion 3.5, and FLUX Schnell
- **Branded Image Cards** — Canvas-based stat cards, quote cards, and multi-image sets with your brand colors
- **Dual Image Mode** — Switch between instant branded cards and AI-generated images
- **Content Calendar** — Weekly posting schedule with engagement checklist
- **Brand Presets** — Comes with Steadfast Physician Partners preset; customize for any business
- **Live/Demo Mode** — Works without an API key (demo mode) or with your OpenRouter key (live AI)
- **Save & Export** — Save generated posts and export as JSON

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
│   │   ├── CalendarPage.jsx
│   │   ├── GeneratePage.jsx
│   │   ├── Header.jsx
│   │   ├── ImageStudioPage.jsx
│   │   ├── NavBar.jsx
│   │   ├── SavedPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── Toast.jsx
│   ├── hooks/
│   │   └── useToast.js
│   ├── presets/
│   │   ├── blank.js
│   │   ├── mockPosts.js
│   │   └── steadfast.js
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
