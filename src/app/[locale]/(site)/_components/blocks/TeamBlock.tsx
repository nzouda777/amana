import { getTranslations } from 'next-intl/server'

import { Avatar } from '@/components/ui/Avatar'
import { Container, Section, SectionHeader } from '@/components/ui/Layout'
import { Link } from '@/components/ui/Link'
import { teamMembersQuery } from '@/features/content/team'
import { typographyFr } from '@/lib/typography'
import type { Media, TeamMember } from '@/payload-types'

import { getTeamMembers } from '../../_data/queries'
import { RichText } from '../RichText'
import { type BlockContext, type BlockOf, populated } from './types'

function photoOf(member: TeamMember): string | undefined {
  const photo = populated<Media>(member.photo) ? member.photo : null
  return photo?.sizes?.thumbnail?.url ?? photo?.url ?? undefined
}

/**
 * Équipe ou comité de conformité charia. Le comité est un levier de crédibilité majeur :
 * il est présenté en grand (fond sable, qualifications complètes, rôle, biographie), avec
 * un rappel de son indépendance et de ce qu'il ne fait pas (pas de fatwa individuelle).
 */
export async function TeamBlock({
  block,
  context,
}: {
  block: BlockOf<'team'>
  context: BlockContext
}) {
  const query = teamMembersQuery(block.group, block.members)
  const members = await getTeamMembers(
    context.locale,
    query.kind === 'manual' ? { ids: query.ids } : { committee: block.group === 'committee' },
  )
  if (members.length === 0) return null
  const t = await getTranslations({ locale: context.locale, namespace: 'site.team' })
  const fr = (text: string) => (context.locale === 'fr' ? typographyFr(text) : text)
  const id = `bloc-${context.index}`

  if (block.group === 'committee') {
    return (
      <Section tone="sand" aria-labelledby={id} id="comite-charia">
        <Container>
          <SectionHeader
            id={id}
            title={fr(block.title)}
            lead={block.intro ? fr(block.intro) : undefined}
          />
          <ul className="grid gap-x-gutter gap-y-12 lg:grid-cols-2">
            {members.map((member) => (
              <li key={member.id} className="flex flex-col gap-5 border-t border-green-700 pt-8">
                <div className="flex items-center gap-5">
                  <Avatar name={member.name} src={photoOf(member)} size="lg" decorative />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-h3">{member.name}</h3>
                    <p className="text-body font-semibold text-green-700">{fr(member.role)}</p>
                  </div>
                </div>
                {member.qualifications ? (
                  <div className="flex flex-col gap-1">
                    <h4 className="font-sans text-small font-semibold text-ink-muted">
                      {t('qualifications')}
                    </h4>
                    <p className="max-w-measure text-body">{fr(member.qualifications)}</p>
                  </div>
                ) : null}
                <RichText data={member.bio} locale={context.locale} className="text-ink-muted" />
                {member.linkedinUrl?.startsWith('https://') ? (
                  <Link
                    href={member.linkedinUrl as `https://${string}`}
                    variant="standalone"
                    className="self-start"
                  >
                    {t('linkedin', { name: member.name })}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    )
  }

  return (
    <Section aria-labelledby={id}>
      <Container>
        <SectionHeader
          id={id}
          title={fr(block.title)}
          lead={block.intro ? fr(block.intro) : undefined}
        />
        <ul className="grid gap-x-gutter gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li key={member.id} className="flex flex-col gap-4 border-t border-line pt-6">
              <Avatar name={member.name} src={photoOf(member)} size="lg" decorative />
              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-h4">{member.name}</h3>
                <p className="text-small text-green-700">{fr(member.role)}</p>
              </div>
              {member.qualifications ? (
                <p className="text-small text-ink-muted">{fr(member.qualifications)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
