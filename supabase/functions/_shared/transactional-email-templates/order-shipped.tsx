import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BRAND, SITE_URL, bar, button, card, container, heading, main, paragraph, small } from './theme.ts'

interface Props {
  name?: string
  orderId?: string
  trackingNumber?: string
  lang?: 'fr' | 'en'
}

const copy = {
  fr: {
    preview: 'Votre commande a été expédiée',
    title: 'Colis expédié 📦',
    hi: (n: string) => (n ? `Bonjour ${n},` : 'Bonjour,'),
    p1: 'Bonne nouvelle : votre commande vient de partir.',
    tracking: 'Numéro de suivi',
    cta: 'Voir mes commandes',
    footer: 'Vous recevez cet email suite à votre commande.',
  },
  en: {
    preview: 'Your order has shipped',
    title: 'Order shipped 📦',
    hi: (n: string) => (n ? `Hi ${n},` : 'Hi there,'),
    p1: 'Good news: your order is on its way.',
    tracking: 'Tracking number',
    cta: 'View my orders',
    footer: 'You are receiving this email because you placed an order.',
  },
}

const Email = ({ name = '', orderId = '', trackingNumber = '', lang = 'fr' }: Props) => {
  const t = copy[lang === 'en' ? 'en' : 'fr']
  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={bar} />
          <Heading style={heading}>{t.title}</Heading>
          <Text style={paragraph}>{t.hi(name)}</Text>
          <Text style={paragraph}>{t.p1}</Text>
          <Section style={card}>
            {orderId ? (
              <Text style={{ ...paragraph, margin: '0 0 6px' }}>#{orderId.slice(0, 8).toUpperCase()}</Text>
            ) : null}
            {trackingNumber ? (
              <Text style={{ ...paragraph, margin: '0', fontWeight: '600' }}>
                {t.tracking}: {trackingNumber}
              </Text>
            ) : null}
          </Section>
          <Button href={`${SITE_URL}/commandes`} style={button}>
            {t.cta}
          </Button>
          <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0 14px' }} />
          <Text style={small}>
            {BRAND} · {t.footer}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data?.lang === 'en' ? 'Your order has shipped' : 'Votre commande a été expédiée',
  displayName: 'Order shipped',
  previewData: { name: 'Otmane', orderId: 'a1b2c3d4', trackingNumber: 'LA123456789FR', lang: 'fr' },
} satisfies TemplateEntry
