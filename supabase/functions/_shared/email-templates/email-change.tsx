/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import {
  brand,
  brandText,
  button,
  container,
  footer,
  h1,
  link,
  main,
  pickLang,
  text,
} from './auth-theme.ts'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
  lang?: string
}

const copy = {
  fr: {
    preview: "Confirmez le changement d'e-mail GoogleReviewAI",
    title: "Confirmez le changement d'e-mail",
    p1: "Vous avez demandé à changer l'adresse e-mail de votre compte GoogleReviewAI de",
    to: 'vers',
    p2: 'Cliquez sur le bouton ci-dessous pour confirmer ce changement :',
    cta: 'Confirmer le changement',
    foot: "Si vous n'êtes pas à l'origine de cette demande, sécurisez votre compte immédiatement.",
  },
  en: {
    preview: 'Confirm your GoogleReviewAI email change',
    title: 'Confirm your email change',
    p1: 'You requested to change the email address of your GoogleReviewAI account from',
    to: 'to',
    p2: 'Click the button below to confirm this change:',
    cta: 'Confirm change',
    foot: "If you didn't request this, secure your account immediately.",
  },
}

export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl, lang }: EmailChangeEmailProps) => {
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
          <Text style={text}>
            {t.p1}{' '}
            <Link href={`mailto:${oldEmail}`} style={link}>
              {oldEmail}
            </Link>{' '}
            {t.to}{' '}
            <Link href={`mailto:${newEmail}`} style={link}>
              {newEmail}
            </Link>
            .
          </Text>
          <Text style={text}>{t.p2}</Text>
          <Button style={button} href={confirmationUrl}>
            {t.cta}
          </Button>
          <Text style={footer}>{t.foot}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailChangeEmail
