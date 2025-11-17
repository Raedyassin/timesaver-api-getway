# 🚀 app-gateway

### Main Backend API Gateway (NestJS)

The **app-gateway** service is the primary backend for the platform. It handles authentication, user accounts, database operations, and communication with the AI microservice (`ai-engine`). This is the **only backend** that the frontend interacts with.

---

## 📌 Features

* User authentication (JWT)
* Connects to the AI service for summaries & Q&A
* Manages database operations
* Validates and processes all frontend requests
* Global error handling, rate limiting, validation

---

## 🔗 Communication with AI Engine

The gateway communicates with the FastAPI-based AI service.

### Example request

```
POST http://ai-engine:8000/summarize
{
  "video_id": "..."
}
```

### Example response

```
{
  "summary": "..."
}
```

---

## 🚀 Setup

---

## 🧩 Modules Overview

### Auth Module

* Sign up / Login
* JWT token management
* Password reset support

### Users Module

* Profiles
* User settings
* Usage statistics

### Summaries Module

* Stores summaries
* User request history

### AI-Agent Module

* Sends transcript to AI engine
* Receives summary / Q&A responses
* Returns formatted data to frontend

---

## 📦 API Example

### POST /summaries/create

```
{
  "videoUrl": "https://youtu.be/12345"
}
```

### Response

```
{
  "summaryId": "123",
  "summary": "...",
  "createdAt": "2025-01-01"
}
```

---
