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
  lang?: 'fr' | 'en'
}

const copy = {
  fr: {
    preview: `Bienvenue sur ${BRAND} — vos avis Google répondus par IA`,
    title: 'Bienvenue 👋',
    hi: (n: string) => (n ? `Bonjour ${n},` : 'Bonjour,'),
    p1: `Votre compte ${BRAND} est prêt. Connectez votre fiche Google Business Profile et l'IA rédige et publie des réponses à vos avis, automatiquement.`,
    steps: 'Vos 3 prochaines étapes :',
    s1: '1. Connectez votre compte Google Business Profile',
    s2: '2. Choisissez le ton de vos réponses (Brand Voice)',
    s3: '3. Activez le pilote automatique',
    cta: 'Ouvrir mon tableau de bord',
    footer: 'Vous recevez cet email car vous avez créé un compte.',
  },
  en: {
    preview: `Welcome to ${BRAND} — AI replies for your Google reviews`,
    title: 'Welcome 👋',
    hi: (n: string) => (n ? `Hi ${n},` : 'Hi there,'),
    p1: `Your ${BRAND} account is ready. Connect your Google Business Profile and AI will write and publish replies to your reviews, automatically.`,
    steps: 'Your next 3 steps:',
    s1: '1. Connect your Google Business Profile account',
    s2: '2. Pick the tone of your replies (Brand Voice)',
    s3: '3. Turn on autopilot',
    cta: 'Open my dashboard',
    footer: 'You are receiving this email because you created an account.',
  },
}

const Email = ({ name = '', lang = 'fr' }: Props) => {
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
            <Text style={{ ...paragraph, fontWeight: '600', margin: '0 0 8px' }}>{t.steps}</Text>
            <Text style={{ ...paragraph, margin: '0' }}>{t.s1}</Text>
            <Text style={{ ...paragraph, margin: '0' }}>{t.s2}</Text>
            <Text style={{ ...paragraph, margin: '0' }}>{t.s3}</Text>
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
    data?.lang === 'en' ? `Welcome to ${BRAND}` : `Bienvenue sur ${BRAND}`,
  displayName: 'Welcome',
  previewData: { name: 'Otmane', lang: 'fr' },
} satisfies TemplateEntry
