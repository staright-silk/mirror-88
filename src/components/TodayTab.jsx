import { useState, useEffect } from 'react'
import { generateTwinCommentary, computeAlignmentScore } from '../lib/claude'
import { saveDayLog, getDayLogs } from '../lib/localStore'

const MOODS = ['😤','😐','🙂','😊','🔥']

function scoreColor(s) {
  if (s >= 70) return '#34d399'
  if (s >= 45) return '#f59e0b'
  return '#f87171'
}

/* Amber gem gauge — inspired by PPT slide 6 */
function GemGauge({ score }) {
  const color = scoreColor(score)
  const pct   = score / 100
  const angle = Math.PI + pct * Math.PI
  const cx=90, cy=88, r=66
  const sx = cx + r * Math.cos(Math.PI)
  const sy = cy + r * Math.sin(Math.PI)
  const ex = cx + r * Math.cos(0)
  const ey = cy + r * Math.sin(0)
  const nx = cx + r * Math.cos(angle)
  const ny = cy + r * Math.sin(angle)

  const label = score >= 70 ? 'Aligned' : score >= 45 ? 'Drifting' : 'Diverged'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0.5rem 0' }}>
      <svg viewBox="0 0 180 110" style={{ width:200, filter:`drop-shadow(0 0 18px ${color}44)` }}>
        <defs>
          <radialGradient id="g-bg" cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.08"/>
            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r+12} fill="url(#g-bg)" />
        <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round"/>
        <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"/>
        <circle cx={nx} cy={ny} r="5" fill={color} style={{ filter:`drop-shadow(0 0 6px ${color})` }}/>
        {/* Center gem facets */}
        <polygon points={`${cx},${cy-18} ${cx+14},${cy-6} ${cx+14},${cy+10} ${cx},${cy+18} ${cx-14},${cy+10} ${cx-14},${cy-6}`} fill="rgba(255,255,255,0.03)" stroke={color} strokeWidth="0.5" strokeOpacity="0.4"/>
        <line x1={cx} y1={cy-18} x2={cx} y2={cy+18} stroke={color} strokeWidth="0.3" strokeOpacity="0.3"/>
        <line x1={cx-14} y1={cy} x2={cx+14} y2={cy} stroke={color} strokeWidth="0.3" strokeOpacity="0.3"/>
      </svg>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'3rem', fontWeight:900, lineHeight:1, color, letterSpacing:'-2px', marginTop:'-0.5rem' }}>{score}</div>
      <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginTop:'0.3rem' }}>alignment score</div>
      <div style={{ marginTop:'0.6rem', padding:'4px 14px', borderRadius:100, background:`${color}18`, border:`1px solid ${color}44`, fontSize:'0.72rem', fontWeight:600, color, fontFamily:'Outfit,sans-serif', letterSpacing:'0.5px' }}>{label}</div>
    </div>
  )
}

export default function TodayTab({ persona, userId }) {
  const [mood,      setMood]    = useState('')
  const [decision,  setDec]     = useState('')
  const [timeSpent, setTime]    = useState('')
  const [goalProg,  setGoal]    = useState('')
  const [score,     setScore]   = useState(70)
  const [commentary,setComm]    = useState("Log something about your day and I'll reflect it back to you.")
  const [loading,   setLoading] = useState(false)
  const [logs,      setLogs]    = useState([])

  useEffect(() => {
    getDayLogs(userId).then(({ data }) => {
      if (data?.length) {
        setLogs(data.slice(0,3))
        setScore(data[0].alignment_score || 70)
        setComm(data[0].twin_commentary || commentary)
      }
    })
  }, [userId])

  async function submit() {
    if (!decision && !timeSpent && !goalProg) return
    setLoading(true)
    const newScore = computeAlignmentScore(persona, { decision, timeSpent, goalProgress:goalProg }, score)
    try {
      const twin = await generateTwinCommentary(persona, { decision, timeSpent, goalProgress:goalProg, mood })
      setComm(twin); setScore(newScore)
      await saveDayLog(userId, { mood, decision, timeSpent, goalProgress:goalProg, alignmentScore:newScore, twinCommentary:twin })
      setDec(''); setTime(''); setGoal(''); setMood('')
      const { data } = await getDayLogs(userId)
      if (data) setLogs(data.slice(0,3))
    } catch { setComm('Entry recorded. Keep going.'); setScore(newScore) }
    finally  { setLoading(false) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', maxWidth:1100 }} className="fade-up">

      {/* LOG PANEL */}
      <div className="panel">
        <div className="panel-label">Log Today</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
          <div>
            <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'1px', fontFamily:'Outfit,sans-serif', fontWeight:600 }}>Mood</div>
            <div style={{ display:'flex', gap:6 }}>
              {MOODS.map(m => (
                <button key={m} onClick={()=>setMood(mood===m?'':m)} style={{ flex:1, background: mood===m ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: mood===m ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'0.5rem', fontSize:'1.1rem', cursor:'pointer', transition:'all 0.2s' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <input className="input" value={decision} onChange={e=>setDec(e.target.value)} placeholder="A decision you made today..." />
          <input className="input" value={timeSpent} onChange={e=>setTime(e.target.value)} placeholder="What consumed your time today?" />
          <input className="input" value={goalProg} onChange={e=>setGoal(e.target.value)} placeholder="Goal progress today..." />
          <button className="btn btn-amber" onClick={submit} disabled={loading} style={{ width:'100%' }}>
            {loading ? <><span className="spinner"/>Reflecting...</> : 'Reflect →'}
          </button>
        </div>
      </div>

      {/* GAUGE PANEL */}
      <div className="panel glow-amber" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div className="panel-label" style={{ alignSelf:'flex-start' }}>Alignment Score</div>
        <GemGauge score={score} />
        <div style={{ marginTop:'1rem', fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
          Based on {logs.length} log{logs.length!==1?'s':''} · updates with each entry
        </div>
      </div>

      {/* TWIN COMMENTARY */}
      <div className="panel">
        <div className="panel-label">Twin's Take</div>
        <div style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:12, padding:'1rem', fontSize:'0.87rem', color:'rgba(255,255,255,0.7)', lineHeight:1.75, minHeight:100, position:'relative' }}>
          <div style={{ fontSize:'0.55rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'2px', color:'rgba(245,158,11,0.7)', marginBottom:'0.6rem', fontFamily:'Outfit,sans-serif' }}>— YOUR TWIN</div>
          {loading
            ? <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'rgba(255,255,255,0.4)' }}><span className="spinner"/>Analyzing... <div className="typing-dots"><span/><span/><span/></div></div>
            : commentary
          }
        </div>

        {logs.length > 0 && (
          <div style={{ marginTop:'1rem' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.25)', marginBottom:'0.6rem', fontFamily:'Outfit,sans-serif' }}>Recent Entries</div>
            {logs.map((l,i) => {
              const c = scoreColor(l.alignment_score)
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.45rem 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:'0.78rem' }}>
                  <span style={{ color:c, fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>{l.alignment_score}</span>
                  <span style={{ color:'rgba(255,255,255,0.4)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{(l.decision||l.time_spent||l.goal_progress||'').substring(0,45)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
