# $READS Platform v2.0 — Frontend

> Learn. Earn. Excel. — Blockchain-powered Learn-to-Earn education platform for Nigerian students.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS (custom `reads-*` tokens) |
| Icons | Lucide React |
| API | FastAPI backend at `/api` (proxied in dev) |
| Auth | JWT (localStorage) |
| Blockchain | Cardano Native Token ($READS) |
| PWA | vite-plugin-pwa |
| Fonts | Playfair Display + DM Sans (Google Fonts) |

## Project Structure

```
src/
├── App.jsx                     # Main router + nav
├── index.css                   # Tailwind + global styles
├── main.jsx                    # React root
├── services/
│   └── api.js                  # Full API service layer
├── context/
│   └── AuthContext.jsx         # Auth state context
├── components/
│   ├── UI.jsx                  # Shared UI components
│   └── LoadingScreen.jsx       # Splash loading screen
└── modules/
    ├── welcome/                # Splash/landing page
    ├── auth/                   # Login, Register, OTP, Reset, Staff Invite
    ├── dashboard/              # Home dashboard
    ├── learn/                  # Lessons + Quiz CBT
    ├── wallet/                 # Token wallet + transactions
    ├── profile/                # Profile, settings, password
    ├── settings/               # App preferences & toggles
    ├── notifications/          # Notification inbox
    ├── school/                 # Student school enrollment
    ├── exams/                  # Exam registration (JAMB/WAEC/etc)
    ├── tutors/                 # Tutor discovery + booking
    ├── ai-tutor/               # AI chat tutor
    ├── marketplace/            # P2P content marketplace
    ├── partner/                # Partner (School/CBT) portal
    └── admin/                  # Admin panel
```

## Setup

```bash
# Install dependencies
npm install

# Dev server (proxies /api → localhost:8000)
npm run dev

# Production build
npm run build
```

## Brand Tokens (Tailwind)

```
reads-cream        Background (#F5F0E8)
reads-navy         Headings/text (#0D1F3C)
reads-green        Primary CTA (#16A34A)
reads-gold         Coin/accent (#E8B84B)
reads-teal         Links (#0D7A6E)
reads-red          Errors/negative (#EF4444)
reads-muted        Secondary text (#6B7280)
```

## User Roles & Routing

| Role | Entry Point |
|---|---|
| Student | Main app (Dashboard → Learn → Wallet → Profile → More) |
| Partner (School/CBT) | `PartnerModule` — full replacement layout |
| Admin | Standard app + Admin tab in bottom nav |
| Tutor | Redirected to tutor portal (future) |
| Staff Invite | `/accept-invite?token=...` |
| Password Reset | `/reset-password?token=...` |

## API Base URL

- **Production:** `https://reads-phi.vercel.app/api`
- **Dev:** `http://localhost:8000` (proxied via Vite)

## Deployment

Deploy to Vercel. The `vercel.json` handles:
- `/api/*` → FastAPI backend
- All other routes → `index.html` (SPA)
- `sw.js` cache-control headers
