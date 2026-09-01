# Professional YouTube-Like Backend Project

Welcome to the backend API of a YouTube-like professional video sharing application! This project is built using modern Javascript with Node.js, Express.js, MongoDB, and Mongoose, and features full file upload capabilities, type-safe validations, and robust testing.

This guide is designed for beginners to help you set up, run, understand, and test the project.

---

## 🚀 Key Features

*   **User Management**: Complete registration, login, logout, password updates, profile updates, and authentication using JWT Access and Refresh Tokens.
*   **Media Uploads**: Local file storage integrated with **Cloudinary** for uploading avatars, cover images, and videos.
*   **Request Validation**: Input validation using **Zod** schema parser to guarantee secure, sanitized request data.
*   **Centralized Error Handling**: Express middleware that intercept errors and converts them to standard structured JSON responses.
*   **Database Integration**: Mongoose schemas modeling Users, Videos, and Subscriptions.
*   **Automated Testing**: Written unit and integration tests using **Jest** and **Supertest** with ES Modules.

---

## 🛠️ Technology Stack

*   **Node.js & Express.js**: Application environment and backend routing.
*   **MongoDB & Mongoose**: Database and object data modeling (ODM) helper.
*   **Zod**: Schema-based data verification and request sanitizer.
*   **JWT (JSON Web Tokens)**: Secure token-based user authentication.
*   **Bcrypt**: Password hashing helper.
*   **Multer**: Handling `multipart/form-data` uploads (files).
*   **Cloudinary**: Remote storage for images and videos.
*   **Jest & Supertest**: Test runner and HTTP endpoint simulation frameworks.

---

## 📂 Project Structure

Here is a simple explanation of the folder structure:

```text
├── public/                 # Static local assets (e.g., temporary file uploads)
├── src/
│   ├── controller/         # Contains the core business logic (e.g., user operations)
│   ├── db/                 # Database connection logic
│   ├── middleware/         # Express middlewares (JWT auth, file uploads, Zod validation)
│   ├── model/              # Mongoose database models (User, Video, Subscription)
│   ├── route/              # API routing endpoints (e.g., /api/v1/users)
│   ├── schema/             # Zod validation schemas definition
│   ├── test/               # Jest automated tests (models, controllers, utils)
│   ├── util/               # Reusable utility classes (ApiError, ApiResponse, Cloudinary upload)
│   ├── app.js              # Express app configuration & middleware mounts
│   ├── constants.js        # Global constant values (e.g., DB name)
│   └── index.js            # Entry point (bootstraps database connection and starts server)
├── .env.sample             # Sample environment variables configuration file
├── jest.config.js          # Jest configuration for ES Modules
└── package.json            # Scripts, project information, and dependencies
```

---

## 🔧 Installation & Setup

Follow these steps to run the project locally on your machine:

### 1. Clone the project and install dependencies
Open your terminal and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` at the root of your project (you can copy the structure from the provided `.env.sample` or read below) and add the following keys:
```env
PORT=8000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_long_random_jwt_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_long_random_refresh_secret_here
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run the Development Server
Start the server in development mode (using nodemon, which restarts automatically when files are changed):
```bash
npm run dev
```

The server should start running at `http://localhost:8000`.

---

## 🧪 Running Automated Tests

We use **Jest** and **Supertest** to test the project. To run the test suite, run the following command:
```bash
npm run test
```

This command runs Jest with native ES Modules support enabled (`NODE_OPTIONS=--experimental-vm-modules`).

---

## 📡 API Endpoints Cheat Sheet

All routes are prefix-configured at `/api/v1/users`:

| Request Method | Route | Description | Authentication Required | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/register` | Create a new user account (uploads Avatar/Cover) | No | Multer Upload + Zod Schema |
| **POST** | `/login` | Log into an existing account (returns Cookies & JSON) | No | Zod Schema |
| **POST** | `/logout` | Log out of user account and clear session tokens | **Yes** | JWT Auth |
| **POST** | `/refresh_token` | Refresh expired access tokens | No | Cookies parser |
| **POST** | `/change-password` | Change authenticated user password | **Yes** | JWT Auth + Zod Schema |
| **GET** | `/current-user` | Retrieve details of current logged-in user | **Yes** | JWT Auth |
| **PATCH** | `/update-account` | Update fullName and email | **Yes** | JWT Auth + Zod Schema |
| **PATCH** | `/avatar` | Update user avatar image | **Yes** | JWT Auth + Multer |
| **PATCH** | `/cover-image` | Update user cover image | **Yes** | JWT Auth + Multer |
| **GET** | `/c/:username` | Fetch aggregate public channel details of a user | **Yes** | JWT Auth |
| **GET** | `/history` | Fetch watch history | **Yes** | JWT Auth |

---

## 💡 Important Core Concepts for Beginners

1.  **JSON API Format**: Every API response follows a consistent structure provided by the `ApiResponse` class:
    ```json
    {
      "success": true,
      "message": "Response message description",
      "data": { ... }
    }
    ```
2.  **Request Sanitization**: Before incoming data reaches the controller, it is validated by the [validation.middleware.js](file:///d:/professional-project-chai-backend/src/middleware/validation.middleware.js). If fields are invalid or missing, it blocks execution and sends a `400 Bad Request` with Zod validation details (like `email: Invalid email format`).
3.  **Local File Cleanup**: When files are uploaded (via Multer), they are saved temporarily inside `public/temp`. After successfully uploading to Cloudinary, or if validation fails, the files are deleted immediately using Node's `fs` module to keep storage usage low.