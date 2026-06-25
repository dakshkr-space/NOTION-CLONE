# Notion Clone

A full-stack Notion-inspired note-taking and collaboration app built with Go (Fiber) and Next.js.

## Tech Stack

**Backend:** Go, Fiber, GORM, PostgreSQL, JWT, Google OAuth2, bcrypt  
**Frontend:** Next.js 16 (React, App Router, Turbopack)

## Current Features

### Authentication
- Email/password registration and login with bcrypt password hashing
- Google OAuth2 login (full redirect flow)
- JWT-based stateless auth (7-day expiry) with role and team claims embedded

### Pages
- Create, read, update, and delete pages
- Pages scoped per user with ownership checks on every request
- Nested page support via `parent_id` field

### Teams & Role-Based Access Control
- Create teams (creator becomes `team_head`)
- Add and remove team members by email
- 4-tier role system: `admin`, `team_head`, `user`, `viewer`
- Role-based middleware protecting team management endpoints

### Infrastructure
- PostgreSQL with GORM auto-migration
- CORS configured for separate frontend/backend dev servers
- Environment-based config via `.env` (never committed)

## Project Structure

```
NOTION-CLONE/
├── server/                         # Go backend
│   ├── main.go
│   └── internal/
│       ├── db/postgres.go          # Database connection
│       ├── models/                 # User, Page, Team structs
│       ├── handlers/               # Auth, Page, Team handlers
│       ├── middleware/             # JWT verification, role checks
│       └── routes/routes.go        # API endpoint registration
└── client/                         # Next.js frontend
    ├── app/
    │   ├── login/page.jsx          # Login + register page
    │   └── dashboard/page.jsx      # Dashboard with page management
    ├── lib/api.js                  # Centralized API calls
    └── app/globals.css             # Global styles
```

## Running Locally

**Backend:**
```bash
cd server
cp .env.example .env   # fill in your values
go run main.go
```

**Frontend:**
```bash
cd client
npm install
npm run dev -- -p 3001
```

Backend runs on `http://localhost:3000`, frontend on `http://localhost:3001`.

## Environment Variables

```
DATABASE_URL=postgres://user:pass@localhost:5432/notion
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register with email/password |
| POST | `/auth/login` | None | Login, returns JWT |
| GET | `/auth/google` | None | Start Google OAuth |
| GET | `/auth/google/callback` | None | Google OAuth callback |
| POST | `/pages` | JWT | Create a page |
| GET | `/pages` | JWT | Get all your pages |
| GET | `/pages/:id` | JWT | Get a single page |
| PUT | `/pages/:id` | JWT | Update a page |
| DELETE | `/pages/:id` | JWT | Delete a page |
| POST | `/teams` | JWT | Create a team |
| POST | `/teams/members` | team_head/admin | Add team member |
| DELETE | `/teams/members/:userId` | team_head/admin | Remove team member |
| PUT | `/teams/promote/:userId` | admin | Change user role |

## Roadmap

- [ ] Rich text editor (headings, bullets, checklists, code blocks)
- [ ] Nested page navigation in sidebar
- [ ] Auto-save on keystroke (debounced)
- [ ] Folder/workspace organization
- [ ] Share pages via public link
- [ ] Real-time collaboration via WebSockets
- [ ] GenAI integration (summarize notes, generate meeting notes, improve writing)