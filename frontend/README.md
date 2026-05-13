# Destny — Frontend

A modern, dark-themed marketing and service website for **Destny** — a platform offering MVP development, 3D printing services, and tech solutions. Built with React 18 + TypeScript and powered by Vite.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| UI Components | Radix UI (shadcn/ui pattern) |
| Animations | Framer Motion |
| Routing | React Router DOM v6 |
| Data Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner + Radix Toast |
| Fonts | Inter (body), Space Grotesk (display) |

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Full marketing landing page |
| `/3d-printing` | 3D Printing | 3D print service — upload, quote, materials, gallery, pricing |
| `/auth` | Auth | Login / Sign-up page |
| `/dashboard` | Dashboard | Admin panel for managing orders, jobs, customers, inventory |
| `*` | Not Found | 404 fallback page |

### Landing Page (`/`)

Composed of the following sections in order:

1. **Navbar** — Fixed glass-effect nav with links to all sections and a Login button
2. **HeroSection** — Main headline and primary CTA
3. **HeroProducts** — Product / offering highlights
4. **ServicesSection** — Service cards (MVP, 3D Printing, etc.)
5. **PricingArchitecture** — Pricing tiers and architecture breakdown
6. **PrintingShowcase** — Highlights of 3D printing capabilities
7. **MVPSection** — MVP development offering
8. **HireSection** — Hire / team section
9. **CTASection** — Call-to-action
10. **NewsletterSection** — Email newsletter signup
11. **Footer** — Site-wide footer

### 3D Printing Page (`/3d-printing`)

1. **PrintingHero** — Hero banner for the 3D printing service
2. **FileUploadSection** — Drag-and-drop file uploader (STL, OBJ, STEP, PDF)
3. **InstantQuote** — Live price calculator (material × quality × dimensions × quantity, prices in ₹)
4. **MaterialsSection** — PLA, PETG, ABS, Resin material breakdown
5. **PrintingGallery** — Gallery of printed work
6. **PrintingPricing** — Detailed pricing plans

### Auth Page (`/auth`)

- Toggle between **Login** and **Sign-up** modes
- Login redirects to `/dashboard`
- Sign-up shows a confirmation toast and returns to login mode

### Dashboard (`/dashboard`)

Full admin panel with a sidebar navigation and tabbed content panels:

| Section | Description |
|---|---|
| Overview | Key metrics: orders, active jobs, revenue (₹), pending quotes, customers |
| Quote Requests | Manage incoming quote requests with status tracking |
| Orders | Full order list with payment status and production status |
| Print Jobs | Active, queued, completed, and failed print jobs per printer |
| Files | Uploaded STL / OBJ / STEP / PDF files linked to orders |
| Customers | Customer directory with order count and total spend |
| Inventory | Filament / resin stock levels with low-stock alerts |
| Printers | Printer fleet status (Busy, Available, Maintenance, Offline) |
| Analytics | Charts and performance data (Recharts) |
| Notifications | System alerts (job completed, low stock, payment received, etc.) |
| Settings | Account and platform configuration |

---

## Project Structure

