import { useState, useEffect } from 'react'
import { getDayLogs } from '../lib/localStore'

function scoreColor(s) {
  if (s >= 70) return '#34d399'
  if (s >= 45) return '#f59e0b'
  return '#f87171'
}

function fmt(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
}

export default function TimelineTab({ persona, userId }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    getDayLogs(userId).then(({ data }) => { if (data) setLogs(data) })
  }, [userId])

  const avg = logs.length ? Math.round(logs.reduce((a,l)=>a+l.alignment_score,0)/logs.length) : null
  const trend = logs.length > 1 ? (logs[0].alignment_score > logs[logs.length-1].alignment_score ? 'improving' : 'declining') : null

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.25rem', maxWidth:1000 }} className="fade-up">

      {/* TIMELINE */}
      <div className="panel">
        <div className="panel-label">Behavioral Timeline</div>
        {logs.length === 0
          ? <div style={{ textAlign:'center', padding:'3rem 1rem', color:'rgba(255,255,255,0.25)', fontSize:'0.88rem', lineHeight:1.7 }}>
              Your timeline is empty.<br/>Start logging in the Today tab to build your behavioral map.
            </div>
          : (
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:20, top:8, bottom:8, width:1, background:'rgba(255,255,255,0.08)' }}/>
              {logs.map((l,i) => {
                const c = scoreColor(l.alignment_score)
                const text = [l.decision, l.time_spent, l.goal_progress].filter(Boolean).join(' · ')
                return (
                  <div key={i} style={{ display:'flex', gap:'1rem', paddingBottom:'1.25rem', position:'relative' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:c, border:`2px solid ${c}`, flexShrink:0, marginTop:4, marginLeft:15, position:'relative', zIndex:1, boxShadow:`0 0 8px ${c}66` }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.25)', marginBottom:'0.2rem' }}>{fmt(l.created_at)}</div>
                      <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.65)', lineHeight:1.55, marginBottom:'0.35rem' }}>{text || '(no details logged)'}</div>
                      {l.twin_commentary && (
                        <div style={{ fontSize:'0.78rem', color:'rgba(245,158,11,0.6)', fontStyle:'italic', lineHeight:1.5, borderLeft:`2px solid rgba(245,158,11,0.25)`, paddingLeft:'0.6rem' }}>
                          "{l.twin_commentary.substring(0,100)}{l.twin_commentary.length>100?'...':''}"
                        </div>
                      )}
                      <span style={{ display:'inline-block', marginTop:'0.4rem', background:`${c}15`, border:`1px solid ${c}35`, borderRadius:6, padding:'2px 8px', fontSize:'0.68rem', fontWeight:700, color:c, fontFamily:'Outfit,sans-serif' }}>
                        {l.alignment_score} alignment
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* SIDEBAR */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

        {/* Projected Self — PPT slide 9 */}
        <div style={{ background:'linear-gradient(135deg, rgba(192,132,252,0.08), rgba(129,140,248,0.06))', border:'1px solid rgba(192,132,252,0.25)', borderRadius:20, padding:'1.4rem' }}>
          <div style={{ fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'2px', color:'rgba(192,132,252,0.8)', marginBottom:'0.5rem', fontFamily:'Outfit,sans-serif' }}>
            The Projected Self
          </div>
          <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'1rem', marginBottom:'0.75rem' }}>
            Your Future, Revealed.
          </div>
          <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.55)', lineHeight:1.75, fontStyle:'italic' }}>
            {persona.projected30Days || 'Complete onboarding to see your projection.'}
          </p>
          <div style={{ marginTop:'1rem', height:1, background:'rgba(255,255,255,0.06)' }}/>
          <div style={{ marginTop:'0.75rem', fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', lineHeight:1.6 }}>
            "If you continue like this, this is who you become in 30 days."
          </div>
        </div>

        {/* Stats */}
        {logs.length > 0 && (
          <div className="panel">
            <div className="panel-label">Pattern Stats</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <Stat label="Average Alignment" value={avg} color={scoreColor(avg)} suffix="/100" />
              <Stat label="Entries Logged" value={logs.length} color="rgba(255,255,255,0.7)" />
              {trend && <Stat label="Trend" value={trend==='improving' ? '↑ Improving' : '↓ Declining'} color={trend==='improving' ? '#34d399' : '#f87171'} />}
              <Stat label="Days Active" value={new Set(logs.map(l=>l.created_at?.slice(0,10))).size} color="rgba(255,255,255,0.7)" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color, suffix='' }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.9rem', color }}>{value}{suffix}</span>
    </div>
  )
}
