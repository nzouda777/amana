import type { CollectionConfig } from 'payload'

import { Assignments } from './Assignments'
import { Authors } from './Authors'
import { Carts } from './Carts'
import { CaseStudies } from './CaseStudies'
import { Categories } from './Categories'
import { Certificates } from './Certificates'
import { Consents } from './Consents'
import { Coupons } from './Coupons'
import { Courses } from './Courses'
import { Documents } from './Documents'
import { Enrollments } from './Enrollments'
import { Events } from './Events'
import { Faqs } from './Faqs'
import { GlossaryTerms } from './GlossaryTerms'
import { Guides } from './Guides'
import { Invitations } from './Invitations'
import { Invoices } from './Invoices'
import { Leads } from './Leads'
import { LessonProgress } from './LessonProgress'
import { Lessons } from './Lessons'
import { Licenses } from './Licenses'
import { Media } from './Media'
import { Modules } from './Modules'
import { NewsletterSubscribers } from './NewsletterSubscribers'
import { OrderItems } from './OrderItems'
import { Orders } from './Orders'
import { Organizations } from './Organizations'
import { OrgMembers } from './OrgMembers'
import { Pages } from './Pages'
import { Partners } from './Partners'
import { Paths } from './Paths'
import { PaymentEvents } from './PaymentEvents'
import { Payments } from './Payments'
import { Posts } from './Posts'
import { Products } from './Products'
import { Questions } from './Questions'
import { QuizAttempts } from './QuizAttempts'
import { Quizzes } from './Quizzes'
import { Quotes } from './Quotes'
import { Refunds } from './Refunds'
import { Reminders } from './Reminders'
import { Reviews } from './Reviews'
import { Services } from './Services'
import { TeamMembers } from './TeamMembers'
import { Testimonials } from './Testimonials'
import { Users } from './Users'

/** Ordre = ordre d'affichage dans l'admin (par groupe). */
export const collections: CollectionConfig[] = [
  // Site
  Pages,
  Services,
  CaseStudies,
  TeamMembers,
  Partners,
  Testimonials,
  Faqs,
  Media,
  // Ressources
  Posts,
  Categories,
  Authors,
  Guides,
  GlossaryTerms,
  Events,
  // Formation
  Courses,
  Modules,
  Lessons,
  Quizzes,
  Questions,
  Paths,
  // Suivi apprenants
  Enrollments,
  LessonProgress,
  QuizAttempts,
  Certificates,
  Reviews,
  // Commerce
  Products,
  Coupons,
  Carts,
  Orders,
  OrderItems,
  Payments,
  PaymentEvents,
  Invoices,
  Refunds,
  // Entreprises
  Organizations,
  OrgMembers,
  Licenses,
  Invitations,
  Assignments,
  Reminders,
  Quotes,
  // Contacts
  Leads,
  NewsletterSubscribers,
  Consents,
  // Système
  Users,
  Documents,
]
