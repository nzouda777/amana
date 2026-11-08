import type { CollectionConfig } from 'payload'

import { isSales, isSuperAdmin } from '../access'
import { contentLanguageOptions, groups, l, leadTypeOptions } from '../shared'

/**
 * Tableau de suivi des demandes (devis, contact, rendez-vous Cal.com, guides…).
 * Création publique uniquement via Server Action (zod + Turnstile + limite de débit) ;
 * l'API REST n'accepte que le personnel commercial.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: l('Demande', 'Lead'), plural: l('Demandes (leads)', 'Leads') },
  admin: {
    group: groups.contacts,
    useAsTitle: 'email',
    defaultColumns: ['type', 'name', 'organization', 'status', 'assignedTo', 'createdAt'],
  },
  access: { read: isSales, create: isSales, update: isSales, delete: isSuperAdmin },
  indexes: [{ fields: ['status', 'type'] }],
  fields: [
    { name: 'type', type: 'select', required: true, index: true, options: leadTypeOptions },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: [
        { value: 'new', label: l('Nouveau', 'New') },
        { value: 'contacted', label: l('Contacté', 'Contacted') },
        { value: 'qualified', label: l('Qualifié', 'Qualified') },
        { value: 'won', label: l('Gagné', 'Won') },
        { value: 'lost', label: l('Perdu', 'Lost') },
      ],
    },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'phone', type: 'text' },
    { name: 'organization', type: 'text', label: l('Organisation', 'Organization') },
    { name: 'jobTitle', type: 'text', label: l('Fonction', 'Job title') },
    { name: 'city', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'message', type: 'textarea' },
    {
      name: 'details',
      type: 'json',
      label: l('Champs qualifiants (selon le type)', 'Qualifying fields'),
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'form',
      index: true,
      options: [
        { value: 'form', label: l('Formulaire', 'Form') },
        { value: 'calcom', label: 'Cal.com' },
        { value: 'guide', label: l('Guide téléchargé', 'Guide download') },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'manual', label: l('Saisie manuelle', 'Manual') },
      ],
    },
    { name: 'sourcePage', type: 'text', label: l('Page d’origine', 'Source page') },
    { name: 'locale', type: 'select', options: contentLanguageOptions },
    {
      name: 'appointment',
      type: 'group',
      label: l('Rendez-vous', 'Appointment'),
      fields: [
        { name: 'bookingId', type: 'text', index: true },
        { name: 'eventType', type: 'text' },
        { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'utm',
      type: 'group',
      fields: [
        { name: 'source', type: 'text' },
        { name: 'medium', type: 'text' },
        { name: 'campaign', type: 'text' },
      ],
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: l('Responsable', 'Owner'),
    },
    {
      name: 'notes',
      type: 'array',
      label: l('Notes de suivi', 'Follow-up notes'),
      fields: [
        { name: 'text', type: 'textarea', required: true },
        { name: 'author', type: 'relationship', relationTo: 'users' },
        { name: 'at', type: 'date' },
      ],
    },
    { name: 'consent', type: 'relationship', relationTo: 'consents' },
  ],
}
