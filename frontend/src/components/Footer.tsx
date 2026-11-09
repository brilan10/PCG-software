export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-4 py-10 text-center text-sm text-slate-500">
      <p>PCG SPA · Soluciones informáticas · Garantía técnica de 30 días sobre los trabajos.</p>
      <p className="mt-1">© {new Date().getFullYear()} PCG SPA. Todos los derechos reservados.</p>
    </footer>
  )
}

