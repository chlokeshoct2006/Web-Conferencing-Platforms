# 🎥 Apna Video Call

A full-stack video conferencing app with real-time video, chat, and screen sharing — built with React, Node.js, Socket.IO, and WebRTC.

**Live Demo:** [Frontend](https://web-conferencing-platforms-frontend.onrender.com) · [Backend](https://web-conferencing-platforms-backend.onrender.com)

---

## Features

- 🔐 Register / Login with encrypted passwords
- 🎥 Peer-to-peer video calls via WebRTC
- 🔇 Toggle camera & microphone on/off
- 🖥️ Screen sharing
- 💬 Real-time in-call chat
- 📋 Meeting history per user
- 🔗 Copy meeting code or link to invite others

---

## Tech Stack

**Frontend:** React, Material UI, Socket.IO Client, WebRTC, Axios, React Router  
**Backend:** Node.js, Express, Socket.IO, MongoDB, Mongoose, bcrypt, dotenv

---

## Project Structure

```
├── backend/
│   └── src/
│       ├── app.js                  # Server entry point
│       ├── controllers/
│       │   ├── socketManager.js    # WebRTC signaling + chat
│       │   └── user.controller.js  # Auth + history logic
│       ├── models/
│       │   ├── user.model.js
│       │   └── meeting.model.js
│       └── routes/users.routes.js
│
└── frontend/
    └── src/
        ├── App.js
        ├── environment.js          # API URL config
        ├── contexts/AuthContext.jsx
        ├── pages/
        │   ├── landing.jsx
        │   ├── authentication.jsx
        │   ├── home.jsx
        │   ├── VideoMeet.jsx
        │   └── history.jsx
        └── utils/withAuth.jsx      # Route guard
```

---

## Local Setup

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/
CLIENT_URL=http://localhost:3000
```

```bash
node src/app.js
# → Mongo Connected | LISTENING ON PORT 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

Set `src/environment.js`:
```js
let IS_PROD = false;
const server = IS_PROD ? "https://your-backend.onrender.com" : "http://localhost:8000";
export default server;
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/users/register` | Register user |
| POST | `/api/v1/users/login` | Login, returns token |
| POST | `/api/v1/users/add_to_activity` | Save meeting to history |
| GET | `/api/v1/users/get_all_activity` | Get meeting history |

---

## Deployment (Render)

### Backend — Web Service
- Root Directory: `backend`
- Build: `npm install`
- Start: `node src/app.js`
- Env vars: `MONGODB_URI`, `PORT=8000`, `CLIENT_URL=https://your-frontend.onrender.com`

### Frontend — Static Site
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `build`
- Update `environment.js` → `IS_PROD = true` + set backend URL

---

## How It Works

```
User A joins → emits join-call
User B joins → server notifies A
A creates offer → sends via socket → B answers
Both exchange ICE candidates → P2P video established ✅
```

---

## Security

- Passwords hashed with **bcrypt** (10 rounds)
- Auth tokens via **crypto.randomBytes**, stored in DB
- `.env` is gitignored — credentials never pushed
- CORS restricted to known origins

---

## Author

**Lokesh Chaudhary** · [@chlokeshoct2006](https://github.com/chlokeshoct2006)
