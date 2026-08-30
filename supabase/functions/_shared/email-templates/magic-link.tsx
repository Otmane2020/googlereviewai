/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { brand, brandText, button, container, footer, h1, main, pickLang, text } from './auth-theme.ts'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  lang?: string
}

const copy = {
  fr: {
    preview: 'Votre lien de connexion GoogleReviewAI',
    title: 'Connectez-vous à GoogleReviewAI',
    p1: 'Cliquez sur le bouton ci-dessous pour accéder en toute sécurité à votre tableau de bord GoogleReviewAI. Ce lien expirera prochainement.',
    cta: 'Se connecter',
    foot: "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.",
  },
  en: {
    preview: 'Your GoogleReviewAI login link',
    title: 'Sign in to GoogleReviewAI',
    p1: 'Click the button below to securely access your GoogleReviewAI dashboard. This link will expire soon.',
    cta: 'Sign in',
    foot: "If you didn't request this, you can safely ignore this email.",
  },
}

export const MagicLinkEmail = ({ confirmationUrl, lang }: MagicLinkEmailProps) => {
  const l = pickLang(lang)
  const t = copy[l]
  return (
    <Html lang={l} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>GoogleReviewAI</Text>
          </Section>
          <Heading style={h1}>{t.title}</Heading>
          <Text style={text}>{t.p1}</Text>
          <Button style={button} href={confirmationUrl}>
            {t.cta}
          </Button>
          <Text style={footer}>{t.foot}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail
