# CodezY — Engineer The Future

[CodezY](https://codezy-startup-pitch-x0kr.bolt.host/) is a student startup idea pitching event. It gives students a place to share ideas, show their creativity, and take a first step toward building something meaningful.

Students can register individually or as a team and submit a startup idea. Submissions are reviewed, and selected students or teams may be invited to present their ideas to a panel.

> **Project status:** This branch includes Supabase-backed registration, admin authentication and data access, shortlist updates, and private sketch uploads. A successful local build does not verify the live Supabase project; apply and verify the migrations and Edge Function configuration before production use.

## Event overview

Participants can submit an idea title and description, choose a domain such as AI, healthcare, finance, education, or environment, describe prototype availability, and optionally upload a sketch. File storage is not connected yet. The current frontend supports individual and team registration.

The event process is:

1. Students register and submit their startup ideas.
2. The event team reviews submissions and may shortlist promising ideas.
3. Selected students or teams may get an opportunity to pitch before a panel.
4. Pitching sessions may take place over 3–4 days during faculty-approved time slots.

Presentation schedules are intended to be shared manually through the official WhatsApp group; no WhatsApp integration is implemented on the website.

### After shortlisting

Depending on the proposal and available resources, selected participants may have opportunities for mentorship, funding support, prototype development help, or technical support and networking. These opportunities are subject to availability and are not guaranteed.

Students do not need a fully developed product to participate. An interesting idea, a clear understanding of the problem, and a possible solution are enough to get started.

## Website features

- Public event and startup pitch information.
- Registration for individuals and teams, including participant and idea details.
- Physical certificate announcement for successfully registered participants, subject to the event's certificate distribution process.
- Supabase-backed admin login and database dashboard, protected by server-controlled admin claims and RLS policies.
- Optional sketch upload to a private Supabase Storage bucket, with admin-only signed access.
- Responsive layouts for desktop, tablet, and mobile.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Routing | React Router |
| Backend | Supabase Auth, Postgres, Edge Functions, and private Storage |

## Getting started

### Requirements

- Node.js 18 or later
- npm

### Run locally

```bash
git clone https://github.com/vaishnavijha006-hub/Startupthon
cd Startupthon
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## Project structure

```text
src/
├── components/       # Shared and admin UI components
├── pages/            # Landing, registration, confirmation, and admin pages
├── services/         # Data-source boundary for future backend integration
├── types/            # Shared TypeScript types
└── utils/            # Validation, dashboard helpers, and export utilities
tests/                # Node.js tests for validation and frontend behavior
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript check |
| `npm run build` | Create the production build in `dist/` |
| `node --test tests/*.test.mjs` | Run the Node.js test files |

## Deployment

The original public site is hosted on Bolt:

- [Live website](https://codezy-startup-pitch-x0kr.bolt.host/)
- [Registration](https://codezy-startup-pitch-x0kr.bolt.host/register)
- [Admin login](https://codezy-startup-pitch-x0kr.bolt.host/admin/login)
- [Admin dashboard](https://codezy-startup-pitch-x0kr.bolt.host/admin/dashboard) (frontend preview; not secured)

The Vercel Preview is connected to this repository branch. Production registration, admin access, storage, and migration state still require verification against the live Supabase project. Do not treat a successful frontend build as proof of live functionality. Build the project with `npm run build` and deploy the generated `dist/` directory to a static host.

## Roadmap

- Verify migrations, RLS, Edge Function secrets, Preview CORS, and real registration submission in Supabase.
- Verify administrator claims and authorization against the live project.
- Verify private sketch bucket policies and signed admin access against the live project.
- Add analytics and continue improving accessibility and SEO.

## Contributing

Suggestions and contributions are welcome. Create a feature branch, make focused changes, run the project checks, and open a pull request for review.

## License

No license has been specified for this project yet.

## Organized by

**CodezY** — Think it. Pitch it. Build it.

The event is organized with faculty permission. Shortlisting, pitching opportunities, and additional support depend on the event review process and available resources.

## Contact

**CodezY Team**

- Website: https://codezy-startup-pitch-x0kr.bolt.host/
- Email: _your-email@example.com_
- LinkedIn / X: _add your links_
