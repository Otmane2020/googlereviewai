/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import { brand, brandText, codeStyle, container, footer, h1, main, pickLang, text } from './auth-theme.ts'

interface ReauthenticationEmailProps {
  token: string
  lang?: string
}

const copy = {
  fr: {
    preview: 'Votre code de vérification Reviews AI',
    title: "Confirmez que c'est bien vous",
    p1: 'Utilisez le code ci-dessous pour confirmer votre identité :',
    foot: "Ce code expirera prochainement. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.",
  },
  en: {
    preview: 'Your Reviews AI verification code',
    title: "Confirm it's you",
    p1: 'Use the code below to confirm your identity:',
    foot: "This code will expire soon. If you didn't request it, you can safely ignore this email.",
  },
}

export const ReauthenticationEmail = ({ token, lang }: ReauthenticationEmailProps) => {
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
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>{t.foot}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ReauthenticationEmail