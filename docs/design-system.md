# GachaFi Design System Specification

> **Version:** 1.0.0  
> **Scope:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui  
> **Theme:** Dark fantasy / DeFi gacha aesthetic  
> **Last audited:** 2026-05-05

---

## 1. Design Tokens

### 1.1 Color Palette

#### Core Semantic Colors (HSL → Hex)
| Token | HSL | Hex | Usage |
|---|---|---|---|
| `background` | `219 17% 8%` | `#11131a` | App background |
| `foreground` | `210 11% 96%` | `#f3f4f6` | Primary text |
| `card` | `219 17% 10%` | `#151722` | Card surfaces |
| `card-foreground` | `210 11% 96%` | `#f3f4f6` | Text on cards |
| `primary` | `262 75% 65%` | `#8B5CF6` | Primary actions, focus rings |
| `primary-foreground` | `219 17% 8%` | `#11131a` | Text on primary buttons |
| `secondary` | `219 17% 16%` | `#1c1f2b` | Secondary surfaces |
| `secondary-foreground` | `210 11% 96%` | `#f3f4f6` | Text on secondary |
| `muted` | `219 17% 14%` | `#181b25` | Muted backgrounds |
| `muted-foreground` | `210 11% 71%` | `#a8adb5` | Secondary / placeholder text |
| `accent` | `262 75% 65%` | `#8B5CF6` | Accents (same as primary) |
| `accent-foreground` | `219 17% 8%` | `#11131a` | Text on accent |
| `destructive` | `0 84% 60%` | `#EF4444` | Errors, destructive actions |
| `destructive-foreground` | `210 11% 96%` | `#f3f4f6` | Text on destructive |
| `border` | `219 17% 20%` | `#242837` | Default borders |
| `input` | `219 17% 16%` | `#1c1f2b` | Input backgrounds |
| `ring` | `262 75% 65%` | `#8B5CF6` | Focus rings |

#### Neon / DeFi Accent Colors
| Token | HSL | Hex | Glow Variable |
|---|---|---|---|
| `neon-purple` | `262 75% 65%` | `#8B5CF6` | `0 0 40px hsla(262,75%,65%,0.7)` |
| `neon-pink` | `328 85% 70%` | `#F472B6` | — |
| `neon-blue` | `195 100% 50%` | `#00D4FF` | — |
| `neon-gold` | `45 100% 70%` | `#FFD56A` | `0 0 40px hsla(45,100%,70%,0.7)` |
| `neon-emerald` | `160 84% 55%` | `#1DE9B6` | `0 0 40px hsla(160,84%,55%,0.7)` |
| `neon-crimson` | `348 83% 62%` | `#EF476F` | `0 0 40px hsla(348,83%,62%,0.7)` |

#### Rarity Colors
| Rarity | Gradient (top → bottom/right) | Glow Color | Border Glow |
|---|---|---|---|
| **Common** | `#CBD5E1` → `#94A3B8` → `#64748B` | `rgba(148, 163, 184, 0.6)` | `0 0 20px rgba(148,163,184,0.5)` |
| **Rare** | `#93C5FD` → `#60A5FA` → `#A855F7` | `rgba(59, 130, 246, 0.8)` | `0 0 25px rgba(59,130,246,0.7)` |
| **Epic** | `#D8B4FE` → `#F472B6` → `#F87171` | `rgba(168, 85, 247, 1.0)` | `0 0 30px rgba(168,85,247,0.9)` |

> **Note:** All rarity gradients use `bg-gradient-to-br` (135°) or `bg-gradient-to-r` (90°) depending on context.

#### Status / Semantic Colors
| State | Background | Text | Border |
|---|---|---|---|
| Offline | `rgba(249, 115, 22, 0.8)` (`orange-500/80`) | `#ffffff` | — |
| Pending TX | `rgba(59, 130, 246, 0.8)` (`blue-500/80`) | `#ffffff` | — |
| Pending Delta | `rgba(168, 85, 247, 0.8)` (`purple-500/80`) | `#ffffff` | — |
| Streak | `#FB9237` → `#EF4444` → `#EC4899` | `#ffffff` | `rgba(253, 186, 116, 0.3)` |
| Success | `#22C55E` | `#ffffff` | — |
| Warning | `#EAB308` | `#11131a` | — |

