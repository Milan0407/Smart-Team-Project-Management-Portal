# Smart Team Project Portal

Smart Team Project Portal is a full-stack collaboration and project management platform for organizations, departments, teams, and project delivery workflows. It supports workspace management, role-based access, Kanban boards, task tracking, analytics, real-time project chat, direct messages, wiki documents, activity feeds, invitations, and notification preferences.

The project is built as a MERN-style application with a React/Vite frontend, an Express/MongoDB backend, and Socket.IO for real-time collaboration.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
- [Application Flow](#application-flow)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment Notes](#deployment-notes)
- [Testing Checklist](#testing-checklist)
- [Deployment Configuration](#deployment-configuration)

## Features

### Authentication and Access

- User registration and login
- JWT-based authentication
- Protected frontend routes
- Session handling and logout flow
- Organization-level roles and permissions
- Project, department, and team membership management

### Organization Workspace

- Create and manage organizations
- Workspace dashboard with overview metrics
- Organization settings
- Organization member and invitation flows
- Join request and invitation handling

### Departments and Teams

- Create departments under an organization
- Assign department managers
- Add/remove department members
- Create teams under departments
- Assign team leads
- Add/remove team members

### Projects and Boards

- Create organization projects
- Assign project leads
- Add project members with roles:
  - Project Manager
  - Developer
  - Viewer
- Create project boards
- Kanban columns and task movement
- Drag-and-drop task workflow
- Task filtering and search

### Task Management

- Create, view, edit, and delete tasks
- Assign users to tasks
- Track priority, status, due dates, descriptions, and activity
- Task activity feed
- Attachments/download support
- Board updates through real-time events

### Analytics

- Organization-level analytics
- Project-level analytics
- Task status summaries
- Completion percentage
- Overdue and due-this-week counts
- Member workload overview

### Messaging and Collaboration

- Real-time project chat
- Direct messages between organization members
- Typing indicators
- Message edit/delete flows
- Unread count handling
- Socket.IO-powered updates

### Wiki Docs

- Organization-wide wiki documents
- Project-scoped wiki documents
- Markdown editor and live preview
- Document search and scope filtering
- Create, edit, and delete wiki pages

### Notifications and Activity

- Notification center
- Activity feed for workspace changes
- Email notification service support through SMTP configuration

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Redux Toolkit Query
- React Redux
- Tailwind CSS
- Lucide React icons
- Socket.IO Client
- @hello-pangea/dnd for drag-and-drop

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- Joi validation
- bcryptjs
- cookie-parser
- cors
- helmet
- compression
- multer
- nodemailer
- winston logging

### Database

- MongoDB Atlas or local MongoDB
- Mongoose schemas and indexes

## Project Structure

```text
smart-team-project-portal/
|-- backend/
|   |-- src/
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- config/
|   |   |-- modules/
|   |   |   |-- analytics/
|   |   |   |-- auth/
|   |   |   |-- board/
|   |   |   |-- chat/
|   |   |   |-- department/
|   |   |   |-- dm/
|   |   |   |-- document/
|   |   |   |-- notification/
|   |   |   |-- org/
|   |   |   |-- project/
|   |   |   |-- task/
|   |   |   `-- team/
|   |   |-- shared/
|   |   `-- sockets/
|   |-- .env.example
|   |-- package.json
|   `-- package-lock.json
|
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- features/
|   |   |   |-- analytics/
|   |   |   |-- auth/
|   |   |   |-- board/
|   |   |   |-- chat/
|   |   |   |-- department/
|   |   |   |-- dm/
|   |   |   |-- document/
|   |   |   |-- layout/
|   |   |   |-- notification/
|   |   |   |-- org/
|   |   |   |-- project/
|   |   |   |-- search/
|   |   |   |-- task/
|   |   |   `-- team/
|   |   |-- services/
|   |   `-- shared/
|   |-- package.json
|   `-- package-lock.json
|
|-- .gitignore
`-- README.md
```

## System Architecture

The application is split into two main services:

1. Frontend client
   - React single-page application
   - Uses Redux Toolkit Query for API calls and cache invalidation
   - Uses Socket.IO client for real-time updates
   - Provides dashboard, project, board, message, document, and settings screens

2. Backend API
   - Express REST API
   - Mongoose models and repositories for MongoDB access
   - Service layer for business rules
   - Controllers/routes for request handling
   - Socket.IO server for chat, board updates, notifications, and direct messages

### High-Level Request Flow

```text
User Browser
  -> React Router page
  -> Redux Toolkit Query API call
  -> Express route
  -> Authentication/authorization middleware
  -> Validation middleware
  -> Controller
  -> Service
  -> Repository
  -> MongoDB
  -> JSON response
  -> RTK Query cache update
  -> React UI update
```

### Real-Time Flow

```text
Frontend Socket.IO Client
  -> Authenticated socket connection
  -> User joins personal room and/or project room
  -> Backend service emits events after writes
  -> Socket.IO broadcasts to relevant users/project rooms
  -> Frontend updates chat, DM, board, notification, or activity UI
```

## Application Flow

### 1. User Starts

1. Register or login.
2. User is authenticated with JWT.
3. Protected routes become available.

### 2. Organization Workspace

1. User creates or joins an organization.
2. Organization dashboard shows workspace overview.
3. Sidebar navigation unlocks project, department, team, message, analytics, docs, and settings modules.

### 3. Departments and Teams

1. Admin creates departments.
2. Admin assigns department manager.
3. Department manager/admin adds members.
4. Teams are created under departments.
5. Team lead/admin manages team members.

### 4. Projects

1. Admin creates a project and assigns a project lead.
2. Project lead becomes project manager.
3. Project managers can add project members from organization members.
4. Project boards and tasks are created and managed.

### 5. Board and Task Workflow

1. Create board.
2. Add tasks.
3. Assign task members.
4. Move tasks through Kanban columns.
5. Track activity, status, priority, and due dates.

### 6. Collaboration

1. Project members can use project chat.
2. Organization members can use direct messages.
3. Socket.IO sends live updates.

### 7. Wiki Docs

1. Create organization-wide or project-scoped wiki documents.
2. Edit content with markdown.
3. Preview and save documents.
4. Search/filter documents by scope.

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB local instance or MongoDB Atlas connection string

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd smart-team-project-portal
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Backend Environment

Create `backend/.env` from `backend/.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in the required values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### 4. Start Backend

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 6. Start Frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Environment Variables

### Backend

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment, for example `development` or `production` |
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh/session tokens |
| `CLIENT_URL` | Frontend URL for CORS and generated links |
| `SMTP_HOST` | SMTP host for email |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | Whether SMTP uses secure connection |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender email address |

### Frontend

Create `frontend/.env` from `frontend/.env.example` when you need custom API URLs:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Local development values:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Production values should point to your deployed backend:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api
VITE_SOCKET_URL=https://your-render-backend.onrender.com
```

## Available Scripts

### Backend

Run from `backend/`:

```bash
npm run dev
```

Starts backend with nodemon.

```bash
npm start
```

Starts backend with Node.

### Frontend

Run from `frontend/`:

```bash
npm run dev
```

Starts Vite development server.

```bash
npm run build
```

Builds frontend for production.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint.

## Deployment Notes

### Backend on Render

Recommended Render service type:

```text
Web Service
```

Suggested settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Add backend environment variables in Render:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_ACCESS_SECRET=your_production_access_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
CLIENT_URL=https://your-vercel-frontend.vercel.app
SMTP_HOST=optional
SMTP_PORT=optional
SMTP_SECURE=optional
SMTP_USER=optional
SMTP_PASS=optional
SMTP_FROM=optional
```

After deployment, Render will provide a backend URL similar to:

```text
https://your-backend-name.onrender.com
```

### Frontend on Vercel

Recommended Vercel settings:

```text
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Add frontend environment variables in Vercel:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api
VITE_SOCKET_URL=https://your-render-backend.onrender.com
```

After the frontend URL is available, update backend `CLIENT_URL` on Render.

## Testing Checklist

Use this checklist before deployment:

- Register a user
- Login/logout
- Create organization
- Create department
- Add department members
- Create team
- Add team members
- Create project
- Add project members
- Create board
- Create task
- Move task between columns
- Test task modal and task activity
- Test project chat
- Test direct messages
- Test wiki document create/edit/delete
- Test dashboard and analytics
- Test activity feed
- Test organization settings
- Refresh pages directly by URL
- Check browser console and network tab for errors

## Deployment Configuration

Frontend backend URLs are configured through Vite environment variables:

```text
VITE_API_BASE_URL
VITE_SOCKET_URL
```

The central frontend config lives in:

```text
frontend/src/shared/config/api.js
```

It is used for:

- RTK Query API base URL
- Socket.IO connection URL
- CSV export URL
- Uploaded attachment preview/download URLs

If no frontend env file is present, the app falls back to local development URLs.

## Security Notes

- Do not commit `.env` files.
- Use strong JWT secrets in production.
- Use MongoDB Atlas network rules carefully.
- Configure production CORS to your deployed frontend URL.
- Keep SMTP credentials private.

## License

This project is currently marked as ISC in the backend package metadata.
