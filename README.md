# 📚 DoR-DoD — Personal Learning & Development Platform

A full-stack MERN learning platform that helps users track their career path, set goals, build habits, monitor skills, and grow professionally — with a complete Admin Panel for platform management.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (HTTP-only cookies) + Google OAuth 2.0 |
| Email | Nodemailer + Gmail |

---

## ✨ Features

### 👤 User Features
- **Authentication** — OTP email verification, Google OAuth, JWT sessions
- **Dashboard** — Real-time stats, progress overview
- **Skills Tracker** — Choose career path, track skill progress, add custom skills
- **Goals** — CRUD goals with sub-goals, categories, priority, and progress
- **Habits** — 21-day habit tracker with streak tracking
- **Learning** — Course library, enroll, track progress, YouTube resources per skill
- **Dev Plan** — Auto-personalized recommendations based on your data
- **Analytics** — Real charts from live data (goals, habits, skills, courses)
- **Achievements** — Auto-earned from goals ≥ 75% progress
- **Community** — Posts, likes, comments
- **Frame of Mind** — Daily mood tracker with mindset score
- **Profile** — Personal + Professional profile
- **Course Upload** — Users can upload courses (pending admin approval)
- **Custom Skills** — Add skills outside your career path with tag inputs

### 🛡️ Admin Features
- **Admin Dashboard** — Platform-wide stats and charts
- **User Management** — Search, filter, suspend, activate, delete users
- **User Details** — Full user profile with goals, habits, skills, achievements
- **Goals Management** — View/edit all users' goals with full filters
- **Habits Management** — View and reset any user's habits
- **Courses Management** — Add, edit, delete courses with skill tags
- **Pending Courses** — Approve or reject user-uploaded courses
- **Community Moderation** — Delete posts/comments, suspend users
- **Achievements** — Manually award achievements to users
- **Notifications** — Send global or user-specific notifications
- **User Skills** — View all user-submitted custom skills
- **Settings** — Promote users to admin role

---

## 📁 Project Structure

```
learning-platform/
├── backend/
│   ├── controllers/         # Route handlers (auth, goals, habits, etc.)
│   ├── models/              # Mongoose models
│   ├── routes/              # Express route definitions
│   ├── middleware/          # JWT protect, admin middleware
│   ├── utils/               # Email service, Passport config
│   ├── data/                # Career paths, skill resources data
│   ├── .env                 # Environment variables
│   └── server.js            # App entry point
│
└── frontend/
    ├── src/
    │   ├── pages/           # All page components
    │   │   └── admin/       # Admin panel pages
    │   ├── components/      # Shared components
    │   │   ├── layout/      # DashboardLayout, Sidebar
    │   │   ├── admin/       # AdminLayout
    │   │   └── ui/          # Buttons, modals, etc.
    │   ├── contexts/        # AuthContext
    │   ├── utils/           # api.ts (Axios instance)
    │   └── App.tsx          # Route definitions
    ├── .env                 # Vite environment variables
    └── vite.config.ts
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local) or [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud)
- [Git](https://git-scm.com/)
- A Gmail account (for sending OTP emails)
- Google OAuth credentials (for Google login)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/learning-platform.git
cd learning-platform
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Install Backend Dependencies

```bash
npm install express mongoose bcryptjs jsonwebtoken cookie-parser cors dotenv nodemailer passport passport-google-oauth20
npm install --save-dev nodemon
```

#### Create `.env` file in `/backend`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillspark
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:8080

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail + App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
```

#### Start Backend

```bash
# Development
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Create `.env` file in `/frontend`

```env
VITE_API_URL=http://localhost:5000
```

#### Start Frontend

```bash
npm run dev
```

Frontend runs at: `http://localhost:8080`

---

### 4. Create Admin User

After the backend is running, run this from the `/backend` folder:

```bash
node createAdmin.js
```

This creates an admin user:
- **Email:** `doordo@email.com`
- **Password:** `DoRDo@123`

To make any existing user an admin, run in MongoDB shell:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 🌐 Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Set **Authorized redirect URIs** to:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
6. Copy the **Client ID** and **Client Secret** into your backend `.env`

---

## 📧 Setting Up Gmail App Password

