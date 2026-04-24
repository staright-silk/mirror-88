import { useState } from 'react'
import { generateShadowDecision, generateDebateReply } from '../lib/claude'
import { saveDecision } from '../lib/localStore'

function scoreColor(s) {
  if (s >= 70) return '#34d399'
  if (s >= 45) return '#f59e0b'
  return '#f87171'
}

function ConfBar({ value, color }) {
  return (
    <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.08)', marginTop:'0.75rem', overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${value}%`, background:`linear-gradient(90deg,${color},${color}88)`, borderRadius:2, transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)' }}/>
    </div>
  )
}

function NumberBadge({ n, color }) {
  return (
    <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.9rem', color, flexShrink:0 }}>
      {n}
    </div>
  )
}

export default function ShadowTab({ persona, userId }) {
  const [query,   setQuery]   = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [debate,  setDebate]  = useState([])
  const [debInput,setDebInput]= useState('')
  const [debLoading,setDebL]  = useState(false)
  const [showDebate,setShowD] = useState(false)

  async function simulate() {
    if (!query.trim()) return
    setLoading(true); setResult(null); setDebate([]); setShowD(false)
    try {
      const r = await generateShadowDecision(persona, query)
      setResult({ ...r, query })
      await saveDecision(userId, { ...r, query })
    } catch {
      setResult({ query, pastChoice:'Take the comfortable path', pastReason:'Your patterns show you default to comfort when under pressure.', pastConf:68, twinChoice:'Pause and prioritize', twinReason:'You said you optimize for meaningful output — adding load now contradicts that.', twinConf:79, initialDebateOpening:"You've said this before. Two weeks later you regretted it." })
    }
    finally { setLoading(false) }
  }

  function startDebate() {
    if (!result) return
    setDebate([{ role:'twin', content: result.initialDebateOpening || "Tell me why you disagree — I'll use your own words to respond." }])
    setShowD(true)
  }

  async function sendDebate() {
    const msg = debInput.trim(); if (!msg) return
    setDebInput('')
    const next = [...debate, { role:'user', content:msg }]
    setDebate(next); setDebL(true)
    try {
      const reply = await generateDebateReply(persona, result, next)
      setDebate([...next, { role:'twin', content:reply }])
    } catch {
      setDebate([...next, { role:'twin', content:'Your own data tells a different story.' }])
    } finally { setDebL(false) }
  }

  return (
    <div style={{ maxWidth:900 }} className="fade-up">

      {/* HEADER STEPS — PPT slide 7 style */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { n:1, label:'You Decide', desc:'Type any choice you face. Your twin observes in parallel.', color:'rgba(255,255,255,0.5)' },
          { n:2, label:'Twin Evaluates', desc:'Independent analysis. Pattern recognition. Value alignment check.', color:'var(--amber)' },
          { n:3, label:'Compare & Debate', desc:'See both paths. If you disagree, your twin argues back.', color:'#818cf8' },
        ].map(s => (
          <div key={s.n} className="panel" style={{ display:'flex', gap:'0.85rem', alignItems:'flex-start' }}>
            <NumberBadge n={`0${s.n}`} color={s.color} />
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.9rem', marginBottom:'0.3rem' }}>{s.label}</div>
              <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="panel" style={{ marginBottom:'1rem' }}>
        <div className="panel-label">Your Decision</div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <input className="input" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&simulate()} placeholder="Should I take this project even though I'm overwhelmed? Should I move cities? Should I quit?" />
          <button className="btn btn-amber" onClick={simulate} disabled={loading||!query.trim()} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
            {loading ? <><span className="spinner"/>Simulating...</> : 'Simulate →'}
          </button>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="fade-up">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>

            {/* PAST YOU */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'1.25rem' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'rgba(255,255,255,0.3)', marginBottom:'0.75rem', fontFamily:'Outfit,sans-serif' }}>Past You Would</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'0.6rem' }}>{result.pastChoice}</div>
              <div style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>{result.pastReason}</div>
              <ConfBar value={result.pastConf} color="rgba(255,255,255,0.5)" />
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.25)', marginTop:'0.4rem' }}>{result.pastConf}% pattern match</div>
            </div>

            {/* TWIN */}
            <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:16, padding:'1.25rem', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:'radial-gradient(circle,rgba(245,158,11,0.12),transparent)', borderRadius:'50%', transform:'translate(20px,-20px)' }}/>
              <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'var(--amber)', marginBottom:'0.75rem', fontFamily:'Outfit,sans-serif' }}>Twin Recommends</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:'0.6rem', color:'var(--amber)' }}>{result.twinChoice}</div>
              <div style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>{result.twinReason}</div>
              <ConfBar value={result.twinConf} color="#f59e0b" />
              <div style={{ fontSize:'0.68rem', color:'rgba(245,158,11,0.5)', marginTop:'0.4rem' }}>{result.twinConf}% value alignment</div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {!showDebate && (
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', marginBottom:'1rem' }}>
              <button className="btn btn-ghost" onClick={startDebate} style={{ borderColor:'rgba(239,68,68,0.3)', color:'#f87171' }}>
                I Disagree — Debate My Twin ↗
              </button>
              <button className="btn btn-amber" onClick={()=>setResult(null)}>
                Accept & Move On
              </button>
            </div>
          )}

          {/* DEBATE ARENA */}
          {showDebate && (
            <div className="panel fade-up">
              <div className="panel-label">Twin Conflict</div>
              <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:12, padding:'1rem', maxHeight:320, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
                {debate.map((m,i) => (
                  <div key={i} style={{ maxWidth:'80%', alignSelf: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color: m.role==='user' ? 'rgba(245,158,11,0.7)' : 'rgba(129,140,248,0.8)', marginBottom:'0.3rem', fontFamily:'Outfit,sans-serif' }}>
                      {m.role==='user' ? 'You' : '◈ Twin'}
                    </div>
                    <div style={{ background: m.role==='user' ? 'rgba(245,158,11,0.1)' : 'rgba(129,140,248,0.1)', border: `1px solid ${m.role==='user' ? 'rgba(245,158,11,0.2)' : 'rgba(129,140,248,0.2)'}`, borderRadius:10, padding:'0.7rem 0.9rem', fontSize:'0.86rem', color:'rgba(255,255,255,0.8)', lineHeight:1.65 }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {debLoading && <div style={{ alignSelf:'flex-start', padding:'0.5rem', color:'rgba(255,255,255,0.3)', fontSize:'0.8rem', display:'flex', gap:'0.4rem', alignItems:'center' }}>◈ Twin thinking <div className="typing-dots"><span/><span/><span/></div></div>}
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <input className="input" value={debInput} onChange={e=>setDebInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendDebate()} placeholder="Push back..." />
                <button className="btn btn-iris" onClick={sendDebate} disabled={debLoading||!debInput.trim()} style={{ flexShrink:0 }}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
