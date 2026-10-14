# CodezY — Engineer The Future

[CodezY](https://codezy-startup-pitch-x0kr.bolt.host/) is a student startup idea pitching event. It gives students a place to share ideas, show their creativity, and take a first step toward building something meaningful.

Students can register individually or as a team and submit a startup idea. Submissions are reviewed, and selected students or teams may be invited to present their ideas to a panel.

> **Project status:** The website is currently frontend-only. Registration forms and calls to action are not connected to a backend or database. Supabase is the planned backend and has not yet been integrated. The admin dashboard is a frontend preview and does not provide real authentication or registration data.

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
- Admin login and dashboard frontend previews; authentication and registration data access are not connected.
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
| Planned backend | Supabase (not integrated yet) |

## Getting started

### Requirements

- Node.js 18 or later
- npm

### Run locally

```bash
git clone <your-repository-url>
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

The public site is hosted at [codezy-startup-pitch-x0kr.bolt.host](https://codezy-startup-pitch-x0kr.bolt.host/). Build the project with `npm run build` and deploy the generated `dist/` directory to another static host if needed.

## Roadmap

- Connect registration submission and storage to the planned Supabase backend.
- Implement real admin authentication and authorization.
- Add server-side validation and registration data access.
- Connect file storage for uploaded sketches.
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
