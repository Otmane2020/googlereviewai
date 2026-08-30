// Shared inline styles for GoogleReviewAI transactional emails
export const BRAND = 'GoogleReviewAI'
export const SITE_URL = 'https://googlereviewai.com'

export const colors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
  emerald: '#059669',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  surface: '#f8fafc',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  color: colors.text,
  margin: '0',
}

export const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 0 32px',
}

export const bar = {
  height: '4px',
  background: `linear-gradient(90deg, ${colors.blue} 0 25%, ${colors.red} 25% 50%, ${colors.yellow} 50% 75%, ${colors.green} 75%)`,
  borderRadius: '4px',
}

export const heading = {
  fontSize: '24px',
  fontWeight: '700',
  margin: '28px 0 12px',
}

export const paragraph = {
  fontSize: '15px',
  lineHeight: '1.65',
  color: '#374151',
  margin: '0 0 14px',
}

export const button = {
  backgroundColor: colors.emerald,
  color: '#ffffff',
  borderRadius: '12px',
  padding: '13px 26px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

export const card = {
  backgroundColor: colors.surface,
  borderRadius: '14px',
  padding: '18px 20px',
  margin: '18px 0',
}

export const small = {
  fontSize: '12px',
  color: colors.muted,
  lineHeight: '1.6',
}
