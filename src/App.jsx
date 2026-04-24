import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Splash() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1.5rem', background:'#000' }}>
      <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'3rem', fontWeight:800, background:'linear-gradient(135deg,#f59e0b,#fb923c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-1px' }}>Mirror</div>
      <div className="spinner" style={{ width:22, height:22 }} />
    </div>
  )
}

export default function App() {
  return (
    <>
      <div className="orb orb-amber"  style={{ top:'-150px', right:'-100px' }} />
      <div className="orb orb-blue"   style={{ bottom:'-100px', left:'-80px' }} />
      <div className="orb orb-purple" style={{ top:'40%', left:'40%' }} />
      <Routes>
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/onboarding"  element={<Guard><OnboardingPage /></Guard>} />
        <Route path="/dashboard/*" element={<Guard><DashboardPage /></Guard>} />
        <Route path="*"            element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
