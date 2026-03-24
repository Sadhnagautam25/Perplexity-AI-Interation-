# Perplexity AI Clone - Backend

This is the backend API server for the Perplexity AI Clone application, built with Node.js, Express.js, and MongoDB.

## 🚀 Quick Start

```bash
cd backend
npm install
npm run dev
```

## 📋 Environment Setup

Create a `.env` file with the required environment variables (see main README.md for details).

## 🛠️ Key Technologies

- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **Redis**: Caching and session management
- **Socket.IO**: Real-time communication
- **JWT**: Authentication
- **LangChain**: AI agent framework
- **Groq API**: LLM integration

## 📁 Project Structure

- `src/controllers/`: Request handlers
- `src/models/`: Database schemas
- `src/routes/`: API endpoints
- `src/services/`: External integrations
- `src/tools/`: LangChain tools
- `src/agent/`: AI agent configuration
- `src/middlewares/`: Express middlewares

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body (FormData):**

```json
{
  "username": "string (required)",
  "email": "string (required)",
  "password": "string (required, min 6 chars)",
  "bio": "string (optional)",
  "profileImage": "file (optional, image/*)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "bio": "string",
    "profileImage": "string (URL)",
    "verified": false
  }
}
```

#### POST /api/auth/login

Authenticate user login.

**Request Body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "bio": "string",
    "profileImage": "string (URL)",
    "verified": true
  }
}
```

**Note:** Sets HTTP-only cookie with JWT token.

#### GET /api/auth/me

Get current authenticated user information.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "bio": "string",
    "profileImage": "string (URL)",
    "verified": true
  }
}
```

#### PUT /api/auth/profile

Update user profile information.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Request Body (FormData):**

```json
{
  "username": "string (optional)",
  "bio": "string (optional)",
  "profileImage": "file (optional, image/*)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "bio": "string",
    "profileImage": "string (URL)",
    "verified": true
  }
}
```

#### POST /api/auth/logout

Logout user and invalidate session.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/verify-email

Verify user email address.

**Query Parameters:**

```
token: string (JWT verification token from email)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST /api/auth/resend-verification

Resend email verification link.

**Request Body:**

```json
{
  "email": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### Chat Endpoints

#### POST /api/chats/message

Send a message and get AI response.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Request Body (FormData):**

```json
{
  "message": "string (required)",
  "chatId": "string (optional, creates new chat if not provided)",
  "file": "file (optional, PDF or image)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "AI response message",
  "chatId": "string",
  "type": "text|image|pdf|email",
  "data": {
    // Additional data based on type
    // For images: { "imageUrl": "string" }
    // For PDFs: { "summary": "string", "fileUrl": "string" }
  }
}
```

#### GET /api/chats

Get all chats for authenticated user.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Response (200):**

```json
{
  "success": true,
  "chats": [
    {
      "id": "string",
      "title": "string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ]
}
```

#### GET /api/chats/:chatId/messages

Get all messages for a specific chat.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Parameters:**

- `chatId`: string (URL parameter)

**Response (200):**

```json
{
  "success": true,
  "messages": [
    {
      "id": "string",
      "content": "string",
      "role": "user|assistant",
      "createdAt": "ISO date string",
      "type": "text|image|pdf|email",
      "data": {
        // Additional metadata
      }
    }
  ]
}
```

#### DELETE /api/chats/:chatId

Delete a specific chat and all its messages.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Parameters:**

- `chatId`: string (URL parameter)

**Response (200):**

```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

#### PUT /api/chats/:chatId/rename

Rename a chat.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Parameters:**

- `chatId`: string (URL parameter)

**Request Body:**

```json
{
  "title": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Chat renamed successfully",
  "chat": {
    "id": "string",
    "title": "string",
    "updatedAt": "ISO date string"
  }
}
```

#### DELETE /api/chats/clear-all

Delete all chats for authenticated user.

**Headers:**

```
Cookie: jwt=your-jwt-token
```

**Response (200):**

```json
{
  "success": true,
  "message": "All chats cleared successfully"
}
```

### Error Response Format

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type (optional)",
  "details": {} // Additional error details (optional)
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing JWT)
- `403`: Forbidden (unverified email, etc.)
- `404`: Not Found
- `409`: Conflict (email already exists)
- `500`: Internal Server Error

### Authentication Notes

- All protected endpoints require a valid JWT token in the `jwt` cookie
- Tokens are HTTP-only and expire after a configured time
- Invalid tokens return 401 status
- User email must be verified before accessing chat features

### File Upload Limits

- Profile images: 5MB max, image/\* types only
- Chat files: 5MB max, PDF and image/\* types only
- Files are uploaded to ImageKit CDN and URLs are returned

### Rate Limiting

- Authentication endpoints: 10 requests per 15 minutes per IP
- Chat endpoints: 100 requests per hour per user
- File uploads: 20 uploads per hour per user

## 📞 Support

For issues related to the backend, please check the main project repository.
