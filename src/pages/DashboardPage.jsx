import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/localStore'
import TodayTab    from '../components/TodayTab'
import ShadowTab   from '../components/ShadowTab'
import TimelineTab from '../components/TimelineTab'
import TwinChatTab from '../components/TwinChatTab'
import AdminTab    from '../components/AdminTab'

const TABS = [
  { id:'today',    label:'Today',             icon:'◈' },
  { id:'shadow',   label:'Shadow Decisions',  icon:'⊕' },
  { id:'timeline', label:'Timeline',          icon:'◎' },
  { id:'twin',     label:'Consult Twin',      icon:'◇' },
]

export default function DashboardPage() {
  const [tab, setTab] = useState('today')
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'
  const persona = profile?.persona

  useEffect(() => {
    if (!loading && profile && !profile.onboarded) navigate('/onboarding')
  }, [loading, profile])

  async function logout() { await signOut(); navigate('/login') }

  const initial = (profile?.full_name || user?.email || 'U').slice(0,2).toUpperCase()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  function renderContent() {
    if (!persona) return <div style={{ padding:'3rem', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>Loading your twin...</div>
    switch(tab) {
      case 'today':    return <TodayTab    persona={persona} userId={user.id} />
      case 'shadow':   return <ShadowTab   persona={persona} userId={user.id} />
      case 'timeline': return <TimelineTab persona={persona} userId={user.id} />
      case 'twin':     return <TwinChatTab persona={persona} />
      case 'admin':    return <AdminTab />
      default:         return null
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>

      {/* HEADER */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', height:58, borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:100, gap:'1rem' }}>

        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.3rem', fontWeight:900, letterSpacing:'-0.5px', background:'linear-gradient(135deg,#f59e0b,#fb923c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', flexShrink:0 }}>
          Mirror
        </div>

        <nav style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ background: tab===t.id ? 'rgba(245,158,11,0.15)' : 'none', border:'none', borderRadius:8, padding:'0.38rem 0.9rem', color: tab===t.id ? 'var(--amber)' : 'rgba(255,255,255,0.45)', fontFamily:'Inter,sans-serif', fontSize:'0.8rem', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:'0.4rem', whiteSpace:'nowrap', fontWeight: tab===t.id ? 600 : 400 }}>
              <span style={{ fontSize:'0.7rem' }}>{t.icon}</span>{t.label}
            </button>
          ))}
          {isAdmin && (
            <button onClick={()=>setTab('admin')} style={{ background: tab==='admin' ? 'rgba(239,68,68,0.15)' : 'none', border:'none', borderRadius:8, padding:'0.38rem 0.9rem', color: tab==='admin' ? '#f87171' : 'rgba(239,68,68,0.6)', fontFamily:'Inter,sans-serif', fontSize:'0.8rem', cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}>
              ⚡ Admin
            </button>
          )}
        </nav>

        <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:50, padding:'0.3rem 0.8rem 0.3rem 0.35rem', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}
          onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.09)'}
          onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,var(--amber),var(--amber2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:800, color:'#000', fontFamily:'Outfit,sans-serif' }}>{initial}</div>
          <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', fontFamily:'Inter,sans-serif' }}>{displayName}</span>
        </button>
      </header>

      <main style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
        {renderContent()}
      </main>
    </div>
  )
}
