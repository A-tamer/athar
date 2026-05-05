/** Site-wide contact & social — update TODO values for production */
export const CONTACT_EMAIL = 'ahmedtwafa@gmail.com'
/** E.164 without + for wa.me links, e.g. 201234567890 */
export const WHATSAPP_E164 = '201000000000' // TODO: replace with real number
export const INSTAGRAM_URL = 'https://www.instagram.com/' // TODO: add handle

export function getWhatsAppLink(message = '') {
  const base = `https://wa.me/${WHATSAPP_E164}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
