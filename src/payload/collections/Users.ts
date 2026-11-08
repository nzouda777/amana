import type { CollectionConfig } from 'payload'

import { canAccessAdmin, isSuperAdmin, roleLabels, roles, selfOr } from '../access'
import { contentLanguageOptions, groups, l, options } from '../shared'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: l('Utilisateur', 'User'), plural: l('Utilisateurs', 'Users') },
  admin: {
    group: groups.system,
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'roles', 'createdAt'],
  },
  auth: {
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: canAccessAdmin,
    // Inscription publique via Server Action (zod + Turnstile), jamais via l'API REST brute.
    create: isSuperAdmin,
    read: selfOr('super-admin', 'sales'),
    update: selfOr('super-admin'),
    delete: isSuperAdmin,
  },
  fields: [
    { name: 'firstName', type: 'text', label: l('Prénom', 'First name') },
    { name: 'lastName', type: 'text', label: l('Nom', 'Last name') },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['learner'],
      saveToJWT: true,
      index: true,
      options: options(roles, roleLabels),
      access: { create: isSuperAdmin, update: isSuperAdmin },
      admin: { position: 'sidebar' },
    },
    { name: 'phone', type: 'text', label: l('Téléphone (E.164)', 'Phone (E.164)') },
    {
      name: 'preferredLocale',
      type: 'select',
      defaultValue: 'fr',
      options: contentLanguageOptions,
      label: l('Langue préférée', 'Preferred language'),
    },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    {
      name: 'memberships',
      type: 'join',
      collection: 'org-members',
      on: 'user',
      label: l('Organisations', 'Organizations'),
    },
  ],
}
