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
  Row,
  Column,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BRAND, SITE_URL, bar, button, card, container, heading, main, paragraph, small } from './theme.ts'

interface Item {
  name?: string
  quantity?: number
  price?: number
}

interface Props {
  name?: string
  orderId?: string
  items?: Item[]
  total?: number
  shippingCost?: number
  shippingAddress?: {
    full_name?: string
    line1?: string
    postal_code?: string
    city?: string
    country?: string
  }
  lang?: 'fr' | 'en'
}

const copy = {
  fr: {
    preview: 'Votre commande est confirmée',
    title: 'Commande confirmée ✅',
    hi: (n: string) => (n ? `Bonjour ${n},` : 'Bonjour,'),
    p1: 'Merci pour votre commande. Nous la préparons et vous recevrez un email dès son expédition.',
    order: 'Commande',
    items: 'Articles',
    shipping: 'Livraison',
    total: 'Total',
    address: 'Adresse de livraison',
    cta: 'Voir mes commandes',
    footer: 'Vous recevez cet email suite à votre commande.',
  },
  en: {
    preview: 'Your order is confirmed',
    title: 'Order confirmed ✅',
    hi: (n: string) => (n ? `Hi ${n},` : 'Hi there,'),
    p1: 'Thanks for your order. We are preparing it and you will get an email as soon as it ships.',
    order: 'Order',
    items: 'Items',
    shipping: 'Shipping',
    total: 'Total',
    address: 'Shipping address',
    cta: 'View my orders',
    footer: 'You are receiving this email because you placed an order.',
  },
}

const money = (v?: number) => `${Number(v || 0).toFixed(2)} €`

const Email = ({
  name = '',
  orderId = '',
  items = [],
  total = 0,
  shippingCost = 0,
  shippingAddress,
  lang = 'fr',
}: Props) => {
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
              <Text style={{ ...paragraph, margin: '0 0 10px', fontWeight: '600' }}>
                {t.order} #{orderId.slice(0, 8).toUpperCase()}
              </Text>
            ) : null}
            {items.map((it, i) => (
              <Row key={i}>
                <Column>
                  <Text style={{ ...paragraph, margin: '0' }}>
                    {it.quantity ? `${it.quantity} × ` : ''}
                    {it.name || '—'}
                  </Text>
                </Column>
                <Column align="right">
                  <Text style={{ ...paragraph, margin: '0' }}>{money(it.price)}</Text>
                </Column>
              </Row>
            ))}
            {shippingCost > 0 ? (
              <Row>
                <Column>
                  <Text style={{ ...paragraph, margin: '8px 0 0' }}>{t.shipping}</Text>
                </Column>
                <Column align="right">
                  <Text style={{ ...paragraph, margin: '8px 0 0' }}>{money(shippingCost)}</Text>
                </Column>
              </Row>
            ) : null}
            <Hr style={{ borderColor: '#e5e7eb', margin: '12px 0' }} />
            <Row>
              <Column>
                <Text style={{ ...paragraph, margin: '0', fontWeight: '700' }}>{t.total}</Text>
              </Column>
              <Column align="right">
                <Text style={{ ...paragraph, margin: '0', fontWeight: '700' }}>{money(total)}</Text>
              </Column>
            </Row>
          </Section>

          {shippingAddress?.line1 ? (
            <Section style={card}>
              <Text style={{ ...paragraph, margin: '0 0 6px', fontWeight: '600' }}>{t.address}</Text>
              <Text style={{ ...paragraph, margin: '0' }}>
                {shippingAddress.full_name}
                <br />
                {shippingAddress.line1}
                <br />
                {shippingAddress.postal_code} {shippingAddress.city}
                <br />
                {shippingAddress.country}
              </Text>
            </Section>
          ) : null}

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
    data?.lang === 'en'
      ? `Your ${BRAND} order is confirmed`
      : `Votre commande ${BRAND} est confirmée`,
  displayName: 'Order confirmation',
  previewData: {
    name: 'Otmane',
    orderId: 'a1b2c3d4-0000',
    items: [{ name: 'Plaque QR Avis Google', quantity: 2, price: 19.9 }],
    shippingCost: 4.9,
    total: 44.7,
    shippingAddress: { full_name: 'Otmane B.', line1: '12 rue de Paris', postal_code: '75001', city: 'Paris', country: 'France' },
    lang: 'fr',
  },
} satisfies TemplateEntry
