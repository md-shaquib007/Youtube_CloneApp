# 🎥 ChaiTube - Professional YouTube-Like Fullstack Platform

![ChaiTube Showcase](docs/assets/showcase.jpg)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-v4.19-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-v6.8-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/React-v19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-v8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Zod-v3.23-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Jest-v29.7-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/Security-Helmet_%26_Rate_Limiting-green?style=for-the-badge&logo=shieldsdotio&logoColor=white" alt="Security" />
</p>

---

## 🌟 Overview

**ChaiTube** is a enterprise-grade, production-hardened video sharing application and content platform inspired by YouTube. Designed with clean architecture, robust security, high-performance database indexing, and interactive UI componentry.

It features complete video management, nested comment threads, like/dislike interactions, public/private playlists, email verification, password reset flows, full-text search, and real-time subscription feeds.

---

## 🔥 Core Features

### 🔐 Authentication & User Management
- **JWT Dual Token Flow**: Secure Access & HTTP-only Refresh Tokens with cookie security (`SameSite`, `HttpOnly`).
- **Email Verification**: Tokenized email confirmation via Resend / Nodemailer.
- **Password Reset**: Secure forgot-password flow with single-use, time-bound reset tokens.
- **Channel Profiles**: Avatar & Cover image uploads powered by Cloudinary.

### 📹 Video & Content Pipeline
- **Chunked Media Upload**: Multer pipeline for uploading video files and thumbnails.
- **Publish & Visibility**: Toggle public/private visibility and record video views seamlessly.
- **Watch History**: Tracking watched content per authenticated account.

### 👍 Engagement & Social Tools
- **Likes & Dislikes**: Dynamic like toggling on videos and comments with instant state query aggregation.
- **Comment Threads & Nested Replies**: Paginated top-level comments with infinite nested reply capability.
- **Playlists**: Custom public and private video collections with drag-and-drop addition/removal.

### 🔎 Search & Discovery
- **Safe Regex Search**: ReDoS-protected full-text search across channels, videos, and playlists.
- **Channel Subscriptions**: Subscribe/unsubscribe functionality with subscriber counter aggregation.

### 🛡️ Production Security & Hardening
- **HTTP Security Headers**: Powered by `helmet`.
- **Rate Limiting**: Configured `express-rate-limit` for authentication and general API protection.
- **Automatic File Cleanup**: Middleware auto-removes stray local temp files on error or cancellation.
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT` signals for zero-downtime container management.

---

## 🛠️ Tech Stack & Architecture

### Backend
- **Runtime**: Node.js ES Modules (`"type": "module"`)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM (Aggregation Pipelines & Paginate-v2)
- **Validation**: Zod schema parsing & sanitization
- **Media Storage**: Cloudinary SDK & Multer
- **Mail Services**: Resend API & Nodemailer fallback
- **Testing**: Jest with `--experimental-vm-modules` & Supertest

### Frontend
- **Framework**: React 19 with Vite 8
- **Styling**: Modern CSS with dark-mode aesthetic
- **Linter**: Oxlint fast JavaScript/React linter

---

## 📂 Repository Structure

```text
├── docs/assets/             # Project showcase and visual assets
├── public/temp/            # Temporary file upload staging
├── src/
│   ├── controller/         # Business logic (User, Video, Like, Comment, Playlist, Sub, Search)
│   ├── db/                 # MongoDB connection & index bootstrapping
│   ├── middleware/         # Auth (JWT), Rate Limiting, Zod Validation, Multer, Error Traps
│   ├── model/              # Mongoose schemas (User, Video, Subscription, Like, Comment, Playlist)
│   ├── route/              # API routers (/users, /videos, /likes, /comments, /playlists, etc.)
│   ├── schema/             # Zod validation schemas
│   ├── test/               # Automated unit & integration Jest test suites
│   ├── util/               # ApiError, ApiResponse, Cloudinary uploader, Email service
│   ├── app.js              # Express app configuration & middleware pipeline
│   ├── constants.js        # Global constants
│   └── index.js            # Entry point & graceful server bootstrap
├── frontend/               # React Vite client SPA
│   ├── src/api/client.js   # Unified API client & endpoint bindings
│   ├── src/context/        # Auth & Toast context declarations
│   └── src/hooks/          # Dedicated React custom hooks
├── .env.sample             # Sample environment variables guide
├── jest.config.js          # Jest ES Modules config
├── package.json            # NPM scripts & dependencies
└── README.md               # Project documentation
```

---

## 📡 API Reference Cheat Sheet

### 1. User & Authentication (`/api/v1/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new account with avatar/cover | No |
| `POST` | `/login` | Authenticate user & issue tokens | No |
| `POST` | `/logout` | Invalidate session tokens & clear cookies | **Yes** |
| `POST` | `/refresh_token` | Issue new access token using refresh cookie | No |
| `POST` | `/verify-email` | Confirm email address via token | No |
| `POST` | `/forgot-password` | Request password reset token email | No |
| `POST` | `/reset-password` | Set new password with reset token | No |
| `GET` | `/current-user` | Retrieve authenticated user profile | **Yes** |
| `PATCH` | `/update-account` | Update name and email address | **Yes** |
| `PATCH` | `/avatar` | Upload new avatar image | **Yes** |
| `PATCH` | `/cover-image` | Upload new cover banner image | **Yes** |
| `GET` | `/c/:username` | Fetch public channel profile & stats | Optional |
| `GET` | `/history` | Fetch account watch history | **Yes** |

