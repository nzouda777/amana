import { useTranslations } from 'next-intl'

import { CapsuleList, CapsuleRow, CourseCard } from '@/components/patterns/CourseCard'
import { CTASection, StatsSentence, Testimonial } from '@/components/patterns/Editorial'
import { FAQ } from '@/components/patterns/FAQ'
import { PillarIndex } from '@/components/patterns/PillarIndex'
import { ServiceHero, ServiceMethod } from '@/components/patterns/ServiceTemplate'
import { StickyPurchase } from '@/components/patterns/StickyPurchase'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Layout'
import { toXaf } from '@/lib/money'

import { GuideSection, Specimen } from '../_components/Specimen'
import { demoPillars } from './demo-data'

export function PatternsSection() {
  const t = useTranslations('styleguide')
  const tp = useTranslations('styleguide.patterns')
  const td = useTranslations('styleguide.demo')

  const courseHref = (slug: string) => ({
    pathname: '/formation/cours/[slug]' as const,
    params: { slug },
  })
  const capsuleHref = { pathname: '/formation/entreprises/capsules' as const }

  return (
    <>
      <GuideSection
        id="motifs"
        title={t('sections.patterns.title')}
        lead={t('sections.patterns.lead')}
      >
        <Specimen title={tp('header')} note={tp('headerNote')}>
          <p className="text-small text-ink-muted">{tp('whatsapp')}</p>
        </Specimen>

        <Specimen title={tp('pillarIndex')}>
          <PillarIndex pillars={demoPillars(td)} headingLevel={3} />
        </Specimen>

        <Specimen title={tp('courseCards')}>
          <div className="grid gap-x-gutter gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            <CourseCard
              href={courseHref('introduction-finance-islamique')}
              theme={td('courses.theme1')}
              title={td('courses.title1')}
              instructor={td('instructors.one')}
              durationMinutes={200}
              level="beginner"
              price={toXaf(45_000)}
              hasFreePreview
            />
            <CourseCard
              href={courseHref('produit-takaful')}
              theme={td('courses.theme2')}
              title={td('courses.title2')}
              instructor={td('instructors.two')}
              durationMinutes={330}
              level="intermediate"
              price={toXaf(65_000)}
              compareAt={toXaf(80_000)}
            />
            <CourseCard
              href={courseHref('comite-conformite')}
              theme={td('courses.theme3')}
              title={td('courses.title3')}
              instructor={td('instructors.three')}
              durationMinutes={45}
              level="advanced"
              price={toXaf(0)}
            />
          </div>
        </Specimen>

        <Specimen title={tp('capsules')}>
          <CapsuleList label={tp('capsulesLabel')}>
            <CapsuleRow
              href={capsuleHref}
              title={td('capsules.c1')}
              summary={td('capsules.c1Summary')}
              durationMinutes={6}
              roles={[td('capsules.roles.front'), td('capsules.roles.compliance')]}
              previewHref={capsuleHref}
            />
            <CapsuleRow
              href={capsuleHref}
              title={td('capsules.c2')}
              summary={td('capsules.c2Summary')}
              durationMinutes={4}
              roles={[td('capsules.roles.front')]}
              previewHref={capsuleHref}
            />
            <CapsuleRow
              href={capsuleHref}
              title={td('capsules.c3')}
              summary={td('capsules.c3Summary')}
              durationMinutes={9}
              roles={[td('capsules.roles.back'), td('capsules.roles.management')]}
            />
          </CapsuleList>
        </Specimen>

        <Specimen title={tp('purchase')}>
          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5 lg:col-start-8">
              <StickyPurchase
                placement="static"
                title={td('purchase.title')}
                price={toXaf(35_000)}
                compareAt={toXaf(45_000)}
                includes={[
                  td('purchase.include1'),
                  td('purchase.include2'),
                  td('purchase.include3'),
                  td('purchase.include4'),
                ]}
                note={td('purchase.note')}
                primaryAction={<Button fullWidth>{td('purchase.buy')}</Button>}
                secondaryAction={
                  <Button variant="secondary" fullWidth>
                    {td('purchase.addToCart')}
                  </Button>
                }
              />
            </div>
          </div>
        </Specimen>

        <Specimen title={tp('stats')}>
          <StatsSentence
            segments={[
              td('stats.s1'),
              { value: 1200, label: td('stats.l1') },
              td('stats.s2'),
              { value: 35, label: td('stats.l2') },
              td('stats.s3'),
              { value: 80, label: td('stats.l3') },
              td('stats.s4'),
            ]}
          />
        </Specimen>
      </GuideSection>

      <Testimonial
        quote={td('testimonial.quote')}
        author={td('testimonial.author')}
        role={td('testimonial.role')}
        organization={td('testimonial.organization')}
      />

      <section aria-labelledby="sg-faq" className="py-section">
        <Container>
          <FAQ
            id="sg-faq"
            items={[
              { id: 'q1', question: td('faq.q1'), answer: td('faq.a1') },
              { id: 'q2', question: td('faq.q2'), answer: td('faq.a2') },
              { id: 'q3', question: td('faq.q3'), answer: td('faq.a3') },
            ]}
          />
        </Container>
      </section>

      <section aria-label={tp('service')} className="border-t border-line">
        <ServiceHero
          breadcrumb={[
            { label: td('service.breadcrumbHome'), href: '/' },
            { label: td('service.breadcrumbPillar'), href: '/audit-conformite' },
            { label: td('service.breadcrumbPage') },
          ]}
          title={td('service.title')}
          lead={td('service.lead')}
          primaryAction={{ label: td('service.primary'), href: '/devis' }}
          headingLevel={2}
        />
        <ServiceMethod
          steps={[
            { title: td('service.step1'), description: td('service.step1Text') },
            { title: td('service.step2'), description: td('service.step2Text') },
            { title: td('service.step3'), description: td('service.step3Text') },
            { title: td('service.step4'), description: td('service.step4Text') },
          ]}
        />
      </section>

      <CTASection
        id="sg-cta"
        title={td('cta.title')}
        text={td('cta.text')}
        primaryAction={{ label: td('cta.primary'), href: '/rendez-vous' }}
        secondaryAction={{ label: td('cta.secondary'), href: '/devis' }}
        withTrame
      />
    </>
  )
}
