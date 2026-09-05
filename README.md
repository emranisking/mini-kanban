# Mini Kanban Board

A Trello-style board for organizing work with your team: create boards, add
columns like "Todo" / "In Progress" / "Done", and drag tasks between them.
You can invite teammates to a board and control what they're allowed to do
(view only, edit, or fully manage the board).

This guide assumes **no technical background**. If you can install an app
and copy-paste into a terminal, you can get this running.

---

## 1. What you need first

You only need one thing installed: **Docker Desktop**. It's a free app that
runs the whole project for you (the website, the server, and the database)
without you having to install anything else individually.

- **Windows or Mac:** download it from <https://www.docker.com/products/docker-desktop/>,
  install it like any other app, and open it once so it's running (you'll
  see a whale icon in your system tray / menu bar).
- **Linux:** install `docker` and the `docker compose` plugin using your
  distribution's package manager, or follow <https://docs.docker.com/engine/install/>.

That's it — no need to install Node.js, PostgreSQL, or Redis yourself; Docker
sets all of that up for you automatically.

---

## 1. Get the project running


1. **Create your settings file.** In that terminal, type:

   ```bash
   cp .env.example .env
   ```

   (Windows PowerShell: `copy .env.example .env`)

   This creates a file called `.env` with sensible defaults already filled
   in — you don't need to edit anything to try the app out.

2. **Start everything** by typing:

   ```bash
   docker compose up --build
   ```

   The first time you run this, it will take a few minutes — Docker is
   downloading and building the website, the server, and the database.
   You'll see a lot of text scroll by; that's normal. Wait until the
   scrolling slows down and you start seeing lines like
   `Mini Kanban API listening on port 3001`.

   Leave this terminal window open — closing it stops the app.

3. **Open the app.** In your web browser, go to:

   ```text
   http://localhost:3000
   ```

   You should see a "Welcome back" sign-in screen. Click **"Create one"**
   to make your first account, then you're in.

---

## 2. Using the app

- **Create a board** from the "Your boards" page — give it a name and,
  optionally, a description.
- **Add columns** using the "Add column" button on the right of the board
  (e.g. "Todo", "In Progress", "Done").
- **Add tasks** with the "Add task" button inside a column. Click any task
  to edit its title/description or delete it.
- **Drag and drop** a task to reorder it within a column, or drop it into a
  different column to move it there.
- **Invite teammates** with the "Share" button at the top of a board. You
  choose their role:
  - **Owner** — full control, including managing who else has access.
  - **Editor** — can create, edit, delete, and move columns and tasks.
  - **Viewer** — can see the board but can't change anything.
- Ask your teammates to create their own account at the same
  `http://localhost:3000` address (or whatever address you've deployed the
  app to) and invite them by the email they registered with.

---

## 3. Stopping and restarting

- To **stop** the app, go back to the terminal window and press `Ctrl + C`.
- To **start it again later**, open a terminal in the project folder and run:

  ```bash
  docker compose up
  ```

  (No `--build` needed unless you've changed the code — your boards, tasks,
  and accounts are kept between restarts.)

- To **completely reset** the app and erase all data, run:

  ```bash
  docker compose down -v
  ```

---

## 4. Troubleshooting

**"Port is already allocated" / "address already in use"**
Something else on your computer is already using port 3000, 3001, 5432, or
6379. Close the other application, or stop any previous `docker compose up`
that might still be running.

**The page at localhost:3000 won't load**
Make sure Docker Desktop is open and running, and that the terminal running
`docker compose up` is still open and hasn't shown any error messages near
the end. Give it a minute after starting — the database needs a few seconds
to finish starting up before the server can connect to it.

**I changed the code and don't see my changes**
Run `docker compose up --build` again — the `--build` flag tells Docker to
rebuild with your latest changes.

**I want to start completely fresh**
Run `docker compose down -v` and then `docker compose up --build`.

---

## 5. For developers

### Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js (App Router), React, TypeScript, Tailwind CSS, dnd-kit |
| Backend   | NestJS, TypeScript, TypeORM, class-validator, JWT (Passport) |
| Database  | PostgreSQL (source of truth) |
| Cache     | Redis (performance layer, never authoritative) |
| Infra     | Docker Compose (postgres, redis, backend, frontend) |