### 2. Video Operations (`/api/v1/videos`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get paginated feed of public videos | No |
| `POST` | `/publish` | Upload & publish video with thumbnail | **Yes (Verified)** |
| `GET` | `/:videoId` | Get video details and owner profile | Optional |
| `PATCH` | `/:videoId` | Edit video title/description | **Yes** |
| `DELETE` | `/:videoId` | Delete video & purge all linked data | **Yes** |
| `PATCH` | `/toggle/publish/:videoId` | Toggle video public/private status | **Yes** |
| `POST` | `/view/:videoId` | Record view count & update watch history | Optional |
| `GET` | `/channel/:username` | Get all videos published by channel | Optional |

### 3. Likes (`/api/v1/likes`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/toggle/v/:videoId` | Toggle like status on video | **Yes** |
| `POST` | `/toggle/c/:commentId` | Toggle like status on comment | **Yes** |
| `GET` | `/videos` | Fetch user's liked videos feed | **Yes** |

### 4. Comments & Replies (`/api/v1/comments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/:videoId` | Get top-level comments with like/reply counts | Optional |
| `POST` | `/:videoId` | Add comment or nested reply | **Yes** |
| `GET` | `/c/:commentId/replies` | Get paginated nested replies | Optional |
| `PATCH` | `/c/:commentId` | Update comment text | **Yes** |
| `DELETE` | `/c/:commentId` | Delete comment and child replies | **Yes** |

### 5. Playlists (`/api/v1/playlists`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create playlist | **Yes** |
| `GET` | `/user/:userId` | Get user playlists | Optional |
| `GET` | `/:playlistId` | Get playlist details and video list | Optional |
| `POST` | `/add/:playlistId/:videoId` | Add video to playlist | **Yes** |
| `DELETE` | `/remove/:playlistId/:videoId` | Remove video from playlist | **Yes** |
| `PATCH` | `/:playlistId` | Edit playlist title/privacy | **Yes** |
| `DELETE` | `/:playlistId` | Delete playlist | **Yes** |

### 6. Subscriptions & Search
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/subscriptions/c/:channelId` | Toggle channel subscription | **Yes** |
| `GET` | `/api/v1/subscriptions` | Get subscribed channels feed | **Yes** |
| `GET` | `/api/v1/search?q=query` | Full-text search channels/videos | No |
| `GET` | `/api/v1/health` | Service health status check | No |

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- Node.js `v20+` installed
- MongoDB instance (local or MongoDB Atlas)
- Cloudinary account credentials

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/md-shaquib007/Media-storage-app.git
cd Media-storage-app

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=8000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chaitube
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@chaitube.com
```

### 4. Running Verification & Development
```bash
# Execute full verification (Jest test suite + Frontend Linter + Vite Build)
npm run verify

# Start development backend
npm run dev

# Start development frontend
cd frontend && npm run dev
```

---

## 🧪 Testing Suite

Tests are executed with native Node.js ES Modules VM support.

```bash
npm test
```

All 7 test suites (35 unit and integration tests) run in isolated memory contexts to guarantee zero side-effects.

---

## 📜 License & Acknowledgments

Built with ❤️ for scalable media storage and seamless video sharing workflows.