#### Glassmorphism Tokens
| Token | Value |
|---|---|
| `glass-bg` | `hsla(219, 17%, 12%, 0.8)` → `rgba(25, 28, 40, 0.8)` |
| `glass-border` | `hsla(255, 255%, 255%, 0.1)` → `rgba(255, 255, 255, 0.1)` |
| `glass-highlight` | `hsla(255, 255%, 255%, 0.05)` → `rgba(255, 255, 255, 0.05)` |

---

### 1.2 Typography Scale

| Token | Size | Line-Height | Weight | Letter-Spacing | Usage |
|---|---|---|---|---|---|
| `display` | 60px / 3.75rem | 1.0 | 800 (ExtraBold) | — | SP counter (`text-6xl`) |
| `h1` | 36px / 2.25rem | 2.5rem | 700 (Bold) | — | Hero title, 404 |
| `h2` | 30px / 1.875rem | 2.25rem | 700 | — | Hero subtitle |
| `h3` | 24px / 1.5rem | 2rem | 600 (SemiBold) | — | Card titles |
| `title-lg` | 20px / 1.25rem | 1.75rem | 700 | `0.05em` (`tracking-wider`) | Balance, tier price |
| `title-md` | 18px / 1.125rem | 1.75rem | 700 | — | Booster title |
| `body` | 16px / 1rem | 1.5rem | 400 / 500 / 700 | — | Body text, tier names |
| `body-sm` | 14px / 0.875rem | 1.25rem | 500 | — | Descriptions, captions |
| `caption` | 12px / 0.75rem | 1rem | 700 | `0.05em` | Status badges, labels |

**Font Families**
- Sans-serif: `Inter, system-ui, -apple-system, sans-serif`
- Monospace: `JetBrains Mono, ui-monospace, SFMono-Regular, monospace`

**Text Transform Rules**
- Tier names, rarity labels, button labels: `uppercase`
- Tier names, price labels: `tracking-widest` (`0.1em`)
- Button labels, balance: `tracking-wider` (`0.05em`)

---

### 1.3 Spacing Scale

The project uses Tailwind's default spacing scale. Key values in use:

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | `gap-2`, `p-2` |
| `space-3` | 12px | `gap-3` |
| `space-4` | 16px | `gap-4`, `px-4`, `p-4` |
| `space-6` | 24px | `gap-6`, `px-6` in tier row, `py-6` |
| `space-8` | 32px | `px-8` in balance, booster |
| `space-10` | 40px | `mt-10` |
| `space-12` | 48px | `mt-12` |

**Component-specific dimensions:**
- Tier card: `min-width: 160px`, `height: 200px`
- Tier icon container: `112px × 112px` (`w-28 h-28`)
- Balance badge: `rounded-full`, `px-32px py-16px`
- Open button: `min-width: 280px`, `height: 80px` (`h-20`)
- Reveal badge: `200px × 200px`

---

### 1.4 Shadow / Elevation Levels

| Level | Value | Usage |
|---|---|---|
| `glass` | `0 8px 32px 0 rgba(31, 38, 135, 0.4), inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 -1px 0 0 rgba(255,255,255,0.02)` | `.glass-card` |
| `glass-premium` | `0 12px 40px 0 rgba(31, 38, 135, 0.5), inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 -1px 0 0 rgba(255,255,255,0.02)` | `.glass-card-premium` |
| `neon` | `0 0 20px rgba(139, 92, 246, 0.5)` | Default neon glow |
| `neon-strong` | `0 0 30px rgba(139, 92, 246, 0.8)` | Intense neon glow |
| `glow` | `0 0 40px rgba(139, 92, 246, 0.3)` | Ambient glow |
| `card-hover` | `0 10px 30px rgba(0, 0, 0, 0.3)` | Elevated cards |
| `streak` | `0 10px 15px -3px rgba(0, 0, 0, 0.3)` | Streak badge shadow (`shadow-lg`) |

---

### 1.5 Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8px | Small elements |
| `radius-md` | 10px | Medium elements |
| `radius-lg` | 12px | Cards (shadcn default), `--radius` |
| `radius-xl` | 16px | — |
| `radius-2xl` | 20px | — |
| `radius-3xl` | 24px | Icon containers, booster card, Open button |
| `radius-full` | 9999px | Balance badge, streak badge, status pills, spinners |