1. Go to your [Google Account](https://myaccount.google.com/)
2. Enable **2-Factor Authentication**
3. Go to **Security → App Passwords**
4. Create a new app password for "Mail"
5. Copy the 16-character password into `EMAIL_PASS` in your backend `.env`

---

## 🔗 API Routes Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/set-password` | Set password after OTP |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/auth/google` | Google OAuth login |
| GET  | `/api/dashboard` | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/goals` | Goals CRUD |
| GET/POST/PATCH/DELETE | `/api/habits` | Habits CRUD |
| GET  | `/api/skill-path/careers` | All career paths |
| POST | `/api/skill-path/select` | Select career path |
| PATCH | `/api/skill-path/skills/:id` | Update skill status |
| POST | `/api/skill-path/skills/:id/add-goal` | Add skill as goal |
| GET  | `/api/learning` | Get approved courses |
| POST | `/api/learning/upload` | Upload course (pending) |
| POST | `/api/learning/:id/enroll` | Enroll in course |
| GET/POST/DELETE | `/api/custom-skills` | Custom skills CRUD |
| GET  | `/api/analytics` | Analytics data |
| GET  | `/api/achievements` | User achievements |
| GET/POST | `/api/community` | Community posts |
| GET/POST | `/api/frame-of-mind` | Mood tracking |
| GET  | `/api/admin/dashboard` | Admin stats |
| GET  | `/api/admin/users` | All users (paginated) |
| PATCH | `/api/admin/users/:id/suspend` | Suspend/activate user |
| PATCH | `/api/admin/users/:id/role` | Change user role |
| GET  | `/api/admin/courses/pending` | Pending course approvals |
| PATCH | `/api/admin/courses/:id/approve` | Approve course |
| PATCH | `/api/admin/courses/:id/reject` | Reject course |
| POST | `/api/admin/notifications` | Send notifications |

---

## 🖥️ App Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login page |
| `/register` | Public | Register page |
| `/dashboard` | User | Main dashboard |
| `/skills` | User | Career path + skill tracker |
| `/goals` | User | Goals management |
| `/habits` | User | 21-day habit tracker |
| `/learning` | User | Course library |
| `/development-plan` | User | Personalized dev plan |
| `/analytics` | User | Analytics charts |
| `/achievements` | User | Achievements |
| `/community` | User | Community posts |
| `/profile` | User | User profile |
| `/frame-of-mind` | User | Mood tracker |
| `/admin` | Admin | Admin dashboard |
| `/admin/users` | Admin | User management |
| `/admin/courses` | Admin | Course management |
| `/admin/pending-courses` | Admin | Course approvals |
| `/admin/goals` | Admin | Goals management |
| `/admin/habits` | Admin | Habits management |
| `/admin/community` | Admin | Community moderation |
| `/admin/notifications` | Admin | Send notifications |

---

## 🔐 Role-Based Access

- **User** → Redirected to `/dashboard` after login
- **Admin** → Redirected to `/admin` after login
- All `/admin/*` routes are protected by `adminProtect` middleware
- Non-admin users trying to access `/admin` are redirected to `/dashboard`

---

## 📦 Backend npm Packages

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "nodemailer": "^6.9.7",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 📦 Frontend npm Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "recharts": "^2.9.0",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^4.11.0",
    "@tanstack/react-query": "^5.8.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

---

## 🛠️ package.json Scripts

### Backend (`/backend/package.json`)
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Frontend (`/frontend/package.json`)
```json
{
  "scripts": {
    "dev": "vite --port 8080",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## 🚨 Common Issues & Fixes

### Backend crashes with `OverwriteModelError`
Check `models/Document.js` — make sure it exports `mongoose.model('Document', ...)` not `DevPlan` or any other name.

### Google OAuth redirects to wrong URL
Make sure `frontend/.env` has `VITE_API_URL=http://localhost:5000`.

### OTP emails not sending
- Enable 2FA on Gmail
- Use a Gmail **App Password** (not your regular password)
- Set `EMAIL_USER` and `EMAIL_PASS` in `backend/.env`

### `next is not a function` error in User model
Replace the pre-save hook — every code path must call `return next()` explicitly. Wrap bcrypt in try/catch and call `next(err)` on failure.

### Admin panel shows "Access Denied"
Run `node createAdmin.js` from the backend folder, or update role in MongoDB:
```js
db.users.updateOne({ email: "you@email.com" }, { $set: { role: "admin" } })
```

---

## 👨‍💻 Developer Notes

- MongoDB auto-seeds courses on first request to `/api/learning`
- Achievements auto-sync from goals ≥ 75% whenever the achievements page is opened
- Dev Plan auto-regenerates from user's real data on each visit
- All admin routes require `role: "admin"` in the JWT cookie — enforced by `adminMiddleware.js`

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

*Built with ❤️ using the MERN Stack*