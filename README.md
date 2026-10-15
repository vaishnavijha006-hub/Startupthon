# Startupthon — CodezY Startup Pitch

Startupthon is the CodezY startup-pitch registration platform. Students can submit startup ideas and register as solo participants or duos; organizers can review registrations through the admin dashboard.

<p align="center">
  <a href="https://startupthon.vercel.app"><strong>Visit the Live Website</strong></a>
  &nbsp; · &nbsp;
  <a href="https://startupthon.vercel.app/admin/dashboard"><strong>Admin Dashboard</strong></a>
  &nbsp; · &nbsp;
  <a href="https://github.com/vaishnavijha006-hub/Startupthon"><strong>GitHub Repository</strong></a>
</p>

> The dashboard and registration backend require the appropriate Supabase project configuration and database setup. A successful local build does not confirm that live authentication, database access, uploads, or migrations are configured.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Admin dashboard](#admin-dashboard)
- [Local development](#local-development)
- [Project scripts](#project-scripts)
- [Project structure](#project-structure)
- [Deployment notes](#deployment-notes)

## Features

- Responsive public event and registration pages.
- Solo and duo registration forms with participant and startup idea details.
- Academic-year roll-number validation: 13 digits; years 2, 3, and 4 require prefixes `25`, `24`, and `23`. Year 1 roll numbers are optional.
- Client-side validation for participant details, phone numbers, email addresses, ideas, and optional sketch files.
- Server-confirmed registration identifiers and a confirmation view. If a submission is only saved locally as a draft, the confirmation page labels it as unconfirmed.
- Optional PNG, JPEG, WebP, or PDF sketch/blueprint upload (up to 5 MB) through the Supabase Edge Function and private Storage bucket, when the backend is configured.
- Admin dashboard overview and registration statistics, with registration search, filters, sorting, and pagination.
- Detailed participant and startup idea views, including duo participants.
- Shortlist status management (`pending`, `shortlisted`, or `rejected`), backed by the database when its migration and policies are applied.
- CSV export with exactly three columns: `Student Section`, `Student Roll Number`, and `Startup Idea Title`. Duo registrations export one row per participant.
- Security measures in code include server-side registration validation, duplicate roll-number constraints, an Edge Function boundary for privileged registration writes, admin checks based on server-controlled claims, RLS policies defined in migrations, a private sketch bucket, and upload size/type/signature checks.

## Technology stack

| Area | Technology |
| --- | --- |
| UI | React 18 |
| Language | TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS |
| Routing | React Router |
| Icons | Lucide React |
| Backend client and services | Supabase Auth, Postgres, Edge Functions, and Storage |

## Admin dashboard

The [Startupthon Admin Dashboard](https://startupthon.vercel.app/admin/dashboard) is intended for authorized administrators. It provides registration statistics and tools to search, filter, sort, paginate, and review participant and startup idea details. Administrators can update shortlist status, export matching student records as CSV, and access uploaded sketches where the private Storage bucket and authorization policies are configured.

The application checks server-controlled Supabase authorization claims, and the migrations define RLS policies for database authorization. This README does not provide credentials or private configuration. Verify live authentication, registration retrieval, shortlist persistence, and file access against the target Supabase project before relying on them.

## Local development

### Prerequisites

- Node.js 18 or later
- npm

### Install and start

```bash
git clone https://github.com/vaishnavijha006-hub/Startupthon.git
cd Startupthon
npm install
npm run dev
```

Open the local address printed by Vite (usually `http://localhost:5173`).

### Environment configuration

The browser application reads these Vite variables at build time:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable client key |

Create an ignored `.env.local` file in the repository root and add the values for your development Supabase project. Do not commit environment files. Vite-exposed variables are included in browser code; use only the publishable client key here, never a service-role key.

The `submit-registration` Edge Function separately reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from its server-side Supabase environment. The optional `ALLOWED_ORIGINS` variable can add explicitly permitted browser origins for CORS. Configure these through the Edge Function’s secret/configuration mechanism; never put the service-role key in a `VITE_` variable or frontend file.

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript check |
| `node --test tests/*.test.mjs` | Run the Node.js test suite |

## Project structure

```text
src/
├── components/       # Shared interface and admin components
├── pages/            # Landing, registration, confirmation, and admin pages
├── services/         # Supabase, admin auth, and registration data access
├── types/            # Shared TypeScript types
└── utils/            # Validation, dashboard, and CSV helpers
supabase/
├── functions/        # Registration Edge Function
└── migrations/       # Registration, RLS, shortlist, and Storage SQL
tests/                # Node.js tests for application behavior and contracts
```

## Deployment notes

The public website is available at [startupthon.vercel.app](https://startupthon.vercel.app). Backend features depend on the corresponding Supabase schema, migrations, Edge Function secrets, CORS allowlist, and Storage policies being configured for the deployment environment. Verify those items and test them against the target Supabase project before relying on live registration or admin operations.

## Contributing

Create a focused branch, make a scoped change, run the relevant checks, and open a pull request for review.
