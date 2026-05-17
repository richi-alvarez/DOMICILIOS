import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Uso',
  description: 'Términos y condiciones de uso de la plataforma WaStore.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-extrabold text-night-800">Términos de Uso</h1>
      <p className="mt-2 text-sm text-warm-400">Última actualización: 23 de abril de 2026</p>

      <div className="prose prose-slate mt-10 max-w-none">
        <h2>1. Aceptación de términos</h2>
        <p>
          Al acceder o usar la plataforma WaStore (el &ldquo;Servicio&rdquo;), aceptas estar vinculado a estos
          Términos de Uso. Si no estás de acuerdo con alguno de estos términos, no debes usar el
          Servicio.
        </p>

        <h2>2. Descripción del servicio</h2>
        <p>
          WaStore es una plataforma SaaS que permite a comerciantes crear catálogos y menús
          digitales para recibir pedidos por WhatsApp o correo electrónico. El Servicio incluye
          herramientas de gestión de productos, pedidos, pagos y analítica.
        </p>

        <h2>3. Registro y cuentas</h2>
        <p>
          Para usar el Servicio debes registrarte con información verídica. Eres responsable de
          mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde
          tu cuenta.
        </p>

        <h2>4. Planes y pagos</h2>
        <p>
          El Servicio ofrece planes gratuitos y de pago. Los precios pueden cambiar con previo aviso
          de 30 días. No cobramos comisiones sobre tus ventas; solo pagas la suscripción a la
          plataforma.
        </p>

        <h2>5. Contenido del usuario</h2>
        <p>
          Eres responsable del contenido que publicas en tu catálogo, incluyendo imágenes, precios y
          descripciones. Garantizas que tienes los derechos necesarios sobre dicho contenido y que no
          infringe derechos de terceros.
        </p>

        <h2>6. Uso aceptable</h2>
        <p>
          No puedes usar el Servicio para actividades ilegales, fraudulentas o que violen derechos de
          terceros. Consulta nuestra{' '}
          <a href="/aup" className="text-primary-500 hover:underline">
            Política de Uso Aceptable
          </a>{' '}
          para más detalles.
        </p>

        <h2>7. Limitación de responsabilidad</h2>
        <p>
          WaStore no será responsable por pérdidas indirectas, incidentales o consecuentes
          derivadas del uso o incapacidad de uso del Servicio. Nuestra responsabilidad máxima estará
          limitada al monto pagado por el usuario en los últimos 12 meses.
        </p>

        <h2>8. Terminación</h2>
        <p>
          Puedes cancelar tu cuenta en cualquier momento. Nos reservamos el derecho de suspender o
          cancelar cuentas que violen estos términos.
        </p>

        <h2>9. Cambios en los términos</h2>
        <p>
          Podemos modificar estos términos en cualquier momento. Te notificaremos por correo con al
          menos 15 días de anticipación ante cambios materiales.
        </p>

        <h2>10. Contacto</h2>
        <p>
          Para preguntas sobre estos términos, escríbenos a{' '}
          <a href="mailto:legal@domicilios.app" className="text-primary-500 hover:underline">
            legal@domicilios.app
          </a>
          .
        </p>
      </div>
    </div>
  )
}