---

### 1.6 Animation Timing

#### Duration Tokens
| Token | Value | Usage |
|---|---|---|
| `duration-fast` | 200ms | Accordions, micro-interactions |
| `duration-normal` | 300ms | Hover opacity, color changes |
| `duration-medium` | 400ms | Button transforms, page transitions |
| `duration-slow` | 500ms | Scale transitions (balance, booster hover) |
| `duration-slower` | 600ms | Shimmer sweep, count-up |
| `duration-slowest` | 700ms | Tier card transitions |
| `duration-shine` | 800ms | Glass card shine sweep (`::before`) |

#### Easing Tokens
| Token | Value | Usage |
|---|---|---|
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default UI transitions |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entry animations (zoom-in) |
| `ease-out-cubic` | `cubic-bezier(0.33, 1, 0.68, 1)` | SP count-up (`1 - Math.pow(1 - t, 3)`) |
| `ease-in-out-sine` | `ease-in-out` | Infinite loops (pulse, float, shimmer) |

---

## 2. Component Specifications

### 2.1 TierSelector / TierCard

**Structure:** Horizontal scroll container (`overflow-x-auto`) with flex row (`gap-24px`, `justify-center`, `snap-x snap-mandatory`). Each card is a `<Card>` rendered as `role="button"` with `tabIndex={0}`.

#### Dimensions & Layout
- Card: `min-width: 160px`, `height: 200px`, `flex-col`, `items-center`, `justify-center`, `position: relative`, `overflow: hidden`
- Container gap: `24px`
- Scroll padding: `px-16px`

#### Default State (Unselected)
- Background: `.glass-card-premium`
- Border: `1px solid rgba(255, 255, 255, 0.2)` (`border-white/20`)
- Border radius: `12px` (inherited from `<Card>`)
- Scale: `1.0`
- Particles: 12 (Common) / 16 (Rare) / 20 (Epic) white dots, `4px × 4px` (`w-1 h-1`), `border-radius: 9999px`, `opacity: 0.2`, `position: absolute`, static positions generated deterministically per card instance
- Icon container: `112px × 112px`, `border-radius: 24px`, `border: 2px solid rgba(255,255,255,0.2)`, rarity gradient fill
- Icon: `40px × 40px` (`w-10 h-10`), `color: #ffffff`, `drop-shadow: 0 0 10px rgba(0,0,0,0.5)` (`drop-shadow-lg`)
- Tier name: `text-xl` (20px), `font-weight: 700`, `uppercase`, `letter-spacing: 0.1em`, `color: #f3f4f6` (`text-foreground`)
- Price: `text-base` (16px), `font-family: JetBrains Mono`, `font-weight: 700`, `letter-spacing: 0.05em`, `color: #a8adb5` (`text-muted-foreground`)
- Rarity badge: hidden (`opacity: 0`)
- Shimmer overlay: hidden (`opacity: 0`)
- Selected dot: hidden

#### Hover State (Unselected)
- Transform: `scale(1.15) translateY(-12px)` (`hover:scale-[1.15] hover:-translate-y-3`)
- Border: `1px solid rgba(139, 92, 246, 0.6)` (`hover:border-primary/60`)
- Particles: `animate-ping` via `group-hover`
- Icon container: rarity-specific animation (`animate-pulse` for Common/Epic, `animate-bounce` for Rare) via `group-hover`
- Icon: `animate-pulse` via `group-hover`
- Sparkles icon: `animate-spin` via `group-hover`
- Tier name: gradient text clip active, `scale(1.05)`
- Price: `color: #8B5CF6` (`text-primary`), `scale(1.05)`
- Rarity badge: `opacity: 1`
- Shimmer overlay: `opacity: 1`
- Transition: `all 700ms cubic-bezier(0.4, 0, 0.2, 1)`