```
frontend/
├── index.html
├── main.tsx                  # App entry point
├── App.tsx                   # Router, providers, scroll restoration
├── App.css
├── index.css                 # Global CSS, Tailwind layers, design tokens
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── package.json
│
├── assets/                   # Static assets (logo, images)
│
├── components/
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── HeroProducts.tsx
│   ├── ServicesSection.tsx
│   ├── PricingArchitecture.tsx
│   ├── PrintingShowcase.tsx
│   ├── MVPSection.tsx
│   ├── HireSection.tsx
│   ├── CTASection.tsx
│   ├── NewsletterSection.tsx
│   ├── Footer.tsx
│   │
│   ├── printing/             # 3D Printing page components
│   │   ├── PrintingHero.tsx
│   │   ├── FileUploadSection.tsx
│   │   ├── InstantQuote.tsx
│   │   ├── MaterialsSection.tsx
│   │   ├── PrintingGallery.tsx
│   │   └── PrintingPricing.tsx
│   │
│   ├── dashboard/            # Dashboard sub-components
│   │   ├── FileUploads.tsx
│   │   ├── PaymentSection.tsx
│   │   └── ProjectTracking.tsx
│   │
│   └── ui/                   # Radix UI / shadcn primitives (40+ components)
│
├── pages/
│   ├── Index.tsx             # Landing page
│   ├── Printing3D.tsx        # 3D Printing service page
│   ├── Auth.tsx              # Login / Sign-up
│   ├── Dashboard.tsx         # Admin dashboard
│   └── NotFound.tsx          # 404
│
├── hooks/
│   ├── use-mobile.tsx        # Responsive breakpoint hook
│   └── use-toast.ts          # Toast notification hook
│
├── lib/
│   └── utils.ts              # cn() class name helper (clsx + tailwind-merge)
│
└── test/
    ├── setup.ts
    └── example.test.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# From the project root
cd frontend

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server, accessible at `http://localhost:5173` (bound to `0.0.0.0` — accessible on your local network).

### Build

```bash
npm run build
```

Outputs a production-ready bundle to `dist/`.

### Preview Production Build

```bash
npm run preview
```

Serves the `dist/` folder on `http://127.0.0.1:4173`.

### Type Check

```bash
npm run typecheck
```

Runs `tsc --noEmit` to check TypeScript types without emitting files.

---

## Design System

The UI is built on a **dark glass-morphism** design language using CSS custom properties.

### Key Design Tokens (defined in `index.css`)

| Token | Usage |
|---|---|
| `--background` | Page background (deep dark) |
| `--foreground` | Primary text |
| `--primary` | Brand accent color |
| `--secondary` | Secondary accent |
| `--surface-glass` | Translucent glass surface |
| `--surface-elevated` | Elevated glass layer |
| `--radius` | Global border radius |

### Custom Utility Classes

| Class | Description |
|---|---|
| `glass` | Frosted glass panel effect |
| `glass-strong` | More opaque glass (used on Navbar) |
| `gradient-mesh` | Subtle mesh gradient background |
| `text-gradient-primary` | Primary brand gradient text |
| `glow-primary` | Box shadow glow on primary elements |

### Typography

- **Body**: [Inter](https://fonts.google.com/specimen/Inter) — `font-body`
- **Display / Headings**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — `font-display`

### Currency

All monetary values in the dashboard and quote calculator are displayed in **Indian Rupees (₹)**, formatted using `Intl.NumberFormat` with `en-IN` locale.

---

## Component Architecture

### `components/ui/`
Primitive components following the [shadcn/ui](https://ui.shadcn.com/) pattern — built on top of Radix UI with Tailwind styling. Includes 40+ components: `Button`, `Card`, `Dialog`, `Select`, `Tabs`, `Badge`, `Input`, `Table`, `Sheet`, `Sidebar`, and more.

### `components/printing/`
Feature components specific to the 3D Printing service page. The `InstantQuote` component performs live pricing calculations based on volume (cm³), material cost per gram, quality multiplier, and quantity — with a minimum floor price of ₹250.

### `components/dashboard/`
Sub-components used within the Dashboard page for project tracking, file uploads, and payment information.

### Shared Landing Components
All top-level components in `components/` (Navbar, Footer, Hero*, etc.) are used exclusively on the landing page (`/`).

---

## Key Libraries

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-router-dom` | ^6.30.2 | Client-side routing |
| `@tanstack/react-query` | ^5.90.12 | Server state management |
| `framer-motion` | ^12.23.25 | Animations and transitions |
| `recharts` | ^2.15.4 | Dashboard charts |
| `react-hook-form` | ^7.68.0 | Form state management |
| `zod` | ^3.25.76 | Schema validation |
| `lucide-react` | ^0.468.0 | Icon library |
| `tailwindcss` | ^3.4.19 | Utility-first CSS |
| `vite` | ^8.0.10 | Build tool |
| `typescript` | ^5.9.3 | Static typing |
