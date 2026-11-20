# Gaming UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a precise, mobile-first gaming interface for Gen Z/Alpha users while retaining GachaFi's existing colors and chain behavior.

**Architecture:** Refine existing React/Tailwind components and add a small global shell. Use native controls, fixed component dimensions, bounded content columns, and restrained CSS effects; add no design dependency.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, Vitest/Testing Library, headless Chrome.

## Global Constraints

- Preserve existing HSL palette and common/rare/epic colors.
- Do not change wallet, transaction, Gateway, privacy, or contract behavior.
- No constant card particles, scale-induced clipping, duplicate helper text, or fixed controls overlapping content.
- Support 320px+ mobile screens, keyboard navigation, and reduced motion.
- Verify the production build with real browser screenshots before pushing.

---

### Task 1: Global shell and visual foundation

**Files:**
- Create: `src/components/AppHeader.tsx`, `src/components/AppHeader.test.tsx`
- Modify: `src/App.tsx`, `src/components/AudioControls.tsx`, `src/components/BottomNav.tsx`, `src/index.css`

**Interfaces:**
- Produces: `AppHeader` renders a vector logo linked to `/open` and `AudioControls`.
- Produces: bottom navigation uses `grid grid-cols-3` and links with `min-w-0`.

- [ ] **Step 1: Write failing shell tests**

```tsx
render(<MemoryRouter><AppHeader /></MemoryRouter>);
expect(screen.getByRole('link', { name: /GachaFi home/i })).toHaveAttribute('href', '/open');
expect(screen.getByRole('button', { name: /audio/i })).toBeInTheDocument();
```

Add a BottomNav test asserting three links and the `grid-cols-3` class.

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npm test -- --run src/components/AppHeader.test.tsx`
Expected: FAIL because `AppHeader` does not exist.

- [ ] **Step 3: Implement shell and CSS**

Create the header using a Lucide `PackageOpen` mark inside a purple/pink gradient square. Mount it in `App.tsx` and hide it on `/` and `/reveal`. Convert `AudioControls` from fixed positioning to a compact inline control with an accessible `aria-label` for mute/unmute. Add `app-header`, `game-background`, `game-panel`, `primary-game-button`, and `safe-area-pb` styles using existing CSS variables. Remove heavy foreground blur and infinite glow effects from shared components.

- [ ] **Step 4: Verify and commit**

Run: `npm run check && npm test -- --run src/components/AppHeader.test.tsx`
Expected: PASS.

```bash
git add src/App.tsx src/components/AppHeader.tsx src/components/AppHeader.test.tsx src/components/AudioControls.tsx src/components/BottomNav.tsx src/index.css
git commit -m "feat: add responsive gaming app shell"
```

### Task 2: Open screen, balance, and tier selection

**Files:**
- Modify: `src/pages/Open.tsx`, `src/pages/Open.test.tsx`
- Modify: `src/components/BalanceDisplay.tsx`, `src/components/OpenButton.tsx`
- Rewrite: `src/components/TierSelector.tsx`
- Create: `src/components/TierSelector.test.tsx`

**Interfaces:**
- Preserve `Tier`, `tiers`, and all existing component prop signatures.
- Tier cards are native `<button type="button" aria-pressed="...">` elements.

- [ ] **Step 1: Add failing behavior and structure tests**

```tsx
render(<TierSelector {...props} />);
expect(screen.getByRole('button', { name: /Common, 8 XRD/i })).toHaveAttribute('aria-pressed', 'false');
await user.click(screen.getByRole('button', { name: /Rare, 15 XRD/i }));
expect(props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'rare' }));
```

Assert there are no pagination buttons or `role="button"` cards, and Open renders only one wallet-helper message.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- --run src/components/TierSelector.test.tsx src/pages/Open.test.tsx`
Expected: FAIL on the new native-button/structure expectations.

- [ ] **Step 3: Implement stable responsive components**

Rewrite TierSelector without particles, dots, scroll arrows, or selected scaling. Use native buttons with stable fixed heights, mobile left-start scrolling and a desktop three-column grid. Keep rarity labels visible and icons statically crisp.