#### Selected State
- Transform: `scale(1.15) translateY(-12px)`
- Border: `2px solid rgba(139, 92, 246, 0.7)` (`border-2 border-primary/70`)
- Box shadow: rarity-specific border glow (see Rarity Colors table)
- Particles: `animate-ping` always active
- Icon container: rarity-specific animation always active
- Icon: `animate-pulse` always active
- Sparkles icon: `animate-spin` always active
- Tier name: gradient text clip, `scale(1.1)`
- Price: `color: rgba(139, 92, 246, 0.9)` (`text-primary/90`), `scale(1.1)`
- Rarity badge: `opacity: 1`
- Shimmer overlay: `opacity: 1`
- Selected indicator: `position: absolute`, `top: -4px`, `right: -4px`, `24px × 24px` circle, `background: #8B5CF6`, `border-radius: 9999px`, containing `8px × 8px` white dot, `animate-pulse`
- `aria-pressed: true`

#### Active / Pressed State
- Scale: `scale(1.12) translateY(-10px)` (slight shrink from hover)
- Transition: `all 150ms ease-out`

#### Focus State
- Outline: `2px solid #8B5CF6`
- Outline offset: `2px`
- Border radius: `12px`

#### Disabled State
- Not applicable (tiers are always selectable).

#### Animation Specs
- **Shimmer overlay:** `position: absolute`, `inset: 0`, `border-radius: 12px`, `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`, `opacity: 0` → `1` on hover/selected, `transition: opacity 300ms ease`
- **Particles:** `animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`, staggered `animation-delay` per particle (`0s` to `2s`)
- **Icon shimmer:** `.shimmer` class — `background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)`, `background-size: 200% 100%`, `animation: shimmer 2s linear infinite`
- **Glass shine sweep:** `::before` pseudo-element on `.glass-card-premium`, `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`, `left: -100%` → `left: 100%` on hover, `transition: left 800ms ease`

---

### 2.2 BalanceDisplay

**Structure:** Centered flex container with a single pill-shaped badge.

#### Default State
- Container: `display: flex`, `justify-content: center`, `margin-bottom: 32px`, `margin-top: 64px`, `position: relative`, `z-index: 10`
- Badge: `.glass-card-premium`, `border-radius: 9999px`, `padding: 16px 32px`, `display: flex`, `align-items: center`, `gap: 16px`, `cursor: pointer`, `user-select: none`
- Balance text: `text-xl` (20px), `font-weight: 800`, `font-family: JetBrains Mono`, `letter-spacing: 0.05em`, `.gradient-text-holographic`
- Animation: `animation: glow-pulse 3s ease-in-out infinite` applied inline

#### Hover State
- Transform: `scale(1.05)`
- Transition: `all 500ms cubic-bezier(0.4, 0, 0.2, 1)`

#### Active / Pressed State
- Transform: `scale(0.98)`
- Transition: `all 150ms ease-out`

#### Streak Badge (Conditional)
- Background: `linear-gradient(90deg, #FB9237, #EF4444, #EC4899)`
- Text: `#ffffff`, `text-sm` (14px), `font-weight: 700`, `letter-spacing: 0.025em`
- Padding: `8px 16px`
- Border radius: `9999px`
- Border: `1px solid rgba(253, 186, 116, 0.3)`
- Shadow: `0 10px 15px -3px rgba(0,0,0,0.3)`
- Icon: `Flame`, `16px`, `color: #FEF08A` (`text-yellow-200`), `animate-pulse`
- Sparkles: `Sparkles`, `14px`, `color: #FEF08A`, `animate-pulse`

#### Status Badges (Conditional)
All status badges share:
- `text-xs` (12px), `font-weight: 700` (for offline) / `500` (for TX)
- `padding: 4px 12px`
- `border-radius: 9999px`
- `backdrop-filter: blur(4px)` (`backdrop-blur-sm`)

| Badge | Background | Text Color |
|---|---|---|
| Offline | `rgba(249, 115, 22, 0.8)` | `#ffffff` |
| Pending TX | `rgba(59, 130, 246, 0.8)` | `#ffffff` (mono font) |
| Pending Delta | `rgba(168, 85, 247, 0.8)` | `#ffffff` (mono font) |
| Queued | `rgba(168, 85, 247, 0.8)` | `#ffffff` |

#### Animation Specs
- **Glow pulse:** `box-shadow` oscillates between `0 0 20px hsla(262,75%,65%,0.4)` and `0 0 40px hsla(262,75%,65%,0.8)`, `3s ease-in-out infinite`
- **Holographic text:** `background: linear-gradient(45deg, #8B5CF6, #00D4FF, #F472B6, #FFD56A)`, `background-size: 200% 200%`, `-webkit-background-clip: text`, `animation: holographic-text 2s ease-in-out infinite`

