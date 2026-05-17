# Skinora Theme Constitution

## Token source of truth
All design tokens live in [assets/typography.css](assets/typography.css), in the
`:root` block. Never redefine these elsewhere; never hard-code their values.

## Typography rules (non-negotiable)
- Use ONLY tokens defined in `assets/typography.css`:
  - `--fs-*` (font-size)
  - `--fw-*` (font-weight)
  - `--ink-*` / `--paper-*` (color)
  - `--space-*` (spacing)
  - `--ff-*` (font-family)
  - `--tracking-*` (letter-spacing)
  - `--lh-*` (line-height)
  - `--measure-*` (max-width for prose)
- NEVER use `font-weight: 300`. Allowed weights: `400` (regular), `500` (medium),
  `600` (semibold). Avoid `700`.
- NEVER use `!important` in new code. Existing usage is being phased out.
- NEVER create duplicate rules. Edit the source, do not layer overrides.
- Ink palette (5 tints, purple-grey family):
  - `--ink-900 #2d1b3d` — display, prices
  - `--ink-700 #3a3448` — H2, primary body, FAQ Q, buttons bg
  - `--ink-500 rgba(45,27,61,.72)` — secondary body, captions, meta
  - `--ink-400 rgba(45,27,61,.58)` — low-emphasis body, sub-captions
  - `--ink-300 rgba(45,27,61,.42)` — hint, divider, disabled
- Fonts: `freight-text-pro` for serif/display, `sofia-pro` for sans/body.

## Reading floors (mobile)
- Body ≥ 16px
- H2 ≥ 28px
- Caption ≥ 13px
- Hero H1 mobile = 28–32px, desktop = 48–52px (use `--fs-hero` token)

## Spacing scale
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` (tokens `--space-1` through `--space-8`).
Larger increments `--space-9 (96)` and `--space-10 (128)` exist for section gaps.

## Section padding
Use `--space-section-sm / -md / -lg` (responsive 48→72, 72→96, 96→128) via the
`.sk-lp-section`, `.lp-section`, and `--sm` / `--lg` modifier classes.

## Workflow
- Atomic commit per phase.
- Do not make independent design decisions. Implement specs as given.
- When in doubt, stop and ask rather than guess.
- Verify the change renders correctly before marking a phase complete.
- Never publish/push to the live theme. Only work on the development theme draft.
- Run `shopify theme check` (if configured) after any CSS change.

## File conventions
- One section = one CSS file in `assets/section-<section-handle>.css`.
- Load via `{{ 'section-<handle>.css' | asset_url | stylesheet_tag }}` at the
  top of the section's `.liquid` file.
- Avoid large inline `<style>` blocks in section files — extract to the
  corresponding asset file.

## Sections in scope
- `sections/sk-lp-hero.liquid` (hero)
- `sections/sk-lp-problem.liquid` (problem framing)
- `sections/sk-lp-results-timeline.liquid`
- `sections/sk-lp-reviews.liquid`
- `sections/sk-lp-why-choose.liquid`
- `sections/sk-lp-how-to-use.liquid`
- `sections/sk-lp-tech-specs.liquid`
- `sections/sk-lp-whats-in-box.liquid`
- `sections/sk-lp-trust-full.liquid`
- `sections/sk-lp-documentation.liquid`
- `sections/sk-lp-faq.liquid` (+ `sections/skinora-faq.liquid`)
- `sections/sk-lp-cta.liquid`