### Project structure

```text
mini-kanban/
├── backend/            NestJS API (auth, boards, columns, tasks, cache)
│   └── src/
│       ├── auth/       Registration, login, JWT strategy & guard
│       ├── users/      User entity & lookups
│       ├── boards/     Boards, memberships, RBAC guards
│       ├── columns/    Columns and their ordering
│       ├── tasks/      Tasks, plus the transactional move/reorder service
│       ├── cache/      Redis service + centralized cache-key factory
│       └── database/   TypeORM data source & migrations
├── frontend/           Next.js app
│   ├── app/            Pages (login, register, boards, board detail)
│   ├── components/     UI, auth, board, column, task, member components
│   └── lib/            API client, auth/session helpers, utilities
├── docker-compose.yml
└── .env.example
```

### Architecture notes

- **PostgreSQL is the source of truth; Redis is a cache.** Every GET
  endpoint checks Redis first and falls back to PostgreSQL on a miss. Every
  mutation (POST/PATCH/DELETE) writes to PostgreSQL first and then
  invalidates the affected Redis keys — Redis is never updated "in place."
  If Redis is unreachable, the API keeps working straight from PostgreSQL;
  it logs the failure instead of breaking the request.
- **Authorization always runs before the cache is consulted**, so a cached
  response can never leak data to someone who isn't a board member.
- **Task moves are transactional.** Reordering a task (within a column or
  across columns) runs inside a single PostgreSQL transaction that locks
  the affected rows before recalculating positions, so two people dragging
  cards on the same board at the same time can't corrupt the ordering.
- **Role-based access control** (`OWNER` / `EDITOR` / `VIEWER`) is enforced
  on the server for every board-scoped route — the frontend hides actions
  a viewer can't perform, but the API rejects them regardless.

### Running without Docker (local development)

You'll need Node.js 20+, PostgreSQL, and Redis running locally.

```bash
# Backend
cd backend
cp ../.env.example .env   # then edit DATABASE_HOST/REDIS_HOST to "localhost"
npm install
npm run migration:run
npm run start:dev

# Frontend (in a second terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:3000`, the backend at
`http://localhost:3001/api`.

### Environment variables

See `.env.example` at the project root for the full list, with comments
explaining each one (database, JWT, Redis, cache TTL, and CORS settings).

### API overview

All endpoints are prefixed with `/api` and (aside from register/login)
require an `Authorization: Bearer <token>` header.

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/boards
POST   /api/boards
GET    /api/boards/:boardId
PATCH  /api/boards/:boardId
DELETE /api/boards/:boardId

GET    /api/boards/:boardId/members
POST   /api/boards/:boardId/members
PATCH  /api/boards/:boardId/members/:userId
DELETE /api/boards/:boardId/members/:userId

GET    /api/boards/:boardId/columns
POST   /api/boards/:boardId/columns
PATCH  /api/boards/:boardId/columns/:columnId
DELETE /api/boards/:boardId/columns/:columnId

GET    /api/boards/:boardId/tasks
POST   /api/boards/:boardId/tasks
GET    /api/boards/:boardId/tasks/:taskId
PATCH  /api/boards/:boardId/tasks/:taskId
DELETE /api/boards/:boardId/tasks/:taskId
PATCH  /api/boards/:boardId/tasks/:taskId/move
```

---

## 6. Design decisions

- **Single repository** for both frontend and backend, to keep setup to one
  `docker compose up`.
- **Stateless JWT auth** rather than server-side sessions, for simplicity.
  For a public production deployment, storing the token in an HttpOnly
  cookie instead of browser storage would be the natural next step.
- **UUID primary keys** everywhere, and `board_id` is stored directly on
  `tasks` (not just derived through `column_id`) so cross-board access can
  be validated in a single check.
- **No `synchronize: true`.** The database schema is defined entirely by
  the migration in `backend/src/database/migrations`, which runs
  automatically when the backend container starts.
