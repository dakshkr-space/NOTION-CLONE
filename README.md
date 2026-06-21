# Notion Clone

A Notion-style dashboard UI with clean layout and structured components.
Currently working on layout, sidebar, and styling improvements.

## Current Progress

### Backend
- Implemented Go Fiber server
- PostgreSQL integration with GORM
- JWT authentication (email + Google OAuth)
- Middleware for protected routes
- Page CRUD API with ownership checks

### Frontend
- Static login and dashboard pages
- Token propagation via query params

### Next Goals
- Integrate frontend with backend using fetch/JS
- Add Next.js frontend for modern routing
- Improve security (env vars for secrets)
- Add role-based access control
