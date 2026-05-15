import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Uso Aceptable',
  description: 'Qué actividades están permitidas y prohibidas en la plataforma Domicilios.',
}

export default function AupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-extrabold text-night-800">Política de Uso Aceptable</h1>
      <p className="mt-2 text-sm text-warm-400">Última actualización: 23 de abril de 2026</p>

      <div className="prose prose-slate mt-10 max-w-none">
        <p>
          Esta política define los usos permitidos y prohibidos de la plataforma Domicilios. Al usar
          el Servicio, aceptas cumplir con estas reglas.
        </p>

        <h2>Usos permitidos</h2>
        <ul>
          <li>Vender productos físicos o digitales legales.</li>
          <li>Ofrecer servicios legítimos de comida, moda, belleza, artesanías, etc.</li>
          <li>Gestionar catálogos de múltiples negocios (agencias).</li>
          <li>Recibir pedidos y pagos de clientes finales.</li>
        </ul>

        <h2>Usos prohibidos</h2>
        <ul>
          <li>Vender productos ilegales, controlados o que infrinjan derechos de autor.</li>
          <li>Publicar contenido engañoso, fraudulento o que induzca al error.</li>
          <li>Usar el Servicio para spam, phishing o actividades maliciosas.</li>
          <li>Vender sustancias controladas, armas o material para adultos sin verificación de edad.</li>
          <li>Copiar o raspar datos de otros catálogos de la plataforma.</li>
          <li>Intentar vulnerar la seguridad del Servicio.</li>
        </ul>

        <h2>Consecuencias del incumplimiento</h2>
        <p>
          El incumplimiento puede resultar en suspensión temporal o cancelación permanente de la
          cuenta, sin reembolso. Nos reservamos el derecho de reportar actividades ilegales a las
          autoridades competentes.
        </p>

        <h2>Reporte de violaciones</h2>
        <p>
          Si detectas un catálogo que viola esta política, repórtalo a{' '}
          <a href="mailto:abuso@domicilios.app" className="text-primary-500 hover:underline">
            abuso@domicilios.app
          </a>
          .
        </p>
      </div>
    </div>
  )
}
