# Shared Layout, Design Tokens & Common Components

> Part of the [Screen Specifications](./README.md).

All prototypes share the same visual language, header, and colour tokens.
React components derived from this spec live in `src/shared/`.

---

## 1. Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--brand-gradient` | `linear-gradient(to bottom, #f58220 0%, #e65318 42%, #c92e27 72%, #98252b 100%)` | App header background |
| `--brand-orange` | `#e45f14` | Primary action, active border, focus ring |
| `--brand-maroon` | `#9a2529` | Secondary action, active sidebar indicator, focus ring (landing) |
| `--brand-maroon-dark` | `#98252b` | Header gradient end |
| `--bg-warm` | `#fff8f3` | DRS screen background |
| `--bg-page` | `#f0f3f8` | Landing / inbox background |
| `--bg-banner` | `#ffead7` | Applicant banner strip |
| `--surface` | `#ffffff` | Cards, panels |
| `--border` | `#e4dedb` | Card borders |
| `--text-primary` | `#302a27` | Body copy |
| `--text-muted` | `#7b716c` | Secondary labels |
| Font family | `Mulish, Arial, sans-serif` | All screens |
| Base font size | `12px` | Body |
| Focus ring | `2px solid #e45f14` (DRS) / `2px solid #9a2529` (landing) | All interactive elements |

---

## 2. AppHeader Component

**Source:** All prototypes — `.app-header` / `.header`

### Props

```tsx
interface AppHeaderProps {
  /** Show back-navigation button (DRS detail screens) */
  showBack?: boolean;
  onBack?: () => void;
  /** Override the session countdown label */
  sessionLabel?: string;
  /** Authenticated user display name */
  userName: string;
  /** Profile menu items */
  menuItems?: ProfileMenuItem[];
}
```

### Layout spec

```
┌──────────────────────────────────────────────────────────────────┐  h=57px
│ [Back] │ [ICICI Logo 150px] │          spacer          │ Date+Time │ [Avatar UserName ▾] │
└──────────────────────────────────────────────────────────────────┘
```

| Slot | Width | Notes |
|---|---|---|
| Back button | 44 px fixed | Only rendered when `showBack=true`; right border rgba(255,255,255,.25) |
| Logo | 150 px fixed | `<img>` or inline SVG; `object-fit: cover` |
| Spacer | flex-grow: 1 | — |
| Date/time | 175 px min | Right-aligned; `border-right: 1px solid rgba(255,255,255,.35)` |
| Profile button | auto | Avatar circle 35×35 px + user name (max 150 px, ellipsis) + chevron |
| Profile popover | 240 px | Positioned `top: 65px; right: 16px`; `border-radius: 8px` |

### Behaviour
- Header is `position: sticky; top: 0; z-index: 100`.
- Back button navigates to previous route via `onBack` callback.
- Profile popover toggles on button click; closes on outside click (`useClickOutside`).
- Date/time auto-updates every minute using `Intl.DateTimeFormat('en-IN', ...)`.

---

## 3. Sidebar / Task Rail Component

**Source:** Landing prototypes — `.sidebar` / `.sidebar.collapsed`

### Props

```tsx
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  sections: SidebarSection[];
  activeTaskId?: string;
  onTaskSelect: (id: string) => void;
}

interface SidebarSection {
  label: string;
  roles?: SidebarRole[];
  tasks: SidebarTask[];
}

interface SidebarTask {
  id: string;
  label: string;
  count?: number;
  initials?: string;
}
```

### Layout spec

| State | Width | Transition |
|---|---|---|
| Expanded | 220 px | `transition: width 0.25s ease` |
| Collapsed | 60 px | Same transition |

- Full height: `calc(100dvh - 57px)`, independently scrollable.
- Active item: `border-left: 3px solid var(--brand-maroon); background: #fdf2f2`.
- Collapse chevron: `transform: rotate(180deg)` expanded → `rotate(0)` collapsed.
- In collapsed state: hide labels, counts, last-login strip; show initials only.

---

## 4. Applicant Banner Component

**Source:** DRS prototypes — `.banner` / `.banner-shell`

### Props

```tsx
interface ApplicantBannerProps {
  applicantName: string;
  applicationNumber: string;
  productName: string;
  sumAssured: string;
  age: number;
  gender: string;
  fields: BannerField[];
}

interface BannerField {
  label: string;
  value: string;
}
```

### Layout spec

```
┌──────────────────────────────────────────────────────────────────┐
│ [Avatar  ] │ Name + AppNo + Product + sum assured + meta fields  │
│ [150px   ] │                                                      │
└──────────────────────────────────────────────────────────────────┘
```

- Two-column grid: `150px | 1fr`.
- Avatar column: gradient `#e45f14 → #c83c2f`; 76×76 px avatar circle.
- Content column: padding 12px 18px; `background: #ffead7`.
- Banner is inside a `position: sticky; top: 0; z-index: 20` shell.
- `border-radius: 12px`; `box-shadow: 0 3px 10px rgba(169,33,41,.16)`.

---

## 5. Tab Navigation Component

**Source:** DRS prototypes — section tabs

```tsx
interface TabNavProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}
```

- Active tab: `border-bottom: 2px solid var(--brand-orange)`.
- Use `role="tablist"` / `role="tab"` / `aria-selected` for accessibility.

---

## 6. Data Grid / Table Component

**Source:** Open-tasks and referral screens — `<table>`

### Shared column patterns

| Column type | Class | Style |
|---|---|---|
| Service ID | `.service-id` | `color: var(--brand-maroon); font-weight: 800` |
| Code pill | `.code` | `background: #f4f1ef; border: 1px solid #ddd5d1; border-radius: 12px` |
| Pool badge | `.pool` | `background: #fff0e7; border: 1px solid #f2cbb4; color: #a84812` |
| Pagination | `.pages` | Active page: `background: var(--brand-orange); color: #fff` |

- Table header: `position: sticky; top: 0`; `background: #fff0e5`.
- Row hover: `background: #fffaf7`.

---

## 7. Page Shell

Every screen uses this outer shell:

```tsx
// All DRS detail screens
<div className="app-shell">            {/* height: 100vh; flex-column */}
  <AppHeader ... />                    {/* h=57px; sticky */}
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    <ApplicantBanner ... />            {/* sticky inside main */}
    {/* screen-specific content */}
  </main>
</div>

// Landing / Inbox screens
<div className="app-shell">
  <AppHeader ... />
  <div className="inbox" style={{ display: 'flex' }}>
    <Sidebar ... />
    <main className="main-area">
      {/* dynamic role table */}
    </main>
  </div>
</div>
```
