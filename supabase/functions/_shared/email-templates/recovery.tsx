/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html, Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { brand, brandText, button, container, footer, h1, main, pickLang, text } from './auth-theme.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  lang?: string
}

const copy = {
  fr: {
    preview: 'Réinitialisez votre mot de passe Reviews AI',
    title: 'Réinitialiser votre mot de passe',
    p1: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Reviews AI. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.',
    cta: 'Réinitialiser le mot de passe',
    foot: "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité — votre mot de passe restera inchangé.",
  },
  en: {
    preview: 'Reset your Reviews AI password',
    title: 'Reset your password',
    p1: 'We received a request to reset the password for your Reviews AI account. Click the button below to choose a new one.',
    cta: 'Reset password',
    foot: "If you didn't request this, you can safely ignore this email — your password will stay unchanged.",
  },
}

export const RecoveryEmail = ({ confirmationUrl, lang }: RecoveryEmailProps) => {
  const l = pickLang(lang)
  const t = copy[l]
  return (
    <Html lang={l} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Img src="https://reviewsai.store/icon-192x192.png" width="36" height="36" alt="Reviews AI" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            <Text style={{ ...brandText, display: 'inline-block', verticalAlign: 'middle' }}>Reviews AI</Text>
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

export default RecoveryEmail