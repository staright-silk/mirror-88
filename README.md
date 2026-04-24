# Mirror — Your Living Digital Twin

> "A digital twin that doesn't just reflect you — it reveals who you're becoming."

---

## Setup (15 mins)

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
```
Fill in:
- `VITE_ANTHROPIC_API_KEY` — from console.anthropic.com

### 3. Run
```bash
npm run dev
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Onboarding** | 7 deep questions → Claude generates your Twin Persona Card |
| **Today Tab** | Log mood + decisions → Alignment Score gauge + Twin commentary |
| **Shadow Decisions** | Type any dilemma → see Past You vs Twin side-by-side + live debate |
| **Timeline** | Behavioral history + 30-day Projected Self |
| **Consult Twin** | Full chat with your twin, in character with your persona |
| **Admin** | See all users' logs, manage entries |

---

## Deploy to Vercel
```bash
npm run build
# drag the dist/ folder to vercel.com, or:
npx vercel --prod
```

Add your 3 env vars in Vercel's dashboard.

---

## ⚠️ Production Note
The Anthropic API key is currently used client-side (fine for demos/hackathons).
For production, proxy requests through a backend or edge function.
