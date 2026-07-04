```
# Notion Clone

A full-stack Notion-inspired note-taking and collaboration app built with Go (Fiber) and Next.js.

## Tech Stack

**Backend:** Go, Fiber, GORM, PostgreSQL, JWT, Google OAuth2, bcrypt  
**Frontend:** Next.js 16 (React, App Router, Turbopack), TipTap rich text editor

## Current Features

### Authentication
- Email/password registration and login with bcrypt password hashing
- Google OAuth2 login (full redirect flow)
- JWT-based stateless auth (7-day expiry) with role and team claims embedded

### Pages
- Create, read, update, delete pages
- Rich text editing via TipTap — headings (H1/H2/H3), bold, italic, strikethrough, bullet lists, numbered lists, checklists, code blocks, blockquotes
- Auto-save — content saves automatically 1 second after the user stops typing, with live "Saving..." / "Saved ✓" status indicator
- Pages scoped per user with ownership checks on every request

### Nested Pages
- Create subpages inside any page via a "New subpage" form
- Sidebar shows expand/collapse arrows (▶) per page — clicking loads and shows child pages indented underneath
- Subpages appear instantly in the sidebar after creation without a page refresh

### Workspace Organization
- Sidebar splits pages into Workspace (team pages) and Personal sections
- Workspace section only visible to users who belong to a team

### Teams & Role-Based Access Control
- Create teams (creator becomes team_head)
- Add and remove team members by email
- 4-tier role system: admin, team_head, user, viewer
- Role-based middleware protecting team management endpoints

### Infrastructure
- PostgreSQL with GORM auto-migration
- CORS configured for separate frontend/backend dev servers
- Environment-based config via .env (never committed)

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
│       └── routes/routes.go       # API endpoint registration
└── client/                        # Next.js frontend
    ├── app/
    │   ├── login/page.jsx          # Login + register page (aurora UI)
    │   └── dashboard/page.jsx      # Dashboard with sidebar, editor, pages
    ├── components/
    │   └── RichTextEditor.jsx      # TipTap editor with toolbar
    ├── lib/api.js                  # Centralized API calls
    └── app/globals.css             # Global styles
```

## Running Locally

**Backend:**
```bash
cd server
# create a .env file with the variables listed in Environment Variables below
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
JWT_SECRET=secret_key
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret
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
| GET | `/pages/:id/children` | JWT | Get child pages of a page |
| POST | `/teams` | JWT | Create a team |
| POST | `/teams/members` | team_head/admin | Add team member |
| DELETE | `/teams/members/:userId` | team_head/admin | Remove team member |
| PUT | `/teams/promote/:userId` | admin | Change user role |

## Roadmap

- [ ] Share pages with teammates via public link
- [ ] Real-time collaboration via WebSockets
- [ ] GenAI integration (summarize notes, generate meeting notes, improve writing)