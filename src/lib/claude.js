const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_MODEL   = 'claude-sonnet-4-20250514'
const ANTHROPIC_KEY     = import.meta.env.VITE_ANTHROPIC_API_KEY
const GEMINI_KEY        = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL        = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-pro'

async function ask(prompt, maxTokens = 500) {
  if (GEMINI_KEY) {
    const url = '/api/gemini'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          messages: [{ author: 'user', content: [{ type: 'text', text: prompt }] }],
        },
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Gemini proxy ${res.status}: ${text}`)
    }
    const d = await res.json()
    const content = d?.candidates?.[0]?.content || d?.output?.[0]?.content || []
    return content.filter(c => c.type === 'text').map(c => c.text || '').join('') || d?.output_text || ''
  }

  if (!ANTHROPIC_KEY) throw new Error('No Anthropic or Gemini API key configured.')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: maxTokens, messages: [{ role:'user', content:prompt }] }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const d = await res.json()
  return d.content?.map(c => c.text||'').join('') || ''
}

function parseJSON(raw) {
  return JSON.parse(raw.replace(/```json|```/g,'').trim())
}

// ── PERSONA ───────────────────────────────────────────────────────────────────
export async function generatePersona(answers, questions) {
  const prompt = `You are Mirror. Generate a digital twin persona JSON. Only JSON, no markdown.

${questions.map((q,i) => `Q: ${q}\nA: ${answers[i]||'(skipped)'}`).join('\n\n')}

JSON structure:
{
  "coreValues": ["value1","value2","value3"],
  "decisionStyle": "2-3 sentences",
  "blindSpots": ["blind spot 1","blind spot 2"],
  "dominantEmotion": "one word",
  "riskAppetite": "low|medium|high",
  "optimizes_for": "short phrase",
  "twinPersonality": "2-3 sentences — opinionated, challenges complacency, uses user's own data",
  "projected30Days": "2 sentences about 30-day trajectory, slightly uncomfortable"
}`
  const raw = await ask(prompt, 800)
  return parseJSON(raw)
}

// ── TWIN COMMENTARY ───────────────────────────────────────────────────────────
export async function generateTwinCommentary(persona, log) {
  const prompt = `You are Mirror, this person's digital twin.
Values: ${persona.coreValues?.join(', ')} | Blind spots: ${persona.blindSpots?.join(', ')} | Style: ${persona.decisionStyle} | Optimizes for: ${persona.optimizes_for}

Today's log:
${log.decision ? `Decision: ${log.decision}` : ''}
${log.timeSpent ? `Time: ${log.timeSpent}` : ''}
${log.goalProgress ? `Goal: ${log.goalProgress}` : ''}
${log.mood ? `Mood: ${log.mood}` : ''}

2-3 sentences. Direct. Reference their values. Call out contradictions. Don't praise.`
  return ask(prompt, 200)
}

// ── SHADOW DECISION ───────────────────────────────────────────────────────────
export async function generateShadowDecision(persona, query) {
  const prompt = `You are Mirror, a digital twin AI. Simulate a shadow decision. Only JSON, no markdown.

Profile — Values: ${persona.coreValues?.join(', ')} | Blind spots: ${persona.blindSpots?.join(', ')} | Style: ${persona.decisionStyle} | Risk: ${persona.riskAppetite} | Optimizes: ${persona.optimizes_for}

Query: "${query}"

{
  "pastChoice": "short phrase",
  "pastReason": "1-2 sentences using blind spots",
  "pastConf": 68,
  "twinChoice": "short phrase",
  "twinReason": "1-2 sentences using stated values",
  "twinConf": 82,
  "initialDebateOpening": "1 opinionated sentence to kick off debate"
}`
  const raw = await ask(prompt, 400)
  return parseJSON(raw)
}

// ── DEBATE ────────────────────────────────────────────────────────────────────
export async function generateDebateReply(persona, decision, history) {
  const h = history.map(m => `${m.role==='user'?'User':'Twin'}: ${m.content}`).join('\n')
  const prompt = `You are Mirror, a digital twin debating with its user.
Values: ${persona.coreValues?.join(', ')} | Blind spots: ${persona.blindSpots?.join(', ')} | Style: ${persona.decisionStyle}

Decision: "${decision.query}" | Twin recommends: "${decision.twinChoice}"

${h}

Respond in 1-2 sentences. Firm. Use their values as evidence. Don't capitulate.`
  return ask(prompt, 150)
}

// ── TWIN CHAT ─────────────────────────────────────────────────────────────────
export async function generateTwinChatReply(persona, history, message) {
  const h = history.map(m => `${m.role==='user'?'User':'Twin'}: ${m.content}`).join('\n')
  const prompt = `You are Mirror — this person's digital twin. You know them deeply.
Values: ${persona.coreValues?.join(', ')} | Blind spots: ${persona.blindSpots?.join(', ')} | Style: ${persona.decisionStyle} | Emotion: ${persona.dominantEmotion} | Personality: ${persona.twinPersonality}

Opinionated. Challenge using their own values. 2-4 sentences max. Don't be agreeable for its own sake.

${h ? `History:\n${h}\n` : ''}User: ${message}

Twin:`
  return ask(prompt, 200)
}

// ── ALIGNMENT SCORE ───────────────────────────────────────────────────────────
export function computeAlignmentScore(persona, log, prev = 70) {
  let s = prev
  const text = [log.decision, log.timeSpent, log.goalProgress].filter(Boolean).join(' ').toLowerCase()
  persona.coreValues?.forEach(v => { if (text.includes(v.split(' ')[0].toLowerCase())) s += 4 })
  persona.blindSpots?.forEach(b => { if (text.includes(b.split(' ')[0].toLowerCase())) s -= 7 })
  const neg = ['overwhelmed','skipped','avoided','procrastinat','missed','behind','lazy','distracted']
  const pos = ['completed','finished','focused','shipped','achieved','progress','proud','deep work']
  neg.forEach(w => { if (text.includes(w)) s -= 5 })
  pos.forEach(w => { if (text.includes(w)) s += 4 })
  return Math.max(12, Math.min(97, Math.round(s)))
}
