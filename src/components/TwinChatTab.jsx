import { useState, useRef, useEffect } from 'react'
import { generateTwinChatReply } from '../lib/claude'

function TwinAvatar({ size=32 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#f59e0b,#818cf8,#c084fc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.4, flexShrink:0, boxShadow:'0 0 12px rgba(245,158,11,0.3)' }}>
      ◈
    </div>
  )
}

export default function TwinChatTab({ persona }) {
  const [history, setHistory] = useState([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [history, loading])

  async function send() {
    const msg = input.trim(); if (!msg || loading) return
    setInput('')
    const next = [...history, { role:'user', content:msg }]
    setHistory(next); setLoading(true)
    try {
      const reply = await generateTwinChatReply(persona, next, msg)
      setHistory([...next, { role:'twin', content:reply }])
    } catch (error) {
      console.error('Twin chat error', error)
      setHistory([...next, { role:'twin', content:`Error: ${error?.message || 'Unable to query AI.'}` }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth:760, display:'flex', flexDirection:'column', height:'calc(100vh - 130px)' }} className="fade-up">

      {/* PERSONA BANNER */}
      <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(129,140,248,0.06))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'0.85rem 1.1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <TwinAvatar size={36} />
        <div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.9rem', marginBottom:'0.15rem' }}>Your Digital Twin</div>
          <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>
            {persona.coreValues?.join(' · ')} · {persona.dominantEmotion}
          </div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', fontStyle:'italic', maxWidth:200, textAlign:'right', lineHeight:1.5 }}>
          "{persona.twinPersonality?.substring(0,80)}..."
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'1rem', paddingBottom:'0.5rem' }}>
        {/* Welcome */}
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
          <TwinAvatar />
          <div>
            <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(245,158,11,0.7)', marginBottom:'0.3rem', fontFamily:'Outfit,sans-serif' }}>◈ TWIN</div>
            <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:'0 12px 12px 12px', padding:'0.8rem 1rem', fontSize:'0.88rem', color:'rgba(255,255,255,0.75)', lineHeight:1.7, maxWidth:520 }}>
              I'm your Mirror. I know your values, your patterns, your blind spots. Ask me anything — about your decisions, trajectory, contradictions. I won't tell you what you want to hear.
            </div>
          </div>
        </div>

        {history.map((m,i) => (
          <div key={i} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', flexDirection: m.role==='user'?'row-reverse':'row' }}>
            {m.role==='twin' && <TwinAvatar />}
            <div>
              <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color: m.role==='user' ? 'rgba(129,140,248,0.7)' : 'rgba(245,158,11,0.7)', marginBottom:'0.3rem', fontFamily:'Outfit,sans-serif', textAlign: m.role==='user'?'right':'left' }}>
                {m.role==='user' ? 'YOU' : '◈ TWIN'}
              </div>
              <div style={{ background: m.role==='user' ? 'rgba(129,140,248,0.1)' : 'rgba(245,158,11,0.06)', border:`1px solid ${m.role==='user'?'rgba(129,140,248,0.2)':'rgba(245,158,11,0.15)'}`, borderRadius: m.role==='user' ? '12px 0 12px 12px' : '0 12px 12px 12px', padding:'0.8rem 1rem', fontSize:'0.88rem', color:'rgba(255,255,255,0.8)', lineHeight:1.7, maxWidth:520 }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
            <TwinAvatar />
            <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:'0 12px 12px 12px', padding:'0.8rem 1.1rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'rgba(255,255,255,0.35)', fontSize:'0.8rem' }}>
              thinking <div className="typing-dots"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* INPUT */}
      <div style={{ display:'flex', gap:'0.75rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <input className="input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask your twin anything..." />
        <button className="btn btn-amber" onClick={send} disabled={loading||!input.trim()} style={{ flexShrink:0, padding:'0.8rem 1.2rem', fontSize:'1rem' }}>↑</button>
      </div>
    </div>
  )
}
