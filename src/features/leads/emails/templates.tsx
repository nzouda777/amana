import { Button, Column, Row, Section, Text } from 'react-email'

import { brand, EmailLayout, type EmailLayoutProps, emailText } from './EmailLayout'

type Frame = Pick<EmailLayoutProps, 'lang' | 'dir' | 'footer'>

/* ----------------------------------------------- Accusé de réception au demandeur */

export type AcknowledgementEmailProps = Frame & {
  preview: string
  heading: string
  greeting: string
  /** Ce qui va se passer, dans l'ordre. */
  steps: string[]
  stepsTitle: string
  summaryTitle: string
  summary: Array<{ label: string; value: string }>
  signature: string
}

export function AcknowledgementEmail(props: AcknowledgementEmailProps) {
  return (
    <EmailLayout lang={props.lang} dir={props.dir} preview={props.preview} footer={props.footer}>
      <Text style={emailText.heading}>{props.heading}</Text>
      <Text style={emailText.paragraph}>{props.greeting}</Text>
      <Text style={{ ...emailText.paragraph, fontWeight: 600 }}>{props.stepsTitle}</Text>
      {props.steps.map((step, index) => (
        <Row key={step} style={{ marginBottom: 8 }}>
          <Column style={{ width: 32, verticalAlign: 'top' }}>
            <Text style={{ margin: 0, color: brand.gold700, fontWeight: 600 }}>{index + 1}</Text>
          </Column>
          <Column>
            <Text style={{ ...emailText.paragraph, margin: 0 }}>{step}</Text>
          </Column>
        </Row>
      ))}
      <Section
        style={{ marginTop: 24, padding: 16, backgroundColor: brand.sand100, borderRadius: 10 }}
      >
        <Text style={{ ...emailText.muted, fontWeight: 600 }}>{props.summaryTitle}</Text>
        {props.summary.map((item) => (
          <Text key={item.label} style={emailText.muted}>
            {item.label} : {item.value}
          </Text>
        ))}
      </Section>
      <Text style={{ ...emailText.paragraph, marginTop: 24 }}>{props.signature}</Text>
    </EmailLayout>
  )
}

/* -------------------------------------------------------- Notification à l'équipe */

export type TeamNotificationEmailProps = Frame & {
  preview: string
  heading: string
  fields: Array<{ label: string; value: string }>
  message?: string
  messageLabel: string
  adminUrl: string
  adminLabel: string
}

export function TeamNotificationEmail(props: TeamNotificationEmailProps) {
  return (
    <EmailLayout lang={props.lang} dir={props.dir} preview={props.preview} footer={props.footer}>
      <Text style={emailText.heading}>{props.heading}</Text>
      {props.fields.map((field) => (
        <Text key={field.label} style={{ ...emailText.paragraph, margin: '0 0 6px' }}>
          <strong>{field.label} :</strong> {field.value}
        </Text>
      ))}
      {props.message ? (
        <Section
          style={{ marginTop: 16, padding: 16, backgroundColor: brand.sand100, borderRadius: 10 }}
        >
          <Text style={{ ...emailText.muted, fontWeight: 600 }}>{props.messageLabel}</Text>
          <Text style={{ ...emailText.paragraph, margin: 0, whiteSpace: 'pre-line' }}>
            {props.message}
          </Text>
        </Section>
      ) : null}
      <Section style={{ marginTop: 24 }}>
        <Button href={props.adminUrl} style={emailText.button}>
          {props.adminLabel}
        </Button>
      </Section>
    </EmailLayout>
  )
}

/* ------------------------------------------------------- Lien d'action (newsletter, guide) */

export type ActionEmailProps = Frame & {
  preview: string
  heading: string
  paragraphs: string[]
  actionLabel: string
  actionUrl: string
  /** Mention sous le bouton (validité du lien, « ignorez ce message si… »). */
  note: string
}

export function ActionEmail(props: ActionEmailProps) {
  return (
    <EmailLayout lang={props.lang} dir={props.dir} preview={props.preview} footer={props.footer}>
      <Text style={emailText.heading}>{props.heading}</Text>
      {props.paragraphs.map((paragraph) => (
        <Text key={paragraph} style={emailText.paragraph}>
          {paragraph}
        </Text>
      ))}
      <Section style={{ margin: '24px 0' }}>
        <Button href={props.actionUrl} style={emailText.button}>
          {props.actionLabel}
        </Button>
      </Section>
      <Text style={emailText.muted}>{props.note}</Text>
      <Text style={{ ...emailText.muted, wordBreak: 'break-all' }}>{props.actionUrl}</Text>
    </EmailLayout>
  )
}
