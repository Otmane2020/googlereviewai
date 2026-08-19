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
  planName?: string
  amount?: number
  interval?: string
  lang?: 'fr' | 'en'
}

const copy = {
  fr: {
    preview: 'Votre abonnement est actif',
    title: 'Abonnement activé 🎉',
    hi: (n: string) => (n ? `Bonjour ${n},` : 'Bonjour,'),
    p1: 'Merci pour votre confiance. Votre abonnement est actif et le pilote automatique peut être activé dès maintenant.',
    plan: 'Formule',
    price: 'Montant',
    cta: 'Accéder au tableau de bord',
    footer: 'Vous recevez cet email suite à votre abonnement.',
  },
  en: {
    preview: 'Your subscription is active',
    title: 'Subscription active 🎉',
    hi: (n: string) => (n ? `Hi ${n},` : 'Hi there,'),
    p1: 'Thanks for subscribing. Your plan is active and you can switch on autopilot right away.',
    plan: 'Plan',
    price: 'Amount',
    cta: 'Go to dashboard',
    footer: 'You are receiving this email because you subscribed.',
  },
}

const Email = ({ name = '', planName = '', amount, interval = '', lang = 'fr' }: Props) => {
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
            {planName ? (
              <Text style={{ ...paragraph, margin: '0' }}>
                {t.plan}: <strong>{planName}</strong>
              </Text>
            ) : null}
            {typeof amount === 'number' ? (
              <Text style={{ ...paragraph, margin: '0' }}>
                {t.price}: <strong>{amount.toFixed(2)} €{interval ? ` / ${interval}` : ''}</strong>
              </Text>
            ) : null}
          </Section>
          <Button href={`${SITE_URL}/dashboard`} style={button}>
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
    data?.lang === 'en' ? `Your ${BRAND} subscription is active` : `Votre abonnement ${BRAND} est actif`,
  displayName: 'Subscription confirmation',
  previewData: { name: 'Otmane', planName: 'Pro', amount: 49, interval: 'mois', lang: 'fr' },
} satisfies TemplateEntry
