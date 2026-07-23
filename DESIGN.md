# Spuds visual system

Warm, social, trustworthy — Airbnb warmth, not a sticker sheet. Cream canvas,
ink text, color only where it means something.

## Color = meaning

| Color | Tailwind | Allowed uses | Never |
| --- | --- | --- | --- |
| Spuds Pink | `spud-*` | Interactive only: primary buttons, links, active nav, selected chips, focus rings | Decorating categories, badges, headings |
| Sprout Green | `sprout-*` | Positive status only: "Free", "You're going", verified, published, capacity healthy | Buttons, decoration |
| Amber | `amber-*` | Star ratings only | Anything else |
| Red | `red-*` | Errors and destructive actions only | Anything else |
| Cream | `cream-*` | Page/surface backgrounds | Text, badges |
| Soil | `soil-*` | All text and neutral UI (borders, muted badges) | — |

If everything is colored, color stops communicating. Default to neutral.

## Icons

- **One system: lucide.** Two sizes only — `size-4` inline/metadata, `size-5` feature rows.
- **No emoji in UI chrome**: headers, buttons, badges, labels, nav, list rows.
- Emoji are allowed in exactly two places:
  1. **Empty states / confirmation moments** — one large emoji as illustration (the 🥔 is the mascot).
  2. **Reputation badges** (🌱🎮🏆🔥) — they are product content from the spec, not chrome.
- A single 👋 in a personal greeting is copy, not chrome. Everything else: no.

## Type scale (four steps, nothing in between)

| Step | Classes | Use |
| --- | --- | --- |
| Screen title | `font-display text-3xl font-black` | One per screen |
| Section/card title | `font-display text-lg font-extrabold` | Section headers, card titles |
| Body | `text-sm` / `text-base` | Everything |
| Caption | `text-xs text-soil-800/50` | Metadata, timestamps |

Display font (Nunito) is reserved for the two title steps.

## Components enforce the rules

- `Badge` has two tones: `neutral` (all metadata — games, platforms, event type,
  skill) and `positive` (green status). There is no pink badge.
- `Button` has `primary` (pink), `outline`, `ghost`, `danger`. There is no green button.
- Radii: cards `rounded-card` (24px), inputs `rounded-xl` (12px), buttons/chips pill.

## Guardrail

`npm run lint:design` fails if emoji appear in `src/` outside the whitelist.
Run it before committing UI work.
