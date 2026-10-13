# CodezY — Engineer The Future

A startup pitch website for **CodezY**, presenting the vision, product, and value proposition to investors, partners, and early users.

🔗 **Live site:** https://codezy-startup-pitch-x0kr.bolt.host/

> **Status:** Frontend only. There is no backend, database, or API yet. Forms and calls to action are not yet connected to a server.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

CodezY Startup Pitch is a single-page marketing and pitch site. It is designed to explain what CodezY does, why it matters, and how people can get involved, in a few minutes of scrolling.

## Features

- Hero section with the core message: *Engineer The Future*
- Problem, solution, and product sections
- Responsive layout for desktop, tablet, and mobile
- Call-to-action buttons for joining, contacting, or learning more
- Clean, modern UI built for fast loading

<!-- Update this list to match the sections actually on the site. -->

## Tech Stack

> Adjust this to match your actual project. Bolt projects commonly use the stack below.

| Layer      | Technology                |
| ---------- | ------------------------- |
| Framework  | React                     |
| Language   | TypeScript / JavaScript   |
| Build tool | Vite                      |
| Styling    | Tailwind CSS              |
| Icons      | Lucide React              |
| Hosting    | Bolt Hosting (`bolt.host`) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js), or yarn / pnpm

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd codezy-startup-pitch

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173`).

## Project Structure

```
codezy-startup-pitch/
├── public/             # Static assets (favicon, images, og image)
├── src/
│   ├── components/     # Reusable UI components
│   ├── App.tsx         # Main app / page layout
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template (title, meta tags)
├── package.json
└── README.md
```

<!-- Update to match your real folder layout. -->

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the development server        |
| `npm run build`   | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run the linter                      |

## Deployment

The site is deployed on **Bolt Hosting** and is publicly available at the live link above.

To deploy somewhere else (Netlify, Vercel, GitHub Pages, Cloudflare Pages):

```bash
npm run build
```

Then upload or connect the generated `dist/` folder to your host.

## Roadmap

- [ ] Replace the default social preview image with a CodezY-branded one
- [ ] Connect the contact / waitlist form to a backend or form service
- [ ] Add a database for storing sign-ups
- [ ] Add analytics
- [ ] Improve SEO (meta description, Open Graph tags, sitemap)
- [ ] Accessibility audit (contrast, keyboard navigation, alt text)
- [ ] Add a custom domain

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

Add your license here (for example, MIT). If you haven't chosen one, remove this section.

## Contact

**CodezY Team**

- Website: https://codezy-startup-pitch-x0kr.bolt.host/
- Email: _your-email@example.com_
- LinkedIn / X: _add your links_