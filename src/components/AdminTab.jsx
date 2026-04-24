import { useState, useEffect } from 'react'
import { getAllDayLogs, getAllProfiles, adminDeleteLog } from '../lib/localStore'

function scoreColor(s) {
  if (s >= 70) return '#34d399'
  if (s >= 45) return '#f59e0b'
  return '#f87171'
}

export default function AdminTab() {
  const [logs,     setLogs]     = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: logsData }, { data: profData }] = await Promise.all([getAllDayLogs(), getAllProfiles()])
    if (logsData) setLogs(logsData)
    if (profData) {
      const map = {}
      profData.forEach(p => { map[p.id] = p })
      setProfiles(map)
    }
    setLoading(false)
  }

  async function del(id) {
    await adminDeleteLog(id)
    setLogs(l => l.filter(x => x.id !== id))
  }

  // Group by user
  const grouped = {}
  logs.forEach(l => {
    if (!grouped[l.user_id]) grouped[l.user_id] = []
    grouped[l.user_id].push(l)
  })

  if (loading) return <div style={{ padding:'3rem', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>Loading all users...</div>

  return (
    <div style={{ maxWidth:900 }} className="fade-up">
      <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'0.75rem 1.1rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'0.85rem', color:'#f87171' }}>
        ⚡ Admin View — Full visibility across all users. Handle with care.
      </div>

      {Object.entries(grouped).map(([uid, userLogs]) => {
        const prof = profiles[uid]
        const name = prof?.full_name || prof?.email || uid.slice(0,8)
        const initials = name.slice(0,2).toUpperCase()
        const avgScore = Math.round(userLogs.reduce((a,l)=>a+l.alignment_score,0)/userLogs.length)
        const c = scoreColor(avgScore)

        return (
          <div key={uid} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'1.25rem', marginBottom:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem', paddingBottom:'0.75rem', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--amber),#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'0.8rem', color:'#000', flexShrink:0 }}>{initials}</div>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.95rem' }}>{name}</div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.35)' }}>{prof?.email} · {userLogs.length} entries</div>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.2rem' }}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'1.2rem', color:c }}>{avgScore}</div>
                <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>avg alignment</div>
              </div>
            </div>

            {userLogs.map(l => {
              const lc = scoreColor(l.alignment_score)
              const text = [l.decision, l.time_spent, l.goal_progress].filter(Boolean).join(' · ')
              return (
                <div key={l.id} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', padding:'0.6rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:3, alignSelf:'stretch', borderRadius:2, background:lc, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.83rem', color:'rgba(255,255,255,0.65)', lineHeight:1.55, marginBottom:'0.2rem' }}>{text || '(no details)'}</div>
                    {l.twin_commentary && <div style={{ fontSize:'0.75rem', color:'rgba(245,158,11,0.5)', fontStyle:'italic' }}>"{l.twin_commentary.substring(0,80)}..."</div>}
                    <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.2)', marginTop:'0.2rem' }}>{new Date(l.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0 }}>
                    <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.85rem', color:lc }}>{l.alignment_score}</span>
                    <button className="btn-danger-soft" onClick={()=>del(l.id)}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.25)', fontSize:'0.88rem' }}>No user logs yet.</div>
      )}
    </div>
  )
}
