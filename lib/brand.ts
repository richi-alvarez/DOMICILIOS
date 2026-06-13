/**
 * Identidad de marca de la app. El nombre se controla por la variable de entorno
 * NEXT_PUBLIC_APP_NAME (cliente y servidor). El logo vive en /public.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'WaCommerce'
export const APP_LOGO = '/wacommerce-logo.jpeg'
