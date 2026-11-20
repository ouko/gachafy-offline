# GachaFi Gaming UI Refinement Design

**Date:** 2026-11-20
**Goal:** Make the app feel like a polished mobile-first game for Gen Z/Alpha users without changing the existing default palette or product behavior.

## Evidence and problems

Headless Chrome captures of `/open` at 390×844 and 1440×1000 show:

- Tier content is clipped on mobile rather than intentionally scrolling from its left edge.
- The three bottom navigation items can overflow the viewport.
- Wallet helper text appears twice and is clipped on mobile.
- Fixed audio controls are disconnected from page structure.
- Selected-card scaling, constant glow, particles, shimmer, and pulse effects reduce visual precision.
- Large empty regions lack a deliberate branded hierarchy.

The redesign fixes layout first, then applies restrained visual polish.

## Chosen approach

Use a focused component redesign, not a full art replacement or a CSS-only reskin. Keep the current HSL background, purple primary, pink accent, cyan rare, and common gray colors. Use vector icons for small branding marks so they remain crisp at all sizes.

## Global shell

- Add a compact fixed header with a vector GachaFi mark, wordmark, and audio control.
- Give every relevant route consistent top clearance; hide the header on the immersive landing/reveal screens.
- Replace floating per-page audio controls with a labeled header control and accessible volume slider.
- Use a subtle fixed grid/radial background, with no heavy blur over foreground content.
- Change bottom navigation to a three-column grid with `min-width: 0`, small icons/labels, and safe-area padding. All items fit 320px-wide screens.

## Open screen

- Use a centered, bounded game column with clear spacing: balance, tier selection, primary action, then secondary information.
- Replace the glowing balance pill with a responsive card containing an explicit Available Balance label and readable amount. Statuses appear in a separate wrapping row.
- Rebuild tier cards as native buttons with fixed dimensions, no selected scaling, and a subtle selected border/inset highlight. Icons, rarity label, name, and price share a stable grid.
- On mobile, tier scrolling starts at the left edge with visible card affordance. On larger screens, use three equal columns. Remove redundant dots and hover-only information.
- Make Connect Wallet and Open use the same full-width purple-gradient primary treatment. Remove the disconnected green button style.
- Show helper text once. Keep transaction links, status errors, and offline behavior unchanged.

## Landing and supporting screens

- Replace automatic landing redirection with an explicit Play action.
- Use concise game-first copy: Open, Reveal, Collect. Retain the existing hero artwork as a restrained backdrop.
- Keep Collection cards aligned to a consistent image/name/rarity/SP grid with neutral custom-tier fallback.
- Preserve Privacy's readable forms and controls, adding shell spacing rather than decorative effects.
- Reveal uses one entry animation and a subtle rarity glow; the real NFT image remains unfiltered.

## Motion and accessibility

- No constant card pulsing, particle fields, or infinite CTA animation.
- Use short 150–250ms state transitions for selection and hover.
- Preserve global reduced-motion behavior.
- Native tier buttons support keyboard activation and visible focus. Audio controls have accessible names.
- Text remains readable without relying on gradient clipping. Monospace is reserved for amounts, IDs, and hashes.

## Verification

- Add component tests for native tier selection, single helper text, navigation fit structure, and landing Play navigation.
- Run all existing tests, typecheck, lint, production build, bundle budget, and dependency audit.
- Capture 390×844 and 1440×1000 screenshots of the actual built Open page, plus mobile landing, Collection, and Privacy.
- Confirm no horizontal document overflow, clipped navigation, duplicated helper text, or overlapping header controls.
- Commit and push only after the final screenshots and quality gates pass.
