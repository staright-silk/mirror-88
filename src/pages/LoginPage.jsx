import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../lib/localStore'

/* Iridescent orb — mimics the PPT 3D holographic shapes */
function HoloOrb() {
  return (
    <svg viewBox="0 0 200 200" style={{ width:260, height:260, filter:'drop-shadow(0 0 40px rgba(245,158,11,0.4))' }}>
      <defs>
        <radialGradient id="orb-core" cx="40%" cy="35%">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.95" />
          <stop offset="30%"  stopColor="#818cf8" stopOpacity="0.8" />
          <stop offset="60%"  stopColor="#c084fc" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="orb-shine" cx="30%" cy="25%">
          <stop offset="0%"  stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Main gem shape — icosahedron approximation */}
      <polygon points="100,15 165,52 165,128 100,165 35,128 35,52" fill="url(#orb-core)" stroke="rgba(245,158,11,0.4)" strokeWidth="0.5"/>
      <polygon points="100,15 165,52 100,75" fill="rgba(251,191,36,0.3)" />
      <polygon points="100,15 35,52 100,75"  fill="rgba(129,140,248,0.25)" />
      <polygon points="165,52 165,128 100,75" fill="rgba(192,132,252,0.2)" />
      <polygon points="35,52 35,128 100,75"   fill="rgba(52,211,153,0.2)" />
      <polygon points="100,165 165,128 100,75" fill="rgba(244,114,182,0.2)" />
      <polygon points="100,165 35,128 100,75"  fill="rgba(245,158,11,0.15)" />
      {/* Shine */}
      <ellipse cx="80" cy="60" rx="30" ry="18" fill="url(#orb-shine)" />
      {/* Facet lines */}
      <line x1="100" y1="15" x2="100" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <line x1="35"  y1="52" x2="165" y2="52" stroke="rgba(255,255,255,0.1)"  strokeWidth="0.5"/>
      <line x1="35"  y1="128" x2="165" y2="128" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setSignUp]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { error: err } = await (isSignUp ? signUpWithEmail : signInWithEmail)(email, password)
      if (err) throw err
      navigate('/onboarding')
    } catch (e) { setError(e.message || 'Authentication failed.') }
    finally     { setLoading(false) }
  }

  async function google() {
    const { error: err } = await signInWithGoogle()
    if (err) setError(err.message)
  }

  return (
    <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', position:'relative', zIndex:1 }}>

      {/* LEFT — hero */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', gap:'2rem', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ animation:'float 4s ease-in-out infinite' }}>
          <HoloOrb />
        </div>
        <div style={{ textAlign:'center', maxWidth:360 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'3.5rem', fontWeight:900, lineHeight:1, letterSpacing:'-2px', marginBottom:'1rem', background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Mirror
          </div>
          <div style={{ fontSize:'1rem', color:'rgba(255,255,255,0.5)', lineHeight:1.7, fontStyle:'italic' }}>
            "A digital twin that doesn't just reflect you —<br/>it reveals who you're becoming."
          </div>
        </div>
      </div>

      {/* RIGHT — auth form */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem' }}>
        <div style={{ width:'100%', maxWidth:420 }} className="fade-up">

          <div style={{ marginBottom:'2.5rem' }}>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'1.8rem', fontWeight:800, marginBottom:'0.4rem' }}>
              {isSignUp ? 'Create your twin.' : 'Welcome back.'}
            </div>
            <div style={{ fontSize:'0.88rem', color:'rgba(255,255,255,0.4)' }}>
              {isSignUp ? 'Start your journey into self-awareness.' : 'Your twin has been waiting.'}
            </div>
          </div>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'0.65rem 1rem', fontSize:'0.82rem', color:'#f87171', marginBottom:'1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem', fontFamily:'Outfit,sans-serif' }}>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'1.5px', color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem', fontFamily:'Outfit,sans-serif' }}>Password</label>
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-amber" type="submit" disabled={loading} style={{ width:'100%', marginTop:'0.25rem', fontSize:'0.95rem' }}>
              {loading ? <><span className="spinner"/>Loading...</> : isSignUp ? 'Create Account →' : 'Enter Mirror →'}
            </button>
          </form>

          <div className="divider" style={{ margin:'1.5rem 0' }}>or continue with</div>

          <button onClick={google} style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'0.78rem', color:'rgba(255,255,255,0.8)', fontFamily:'Inter,sans-serif', fontSize:'0.88rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem', transition:'background 0.2s' }}
            onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.09)'}
            onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <div style={{ marginTop:'1.5rem', textAlign:'center', fontSize:'0.82rem', color:'rgba(255,255,255,0.3)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={()=>setSignUp(!isSignUp)} style={{ background:'none', border:'none', color:'var(--amber)', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit' }}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
