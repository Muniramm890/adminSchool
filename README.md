# School Office — Admin Frontend (Modularized)

Original `src/App.tsx` (25,335 lines, one file) split into **67 files** under `src/`,
with **zero logic changes** — every component, JSX, hook, mock-data, condition, and
handler is byte-identical to the original. Only two mechanical things were added per file:
1. A `// path: src/...` header comment (matches your backend's convention)
2. `import` / `export` statements needed to wire modules back together

## Structure

```
src/
  shared/
    mockData.ts           # SCHOOL_CONFIG, CLASSES, SECTIONS, STUDENTS, TEACHERS, etc.
    theme.ts               # color palette (C), CHART_COLORS, injectStyles
    utils.ts                # date/status helpers (todayISO, timeAgo, etc.)
    api.ts                   # apiRequest, gasRequest, uploadToCloudinary, API_BASE_URL
    ui/                        # Brand.tsx, Icon.tsx, Common.tsx (Modal, KpiCard, Field...), DialogProvider.tsx
    context/AppContexts.tsx      # AuthProvider, SessionProvider, DataProvider, useAuth etc.
  modules/
    dashboard/, students/, teachers/, setup/, promotion/, transport/,
    commhub/, timetable/, attendance/, arrangement/, fees/, payroll/,
    exams/, results/, leaderboard/, tests/, homework/, analytics/,
    usermanagement/, auditlog/, auth/, core/ (Sidebar, SchoolERP, MainLayout)
  App.tsx                        # slim entry point — wraps providers, renders MainLayout
  index.tsx, styles.css        # unchanged
```

Each module folder groups a feature's main component with its own tabs/sub-components/helpers,
so `TeachersModule.tsx` no longer drags in Fees, Payroll, Exams, etc. — the bundler can
now split these into separate chunks instead of one 25k-line blob.

## How this was verified
Every file was regenerated from the original `App.tsx`'s AST (not hand-retyped), so the
code inside each file is a byte-exact slice of your original source. The whole project was
then bundled with esbuild to confirm every import resolves and nothing is missing —
it builds clean (only one pre-existing harmless warning: a duplicate `close` key in the
original `Icon` component's SVG map, which was already in your original file, untouched).

## Setup

```bash
npm install
npm start        # local dev
npm run build     # production build → outputs to /build
```

## Deploy on Cloudflare Pages
1. Push this repo to GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
3. Build settings:
   - **Framework preset:** Create React App
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
4. Add any env vars (e.g. if you later move `API_BASE_URL` to `.env`) under Settings → Environment Variables

## Optional next steps (not done here — would change behavior, not just structure)
- Convert module imports in `SchoolERP.tsx` to `React.lazy()` + `<Suspense>` so each
  module's JS only downloads when the user opens that tab (real render-time weight reduction)
- A few module files are still large (StudentsModule ~2170 lines, AttendanceTabs ~1900,
  TeachersModule ~1735) since their sub-tabs were kept together — these can be split
  further into one-file-per-tab if you want
