# Hackathon Chatbot Frontend (React + TypeScript + Vite)

A complete, production-ready React frontend scaffold for the DevOps RAG Chatbot with real-time WebSocket integration, role-based access control, and agentic flow visualization.

## Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Configure Environment
Create `.env.local` in project root:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENV=development
```

For production, create `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENV=production
```

### 3. Run Development Server
```powershell
npm run dev
```

Open browser to **http://localhost:5173/**

### 4. Login
- **Demo Admin Token:** `admin_devtoken` → Roles: `admin`, `user`
- **Demo User Token:** `user_devtoken` → Role: `user`
- Or click **"Login as Admin"** or **"Login as User"** buttons

## What's Included

### Architecture
- **React 18** with TypeScript for type safety
- **Vite** for ultra-fast dev/build
- **React Router** v6 for client-side routing
- **Zustand** for lightweight state management (auth, chat)
- **React Query** for data fetching & caching
- **Axios** with auth interceptors
- **WebSocket Client** with automatic reconnect
- **Tailwind CSS** for modern styling
- **Framer Motion** for smooth animations (ready for use)
- **Lucide Icons** for UI icons

### Folder Structure
```
src/
  ├─ components/
  │   ├─ Common/          # Button, Input, Modal, Toast
  │   └─ Layout/          # AppLayout, Sidebar, TopBar
  ├─ pages/
  │   ├─ auth/            # LoginPage
  │   ├─ chat/            # ChatPage (main feature)
  │   ├─ admin/           # DocumentsPage, UsersPage
  │   └─ SettingsPage.tsx
  ├─ services/
  │   ├─ api.ts           # Axios client + interceptors
  │   ├─ websocket.ts     # WebSocket with reconnect
  │   └─ constants.ts     # API_BASE_URL, WS_URL
  ├─ stores/
  │   ├─ authStore.ts     # Zustand: user, token, login/logout
  │   └─ chatStore.ts     # Zustand: messages, agentSteps
  ├─ hooks/
  │   ├─ useChat.ts       # WebSocket connection + message handling
  │   └─ useDocuments.ts  # React Query for document API
  ├─ types/
  │   ├─ auth.ts
  │   └─ chat.ts
  ├─ App.tsx              # Router setup & protected routes
  ├─ main.tsx             # React Query & Router providers
  └─ index.css            # Tailwind + custom animations
```

### Key Features

#### Authentication
- Token-based (Bearer tokens stored in Zustand with persistence)
- Protected routes redirect to `/login` if no token
- Role-based rendering (admin/user items hidden based on roles)
- Demo tokens for testing

#### Chat Interface
- Real-time WebSocket connection with reconnect logic
- Message history preserved during session
- Two-column layout: messages (left) + agent flow (right)
- User messages right-aligned, assistant left-aligned
- Typing input with send button

#### Admin Features (role-based)
- **Documents:** Upload, list, search
- **Users:** Create, list, manage roles
- Both pages show "Access Denied" for non-admins

#### Settings
- Profile info display
- Placeholder for theme/preferences
- Session management

### Services & Integrations

#### API Service (`src/services/api.ts`)
- Axios instance with Authorization header injected
- Auto-logout on 401 Unauthorized
- Endpoints:
  ```
  GET  /health
  POST /api/documents (upload document)
  GET  /api/documents (list documents)
  GET  /api/documents/search?q=query
  POST /api/users (create user)
  ```

#### WebSocket (`src/services/websocket.ts`)
- Connect on component mount
- Auto-reconnect with exponential backoff (up to 6 attempts)
- Message parsing and callback handling
- Graceful disconnect on unmount

#### Stores (Zustand)
- **authStore:** user, token, login(), logout() with localStorage persistence
- **chatStore:** messages[], agentSteps[], addMessage(), updateAgentStep(), clearChat()

### Build & Deploy

#### Production Build
```powershell
npm run build
```
Output: `dist/` folder

#### Preview Production Build
```powershell
npm run preview
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build & run:
```bash
docker build -t hackathon-frontend .
docker run -p 80:80 hackathon-frontend
```

#### Deploy to Vercel
```powershell
npm i -g vercel
vercel deploy --prod
```

## Next Steps for Customization

### Enhance Chat Page
- Replace placeholder agent flow with dynamic visualization
- Add typing indicators
- Add message loading states
- Implement auto-scroll to latest message
- Add emoji/markdown support

### Complete Admin Pages
- Add document upload form with drag-drop
- Add document table with search/pagination
- Add user creation form
- Add role badge component
- Add token copy-to-clipboard feature

### Add Settings Page
- Theme toggle (dark/light)
- Notification preferences
- Message display density selector
- Profile card with user info

### Advanced Features
- Add real-time collaboration indicators
- Implement document preview modals
- Add export/download functionality
- Implement user activity logging
- Add analytics integration

## Troubleshooting

**Issue:** WebSocket connection fails
→ Check `VITE_WS_URL` is correct and backend is running

**Issue:** 401 Unauthorized errors
→ Ensure token is sent in requests; check backend auth middleware

**Issue:** Styles not loading (Tailwind not working)
→ Restart dev server; verify `tailwind.config.cjs` has correct content paths

**Issue:** Components not rendering
→ Check browser console (F12) for errors; verify import paths

**Issue:** CORS errors
→ Check backend CORS headers; ensure API_BASE_URL matches backend

## Resources

- **Specification Docs:** See `FRONTEND_SPECIFICATION.md` for detailed design/features
- **Component Prompts:** See `FRONTEND_PROMPTS.md` for component generation prompts
- **Code Examples:** See `FRONTEND_API_EXAMPLES.md` for patterns & implementations
- **Setup Guide:** See `FRONTEND_SETUP.md` for step-by-step instructions
- **Quick Reference:** See `FRONTEND_QUICK_REF.md` for cheat sheets

## Current Status

✅ Project scaffold complete  
✅ Dependencies installed  
✅ Dev server running at `http://localhost:5173/`  
✅ Authentication (login, role-based access)  
✅ Routing & protected routes  
✅ Zustand stores (auth, chat)  
✅ API service with interceptors  
✅ WebSocket service with reconnect  
✅ Common components (Button, Input, Modal, Toast)  
✅ Layout components (Sidebar, TopBar, AppLayout)  
✅ Page skeletons (Chat, Documents, Users, Settings)  

⏳ **Next:** Enhance components with real UI, integrate with backend API

---

**Built with ❤️ for the Hackathon RAG Chatbot**