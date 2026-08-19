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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  lang?: string
}

const copy = {
  fr: {
    preview: "Confirmez votre e-mail pour commencer à être visible sur l'IA",
    title: 'Confirmez votre e-mail',
    intro: 'Bienvenue sur',
    introEnd: " — la plateforme qui aide votre établissement à se positionner dans ChatGPT, Gemini et Perplexity.",
    ask1: 'Veuillez confirmer votre adresse e-mail (',
    ask2: ') pour activer votre compte :',
    cta: "Vérifier l'e-mail",
    foot: "Si vous n'avez pas créé de compte GoogleReviewAI, vous pouvez ignorer cet e-mail en toute sécurité.",
  },
  en: {
    preview: 'Confirm your email to start getting visible on AI search',
    title: 'Confirm your email',
    intro: 'Welcome to',
    introEnd: ' — the platform that helps your business get recommended by ChatGPT, Gemini and Perplexity.',
    ask1: 'Please confirm your email address (',
    ask2: ') to activate your account:',
    cta: 'Verify email',
    foot: "If you didn't create a GoogleReviewAI account, you can safely ignore this email.",
  },
}

export const SignupEmail = ({ siteUrl, recipient, confirmationUrl, lang }: SignupEmailProps) => {
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
            {t.intro}{' '}
            <Link href={siteUrl} style={link}>
              <strong>GoogleReviewAI</strong>
            </Link>
            {t.introEnd}
          </Text>
          <Text style={text}>
            {t.ask1}
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            {t.ask2}
          </Text>
          <Button style={button} href={confirmationUrl}>
            {t.cta}
          </Button>
          <Text style={footer}>{t.foot}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail
