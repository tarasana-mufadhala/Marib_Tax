/**
 * Supabase Theme
 * Structured, tokenized, developer-first UI theme based on Supabase Design System.
 * Accent emerald: #72e3ad / #3ecf8e
 * Canvas dark: #000000 / #0c0c0c
 * Card / Surface: #171717 / #1f1f1f
 * Borders: #262626 / oklch(0.1 0 34 / 0.146)
 * Radius: 6px (0.375rem)
 */

import { defineTheme, defineSyntaxTheme } from '@astryxdesign/core/theme';
import { supabaseIconRegistry } from './icons';

const supabaseSyntax = defineSyntaxTheme({
  name: 'xds-supabase',
  tokens: {
    keyword: ['#3ecf8e', '#72e3ad'],
    string: ['#10b981', '#6ee7b7'],
    comment: ['#64748b', '#94a3b8'],
    number: ['#f59e0b', '#fbbf24'],
    function: ['#3b82f6', '#60a5fa'],
    type: ['#8b5cf6', '#a78bfa'],
    variable: ['#1e293b', '#f8fafc'],
    operator: ['#64748b', '#94a3b8'],
    constant: ['#f59e0b', '#fbbf24'],
    tag: ['#ef4444', '#fca5a5'],
    attribute: ['#eab308', '#fde047'],
    property: ['#14b8a6', '#5eead4'],
    punctuation: ['#94a3b8', '#64748b'],
    background: ['#ffffff', '#0c0c0c'],
  },
});

export const supabaseTheme = defineTheme({
  name: 'supabase',

  typography: {
    scale: { base: 15, ratio: 1.2 },
    body: {
      family: 'Inter',
      fallbacks:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'Inter',
      fallbacks:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      weights: { 3: 'bold', 4: 'bold' },
    },
    code: {
      family: 'ui-monospace',
      fallbacks:
        '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },

  motion: { fast: 150, medium: 200, slow: 400, ratio: 0.75 },

  syntax: supabaseSyntax,

  tokens: {
    // Backgrounds
    '--color-background-surface': ['#ffffff', '#171717'],
    '--color-background-body': ['#f8fafc', '#000000'],
    '--color-background-card': ['#ffffff', '#121212'],
    '--color-background-popover': ['#ffffff', '#171717'],
    '--color-background-muted': ['#f1f5f9', '#171717'],

    // Accents (Supabase Emerald #72e3ad / #3ecf8e)
    '--color-accent': ['#10b981', '#72e3ad'],
    '--color-accent-muted': ['#ecfdf5', '#064e3b'],
    '--color-neutral': ['#0000000F', '#FFFFFF1A'],

    // Overlays
    '--color-overlay': ['#00000080', '#000000CC'],
    '--color-overlay-hover': ['#0000000D', '#FFFFFF0D'],
    '--color-overlay-pressed': ['#0000001A', '#FFFFFF1A'],

    // Text
    '--color-text-primary': ['#0f172a', '#f8fafc'],
    '--color-text-secondary': ['#475569', '#94a3b8'],
    '--color-text-disabled': ['#94a3b8', '#475569'],
    '--color-text-accent': ['#047857', '#72e3ad'],
    '--color-on-dark': '#ffffff',
    '--color-on-light': '#0f172a',
    '--color-on-accent': ['#ffffff', '#000000'],
    '--color-on-success': ['#ffffff', '#000000'],
    '--color-on-error': ['#ffffff', '#ffffff'],
    '--color-on-warning': '#0f172a',

    // Icons
    '--color-icon-accent': ['#10b981', '#72e3ad'],
    '--color-icon-primary': ['#0f172a', '#f8fafc'],
    '--color-icon-secondary': ['#64748b', '#94a3b8'],
    '--color-icon-disabled': ['#94a3b8', '#475569'],

    // Sentiments
    '--color-success': ['#059669', '#3ecf8e'],
    '--color-error': ['#dc2626', '#f87171'],
    '--color-warning': ['#d97706', '#fbbf24'],
    '--color-success-muted': ['#d1fae5', '#064e3b3D'],
    '--color-error-muted': ['#fee2e2', '#7f1d1d3D'],
    '--color-warning-muted': ['#fef3c7', '#78350f3D'],

    // Borders
    '--color-border': ['#e2e8f0', '#262626'],
    '--color-border-emphasized': ['#cbd5e1', '#333333'],

    // Radius (Supabase 6px / 0.375rem default)
    '--radius-none': '0px',
    '--radius-inner': '4px',
    '--radius-element': '6px',
    '--radius-container': '8px',
    '--radius-page': '12px',
    '--radius-full': '9999px',

    // Shadows
    '--shadow-low':
      '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.08))',
    '--shadow-med':
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), inset 0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.1))',
    '--shadow-high':
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.12))',
  },

  components: {
    button: {
      'variant:destructive': {
        backgroundColor: 'var(--color-error-muted)',
        color: 'var(--color-error)',
      },
    },
    card: {
      base: {
        padding: '1rem',
        borderRadius: 'var(--radius-container)',
        border: '1px solid var(--color-border)',
      },
    },
  },

  icons: supabaseIconRegistry,
});