BalanceDisplay becomes a full-width `game-panel` with an Available Balance label, amount, and a separate wrapping status row. OpenButton uses `primary-game-button h-16 w-full max-w-sm` for both connect/open states and contains no duplicate helper paragraph.

Open.tsx uses `game-background min-h-screen px-4 pb-28 pt-20` and a centered bounded content column. Remove floating orb markup and repeated helper copy while preserving transaction logic and statuses.

- [ ] **Step 4: Verify and commit**

Run: `npm run check && npm test -- --run src/components/TierSelector.test.tsx src/pages/Open.test.tsx`
Expected: all focused and existing Open tests pass.

```bash
git add src/pages/Open.tsx src/pages/Open.test.tsx src/components/BalanceDisplay.tsx src/components/OpenButton.tsx src/components/TierSelector.tsx src/components/TierSelector.test.tsx
git commit -m "feat: refine core gaming interaction"
```

### Task 3: Landing, Collection, Reveal, and Privacy polish

**Files:**
- Rewrite: `src/components/HeroSection.tsx`
- Modify: `src/pages/Index.tsx`, `src/pages/Inventory.tsx`, `src/pages/Reveal.tsx`, `src/pages/Privacy.tsx`
- Modify: `src/components/BadgeCard.tsx`, `src/components/BadgeImage.tsx`
- Create: `src/pages/Index.test.tsx`

**Interfaces:**
- Landing exposes a Play link to `/open` and no automatic redirect.
- Badge components keep their existing props.

- [ ] **Step 1: Add failing landing/support tests**

```tsx
render(<MemoryRouter><Index /></MemoryRouter>);
expect(screen.getByRole('link', { name: /play now/i })).toHaveAttribute('href', '/open');
expect(screen.getByText(/Open\. Reveal\. Collect\./i)).toBeInTheDocument();
```

Verify no redirect occurs after a short timer and the PWA install behavior remains mounted.

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm test -- --run src/pages/Index.test.tsx`
Expected: FAIL because Play and the new copy do not exist.

- [ ] **Step 3: Implement supporting-screen refinement**

Use concise landing copy, a primary Play link, a secondary How It Works link, and the existing hero artwork as a subtle backdrop. Remove the six-second redirect and unused navigation effect.

Apply consistent `pt-20 pb-28` shell spacing and bounded widths to Inventory/Privacy. Keep BadgeImage unfiltered and centered within a fixed aspect ratio. BadgeCard uses a stable content grid, visible rarity, and neutral custom-tier fallback. Reveal retains actual NFT data and uses one entry transition with a subtle rarity glow.

- [ ] **Step 4: Verify and commit**

Run: `npm run check && npm test -- --run src/pages`
Expected: all page tests pass.

```bash
git add src/components/HeroSection.tsx src/pages/Index.tsx src/pages/Index.test.tsx src/pages/Inventory.tsx src/pages/Reveal.tsx src/pages/Privacy.tsx src/components/BadgeCard.tsx src/components/BadgeImage.tsx
git commit -m "feat: polish gaming landing and supporting screens"
```

### Task 4: Visual verification, documentation, and release

**Files:**
- Modify: `docs/design-system.md` with a current-design section.
- Modify: `README.md` only if user-facing navigation behavior needs correction.

- [ ] **Step 1: Run complete quality gates**

```bash
npm ci
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
git diff --check
```

Expected: every command exits 0; existing lint warnings remain non-blocking only if no new warnings appear.

- [ ] **Step 2: Capture and inspect production screenshots**

Start `npm run preview -- --host 127.0.0.1`. Use headless Chrome at 390×844 and 1440×1000 for `/open`; capture `/`, `/inventory`, and `/privacy` at mobile size. Read every image. Confirm no horizontal overflow, clipped navigation, duplicated helper text, overlapping audio/header content, or unreadable selected states.

- [ ] **Step 3: Fix and reverify any visual defect**

Change only the component responsible for the observed defect. Rerun its focused test and capture the same viewport again. Do not claim visual completion from code alone.

- [ ] **Step 4: Update current design documentation and push**

Document the new shell, stable card sizing, responsive breakpoints, motion policy, and screenshot verification. Commit all reviewed work and push `main` normally. Confirm the remote SHA and final GitHub Actions result.
