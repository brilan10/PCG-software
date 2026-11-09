import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import TeamCards from '@/components/TeamCards'
import QuickAccess from '@/components/QuickAccess'
import Timeline from '@/components/Timeline'
import Footer from '@/components/Footer'

export default function Landing() {
  return (
    <div id="top" className="bg-slate-900">
      <Navbar />
      <main className="pt-16">
        {/* 1. Presentación del personal primero (tarjetas arrastrables) */}
        <TeamCards />
        {/* 2. Accesos directos (Solicitar ticket -> login/registro, Estado de equipo, Alertas) */}
        <QuickAccess />
        {/* 3. Cloud Hero con vista previa del Dashboard / Planner */}
        <Hero />
        {/* 4. Línea de tiempo del servicio */}
        <Timeline />
      </main>
      <Footer />
    </div>
  )
}
