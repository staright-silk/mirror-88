import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { generatePersona } from '../lib/claude'
import { savePersona } from '../lib/localStore'

const QS = [
  { q:'What do you value most in life?',                      hint:'Family, freedom, impact, craft — be honest, not aspirational.' },
  { q:'What is your biggest current struggle or tension?',    hint:'What is pulling you in two directions right now?' },
  { q:'Describe a decision you are proud of.',               hint:'Why does it reflect who you truly are?' },
  { q:'Describe a decision you regret.',                     hint:'What does it reveal about your blind spots?' },
  { q:'What do you want to optimize for in the next 30 days?', hint:'Specific — not "be happier" but exactly how.' },
  { q:'What drains your energy most?',                       hint:'People, tasks, or situations that leave you depleted.' },
  { q:'What does your ideal day look like?',                 hint:'Hour by hour — this tells the twin your natural rhythm.' },
]

function ProgressBar({ step, total }) {
  return (
    <div style={{ display:'flex', gap:5, marginBottom:'2.5rem' }}>
      {Array.from({length:total}).map((_,i) => (
        <div key={i} style={{ flex:1, height:2, borderRadius:2, background: i<step ? 'var(--amber)' : i===step ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
      ))}
    </div>
  )
}

function GeneratingView() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'2rem', position:'relative', zIndex:1 }}>
      <div style={{ position:'relative', width:120, height:120 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.4)', animation:'pulse-ring 1.6s ease-out infinite' }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.2)', animation:'pulse-ring 1.6s ease-out 0.5s infinite' }}/>
        <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'radial-gradient(circle at 35% 30%, rgba(245,158,11,0.3), rgba(129,140,248,0.2), transparent)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(245,158,11,0.3)' }}>
          <span style={{ fontSize:'2rem' }}>◈</span>
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:700, marginBottom:'0.5rem' }}>Synthesizing your twin...</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.88rem' }}>Mapping your values · Identifying patterns · Building your mirror</div>
      </div>
    </div>
  )
}

function PersonaReveal({ persona, onEnter }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:600 }} className="fade-up">
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'var(--amber)', marginBottom:'0.75rem', fontFamily:'Outfit,sans-serif' }}>Twin Genesis Complete</div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'2rem', fontWeight:800, lineHeight:1.2, marginBottom:'0.5rem' }}>Your mirror is ready.</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.9rem' }}>This is how Mirror sees you. It won't always be comfortable.</div>
        </div>

        <div style={{ background:'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(129,140,248,0.06))', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'1.75rem', marginBottom:'1.5rem' }}>
          <Section label="Core Values">
            <div>{persona.coreValues?.map(v=><span key={v} className="tag tag-amber">{v}</span>)}</div>
          </Section>
          <Section label="How You Make Decisions">
            <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.65)', lineHeight:1.75 }}>{persona.decisionStyle}</p>
          </Section>
          <Section label="Blind Spots">
            <div>{persona.blindSpots?.map(v=><span key={v} className="tag tag-red">{v}</span>)}</div>
          </Section>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginTop:'0.5rem' }}>
            <StatBox label="Dominant Emotion" value={persona.dominantEmotion} />
            <StatBox label="Risk Appetite" value={persona.riskAppetite} capitalize />
            <StatBox label="Optimizes For" value={persona.optimizes_for} />
          </div>
        </div>

        <div style={{ background:'rgba(192,132,252,0.06)', border:'1px solid rgba(192,132,252,0.2)', borderRadius:14, padding:'1.1rem 1.4rem', marginBottom:'1.75rem' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'rgba(192,132,252,0.8)', marginBottom:'0.5rem', fontFamily:'Outfit,sans-serif' }}>30-Day Projection</div>
          <p style={{ fontSize:'0.88rem', color:'rgba(255,255,255,0.6)', lineHeight:1.7, fontStyle:'italic' }}>{persona.projected30Days}</p>
        </div>

        <button className="btn btn-amber" onClick={onEnter} style={{ width:'100%', fontSize:'1rem', padding:'1rem' }}>
          Enter Mirror →
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom:'1.25rem' }}>
      <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'rgba(255,255,255,0.3)', marginBottom:'0.5rem', fontFamily:'Outfit,sans-serif' }}>{label}</div>
      {children}
    </div>
  )
}

function StatBox({ label, value, capitalize }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'0.75rem' }}>
      <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.3)', marginBottom:'0.35rem', fontFamily:'Outfit,sans-serif' }}>{label}</div>
      <div style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.8)', fontWeight:600, fontFamily:'Outfit,sans-serif', textTransform: capitalize?'capitalize':'none' }}>{value}</div>
    </div>
  )
}

export default function OnboardingPage() {
  const [step,      setStep]   = useState(0)
  const [answers,   setAns]    = useState(Array(QS.length).fill(''))
  const [generating, setGen]   = useState(false)
  const [persona,   setPersona]= useState(null)
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  function setAnswer(v) { setAns(a => { const n=[...a]; n[step]=v; return n }) }

  async function next() {
    if (step < QS.length - 1) { setStep(s=>s+1); return }
    setGen(true)
    try {
      const p = await generatePersona(answers, QS.map(q=>q.q))
      setPersona(p)
    } catch {
      setPersona({ coreValues:['Authenticity','Growth','Connection'], decisionStyle:'You weigh long-term impact heavily but sacrifice it for short-term comfort under stress.', blindSpots:['Overcommitting','Avoiding hard conversations'], dominantEmotion:'Ambition', riskAppetite:'medium', optimizes_for:'meaningful output', twinPersonality:'Direct and honest. Uses your own words against you when you drift from your values.', projected30Days:'On current trajectory, surface-level goals get accomplished while deeper work stays deferred. The gap between who you say you are and what you do will widen.' })
    } finally { setGen(false) }
  }

  async function enter() {
    await savePersona(user.id, persona)
    await refreshProfile()
    navigate('/dashboard')
  }

  if (generating) return <GeneratingView />
  if (persona)    return <PersonaReveal persona={persona} onEnter={enter} />

  const q = QS[step]
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:560 }} className="fade-up">
        <ProgressBar step={step} total={QS.length} />

        <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'var(--amber)', marginBottom:'1rem', fontFamily:'Outfit,sans-serif' }}>
          Question {step+1} of {QS.length}
        </div>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.5rem', fontWeight:700, lineHeight:1.35, marginBottom:'0.6rem' }}>
          {q.q}
        </div>
        <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem', lineHeight:1.6 }}>
          {q.hint}
        </div>

        <textarea
          className="textarea"
          value={answers[step]}
          onChange={e=>setAnswer(e.target.value)}
          placeholder="Write honestly — your twin learns from this..."
          style={{ minHeight:110, marginBottom:'1.5rem' }}
          autoFocus
        />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {step > 0
            ? <button className="btn btn-ghost" onClick={()=>setStep(s=>s-1)}>← Back</button>
            : <span/>
          }
          <button className="btn btn-amber" onClick={next}>
            {step === QS.length-1 ? 'Generate My Twin →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