---

### 2.3 BoosterControl

**Structure:** Centered flex container with `.glass-card-premium` wrapper.

#### Default State
- Container: `margin-top: 40px`, `display: flex`, `justify-content: center`
- Card: `.glass-card-premium`, `border-radius: 24px`, `padding: 24px 32px`, `display: flex`, `align-items: center`, `gap: 24px`, `border: 1px solid rgba(250, 204, 21, 0.2)` (`border-yellow-400/20`)
- Icon wrapper: `padding: 8px`, `border-radius: 9999px`, `background: linear-gradient(90deg, rgba(250,204,21,0.2), rgba(249,115,22,0.2))`, `border: 1px solid rgba(250,204,21,0.3)`
- Icon: `Zap`, `24px × 24px`, default `color: #a8adb5` (`text-muted-foreground`), `animate-pulse`
- Title: `text-lg` (18px), `font-weight: 700`, `.gradient-text-gold`
- Description: `text-sm` (14px), `color: #a8adb5`, `font-weight: 500`
- Switch: `scale(1.25)` (`scale-125`), unchecked track `background: #1c1f2b` (`bg-input`)

#### Hover State
- Card transform: `scale(1.05)`
- Transition: `all 500ms cubic-bezier(0.4, 0, 0.2, 1)`

#### Active / Checked State
- Icon: `color: #FACC15` (`text-yellow-400`)
- Switch track: `background: linear-gradient(90deg, #FACC15, #F97316)` (`from-yellow-400 to-orange-500`)
- Switch thumb: `translate-x: 20px` (standard Radix Switch behavior)

#### Focus State
- Inherited from shadcn Switch: `ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-[#11131a]`

#### Animation Specs
- Icon pulse: `animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`
- Gold gradient text: `background: linear-gradient(135deg, hsl(45,100%,70%), hsl(45,100%,60%))`, `-webkit-background-clip: text`

---

### 2.4 OpenButton

**Structure:** shadcn `<Button size="lg">` with custom `.holographic-button` class.

#### Default State (Can Afford, Online, Connected)
- Size: `min-width: 280px`, `height: 80px`, `border-radius: 24px`
- Background: `.holographic-button` → `background: linear-gradient(45deg, #8B5CF6, #00D4FF, #F472B6, #FFD56A)`, `background-size: 300% 300%`
- Border: `2px solid rgba(255, 255, 255, 0.3)`
- Text: `text-xl` (20px), `font-weight: 700`, `letter-spacing: 0.05em`, `color: #ffffff`
- Shadow: `0 0 60px hsla(262,75%,65%,0.5), 0 0 100px hsla(328,85%,70%,0.3)`
- Icons: `Sparkles`, `20px × 20px`, `animate-pulse`, one on each side of label

#### Hover State
- Transform: `translateY(-4px) scale(1.05)`
- Animation speed: holographic shift speeds from `3s` to `1s` cycle
- Transition: `all 400ms cubic-bezier(0.4, 0, 0.2, 1)`

#### Active / Pressed State
- Transform: `translateY(-1px) scale(0.98)`
- Transition: `all 150ms ease-out`

#### Disabled State (Insufficient Funds)
- Opacity: `0.5`
- Cursor: `not-allowed`
- Filter: `grayscale(100%)`
- Text: `Need {shortfall} XRD`

#### Loading State
- Content replaced by spinner + label
- Spinner: `24px × 24px` circle, `border: 3px solid #ffffff`, `border-top-color: transparent`, `border-radius: 9999px`, `animation: spin 1s linear infinite`
- Label: `"Processing…"` (if pending TX) or `"Connecting…"`

#### Offline Queue State
- Same visual styling as default
- Label: `"Queue {tierName} • {cost} XRD"`

#### Not Connected State
- Content replaced by `<radix-connect-button>` at `scale(1.5)`
- Subtext: `text-sm`, `color: #a8adb5`, `"Connect your Radix wallet to start opening boxes"`

#### Focus State
- `ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-[#11131a]`

