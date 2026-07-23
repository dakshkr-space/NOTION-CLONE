# Notion Clone

A full-stack Notion-inspired note-taking and collaboration app built with Go (Fiber) and Next.js.

## Tech Stack

**Backend:** Go, Fiber, GORM, PostgreSQL, JWT, Google OAuth2, bcrypt, Groq AI (Llama 3.3)
**Frontend:** Next.js 16 (React, App Router, Turbopack), TipTap rich text editor

## Features

### Authentication
- Email/password registration and login with bcrypt password hashing
- Google OAuth2 login (full redirect flow)
- JWT-based stateless auth (7-day expiry) with role and team claims embedded
- Email format validation on both frontend and backend

### Pages
- Create, read, update, delete pages
- Rich text editing via TipTap — headings (H1/H2/H3), bold, italic, strikethrough, bullet lists, numbered lists, checklists, code blocks, blockquotes
- Debounced Auto-Save: Real-time background persistence (1s debounce) with visual `Saving...` / `Saved ✓`
- Pages scoped per user with ownership checks on every request
- Public Page Sharing: Generate unique, public read-only links for external sharing without requiring auth

### Pre-built Page Templates
- Quick-start templates available via a dedicated template picker:
  - 📋 **Meeting Notes** (Agenda, Discussion, Action Items)[cite: 1]
  - 🚀 **Project Doc** (Goals, Timeline, Task Checklist)[cite: 1]
  - 📚 **Study Notes** (Key Concepts, Questions, References)[cite: 1]
  - 📝 **Daily Journal** (Goals, Wins, Reflection)[cite: 1]
  - 🐛 **Bug Report** (Steps to Reproduce, Expected vs Actual)[cite: 1]


### Global Full-Text Search
- Instant Search (`⌘K`): Modal search index across both page titles and HTML body content
- Smart Excerpts: Highlighted matching text snippets in search results with one-click page navigation

### Nested Pages
- Create subpages inside any page
- Sidebar shows expand/collapse arrows per page — clicking loads child pages indented underneath
- Subpages appear instantly after creation without a page refresh

### Workspace Organization
- Sidebar splits pages into Workspace (team pages) and Personal sections
- Workspace section only visible to users who belong to a team

### Teams & Role-Based Access Control
- Create teams (creator becomes team_head)
- Add and remove team members by email
- 4-tier role system: admin, team_head, user, viewer
- Role-based middleware protecting team management endpoints

### AI Workspace (Groq — Llama 3.3)
- AI assistant panel in the right sidebar
- Context-Aware AI Assistant: Pulls content directly from the active open page[cite: 1, 4].
- One-Click Action Chips:
   - Summarize current page in bullet points
   - Generate structured meeting notes from page content
   - Improve writing quality
   - Ask any question with current page as context
   - Generate additional relevant content
- Interactive Conversation History: Chat thread session with option to clear history
- Powered by Groq's free API running Llama 3.3 70B

### Infrastructure
- PostgreSQL with GORM auto-migration
- CORS configured for separate frontend/backend dev servers
- Environment-based config via .env (never committed)

## Project Structure

```
NOTION-CLONE/
├── server/                          # Go backend
│   ├── main.go
│   └── internal/
│       ├── db/postgres.go           # Database connection
│       ├── models/                  # User, Page, Team structs
│       ├── handlers/                # Auth, Page, Team, AI handlers
│       ├── middleware/              # JWT verification, role checks
│       └── routes/routes.go        # API endpoint registration
└── client/                         # Next.js frontend
    ├── app/
    │   ├── login/page.jsx           # Login + register page (aurora UI)
    │   ├── dashboard/page.jsx       # Dashboard with sidebar, editor, AI panel
    │   └── shared/[token]/page.jsx  # Public shared page view
    ├── components/
    │   └── RichTextEditor.jsx       # TipTap editor with toolbar
    ├── lib/api.js                   # Centralized API calls
    └── app/globals.css              # Global styles
```

## Running Locally

**Backend:**
```bash
cd server
# create a .env file with the variables listed below
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
GROQ_API_KEY=groq_api_key
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
| GET | `/pages/:id/children` | JWT | Get child pages |
| POST | `/pages/:id/share` | JWT | Generate share link |
| GET | `/shared/:token` | None | View shared page publicly |
| POST | `/teams` | JWT | Create a team |
| POST | `/teams/members` | team_head/admin | Add team member |
| DELETE | `/teams/members/:userId` | team_head/admin | Remove team member |
| PUT | `/teams/promote/:userId` | admin | Change user role |
| POST | `/ai/ask` | JWT | Ask AI about page content |

## Roadmap

- [ ] Real-time collaboration via WebSockets
- [ ] Landing page
- [ ] Delete and edit pages from dashboard