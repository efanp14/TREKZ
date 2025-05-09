VIEW THIS VIA THE README.md FILE IN CODE VIEWING

https://github.com/efanp14/TREKZ/blob/main/README.md?plain=1

Overview
Table of Contents
* Root Directory

* attached_assets/

* client/

* server/

* shared/

* APIs & Data Flow

* Getting Started

TREKZ is a full‑stack travel journaling application built with TypeScript, React, Vite, Tailwind CSS on the front end, and Express + Drizzle ORM + PostgreSQL on the back end. It lets users create, edit, browse, and share multi‑pin travel trips, complete with photos, descriptions, maps, and search functionality.
________________


Root Directory
   * README.md (if present): High‑level project description and setup instructions.

   * .replit: Configuration for running on Replit, including services (Node.js, web, PostgreSQL), dev and build scripts, port mappings, and workflows.

   * .gitignore: Lists files and folders excluded from version control (e.g., node_modules, dist, secret config files).

   * components.json: shadcn/ui component generator settings (style, file paths, aliases) for consistent React UI.

   * drizzle.config.ts: Drizzle‑Kit config for database migrations (schema points to shared/schema.ts, output to ./migrations).

   * package.json & package-lock.json: NPM metadata, dependencies (Express, React, Vite, Drizzle, Tailwind, Zod, React Query, etc.), and scripts:

      * dev: Runs the server in development (with Vite middleware).

      * build: Bundles client (Vite) and server (esbuild) into dist.

      * start: Runs the production bundle.

      * check: TypeScript compile check.

      * db:push: Applies migrations to the database.

         * postcss.config.js: Enables Tailwind CSS and Autoprefixer.

         * tailwind.config.ts: Tailwind config (file scanning, theme extensions, animations, plugins).

         * tsconfig.json: TypeScript compiler options, including path aliases (@/*, @shared/*) and include/exclude rules.

         * vite.config.ts: Vite configuration for the front end:

            * Uses the React plugin and Replit error overlay.

            * Sets the project root to client/ and output to dist/public.

            * Defines path aliases (@assets → attached_assets).

________________


attached_assets/
Stores design docs, screenshots, and reference images used during development:
               * *.png: UI mockups, logo variations.

               * *.txt: Brainstorming and feature‑spec notes.

________________


client/ (Front End)
All source for the React single‑page application, built with Vite and styled with Tailwind CSS.
client/
├── index.html         # HTML entry point (mounts React app)
├── src/
│   ├── index.css      # Global Tailwind imports and custom styles
│   ├── App.tsx        # Root React component (sets up routes)
│   ├── assets/        # Static assets: fonts.css, logos
│   ├── components/    # Reusable React components:
│   │   ├── Header.tsx, HeroSection.tsx, FeaturedTrip.tsx, TripTimeline.tsx, etc.
│   │   └── ui/        # shadcn/ui primitives (buttons, cards, dialogs)
│   ├── hooks/         # Custom hooks:
│   │   ├── use-trips.ts  # Fetch and cache trips
│   │   ├── use-pins.ts   # Fetch and cache pins
│   │   ├── use-search.ts # Debounced search logic
│   │   └── use-mobile.tsx, use-toast.ts, use-debounce.ts
│   ├── lib/           # Utility modules:
│   │   ├── api.ts        # REST wrappers for all `/api` endpoints
│   │   ├── mapbox.ts     # Mapbox setup and helpers
│   │   ├── queryClient.ts# React Query client configuration
│   │   └── utils.ts      # Misc helpers (formatting, date handling)
│   └── pages/         # Route views:
│       ├── Explore.tsx    # Homepage showing trending, recent, featured trips
│       ├── BrowserPage.tsx# Search/filter interface
│       ├── CreateTrip.tsx # Trip creation form
│       ├── EditTrip.tsx   # Trip editing form
│       ├── TripDetails.tsx# Detailed trip view with map and pins
│       ├── MyTrips.tsx    # User’s own trips list
│       └── not-found.tsx  # 404 fallback
├── vite-env.d.ts      # Vite + TS global types (if present)
└── tsconfig.json      # Inherited or local TS settings (if present)


Build & Dev
                  * npm run dev — runs Vite dev server for client + Express server with HMR.

                  * npm run build — bundles both client and server for deployment.

________________


server/ (Back End)
Express + Vite middleware + Drizzle ORM for handling API requests and serving the production front end.
server/
├── index.ts      # Entry point:
│   • Configures Express (JSON/body parsing, request logging)
│   • Registers API routes
│   • Sets up Vite dev middleware (development) or static serving (production)
│   • Starts HTTP server on port 5000
├── routes.ts     # Defines all `/api` endpoints:
│   • **GET** `/api/trips`             — list all trips or by user
│   • **GET** `/api/trips/:id`         — get one trip
│   • **POST** `/api/trips`            — create a trip
│   • **PUT** `/api/trips/:id`         — update a trip
│   • **DELETE** `/api/trips/:id`      — delete a trip
│   • **POST** `/api/trips/:id/like`   — increment like count
│   • **GET** `/api/trips/recent?limit`   — recent trips
│   • **GET** `/api/trips/trending?limit` — trending trips
│   • **GET** `/api/pins/:tripId`      — list pins for a trip
│   • **POST** `/api/pins`             — create a pin
│   • **PUT** `/api/pins/:id`          — update a pin
│   └── **DELETE** `/api/pins/:id`     — delete a pin
├── storage.ts    # `IStorage` implementation using Drizzle ORM:
│   • Connects to PostgreSQL via `drizzle-orm`
│   • CRUD methods for users, trips, pins
│   • Search algorithm (`searchTrips`) scoring by title, summary, categories
│   • Sample data seeding (mock users, trips) for development
├── db.ts         # Database connection:
│   • Uses `@neondatabase/serverless` pool + WebSocket for Drizzle
├── vite.ts       # Vite middleware for SSR during development and static serving in production
└── migrations/   # Generated by Drizzle (after running `npm run db:push`)


________________


shared/
Purpose: Single source of truth for database schema, TypeScript types, and Zod validation across both client and server.
                     * schema.ts:

                        * Defines Drizzle ORM table schemas (users, trips, pins).

                        * Exports insertUserSchema, insertTripSchema, insertPinSchema (for auto‑generating insert types).

                        * Zod schemas (tripFormSchema, pinFormSchema) for runtime validation on both client forms and server requests.

                        * TypeScript types (User, Trip, Pin, InsertTrip, InsertPin) inferred from schema.

________________


APIs & Data Flow
                           1. Client calls api.ts wrappers (e.g. getTrips(), createTrip(data), searchTrips(query)).

                           2. Express routes in routes.ts receive the request, parse + validate via Zod schemas, then call storage methods.

                           3. Storage (Drizzle ORM) reads/writes to PostgreSQL using type‑safe queries.

                           4. Response is JSON data; client React hooks (React Query) consume and cache results.

                           5. Map Integration: mapbox.ts initializes Mapbox GL map, plots trip pins, and manages map interactions.

________________


Running
                              1. Environment:

                                 * Node.js ≥ 20

                                 * PostgreSQL (e.g. Neon or local)

                                 * DATABASE_URL environment variable pointing to your database.

                                    2. Install: npm install

                                    3. Database:

                                       * npm run db:push — create tables via Drizzle.

                                          4. Dev: npm run dev — runs server (http://localhost:5000) and client HMR.

                                          5. Build & Deploy:

                                             * npm run build — outputs to dist/

                                             * npm run start — starts production server.

________________
