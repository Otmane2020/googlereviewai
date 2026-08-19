// Shared styles for auth email templates (GoogleReviewAI)
export type AuthLang = 'fr' | 'en'

export const pickLang = (lang?: string): AuthLang => (lang === 'en' ? 'en' : 'fr')

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}
export const container = { padding: '32px 28px', maxWidth: '560px' }
export const brand = { borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }
export const brandText = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: 'hsl(217, 91%, 60%)',
  margin: 0,
  letterSpacing: '-0.01em',
}
export const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(222, 47%, 11%)',
  margin: '0 0 20px',
  letterSpacing: '-0.02em',
}
export const text = { fontSize: '15px', color: 'hsl(215, 16%, 47%)', lineHeight: '1.6', margin: '0 0 20px' }
export const link = { color: 'hsl(217, 91%, 60%)', textDecoration: 'underline' }
export const button = {
  backgroundColor: 'hsl(217, 91%, 60%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
export const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', lineHeight: '1.5' }
export const codeStyle = {
  fontSize: '32px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  color: 'hsl(222, 47%, 11%)',
  margin: '0 0 20px',
}