#### Animation Specs
- **Holographic shift:** `background-position` animates from `0% 50%` to `100% 50%`, `3s ease-in-out infinite` (speeds to `1s` on hover)
- Keyframes: `@keyframes holographic-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`

---

### 2.5 Reveal Page

**Structure:** Full-screen flex column (`min-h-screen`), centered content.

#### Background
- Base: `#11131a` (`bg-background`)
- Ambient gradients: radial gradients at 20% 80% (`purple-400/20`), 80% 20% (`pink-400/20`), etc. (same as Open page)

#### Reward Badge
- Image: `mythic-badge.png`, `200px × 200px`, `object-fit: contain`
- Entry animation: `scale(0) opacity(0)` → `scale(1) opacity(1)`, `400ms`, `cubic-bezier(0.16, 1, 0.3, 1)` (`animate-zoom-in`)
- Delay: `100ms` after mount
- Glow: `position: absolute`, `inset: 0`, `z-index: -10`, `border-radius: 9999px`, `filter: blur(24px)` (`blur-2xl`), `opacity: 0.7`, `background: rarity gradient`

#### Tier Label
- Layout: `flex`, `align-items: center`, `gap: 8px`
- Icon: Lucide icon matching tier, `20px × 20px`, `color: rgba(255,255,255,0.8)`
- Text: `text-lg` (18px), `uppercase`, `letter-spacing: 0.1em`, `color: rgba(255,255,255,0.8)`

#### SP Counter
- Value: `text-6xl` (60px), `font-weight: 700`, `color: #ffffff`
- Animation: `animate-count-up` — `opacity: 0.5` → `1.0`, `600ms ease-out`
- Count-up logic: JS-driven, `600ms` duration, `easeOutCubic` easing (`1 - Math.pow(1 - progress, 3)`), starts `400ms` after mount
- Label: `text-xl` (24px), `color: #E9D5FF` (`text-purple-200`)

#### TX Hash (Conditional)
- Background: `rgba(255,255,255,0.1)`
- Text: `text-sm` (14px), `font-family: JetBrains Mono`, `color: #ffffff`
- Padding: `8px 16px`
- Border radius: `9999px`

#### Share Button
- Background: `#ffffff`
- Text: `color: #000000`, `font-weight: 600`
- Padding: `12px 32px`
- Hover: `background: #F3F4F6` (`hover:bg-gray-100`)

#### Countdown Text
- Text: `text-sm` (14px), `color: #E9D5FF` (`text-purple-200`), `opacity: 0.75`

#### Auto-navigation
- Timer: `3000ms` after mount
- No transition animation on exit (instant route change)

---

## 3. Motion Design

### 3.1 Page Transitions

| Transition | From | To | Spec |
|---|---|---|---|
| **Index → Open** | Hero fade | Main UI | `opacity: 1 → 0`, `300ms ease-out` on hero; immediate mount of Open page |
| **Open → Reveal** | Current UI | Full-screen reveal | No exit animation; Reveal mounts with badge `zoom-in` |
| **Reveal → Open** | Reveal unmounts | Open remounts | Instant; Open page has no entry animation |
| **404** | — | Static page | No animation |

**Note:** The current implementation does not use a shared layout or Framer Motion for route transitions. All page changes are instant React Router navigations.

### 3.2 Button Press Feedback

| Component | Press Down | Press Up | Spec |
|---|---|---|---|
| **OpenButton** | `scale(0.98) translateY(-1px)` | `scale(1.05) translateY(-4px)` (if hover persists) | `150ms ease-out` down, `400ms cubic-bezier(0.4,0,0.2,1)` up |
| **TierCard** | `scale(1.12) translateY(-10px)` | `scale(1.15) translateY(-12px)` (if selected) | `150ms ease-out` down, `700ms cubic-bezier(0.4,0,0.2,1)` up |
| **BalanceDisplay** | `scale(0.98)` | `scale(1.05)` | `150ms ease-out` down, `500ms cubic-bezier(0.4,0,0.2,1)` up |
| **BoosterControl** | `scale(0.98)` | `scale(1.05)` | `150ms ease-out` down, `500ms cubic-bezier(0.4,0,0.2,1)` up |

### 3.3 Success / Error State Animations

