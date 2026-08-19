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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  lang?: string
}

const copy = {
  fr: {
    preview: 'Vous avez été invité sur GoogleReviewAI',
    title: 'Vous avez été invité',
    p1: 'Vous avez été invité à rejoindre',
    p1End: ", la plateforme pour vous positionner dans ChatGPT, Gemini et Perplexity. Acceptez l'invitation pour créer votre compte.",
    cta: "Accepter l'invitation",
    foot: "Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail en toute sécurité.",
  },
  en: {
    preview: "You've been invited to GoogleReviewAI",
    title: "You've been invited",
    p1: "You've been invited to join",
    p1End: ', the platform that gets your business recommended by ChatGPT, Gemini and Perplexity. Accept the invitation to create your account.',
    cta: 'Accept invitation',
    foot: "If you weren't expecting this invitation, you can safely ignore this email.",
  },
}

export const InviteEmail = ({ siteUrl, confirmationUrl, lang }: InviteEmailProps) => {
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
            <Link href={siteUrl} style={link}>
              <strong>GoogleReviewAI</strong>
            </Link>
            {t.p1End}
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

export default InviteEmail
