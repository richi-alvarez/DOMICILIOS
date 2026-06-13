import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo recopilamos, usamos y protegemos tu información personal en WaCommerce.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-extrabold text-night-800">Política de Privacidad</h1>
      <p className="mt-2 text-sm text-warm-400">Última actualización: 23 de abril de 2026</p>

      <div className="prose prose-slate mt-10 max-w-none">
        <h2>1. Información que recopilamos</h2>
        <p>Recopilamos la siguiente información cuando usas WaCommerce:</p>
        <ul>
          <li><strong>Información de cuenta:</strong> nombre, correo electrónico, contraseña cifrada.</li>
          <li><strong>Información de negocio:</strong> nombre del catálogo, productos, precios, imágenes.</li>
          <li><strong>Información de pedidos:</strong> datos del cliente final (nombre, teléfono, dirección).</li>
          <li><strong>Información de uso:</strong> páginas visitadas, acciones en el panel, logs de errores.</li>
          <li><strong>Información de pago:</strong> procesada por Stripe; no almacenamos datos de tarjeta.</li>
        </ul>

        <h2>2. Cómo usamos tu información</h2>
        <ul>
          <li>Proveer y mejorar el Servicio.</li>
          <li>Enviarte correos transaccionales (verificación, facturación, notificaciones).</li>
          <li>Analizar el uso para mejorar la plataforma.</li>
          <li>Cumplir obligaciones legales.</li>
        </ul>

        <h2>3. Compartición de datos</h2>
        <p>
          No vendemos tu información personal. La compartimos únicamente con proveedores de servicio
          esenciales: Neon (base de datos), Stripe (pagos), Resend (email), Anthropic (IA),
          Vercel (hosting). Todos bajo acuerdos de procesamiento de datos.
        </p>

        <h2>4. Datos de clientes finales</h2>
        <p>
          Los datos de los clientes que realizan pedidos en tu catálogo (nombre, teléfono, dirección)
          son responsabilidad tuya como comerciante. Solo los almacenamos para mostrártelos a ti en
          el panel de pedidos.
        </p>

        <h2>5. Retención de datos</h2>
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Al cancelar, eliminamos tus datos
          dentro de los 90 días siguientes, salvo obligaciones legales que exijan conservarlos más.
        </p>

        <h2>6. Seguridad</h2>
        <p>
          Usamos cifrado TLS, contraseñas con bcrypt, y acceso limitado a datos por rol. Ningún
          sistema es 100% seguro; te notificaremos ante cualquier brecha que afecte tus datos.
        </p>

        <h2>7. Tus derechos</h2>
        <p>
          Tienes derecho a acceder, corregir o eliminar tus datos personales. Escríbenos a{' '}
          <a href="mailto:privacidad@domicilios.app" className="text-primary-500 hover:underline">
            privacidad@domicilios.app
          </a>
          .
        </p>

        <h2>8. Cookies</h2>
        <p>
          Usamos cookies esenciales para el funcionamiento del Servicio (sesión, preferencias) y
          cookies de analítica propia. No usamos cookies de publicidad de terceros.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Para ejercer tus derechos o preguntas sobre privacidad:{' '}
          <a href="mailto:privacidad@domicilios.app" className="text-primary-500 hover:underline">
            privacidad@domicilios.app
          </a>
          .
        </p>
      </div>
    </div>
  )
}