| State | Visual | Spec |
|---|---|---|
| **Transaction Submitted** | Sonner toast (shadcn/ui), default styling | No custom animation |
| **Transaction Failed** | Sonner toast, destructive variant | No custom animation |
| **Insufficient Funds** | Error sound + destructive toast | No custom animation |
| **Reveal Success** | Badge `zoom-in` + SP count-up | See Reveal Page spec |
| **Offline Queued** | Standard toast notification | No custom animation |

### 3.4 Skeleton Loading Patterns

The project currently **does not implement skeleton loaders**. Recommended pattern:

| Element | Skeleton Style |
|---|---|
| **Balance** | `112px × 40px` pill, `.glass-card-premium` base, shimmer overlay (`animate-shimmer`), `border-radius: 9999px` |
| **Tier Cards** | `160px × 200px` rectangle, `.glass-card-premium` base, shimmer overlay, `border-radius: 12px` |
| **Open Button** | `280px × 80px` rectangle, `background: #1c1f2b`, shimmer overlay, `border-radius: 24px` |

**Shimmer keyframes:**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
**Shimmer CSS:** `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`, `background-size: 200% 100%`, `animation: shimmer 2s linear infinite`

### 3.5 Ambient Background Motion

The Open page renders four floating orbs:

| Orb | Size | Gradient | Blur | Animation |
|---|---|---|---|---|
| 1 | `160px × 160px` | `from-purple-400/20 to-pink-400/20` | `blur-2xl` (40px) | `magical-float 6s ease-in-out infinite` |
| 2 | `128px × 128px` | `from-blue-400/25 to-purple-400/25` | `blur-xl` (24px) | `magical-float 8s ease-in-out infinite`, delay `2s` |
| 3 | `96px × 96px` | `from-pink-400/15 to-red-400/15` | `blur-lg` (16px) | `magical-float 10s ease-in-out infinite`, delay `4s` |
| 4 | `112px × 112px` | `from-emerald-400/20 to-blue-400/20` | `blur-xl` | `magical-float 7s ease-in-out infinite`, delay `1s` |

**`magical-float` keyframes:**
```css
@keyframes magical-float {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.6; }
  33%   { transform: translateY(-8px) translateX(4px) rotate(120deg); opacity: 0.8; }
  66%   { transform: translateY(-4px) translateX(-4px) rotate(240deg); opacity: 1; }
}
```

---

## 4. Accessibility Requirements

### 4.1 Contrast Ratios (WCAG 2.1 AA)

| Text | Background | Ratio | Pass |
|---|---|---|---|
| `#f3f4f6` (foreground) | `#11131a` (background) | **16.8:1** | ✅ |
| `#a8adb5` (muted) | `#11131a` (background) | **7.3:1** | ✅ |
| `#8B5CF6` (primary) | `#11131a` (background) | **5.3:1** | ✅ |
| `#ffffff` | `#8B5CF6` (primary) | **4.6:1** | ✅ |
| `#ffffff` | `#1c1f2b` (secondary/input) | **12.1:1** | ✅ |
| `#ffffff` | `#EF4444` (destructive) | **4.5:1** | ✅ |
| `#FFD56A` (gold text) | `#11131a` | **10.2:1** | ✅ |

#### ⚠️ Contrast Issues Requiring Fixes

| Element | Current | Problem | Recommendation |
|---|---|---|---|
| **Rarity badge text** | `#ffffff` on gradient midpoints | 2.1–2.4:1 (fails AA) | Change to `#0F172A` (`slate-900`). On lightest gradient stops: Common `#CBD5E1` → 10.8:1, Rare `#93C5FD` → 5.4:1, Epic `#D8B4FE` → 5.1:1 |
| **Streak badge text** | `#FEF08A` (`yellow-200`) on orange-pink gradient | ~2.0:1 (decorative icon) | Acceptable for decorative icons; ensure adjacent text is `#ffffff` |
| **Sparkles icons in buttons** | `#ffffff` on holographic gradient | Varies ~2.5–4.0:1 | Add `drop-shadow: 0 1px 2px rgba(0,0,0,0.5)` to ensure text/icon separation from background |
| **Muted-foreground links** | `#a8adb5` on `#11131a` | 7.3:1 | Passes, but hover state should shift to `#f3f4f6` for clearer affordance |

### 4.2 Focus Ring Styles

All interactive elements **must** use the following focus indicator:

