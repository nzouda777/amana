import { Body, Container, Head, Hr, Html, Preview, Section, Text } from 'react-email'
import type { ReactNode } from 'react'

/**
 * Gabarit commun des e-mails transactionnels, aux couleurs de la charte (DESIGN §2).
 * Les clients de messagerie n'interprètent pas les variables CSS : les valeurs des
 * tokens sont reprises ici en clair.
 */
export const brand = {
  green900: '#0F3A14',
  green700: '#1B5E20',
  gold500: '#D4AF37',
  gold700: '#8B6914',
  sand100: '#FAF4EA',
  sand300: '#F1E0C5',
  ink: '#1C1C1C',
  inkMuted: '#4A4A45',
  line: '#E4DDD0',
  paper: '#FFFFFF',
} as const

const display = "Baskerville, 'Baskervville', 'Libre Baskerville', Georgia, serif"
const sans = "'Open Sans', 'Segoe UI', Arial, sans-serif"

export type EmailLayoutProps = {
  lang: string
  dir: 'ltr' | 'rtl'
  preview: string
  /** Mention de pied : avertissement, adresse, raison de l'envoi. */
  footer: string
  children: ReactNode
}

export function EmailLayout({ lang, dir, preview, footer, children }: EmailLayoutProps) {
  return (
    <Html lang={lang} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: brand.sand100, margin: 0, padding: '24px 0', fontFamily: sans }}
      >
        <Container style={{ maxWidth: 600, backgroundColor: brand.paper }}>
          <Section style={{ backgroundColor: brand.green900, padding: '24px 32px' }}>
            <Text
              style={{
                margin: 0,
                color: brand.paper,
                fontFamily: display,
                fontSize: 24,
                lineHeight: '32px',
              }}
            >
              Amana Conseil
            </Text>
            <Hr style={{ borderColor: brand.gold500, width: 48, margin: '12px 0 0' }} />
          </Section>
          <Section style={{ padding: '32px', color: brand.ink, fontSize: 16, lineHeight: '26px' }}>
            {children}
          </Section>
          <Section style={{ padding: '24px 32px', backgroundColor: brand.sand100 }}>
            <Text style={{ margin: 0, color: brand.inkMuted, fontSize: 13, lineHeight: '20px' }}>
              {footer}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const emailText = {
  heading: {
    fontFamily: display,
    fontSize: 26,
    lineHeight: '32px',
    color: brand.ink,
    margin: '0 0 16px',
    fontWeight: 400,
  },
  paragraph: { margin: '0 0 16px', fontSize: 16, lineHeight: '26px', color: brand.ink },
  muted: { margin: '0 0 8px', fontSize: 14, lineHeight: '22px', color: brand.inkMuted },
  button: {
    display: 'inline-block',
    backgroundColor: brand.green700,
    color: brand.paper,
    padding: '14px 24px',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 16,
    textDecoration: 'none',
  },
} as const