```css
:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
  border-radius: inherit; /* or specific radius per component */
}
```

**Component-specific focus overrides:**
- **TierCard:** `outline-offset: 2px`, `border-radius: 12px`. Must also respond to `Enter` and `Space` keys (`onKeyDown` handler is already implemented).
- **OpenButton:** Inherited from shadcn Button (`ring-2 ring-ring ring-offset-2`). No override needed.
- **BoosterControl (Switch):** Inherited from Radix Switch primitive (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`). No override needed.
- **BalanceDisplay:** Not keyboard-focusable by default (div). If made focusable (`tabIndex={0}`), apply same ring style.

### 4.3 Reduced Motion Alternatives

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all infinite loops */
  .animate-pulse,
  .animate-ping,
  .animate-bounce,
  .animate-spin,
  .animate-float,
  .animate-glow-pulse,
  .animate-shimmer,
  .animate-holographic-shift,
  .animate-holographic-text,
  .animate-magical-float,
  .animate-pulse-slow,
  .animate-spin-slow,
  .animate-holographic-pulse,
  .animate-magical-bounce {
    animation: none !important;
  }

  /* Instant transitions */
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }

  /* Keep functional state changes instant */
  .tier-card:hover,
  .tier-card[data-selected="true"] {
    transform: none;
  }

  /* Reveal page: show badge immediately, skip count-up */
  .reveal-badge {
    transform: scale(1);
    opacity: 1;
  }
}
```

**Behavioral changes under `prefers-reduced-motion`:**
- Tier cards: No scale/translate on hover. Border color change only.
- Particles: Hidden.
- Shimmer effects: Hidden.
- Open button: No holographic background animation. Static gradient.
- Balance glow: Static shadow (no pulse).
- Reveal page: Badge appears instantly. SP number jumps to final value without count-up.
- Ambient orbs: Hidden.
- All toast notifications: No slide/fade; instant appearance.

### 4.4 Touch Targets

| Component | Minimum Size | Actual Size | Pass |
|---|---|---|---|
| TierCard | `44px × 44px` | `160px × 200px` | ✅ |
| OpenButton | `44px × 44px` | `280px × 80px` | ✅ |
| BalanceDisplay | `44px × 44px` | ~`200px × 64px` | ✅ |
| Booster Switch | `44px × 44px` | `44px × 24px` track, thumb `20px × 20px` | ⚠️ Increase switch hit area with `padding: 10px` (negative margin) |

### 4.5 Screen Reader Considerations

- **TierCard:** Must maintain `role="button"`, `tabIndex={0}`, `aria-pressed={isSelected}`, and visible label text.
- **OpenButton:** Must use native `<button>` (shadcn Button does). Loading state should announce via `aria-live="polite"` region or toast.
- **BalanceDisplay:** Wrap in `aria-live="polite"` so pending delta / TX status changes are announced.
- **Reveal page:** The `2000ms` auto-redirect should be announced with `aria-live="polite"` on the countdown text.

---

## Appendix A: Known Implementation Gaps

The following classes/values are used in the codebase but do not exist in standard Tailwind and should be normalized:

| Current Code | Issue | Spec Recommendation |
|---|---|---|
| `hover:scale-115` | No `scale-115` in default Tailwind | Use `hover:scale-[1.15]` |
| `scale-115` | Same | Use `scale-[1.15]` |
| `duration-400` | No `duration-400` in default Tailwind | Use `duration-400` if custom config added, else `duration-500` |
| `border-3` | No `border-3` in default Tailwind | Use `border-[3px]` |
| `gradient-reveal` | Class not defined in CSS | Define as `bg-background` plus ambient radial gradients (same as Open page) |
| `animate-zoom-in` | Defined in Tailwind config | ✅ Valid — `400ms ease-out` |
| `animate-count-up` | Defined in Tailwind config | ✅ Valid — `600ms ease-out` |

---

## Appendix B: Asset Reference

| Asset | Path | Dimensions | Usage |
|---|---|---|---|
| `mythic-badge.png` | `src/assets/mythic-badge.png` | `200px × 200px` display | Reveal page reward image |
| `hero-bg.jpg` | `src/assets/hero-bg.jpg` | Full-screen cover | Index page background at 20% opacity |

---

*End of specification.*
