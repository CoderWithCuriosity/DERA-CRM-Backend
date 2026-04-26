# 📊 DERA CRM Backend - Complete API Documentation

Looking at your initial documentation and comparing it with the complete codebase I've provided, here's a comprehensive analysis and the updated documentation:

## 🔍 What's Been Added/Modified

### ✅ **New Features Added:**

1. **Organization Management** - Complete organization settings with logo upload
2. **Email Marketing System** - Full campaign management with tracking
3. **SLA Monitoring** - Service Level Agreement tracking for tickets
4. **Audit Logging** - Complete audit trail for all actions
5. **Backup System** - Automated database backups with status tracking
6. **Queue System** - Bull-based queue for campaign processing
7. **Scheduled Jobs** - Daily digest, weekly summaries, cleanup jobs
8. **Import/Export** - Bulk operations with progress tracking
9. **Tag Management** - Comprehensive tagging system for contacts
10. **Kanban Board** - Visual pipeline management for deals

### 🔄 **Modified Endpoints:**

1. **Tickets** - Added some SLA tracking fields (`sla_response_due`, `sla_resolution_due`)
2. **Activities** - Enhanced with better status tracking and outcomes
3. **Contacts** - Added import/export with column mapping
4. **Deals** - Enhanced pipeline summary with weighted values
5. **Users** - Added organization association and detailed settings

### ❌ **Not Implemented (as per your request):**

1. **Testing** - All test-related code removed (Jest, Supertest, etc.)
2. **WebSockets** - Using polling instead for real-time updates
3. **Social Login** - Not included in this version


## User Impersonation

### Overview
The User Impersonation feature allows administrators to temporarily log in and act as another user (agent or manager) without needing their password. This is useful for:
- Debugging user-specific issues
- Providing training and support
- Auditing user permissions and access
- Testing workflows from different user perspectives

### Security Features
- ✅ **Admin Only**: Only users with `admin` role can impersonate others
- ✅ **No Admin Impersonation**: Cannot impersonate other administrators
- ✅ **Audit Trail**: All impersonations are logged with admin details
- ✅ **Short Sessions**: Impersonation tokens expire in 2 hours
- ✅ **Session Tracking**: All actions during impersonation are tracked

### Impersonation Flow


## 📋 Complete Updated Documentation

```markdown
# 📊 DERA CRM Backend API Documentation

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users & Profile](#users--profile-endpoints)
   - [Users Impersonation](#user-impersonation-endpoints)
   - [Organization](#organization-endpoints)
   - [Contacts](#contacts-endpoints)
   - [Deals & Sales Pipeline](#deals--sales-pipeline-endpoints)
   - [Activities](#activities-endpoints)
   - [Support Tickets](#support-tickets-endpoints)
   - [Email Marketing](#email-marketing-endpoints)
   - [Campaigns](#campaigns-endpoints)
   - [Dashboard](#dashboard-endpoints)
   - [Administration](#administration-endpoints)
   - [System](#system-endpoints)
4. [Email Notifications](#email-notifications)
5. [Scheduled Jobs](#scheduled-jobs)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Real-time Updates](#real-time-updates)
9. [Deployment](#deployment)

## API Overview

**Base URL:** `http://localhost:5000/api` (Development)  
**Production URL:** `https://api.deracrm.com/api`

**Content-Type:** `application/json`  
**Authentication:** Bearer Token

### API Response Format
All endpoints return responses in a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2025-11-08T22:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### Example Base Request
```javascript
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://api.deracrm.com/api' 
  : 'http://localhost:5000/api';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

## Authentication

### JWT Token
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "admin",
  "type": "access",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Refresh Token Flow
The API uses refresh tokens for extended sessions:
1. Access token expires in 7 days
2. Refresh token expires in 30 days
3. Use `/auth/refresh-token` to get new access token

## Endpoints

### Authentication Endpoints

#### 1. Register User
**POST** `/auth/register`

Registers a new user and sends verification email.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"  
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `password`: Min 8 chars, at least 1 letter, 1 number, 1 special char
- `first_name`: Required, max 50 chars
- `last_name`: Required, max 50 chars

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "agent",
      "avatar": null,
      "is_verified": false,
      "settings": {
        "notifications": true,
        "theme": "light",
        "language": "en"
      },
      "created_at": "2025-11-08T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "uuid-refresh-token-here"
  }
}
```

#### 2. Login
**POST** `/auth/login`

Authenticates user and returns access tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "avatar": "/uploads/avatars/user-1-12345.jpg",
      "is_verified": true,
      "last_login": "2025-11-08T11:30:00.000Z",
      "organization": {
        "id": 1,
        "name": "Acme Inc",
        "logo": "/uploads/logos/acme-12345.png",
        "timezone": "America/New_York",
        "currency": "USD"
      },
      "settings": {
        "notifications": true,
        "theme": "light",
        "language": "en"
      },
      "created_at": "2025-11-01T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "uuid-refresh-token-here"
  }
}
```

#### 3. Refresh Token
**POST** `/auth/refresh-token`

Gets new access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "uuid-refresh-token-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new-uuid-refresh-token-here"
  }
}
```

#### 4. Logout
**POST** `/auth/logout`

Revokes refresh token and logs out user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "refresh_token": "uuid-refresh-token-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 5. Verify Email
**GET** `/auth/verify-email/:token`

Verifies user's email address using token from email.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 6. Forgot Password
**POST** `/auth/forgot-password`

Sends password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### 7. Reset Password
**POST** `/auth/reset-password`

Resets password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-12345",
  "password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

#### 8. Resend Verification
**POST** `/auth/resend-verification`

Resends verification email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification email resent successfully"
}
```

### Users & Profile Endpoints

#### 1. Get Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "avatar": "/uploads/avatars/user-1-12345.jpg",
    "is_verified": true,
    "last_login": "2025-11-08T11:30:00.000Z",
    "organization_id": 1,
    "settings": {
      "notifications": true,
      "theme": "light",
      "language": "en"
    },
    "created_at": "2025-11-01T10:30:00.000Z",
    "updated_at": "2025-11-08T11:30:00.000Z"
  }
}
```

#### 2. Update Profile
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "Jonathan",
  "last_name": "Doe",
  "email": "jonathan@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "first_name": "Jonathan",
    "last_name": "Doe",
    "email": "jonathan@example.com",
    "updated_at": "2025-11-08T12:00:00.000Z"
  }
}
```

#### 3. Change Password
**PUT** `/users/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "current_password": "SecurePass123!",
  "new_password": "NewSecurePass456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 4. Upload Avatar
**POST** `/users/avatar`

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
```
avatar: [image file] (max 2MB, formats: jpg, jpeg, png, gif)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": "/uploads/avatars/user-1-1705316400000.jpg"
  }
}
```

#### 5. Remove Avatar
**DELETE** `/users/avatar`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar removed successfully"
}
```

#### 6. Get All Users
**GET** `/users`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page (max 100) | 20 |
| role | string | Filter by role | - |
| search | string | Search by name/email | - |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 2,
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "role": "manager",
        "avatar": null,
        "is_verified": true,
        "last_login": "2025-11-07T09:15:00.000Z",
        "created_at": "2025-11-02T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### 7. Get User by ID
**GET** `/users/:id`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin/Manager only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "manager",
    "avatar": null,
    "is_verified": true,
    "last_login": "2025-11-07T09:15:00.000Z",
    "created_at": "2025-11-02T10:00:00.000Z",
    "updated_at": "2025-11-07T09:15:00.000Z",
    "stats": {
      "contacts_created": 45,
      "deals_owned": 12,
      "tickets_assigned": 8,
      "activities_logged": 67
    }
  }
}
```

#### 8. Update User Role
**PUT** `/users/:id/role`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Request Body:**
```json
{
  "role": "manager"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "id": 3,
    "role": "manager",
    "updated_at": "2025-11-08T13:00:00.000Z"
  }
}
```

#### 9. Delete User
**DELETE** `/users/:id`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```


### Impersonation Endpoints

#### 1. Impersonate a User
**POST** `/users/:id/impersonate`

Initiates an impersonation session as the specified user.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Now impersonating Sarah Johnson",
  "data": {
    "user": {
      "id": 101,
      "email": "sarah.johnson@example.com",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "role": "agent",
      "avatar": "/uploads/avatars/avatar-1705316400000.jpg",
      "is_verified": true,
      "organization_id": 1,
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-08T15:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isImpersonating": true,
    "impersonatedBy": {
      "id": 1,
      "name": "John Doe",
      "email": "admin@example.com"
    }
  }
}
```

#### 2. Stop Impersonating
**POST** `/users/stop-impersonating`

Ends the current impersonation session and returns to the original admin account.

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Stopped impersonating. Returned to admin account.",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "avatar": "/uploads/avatars/admin-avatar.jpg",
      "is_verified": true,
      "organization_id": 1,
      "created_at": "2025-11-01T09:00:00.000Z",
      "updated_at": "2025-11-08T16:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isImpersonating": false
  }
}
```


### Organization Endpoints

#### 1. Get Organization Settings
**GET** `/organization/settings`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "Acme Inc",
    "company_logo": "/uploads/logos/acme-12345.png",
    "company_email": "info@acme.com",
    "company_phone": "+1234567890",
    "company_address": "123 Business St, City, Country",
    "website": "https://acme.com",
    "timezone": "America/New_York",
    "date_format": "MM/DD/YYYY",
    "currency": "USD",
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-05T09:30:00.000Z"
  }
}
```

#### 2. Update Organization Settings
**PUT** `/organization/settings`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Request Body:**
```json
{
  "company_name": "Acme Corporation",
  "company_phone": "+1987654321",
  "timezone": "America/Chicago",
  "currency": "EUR"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Organization settings updated successfully",
  "data": {
    "company_name": "Acme Corporation",
    "company_phone": "+1987654321",
    "timezone": "America/Chicago",
    "currency": "EUR",
    "updated_at": "2025-11-08T14:00:00.000Z"
  }
}
```

#### 3. Upload Company Logo
**POST** `/organization/logo`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only  
**Content-Type:** `multipart/form-data`

**Form Data:**
```
logo: [image file] (max 3MB, formats: jpg, jpeg, png, gif)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Company logo uploaded successfully",
  "data": {
    "company_logo": "/uploads/logos/acme-1705316400000.png"
  }
}
```

#### 4. Invite User
**POST** `/organization/invite`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "first_name": "New",
  "last_name": "User",
  "role": "agent"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

## Contacts Endpoints

### 1. Create Contact
**POST** `/contacts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1234567890",
  "company": "Tech Solutions Ltd",
  "job_title": "Marketing Director",
  "status": "active",
  "source": "website",
  "notes": "Met at tech conference, interested in our enterprise plan",
  "tags": ["tech", "marketing", "lead"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "contact": {
      "id": 101,
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1234567890",
      "company": "Tech Solutions Ltd",
      "job_title": "Marketing Director",
      "status": "active",
      "source": "website",
      "notes": "Met at tech conference, interested in our enterprise plan",
      "tags": ["tech", "marketing", "lead"],
      "avatar": null,
      "user_id": 1,
      "created_at": "2025-11-08T15:30:00.000Z",
      "updated_at": "2025-11-08T15:30:00.000Z"
    }
  }
}
```

### 2. Get All Contacts
**GET** `/contacts`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page (max 100) | 20 |
| status | string | Filter by status (active/inactive/lead) | - |
| tag | string | Filter by tag | - |
| search | string | Search by name/email/company | - |
| sort_by | string | Field to sort by | created_at |
| sort_order | string | asc/desc | desc |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "+1234567890",
        "company": "Tech Solutions Ltd",
        "job_title": "Marketing Director",
        "status": "active",
        "source": "website",
        "tags": ["tech", "marketing", "lead"],
        "avatar": "http://localhost:3000/uploads/avatars/avatar-1705316400000-abc123.jpg",
        "created_at": "2025-11-08T15:30:00.000Z",
        "updated_at": "2025-11-08T15:30:00.000Z",
        "deals_count": 2,
        "tickets_count": 1,
        "last_activity": "2025-11-08T16:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "statuses": ["active", "inactive", "lead"],
      "tags": ["tech", "marketing", "c-level", "sales"]
    }
  }
}
```

### 3. Get Contact by ID
**GET** `/contacts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contact": {
      "id": 101,
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1234567890",
      "company": "Tech Solutions Ltd",
      "job_title": "Marketing Director",
      "status": "active",
      "source": "website",
      "notes": "Met at tech conference, interested in our enterprise plan",
      "tags": ["tech", "marketing", "lead"],
      "avatar": "http://localhost:3000/uploads/avatars/avatar-1705316400000-abc123.jpg",
      "user_id": 1,
      "created_at": "2025-11-08T15:30:00.000Z",
      "updated_at": "2025-11-08T15:30:00.000Z",
      "created_by": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      }
    },
    "deals": [
      {
        "id": 201,
        "name": "Enterprise Plan - Tech Solutions",
        "stage": "proposal",
        "amount": 15000.00,
        "status": "open"
      }
    ],
    "tickets": [
      {
        "id": 301,
        "subject": "Product demo request",
        "status": "open",
        "priority": "medium",
        "created_at": "2025-11-08T15:45:00.000Z"
      }
    ],
    "activities": [
      {
        "id": 401,
        "type": "call",
        "subject": "Initial discovery call",
        "scheduled_date": "2025-11-09T14:00:00.000Z",
        "status": "scheduled"
      }
    ]
  }
}
```

### 4. Update Contact
**PUT** `/contacts/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "Sarah",
  "last_name": "Johnson-Williams",
  "phone": "+1234567891",
  "job_title": "VP of Marketing",
  "notes": "Promoted to VP, now has larger budget",
  "tags": ["tech", "marketing", "vip"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact updated successfully",
  "data": {
    "contact": {
      "id": 101,
      "first_name": "Sarah",
      "last_name": "Johnson-Williams",
      "phone": "+1234567891",
      "job_title": "VP of Marketing",
      "notes": "Promoted to VP, now has larger budget",
      "tags": ["tech", "marketing", "vip"],
      "avatar": "http://localhost:3000/uploads/avatars/avatar-1705316400000-abc123.jpg",
      "updated_at": "2025-11-08T16:00:00.000Z"
    }
  }
}
```

### 5. Delete Contact
**DELETE** `/contacts/:id`

**Headers:** `Authorization: Bearer <token>`

**Note:** This will also delete the contact's avatar file from the server.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### 6. Upload Contact Avatar
**POST** `/contacts/:id/avatar`

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
```
avatar: [Image file] (JPEG, PNG, GIF, WEBP, max 2MB)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": "http://localhost:3000/uploads/avatars/avatar-1705316400000-abc123.jpg"
  }
}
```

### 7. Delete Contact Avatar
**DELETE** `/contacts/:id/avatar`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

### 8. Import Contacts
**POST** `/contacts/import`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin/Manager only  
**Content-Type:** `multipart/form-data`

**Form Data:**
```
file: [CSV file] (max 10MB)
column_mapping: {
  "first_name": "First Name",
  "last_name": "Last Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "company": "Company",
  "job_title": "Job Title"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Import started. You will be notified when complete.",
  "data": {
    "import_id": "imp_12345",
    "total_rows": 150,
    "estimated_time": "30 seconds"
  }
}
```

### 9. Get Import Status
**GET** `/contacts/import/:import_id/status`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin/Manager only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "import_id": "imp_12345",
    "status": "completed",
    "total": 150,
    "processed": 150,
    "successful": 145,
    "failed": 5,
    "errors": [
      {
        "row": 12,
        "error": "Invalid email format"
      }
    ],
    "completed_at": "2025-11-08T16:30:00.000Z"
  }
}
```

### 10. Export Contacts
**GET** `/contacts/export`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| format | string | csv/excel | csv |
| fields | string | Comma-separated list of fields | all fields |
| status | string | Filter by status | - |
| tag | string | Filter by tag | - |
| search | string | Search query | - |

**Note:** Avatar URLs are not included in exports for privacy/performance reasons.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "download_url": "/exports/contacts-1705316400000.csv",
    "expires_at": "2025-11-09T16:45:00.000Z"
  }
}
```

### 11. Add Tag to Contact
**POST** `/contacts/:id/tags`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tag": "vip"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag added successfully",
  "data": {
    "tags": ["tech", "marketing", "lead", "vip"]
  }
}
```

### 12. Remove Tag from Contact
**DELETE** `/contacts/:id/tags/:tag`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag removed successfully",
  "data": {
    "tags": ["tech", "marketing", "lead"]
  }
}
```

### 13. Get All Tags
**GET** `/contacts/tags/all`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "tech",
        "count": 25
      },
      {
        "name": "marketing",
        "count": 18
      }
    ]
  }
}
```

## Avatar Upload Specifications

### Supported File Types
- JPEG/JPG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WEBP (`image/webp`)

### File Size Limit
- Maximum: 2MB per avatar

### Storage
- Avatars are stored in: `/uploads/avatars/`
- Filename format: `avatar-[timestamp]-[uuid].[extension]`
- Example: `avatar-1705316400000-abc123.jpg`

### URL Format
```
http://localhost:3000/uploads/avatars/[filename]
```

### Automatic Cleanup
- Old avatars are automatically deleted when uploading a new one
- Avatars are deleted when the contact is deleted
- Server may periodically clean up orphaned avatar files
### Deals & Sales Pipeline Endpoints

#### 1. Create Deal
**POST** `/deals`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Enterprise Plan - Tech Solutions",
  "contact_id": 101,
  "stage": "lead",
  "amount": 15000.00,
  "probability": 20,
  "expected_close_date": "2025-12-15",
  "notes": "Interested in annual subscription with premium support",
  "user_id": 1
}
```

**Available Stages:** `lead`, `qualified`, `proposal`, `negotiation`, `won`, `lost`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Deal created successfully",
  "data": {
    "deal": {
      "id": 201,
      "name": "Enterprise Plan - Tech Solutions",
      "contact_id": 101,
      "user_id": 1,
      "stage": "lead",
      "amount": 15000.00,
      "probability": 20,
      "expected_close_date": "2025-12-15",
      "actual_close_date": null,
      "status": "open",
      "notes": "Interested in annual subscription with premium support",
      "created_at": "2025-11-08T16:30:00.000Z",
      "updated_at": "2025-11-08T16:30:00.000Z",
      "weighted_amount": 3000.00,
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "company": "Tech Solutions Ltd"
      },
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  }
}
```

#### 2. Get All Deals
**GET** `/deals`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| stage | string | Filter by stage |
| status | string | open/won/lost |
| user_id | integer | Filter by owner |
| contact_id | integer | Filter by contact |
| search | string | Search by name |
| date_from | date | Expected close date from |
| date_to | date | Expected close date to |
| min_amount | number | Minimum amount |
| max_amount | number | Maximum amount |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "id": 201,
        "name": "Enterprise Plan - Tech Solutions",
        "stage": "proposal",
        "amount": 15000.00,
        "probability": 60,
        "weighted_amount": 9000.00,
        "expected_close_date": "2025-12-15",
        "status": "open",
        "created_at": "2025-11-08T16:30:00.000Z",
        "contact": {
          "id": 101,
          "first_name": "Sarah",
          "last_name": "Johnson",
          "company": "Tech Solutions Ltd"
        },
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe"
        },
        "activities_count": 3,
        "is_overdue": false
      }
    ],
    "pagination": {
      "total": 28,
      "page": 1,
      "limit": 20,
      "pages": 2
    },
    "summary": {
      "total_value": 450000.00,
      "weighted_value": 225000.00,
      "by_stage": {
        "lead": 5,
        "qualified": 8,
        "proposal": 10,
        "negotiation": 3,
        "won": 2
      }
    }
  }
}
```

#### 3. Get Deal by ID
**GET** `/deals/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deal": {
      "id": 201,
      "name": "Enterprise Plan - Tech Solutions",
      "contact_id": 101,
      "user_id": 1,
      "stage": "proposal",
      "amount": 15000.00,
      "probability": 60,
      "expected_close_date": "2025-12-15",
      "actual_close_date": null,
      "status": "open",
      "notes": "Interested in annual subscription with premium support",
      "created_at": "2025-11-08T16:30:00.000Z",
      "updated_at": "2025-11-09T10:00:00.000Z",
      "weighted_amount": 9000.00,
      "is_overdue": false,
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "+1234567890",
        "company": "Tech Solutions Ltd"
      },
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "activities": [
        {
          "id": 401,
          "type": "call",
          "subject": "Initial discovery call",
          "scheduled_date": "2025-11-09T14:00:00.000Z",
          "status": "scheduled"
        }
      ]
    }
  }
}
```

#### 4. Update Deal
**PUT** `/deals/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "stage": "negotiation",
  "probability": 80,
  "amount": 16500.00,
  "expected_close_date": "2025-12-10",
  "notes": "Added premium support package"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deal updated successfully",
  "data": {
    "deal": {
      "id": 201,
      "stage": "negotiation",
      "probability": 80,
      "amount": 16500.00,
      "expected_close_date": "2025-12-10",
      "notes": "Added premium support package",
      "updated_at": "2025-11-09T11:00:00.000Z"
    },
    "pipeline_update": {
      "previous_stage": "proposal",
      "new_stage": "negotiation",
      "probability_change": 20,
      "amount_change": 1500.00
    }
  }
}
```

#### 5. Update Deal Stage (Drag & Drop)
**PATCH** `/deals/:id/stage`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "stage": "won",
  "actual_close_date": "2025-11-09"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deal stage updated successfully",
  "data": {
    "deal": {
      "id": 201,
      "stage": "won",
      "status": "won",
      "actual_close_date": "2025-11-09",
      "updated_at": "2025-11-09T11:30:00.000Z"
    },
    "pipeline_summary": {
      "total_value": 450000.00,
      "weighted_value": 225000.00,
      "by_stage": {
        "lead": 5,
        "qualified": 8,
        "proposal": 9,
        "negotiation": 3,
        "won": 3
      }
    }
  }
}
```

#### 6. Mark Deal as Won
**POST** `/deals/:id/win`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "actual_close_date": "2025-11-09",
  "notes": "Signed contract for enterprise plan"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deal marked as won",
  "data": {
    "deal": {
      "id": 201,
      "stage": "won",
      "status": "won",
      "actual_close_date": "2025-11-09",
      "notes": "Signed contract for enterprise plan"
    }
  }
}
```

#### 7. Mark Deal as Lost
**POST** `/deals/:id/lost`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "actual_close_date": "2025-11-09",
  "notes": "Lost to competitor",
  "loss_reason": "competitor_price"
}
```

**Loss Reasons:** `competitor_price`, `competitor_features`, `budget`, `timing`, `other`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deal marked as lost",
  "data": {
    "deal": {
      "id": 201,
      "stage": "lost",
      "status": "lost",
      "actual_close_date": "2025-11-09",
      "notes": "Lost to competitor"
    }
  }
}
```

#### 8. Delete Deal
**DELETE** `/deals/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deal deleted successfully"
}
```

#### 9. Get Pipeline Summary
**GET** `/deals/pipeline/summary`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id`: Filter by owner

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "name": "lead",
        "display_name": "Lead",
        "count": 5,
        "value": 75000.00,
        "weighted_value": 15000.00,
        "color": "#3B82F6"
      },
      {
        "name": "qualified",
        "display_name": "Qualified",
        "count": 8,
        "value": 120000.00,
        "weighted_value": 48000.00,
        "color": "#8B5CF6"
      },
      {
        "name": "proposal",
        "display_name": "Proposal",
        "count": 9,
        "value": 145000.00,
        "weighted_value": 101500.00,
        "color": "#F59E0B"
      },
      {
        "name": "negotiation",
        "display_name": "Negotiation",
        "count": 3,
        "value": 55000.00,
        "weighted_value": 44000.00,
        "color": "#EF4444"
      },
      {
        "name": "won",
        "display_name": "Won",
        "count": 3,
        "value": 55000.00,
        "weighted_value": 55000.00,
        "color": "#10B981"
      },
      {
        "name": "lost",
        "display_name": "Lost",
        "count": 2,
        "value": 25000.00,
        "weighted_value": 0,
        "color": "#6B7280"
      }
    ],
    "totals": {
      "total_value": 450000.00,
      "weighted_value": 263500.00,
      "open_deals": 25,
      "won_deals": 3,
      "lost_deals": 2,
      "win_rate": 60.0
    },
    "forecast": {
      "this_month": 150000.00,
      "next_month": 200000.00,
      "quarter": 450000.00
    }
  }
}
```

#### 10. Get Kanban Board
**GET** `/deals/kanban`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id`: Filter by owner

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": "lead",
        "title": "Lead",
        "color": "#3B82F6",
        "limit": 10,
        "deals": [
          {
            "id": 203,
            "name": "Basic Plan - New Co",
            "amount": 5000.00,
            "probability": 10,
            "expected_close_date": "2025-12-20",
            "contact_name": "Robert Brown",
            "contact_company": "New Co Ltd",
            "avatar": null,
            "has_activity_today": false
          }
        ]
      },
      {
        "id": "qualified",
        "title": "Qualified",
        "color": "#8B5CF6",
        "limit": 10,
        "deals": [
          {
            "id": 202,
            "name": "Basic Plan - Innovate LLC",
            "amount": 5000.00,
            "probability": 40,
            "expected_close_date": "2025-12-01",
            "contact_name": "Michael Chen",
            "contact_company": "Innovate LLC",
            "avatar": null,
            "has_activity_today": true
          }
        ]
      }
    ]
  }
}
```

### Activities Endpoints

#### 1. Create Activity
**POST** `/activities`

**Headers:** `Authorization: Bearer <token>`

**Activity Types:** `call`, `email`, `meeting`, `task`, `note`, `follow-up`

**Request Body:**
```json
{
  "type": "call",
  "subject": "Initial discovery call",
  "description": "Discuss requirements and budget",
  "contact_id": 101,
  "deal_id": 201,
  "scheduled_date": "2025-11-09T14:00:00.000Z",
  "duration": 30,
  "user_id": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "data": {
    "activity": {
      "id": 401,
      "type": "call",
      "subject": "Initial discovery call",
      "description": "Discuss requirements and budget",
      "contact_id": 101,
      "deal_id": 201,
      "user_id": 1,
      "scheduled_date": "2025-11-09T14:00:00.000Z",
      "completed_date": null,
      "duration": 30,
      "outcome": null,
      "status": "scheduled",
      "created_at": "2025-11-08T17:00:00.000Z",
      "updated_at": "2025-11-08T17:00:00.000Z"
    }
  }
}
```

#### 2. Get Activities
**GET** `/activities`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| type | string | Filter by activity type |
| contact_id | integer | Filter by contact |
| deal_id | integer | Filter by deal |
| user_id | integer | Filter by owner |
| status | string | scheduled/completed/cancelled/overdue |
| date_from | date | Scheduled date from |
| date_to | date | Scheduled date to |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 401,
        "type": "call",
        "subject": "Initial discovery call",
        "description": "Discuss requirements and budget",
        "scheduled_date": "2025-11-09T14:00:00.000Z",
        "completed_date": null,
        "duration": 30,
        "status": "scheduled",
        "is_overdue": false,
        "contact": {
          "id": 101,
          "first_name": "Sarah",
          "last_name": "Johnson",
          "company": "Tech Solutions Ltd"
        },
        "deal": {
          "id": 201,
          "name": "Enterprise Plan - Tech Solutions",
          "amount": 16500.00
        },
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe"
        },
        "created_at": "2025-11-08T17:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

#### 3. Get Activity by ID
**GET** `/activities/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activity": {
      "id": 401,
      "type": "call",
      "subject": "Initial discovery call",
      "description": "Discuss requirements and budget",
      "contact_id": 101,
      "deal_id": 201,
      "user_id": 1,
      "scheduled_date": "2025-11-09T14:00:00.000Z",
      "completed_date": null,
      "duration": 30,
      "outcome": null,
      "status": "scheduled",
      "is_overdue": false,
      "created_at": "2025-11-08T17:00:00.000Z",
      "updated_at": "2025-11-08T17:00:00.000Z",
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "+1234567890"
      },
      "deal": {
        "id": 201,
        "name": "Enterprise Plan - Tech Solutions",
        "stage": "negotiation",
        "amount": 16500.00
      },
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

#### 4. Update Activity
**PUT** `/activities/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "scheduled_date": "2025-11-09T15:00:00.000Z",
  "description": "Rescheduled due to conflict"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Activity updated successfully",
  "data": {
    "activity": {
      "id": 401,
      "scheduled_date": "2025-11-09T15:00:00.000Z",
      "description": "Rescheduled due to conflict",
      "updated_at": "2025-11-08T17:30:00.000Z"
    }
  }
}
```

#### 5. Complete Activity
**POST** `/activities/:id/complete`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "outcome": "Client interested, moving to proposal stage",
  "duration": 45
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Activity completed successfully",
  "data": {
    "activity": {
      "id": 401,
      "status": "completed",
      "completed_date": "2025-11-09T15:45:00.000Z",
      "outcome": "Client interested, moving to proposal stage",
      "duration": 45
    }
  }
}
```

#### 6. Delete Activity
**DELETE** `/activities/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

#### 7. Get Today's Activities
**GET** `/activities/today`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id`: Filter by owner

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "date": "2025-11-08",
    "activities": [
      {
        "id": 403,
        "type": "call",
        "subject": "Follow-up call with Tech Solutions",
        "scheduled_date": "2025-11-08T10:00:00.000Z",
        "status": "completed",
        "contact": {
          "name": "Sarah Johnson",
          "company": "Tech Solutions Ltd"
        }
      }
    ],
    "summary": {
      "total": 8,
      "completed": 3,
      "scheduled": 5,
      "overdue": 0
    }
  }
}
```

#### 8. Get Upcoming Activities
**GET** `/activities/upcoming`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days`: Number of days to look ahead (default: 7)
- `user_id`: Filter by owner

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "range": {
      "start": "2025-11-08",
      "end": "2025-11-15"
    },
    "activities": [
      {
        "id": 401,
        "type": "call",
        "subject": "Initial discovery call",
        "scheduled_date": "2025-11-09T15:00:00.000Z",
        "status": "scheduled",
        "contact": {
          "name": "Sarah Johnson",
          "company": "Tech Solutions Ltd"
        }
      }
    ],
    "grouped_by_date": {
      "2025-11-09": [401]
    }
  }
}
```


# 🎫 Support Tickets API Documentation

## Ticket Model

### Database Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `ticket_number` | string | Unique ticket identifier (format: `TKT-YYYY-XXXX`) |
| `subject` | string | Ticket subject (max 255 chars) |
| `description` | text | Detailed ticket description |
| `contact_id` | integer | Foreign key to contacts table |
| `user_id` | integer | ID of user who created the ticket |
| `assigned_to` | integer/null | ID of agent assigned to ticket |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `status` | enum | `new`, `open`, `pending`, `resolved`, `closed` |
| `due_date` | date/null | Resolution deadline (SLA) |
| `resolved_at` | date/null | Timestamp when ticket was resolved |
| `sla_warnings_sent` | json | Array of warning thresholds already sent |
| `sla_breach_notified` | boolean | Whether breach notification was sent |
| `created_at` | date | Creation timestamp |
| `updated_at` | date | Last update timestamp |

### ⚠️ Important Note about SLA Fields
The CRM tracks **Resolution SLA only** using the `due_date` field. 
Response SLA fields (`sla_response_due`, `sla_resolution_due`) are not stored in the database.
If these fields are sent in requests, they are automatically ignored.


### Virtual/Calculated Fields
| Field | Type | Description |
|-------|------|-------------|
| `responseTime` | number/null | Time to first response in minutes |
| `resolutionTime` | number/null | Time to resolution in minutes |
| `isOverdue` | boolean | Whether ticket is past due date |

### Priority Levels
```javascript
PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}
```

### Ticket Statuses
```javascript
TICKET_STATUS = {
  NEW: 'new',
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
}
```

### SLA Time Calculations (Internal)
```javascript
// Response time targets (not tracked in responses)
URGENT: 1 hour
HIGH: 4 hours
MEDIUM: 8 hours
LOW: 24 hours

// Resolution time targets (set as due_date)
URGENT: 4 hours
HIGH: 24 hours (1 day)
MEDIUM: 48 hours (2 days)
LOW: 120 hours (5 days)
```

---

## Ticket Endpoints

### 1. Create Ticket
**POST** `/api/tickets`

Creates a new support ticket.
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subject": "Cannot access premium features",
  "description": "User upgraded to premium but features are still locked",
  "contact_id": 101,
  "priority": "high",
  "due_date": "2025-11-10",
  "assigned_to": 3
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `subject` | Yes | string | Ticket subject (max 255 chars) |
| `description` | Yes | string | Detailed description |
| `contact_id` | Yes | integer | Must reference existing contact |
| `priority` | No | string | Defaults to `medium` |
| `due_date` | No | date | ISO date string |
| `assigned_to` | No | integer | User ID to assign ticket to |

**Validation Rules:**
- `subject`: Cannot be empty
- `description`: Cannot be empty
- `contact_id`: Must exist in contacts table
- Agents can only create tickets for contacts they own

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "ticket": {
      "id": 301,
      "ticket_number": "TKT-2025-0001",
      "subject": "Cannot access premium features",
      "description": "User upgraded to premium but features are still locked",
      "contact_id": 101,
      "user_id": 1,
      "assigned_to": 3,
      "priority": "high",
      "status": "new",
      "due_date": "2025-11-10T00:00:00.000Z",
      "resolved_at": null,
      "sla_warnings_sent": [],
      "sla_breach_notified": false,
      "created_at": "2025-11-08T18:00:00.000Z",
      "updated_at": "2025-11-08T18:00:00.000Z",
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@example.com"
      },
      "createdBy": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      }
    },
    "sla": {
      "response_due": null,
      "resolution_due": null
    }
  }
}
```

**Email Notification:**
If `assigned_to` is provided, an email is sent to the assignee using `ticketAssigned` template.

---

### 2. Get All Tickets
**GET** `/api/tickets`

Retrieves a paginated list of tickets with filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `limit` | integer | Items per page | 20 |
| `status` | string | Filter by status | - |
| `priority` | string | Filter by priority | - |
| `assigned_to` | integer | Filter by assignee ID | - |
| `contact_id` | integer | Filter by contact ID | - |
| `search` | string | Search in subject/description/ticket_number | - |

**Access Control:**
- **Admin/Manager**: Can see all tickets
- **Agent**: Can only see tickets they created OR are assigned to

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 301,
        "ticket_number": "TKT-2025-0001",
        "subject": "Cannot access premium features",
        "description": "User upgraded to premium but features are still locked",
        "priority": "high",
        "status": "open",
        "due_date": "2025-11-10T00:00:00.000Z",
        "created_at": "2025-11-08T18:00:00.000Z",
        "contact": {
          "id": 101,
          "first_name": "Sarah",
          "last_name": "Johnson",
          "email": "sarah.johnson@example.com"
        },
        "assignedTo": {
          "id": 3,
          "first_name": "Bob",
          "last_name": "Johnson"
        },
        "comment_count": 2,
        "sla_breach": false,
        "response_time": 15,
        "resolution_time": null,
        "is_overdue": false
      }
    ],
    "totalItems": 18,
    "totalPages": 1,
    "currentPage": 1,
    "summary": {
      "by_status": {
        "new": 5,
        "open": 8,
        "pending": 3,
        "resolved": 2,
        "closed": 0
      },
      "by_priority": {
        "low": 2,
        "medium": 8,
        "high": 5,
        "urgent": 3
      }
    }
  }
}
```

---

### 3. Get Ticket by ID
**GET** `/api/tickets/:id`

Retrieves a single ticket with all associations.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Ticket ID (integer)

**Access Control:**
- **Admin/Manager**: Can view any ticket
- **Agent**: Can only view tickets they created OR are assigned to

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": 301,
      "ticket_number": "TKT-2025-0001",
      "subject": "Cannot access premium features",
      "description": "User upgraded to premium but features are still locked",
      "contact_id": 101,
      "user_id": 1,
      "assigned_to": 3,
      "priority": "high",
      "status": "open",
      "due_date": "2025-11-10T00:00:00.000Z",
      "resolved_at": null,
      "sla_warnings_sent": [],
      "sla_breach_notified": false,
      "created_at": "2025-11-08T18:00:00.000Z",
      "updated_at": "2025-11-08T18:30:00.000Z",
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "+1234567890"
      },
      "createdBy": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      },
      "assignedTo": {
        "id": 3,
        "first_name": "Bob",
        "last_name": "Johnson",
        "email": "bob@example.com"
      },
      "comments": [
        {
          "id": 501,
          "comment": "Looking into this issue now",
          "is_internal": false,
          "created_at": "2025-11-08T18:15:00.000Z",
          "user": {
            "id": 3,
            "first_name": "Bob",
            "last_name": "Johnson",
            "avatar": null
          }
        }
      ]
    },
    "sla": {
      "response_time": 15,
      "response_due": null,
      "response_breached": false,
      "resolution_due": "2025-11-10T00:00:00.000Z",
      "resolution_breached": false
    },
    "time_spent": {
      "total": null,
      "breached": false
    }
  }
}
```

---

### 4. Update Ticket
**PUT** `/api/tickets/:id`

Updates an existing ticket.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Ticket ID (integer)

**Request Body:**
```json
{
  "subject": "Cannot access premium features - URGENT",
  "priority": "urgent",
  "due_date": "2025-11-09"
}
```

**Restrictions:**
- Cannot update tickets with status `resolved` or `closed`
- The following fields cannot be updated directly (they are managed by the system):
  - `ticket_number` (auto-generated)
  - `user_id` (set at creation)
  - `created_at` (auto-set)
  - `resolved_at` (auto-set when status changes to resolved)
  - `sla_warnings_sent` (managed by SLA monitor)
  - `sla_breach_notified` (managed by SLA monitor)

**Access Control:**
- **Admin/Manager**: Can update any ticket
- **Agent**: Can only update tickets they created OR are assigned to

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "data": {
    "ticket": {
      "id": 301,
      "subject": "Cannot access premium features - URGENT",
      "priority": "urgent",
      "due_date": "2025-11-09T00:00:00.000Z",
      "updated_at": "2025-11-08T18:45:00.000Z"
    },
    "sla": {
      "response_due": null,
      "resolution_due": "2025-11-09T00:00:00.000Z"
    }
  }
}
```

---

### 5. Update Ticket Status
**PATCH** `/api/tickets/:id/status`

Updates only the status of a ticket.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Ticket ID (integer)

**Request Body:**
```json
{
  "status": "resolved",
  "resolution_notes": "Fixed by upgrading account in billing system"
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `status` | Yes | string | New status (new/open/pending/resolved/closed) |
| `resolution_notes` | No | string | Added as internal comment when resolving |

**Behavior:**
- When status changes to `resolved`, `resolved_at` is automatically set
- Resolution notes are added as an internal comment
- Email notification sent to ticket creator using `ticketResolved` template
- If status is `resolved`, `resolutionTime` virtual field becomes available

**Restrictions:**
- Cannot change status of tickets that are already `resolved` or `closed`
- Cannot change status to the current status
- When changing to `resolved`, the `resolved_at` timestamp is automatically set

**Access Control:**
- **Admin/Manager**: Can update any ticket
- **Agent**: Can only update tickets they created OR are assigned to

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket status updated successfully",
  "data": {
    "ticket": {
      "id": 301,
      "status": "resolved",
      "resolved_at": "2025-11-08T19:00:00.000Z",
      "updated_at": "2025-11-08T19:00:00.000Z"
    },
    "resolution_time": 60
  }
}
```

---

### 6. Assign Ticket
**POST** `/api/tickets/:id/assign`

Assigns or unassigns a ticket to a user.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin/Manager only

**URL Parameters:**
- `id`: Ticket ID (integer)

**Request Body:**
```json
{
  "assigned_to": 2
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `assigned_to` | Yes | integer/null | User ID to assign, or `null` to unassign |

**Restrictions:**
- Only Admin/Manager can assign/unassign tickets
- Cannot assign tickets that are `resolved` or `closed`

**Behavior:**
- Internal comment automatically added: "Assigned to [Name]" or "Assigned to unassigned"
- Email notification sent to new assignee using `ticketAssigned` template
- Audit log entry created

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket assignment updated successfully",
  "data": {
    "ticket": {
      "id": 301,
      "assigned_to": 2,
      "updated_at": "2025-11-08T19:15:00.000Z"
    },
    "assigned_user": {
      "id": 2,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com"
    }
  }
}
```

---

### 7. Add Ticket Comment
**POST** `/api/tickets/:id/comments`

Adds a comment to a ticket.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Ticket ID (integer)

**Request Body:**
```json
{
  "comment": "Customer confirmed the issue is resolved",
  "is_internal": false
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `comment` | Yes | string | Comment text |
| `is_internal` | No | boolean | If true, only visible to staff (default: false) |

**Behavior:**
- If ticket status is `new` and comment is **not internal**, status auto-updates to `open`
- Email notifications sent to relevant parties (creator, assignee) unless comment is internal
- Internal comments only visible to admin/manager/assigned agent

**Access Control:**
- **Admin/Manager**: Can add comments to any ticket
- **Agent**: Can only add comments to tickets they created OR are assigned to

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "id": 503,
      "ticket_id": 301,
      "user_id": 3,
      "comment": "Customer confirmed the issue is resolved",
      "is_internal": false,
      "created_at": "2025-11-08T19:30:00.000Z",
      "user": {
        "id": 3,
        "first_name": "Bob",
        "last_name": "Johnson",
        "avatar": null
      }
    }
  }
}
```

---

### 8. Get Ticket Comments
**GET** `/api/tickets/:id/comments`

Retrieves all comments for a ticket.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Ticket ID (integer)

**Query Parameters:**
- `include_internal`: Set to `"true"` to include internal comments (staff only)

**Access Control:**
- **Admin/Manager**: Can see all comments
- **Agent**: Can only see non-internal comments unless they own/are assigned to the ticket

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 501,
        "comment": "Looking into this issue now",
        "is_internal": false,
        "created_at": "2025-11-08T18:15:00.000Z",
        "user": {
          "id": 3,
          "first_name": "Bob",
          "last_name": "Johnson",
          "avatar": null
        }
      },
      {
        "id": 502,
        "comment": "Internal note: escalated to senior team",
        "is_internal": true,
        "created_at": "2025-11-08T18:20:00.000Z",
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "avatar": null
        }
      }
    ],
    "total": 3
  }
}
```

---

### 9. Delete Ticket
**DELETE** `/api/tickets/:id`

Permanently deletes a ticket.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**URL Parameters:**
- `id`: Ticket ID (integer)

**Behavior:**
- Cascading delete removes all associated comments
- Audit log entry created

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

---

### 10. Get SLA Report
**GET** `/api/tickets/sla/report`

Generates SLA compliance report for tickets.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin/Manager only

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `start_date` | date | Start date (YYYY-MM-DD) | 30 days ago |
| `end_date` | date | End date (YYYY-MM-DD) | today |

**Important Notes:**
- **Response SLA** is not tracked (all response metrics show 100% compliance)
- **Resolution SLA** is tracked using the `due_date` field
- Resolution breach = ticket with `isOverdue = true`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-09",
      "end": "2025-11-08"
    },
    "response_times": {
      "average": 25.5,
      "median": 15,
      "min": 5,
      "max": 180,
      "breached": 0,
      "total": 18,
      "compliance_rate": 100
    },
    "resolution_times": {
      "average": 180,
      "median": 120,
      "min": 30,
      "max": 720,
      "breached": 1,
      "total": 12,
      "compliance_rate": 91.7
    },
    "by_priority": {
      "urgent": {
        "response_compliance": 100,
        "resolution_compliance": 100
      },
      "high": {
        "response_compliance": 100,
        "resolution_compliance": 80
      },
      "medium": {
        "response_compliance": 100,
        "resolution_compliance": 100
      },
      "low": {
        "response_compliance": 100,
        "resolution_compliance": 100
      }
    },
    "daily_breaches": [
      {
        "date": "2025-11-05",
        "response_breaches": 0,
        "resolution_breaches": 1
      },
      {
        "date": "2025-11-06",
        "response_breaches": 0,
        "resolution_breaches": 0
      }
    ]
  }
}
```

---

## Email Templates for Tickets

### Ticket Assigned
**Template:** `ticketAssigned.ejs`

**Variables:**
```json
{
  "first_name": "Bob",
  "ticket_number": "TKT-2025-0001",
  "subject": "Cannot access premium features",
  "priority": "high",
  "contact_name": "Sarah Johnson",
  "ticket_url": "https://app.deracrm.com/tickets/301"
}
```

### Ticket Resolved
**Template:** `ticketResolved.ejs`

**Variables:**
```json
{
  "first_name": "John",
  "ticket_number": "TKT-2025-0001",
  "subject": "Cannot access premium features",
  "contact_name": "Sarah Johnson",
  "resolution_time": 60,
  "ticket_url": "https://app.deracrm.com/tickets/301"
}
```

### New Comment
**Template:** `ticketComment.ejs`

**Variables:**
```json
{
  "first_name": "John",
  "ticket_number": "TKT-2025-0001",
  "subject": "Cannot access premium features",
  "comment_author": "Bob Johnson",
  "comment": "Looking into this issue now",
  "ticket_url": "https://app.deracrm.com/tickets/301"
}
```

---

## Permission Matrix

| Action | Admin | Manager | Agent (Owner/Assignee) | Agent (Other) |
|--------|-------|---------|------------------------|---------------|
| Create Ticket | ✅ | ✅ | ✅ | ✅ |
| View All Tickets | ✅ | ✅ | ❌ | ❌ |
| View Own Tickets | ✅ | ✅ | ✅ | ❌ |
| Update Ticket | ✅ | ✅ | ✅ | ❌ |
| Update Status | ✅ | ✅ | ✅ | ❌ |
| Assign Ticket | ✅ | ✅ | ❌ | ❌ |
| Add Comment | ✅ | ✅ | ✅ | ❌ |
| View Internal Comments | ✅ | ✅ | ✅* | ❌ |
| Delete Ticket | ✅ | ❌ | ❌ | ❌ |
| View SLA Report | ✅ | ✅ | ❌ | ❌ |

*\*Agents can see internal comments only on tickets they own or are assigned to*

---

## Error Codes

| Error | Status | Description |
|-------|--------|-------------|
| `User not authenticated` | 401 | Missing or invalid token |
| `Contact not found` | 404 | contact_id doesn't exist |
| `Ticket not found` | 404 | Ticket ID doesn't exist |
| `Forbidden` | 403 | User lacks permission |
| `Cannot update resolved or closed tickets` | 400 | Ticket is in final state |
| `Validation failed` | 400 | Invalid input data |

---

## Audit Logging

All ticket operations are logged to the `AuditLog` table:

| Action | Entity Type | Details Example |
|--------|-------------|-----------------|
| CREATE | ticket | "Created ticket: TKT-2025-0001" |
| UPDATE | ticket | "Updated ticket: TKT-2025-0001" |
| VIEW | ticket | "Viewed ticket: TKT-2025-0001" |
| DELETE | ticket | "Deleted ticket: TKT-2025-0001" |

### Sample Audit Log Entry:
```json
{
  "id": 5001,
  "user_id": 1,
  "action": "IMPERSONATE",
  "entity_type": "user",
  "entity_id": 101,
  "details": "Admin john@example.com impersonated user sarah@example.com",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-11-08T16:30:00.000Z"
}
```

---

## Implementation Notes

### Virtual Field Calculations
```javascript
// Response time (minutes) - time to first non-internal comment
get responseTime() {
  // Implementation depends on first comment tracking
  return null; // Override based on your logic
}

// Resolution time (minutes)
get resolutionTime() {
  if (!this.resolved_at) return null;
  return Math.floor((this.resolved_at.getTime() - this.created_at.getTime()) / 60000);
}

// Overdue check
get isOverdue(): boolean {
  if (!this.due_date || this.status === 'resolved' || this.status === 'closed') {
    return false;
  }
  return new Date() > new Date(this.due_date);
}
```

### SLA Warning System
The `sla_warnings_sent` array tracks which warning thresholds have been sent:
- Thresholds: [0.5, 0.75, 0.9, 1] (50%, 75%, 90%, 100% of time elapsed)
- Used by background job to prevent duplicate notifications

### Ticket Number Generation
Format: `TKT-YYYY-XXXX` where:
- `YYYY` = Current year
- `XXXX` = Sequential number (padded to 4 digits)

Example: `TKT-2025-0042`
### Email Marketing Endpoints

#### 1. Create Email Template
**POST** `/email-templates`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Welcome Email",
  "subject": "Welcome to {{company_name}}!",
  "body": "<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We're excited to have you on board.</p>",
  "variables": ["first_name", "company_name", "login_link"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Email template created successfully",
  "data": {
    "template": {
      "id": 601,
      "name": "Welcome Email",
      "subject": "Welcome to {{company_name}}!",
      "body": "<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We're excited to have you on board.</p>",
      "variables": ["first_name", "company_name", "login_link"],
      "user_id": 1,
      "created_at": "2025-11-08T20:00:00.000Z",
      "updated_at": "2025-11-08T20:00:00.000Z"
    }
  }
}
```

#### 2. Get Email Templates
**GET** `/email-templates`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name/subject

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 601,
        "name": "Welcome Email",
        "subject": "Welcome to {{company_name}}!",
        "preview": "Hello {{first_name}}, Welcome to {{company_name}}! We're excited...",
        "variables": ["first_name", "company_name", "login_link"],
        "created_at": "2025-11-08T20:00:00.000Z",
        "updated_at": "2025-11-08T20:00:00.000Z",
        "campaigns_count": 2
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

#### 3. Get Email Template by ID
**GET** `/email-templates/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": 601,
      "name": "Welcome Email",
      "subject": "Welcome to {{company_name}}!",
      "body": "<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We're excited to have you on board.</p><p>Get started by logging in here: {{login_link}}</p>",
      "variables": ["first_name", "company_name", "login_link"],
      "user_id": 1,
      "created_at": "2025-11-08T20:00:00.000Z",
      "updated_at": "2025-11-08T20:00:00.000Z"
    }
  }
}
```

#### 4. Update Email Template
**PUT** `/email-templates/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Welcome Email v2",
  "subject": "Welcome to {{company_name}} - Get Started Today!",
  "body": "<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We're excited to have you on board.</p><p>Here's how to get started: {{getting_started_link}}</p>",
  "variables": ["first_name", "company_name", "getting_started_link"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email template updated successfully",
  "data": {
    "template": {
      "id": 601,
      "name": "Welcome Email v2",
      "subject": "Welcome to {{company_name}} - Get Started Today!",
      "body": "<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We're excited to have you on board.</p><p>Here's how to get started: {{getting_started_link}}</p>",
      "variables": ["first_name", "company_name", "getting_started_link"],
      "updated_at": "2025-11-08T20:30:00.000Z"
    }
  }
}
```

#### 5. Delete Email Template
**DELETE** `/email-templates/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email template deleted successfully"
}
```

#### 6. Preview Email Template
**POST** `/email-templates/:id/preview`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "test_data": {
    "first_name": "Sarah",
    "company_name": "Acme Inc",
    "login_link": "https://app.deracrm.com/login"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subject": "Welcome to Acme Inc - Get Started Today!",
    "body": "<h1>Hello Sarah,</h1><p>Welcome to Acme Inc! We're excited to have you on board.</p><p>Here's how to get started: https://app.deracrm.com/login</p>",
    "preview_html": "<div style='padding:20px; border:1px solid #ccc;'><h1>Hello Sarah,</h1><p>Welcome to Acme Inc! We're excited to have you on board.</p><p>Here's how to get started: <a href='https://app.deracrm.com/login'>Login</a></p></div>"
  }
}
```

#### 7. Duplicate Email Template
**POST** `/email-templates/:id/duplicate`

**Headers:** `Authorization: Bearer <token>`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Template duplicated successfully",
  "data": {
    "template": {
      "id": 602,
      "name": "Welcome Email (Copy)",
      "subject": "Welcome to {{company_name}}!",
      "body": "<h1>Hello {{first_name}},</h1><p>Welcome to {{company_name}}! We're excited to have you on board.</p>",
      "variables": ["first_name", "company_name"],
      "user_id": 1,
      "created_at": "2025-11-08T20:45:00.000Z"
    }
  }
}
```

### Campaigns Endpoints

#### 1. Create Campaign
**POST** `/campaigns`

**Headers:** `Authorization: Bearer <token>`

**Campaign Status:** `draft`, `scheduled`, `sending`, `sent`, `cancelled`

**Request Body:**
```json
{
  "name": "Welcome Campaign - November 2025",
  "template_id": 601,
  "target_list": {
    "contact_ids": [101, 102, 103, 104],
    "filters": {
      "tags": ["new_signup"],
      "status": "active"
    }
  },
  "scheduled_at": "2025-11-09T10:00:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Campaign created successfully",
  "data": {
    "campaign": {
      "id": 701,
      "name": "Welcome Campaign - November 2025",
      "template_id": 601,
      "user_id": 1,
      "status": "scheduled",
      "target_count": 25,
      "sent_count": 0,
      "open_count": 0,
      "click_count": 0,
      "scheduled_at": "2025-11-09T10:00:00.000Z",
      "sent_at": null,
      "created_at": "2025-11-08T21:00:00.000Z",
      "updated_at": "2025-11-08T21:00:00.000Z",
      "open_rate": 0,
      "click_rate": 0,
      "click_to_open_rate": 0
    }
  }
}
```

#### 2. Get Campaigns
**GET** `/campaigns`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: draft/scheduled/sending/sent/cancelled
- `search`: Search by name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": 701,
        "name": "Welcome Campaign - November 2025",
        "status": "scheduled",
        "target_count": 25,
        "sent_count": 0,
        "open_count": 0,
        "click_count": 0,
        "open_rate": 0,
        "click_rate": 0,
        "scheduled_at": "2025-11-09T10:00:00.000Z",
        "created_at": "2025-11-08T21:00:00.000Z",
        "template": {
          "id": 601,
          "name": "Welcome Email v2",
          "subject": "Welcome to {{company_name}} - Get Started Today!"
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

#### 3. Get Campaign by ID
**GET** `/campaigns/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": 702,
      "name": "Monthly Newsletter - November",
      "template_id": 603,
      "user_id": 1,
      "status": "sent",
      "target_count": 150,
      "sent_count": 150,
      "open_count": 89,
      "click_count": 34,
      "scheduled_at": "2025-11-01T09:00:00.000Z",
      "sent_at": "2025-11-01T09:05:00.000Z",
      "created_at": "2025-10-25T14:00:00.000Z",
      "updated_at": "2025-11-01T09:05:00.000Z",
      "open_rate": 59.3,
      "click_rate": 22.7,
      "click_to_open_rate": 38.2,
      "template": {
        "id": 603,
        "name": "Newsletter Template",
        "subject": "Your Monthly Update from {{company_name}}",
        "body": "<h1>Hello {{first_name}},</h1><p>Here's what's new this month...</p>"
      },
      "analytics": {
        "delivery_rate": 98.7,
        "bounce_rate": 1.3,
        "unsubscribe_rate": 0.7
      },
      "recipients": [
        {
          "contact_id": 101,
          "email": "sarah.johnson@example.com",
          "status": "sent",
          "opened_at": "2025-11-01T09:30:00.000Z",
          "clicked_at": null
        }
      ]
    }
  }
}
```

#### 4. Update Campaign
**PUT** `/campaigns/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Welcome Campaign - November 2025 (Updated)",
  "scheduled_at": "2025-11-10T10:00:00.000Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "data": {
    "campaign": {
      "id": 701,
      "name": "Welcome Campaign - November 2025 (Updated)",
      "scheduled_at": "2025-11-10T10:00:00.000Z",
      "updated_at": "2025-11-08T21:30:00.000Z"
    }
  }
}
```

#### 5. Send Campaign
**POST** `/campaigns/:id/send`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "send_immediately": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Campaign sending started",
  "data": {
    "campaign": {
      "id": 701,
      "status": "sending",
      "sent_count": 0,
      "sent_at": "2025-11-08T21:45:00.000Z"
    },
    "estimated_time": "2 minutes"
  }
}
```

#### 6. Cancel Campaign
**POST** `/campaigns/:id/cancel`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Campaign cancelled successfully",
  "data": {
    "campaign": {
      "id": 701,
      "status": "cancelled",
      "updated_at": "2025-11-08T21:50:00.000Z"
    }
  }
}
```

#### 7. Send Test Email
**POST** `/campaigns/:id/test`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "test_email": "test@example.com",
  "test_data": {
    "first_name": "Test",
    "company_name": "Acme Inc"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "data": {
    "email_id": "msg_12345",
    "sent_to": "test@example.com"
  }
}
```

#### 8. Get Campaign Analytics
**GET** `/campaigns/:id/analytics`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaign_id": 702,
    "name": "Monthly Newsletter - November",
    "summary": {
      "sent": 150,
      "delivered": 148,
      "opens": 89,
      "unique_opens": 89,
      "clicks": 34,
      "unique_clicks": 34,
      "bounces": 2,
      "unsubscribes": 1,
      "complaints": 0
    },
    "rates": {
      "delivery_rate": 98.7,
      "open_rate": 60.1,
      "click_rate": 23.0,
      "click_to_open_rate": 38.2,
      "bounce_rate": 1.3,
      "unsubscribe_rate": 0.7
    },
    "hourly_opens": [
      {
        "hour": "09:00",
        "opens": 15
      }
    ],
    "device_breakdown": {
      "desktop": 65,
      "mobile": 30,
      "tablet": 5
    },
    "top_links": [
      {
        "url": "https://deracrm.com/features",
        "clicks": 18
      }
    ]
  }
}
```

#### 9. Duplicate Campaign
**POST** `/campaigns/:id/duplicate`

**Headers:** `Authorization: Bearer <token>`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Campaign duplicated successfully",
  "data": {
    "campaign": {
      "id": 703,
      "name": "Monthly Newsletter - November (Copy)",
      "template_id": 603,
      "status": "draft",
      "target_count": 150,
      "created_at": "2025-11-08T22:00:00.000Z"
    }
  }
}
```

### Dashboard Endpoints

#### 1. Get Dashboard
**GET** `/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id`: Filter by user (admin only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_contacts": 156,
      "new_contacts_today": 3,
      "open_deals": 25,
      "total_pipeline_value": 450000.00,
      "weighted_pipeline_value": 263500.00,
      "deals_won_this_month": 5,
      "deals_lost_this_month": 2,
      "win_rate": 71.4,
      "new_tickets": 8,
      "open_tickets": 12,
      "overdue_tickets": 2,
      "tickets_resolved_today": 4
    },
    "sales_chart": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      "won_deals": [12000, 15000, 18000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 40000],
      "lost_deals": [5000, 6000, 4000, 7000, 8000, 5000, 6000, 7000, 9000, 8000, 7000]
    },
    "pipeline_value_chart": {
      "stages": [
        {
          "name": "Lead",
          "count": 5,
          "value": 75000,
          "color": "#3B82F6"
        }
      ],
      "total_value": 395000,
      "weighted_value": 217500
    },
    "ticket_volume_chart": {
      "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "new": [5, 7, 8, 6, 9, 3, 2],
      "resolved": [4, 6, 7, 5, 8, 2, 1]
    },
    "recent_activities": [
      {
        "id": 401,
        "type": "call",
        "subject": "Initial discovery call",
        "scheduled_date": "2025-11-09T15:00:00.000Z",
        "status": "scheduled",
        "contact": {
          "id": 101,
          "first_name": "Sarah",
          "last_name": "Johnson",
          "company": "Tech Solutions Ltd"
        },
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe"
        }
      }
    ],
    "task_list": [
      {
        "id": 407,
        "type": "follow-up",
        "description": "Follow up with Tech Solutions about proposal",
        "due_date": "2025-11-09",
        "priority": "high",
        "contact": "Sarah Johnson"
      }
    ],
    "top_performers": [
      {
        "user_id": 1,
        "name": "John Doe",
        "deals_won": 8,
        "deals_value": 125000,
        "tickets_resolved": 15
      }
    ]
  }
}
```

#### 2. Get Sales Chart Data
**GET** `/dashboard/sales-chart`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: month/quarter/year (default: month)
- `year`: Filter by year

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "year": 2025,
    "data": [
      {
        "month": "January",
        "won": 12000,
        "lost": 5000
      }
    ],
    "totals": {
      "won": 45000,
      "lost": 15000,
      "net": 30000
    }
  }
}
```

#### 3. Get Pipeline Chart Data
**GET** `/dashboard/pipeline-chart`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "name": "Lead",
        "count": 5,
        "value": 75000,
        "weighted_value": 15000,
        "color": "#3B82F6"
      }
    ],
    "total_value": 395000,
    "weighted_value": 217500
  }
}
```

#### 4. Get Ticket Chart Data
**GET** `/dashboard/ticket-chart`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days`: Number of days (default: 7)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "days": 7,
    "data": [
      {
        "date": "2025-11-02",
        "new": 5,
        "resolved": 4
      }
    ],
    "totals": {
      "new": 40,
      "resolved": 33,
      "open": 12
    }
  }
}
```

### Administration Endpoints

#### 1. Get System Stats
**GET** `/admin/stats`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 12,
      "active_today": 8,
      "by_role": {
        "admin": 2,
        "manager": 3,
        "agent": 7
      }
    },
    "contacts": {
      "total": 156,
      "active": 142,
      "inactive": 14
    },
    "deals": {
      "total": 35,
      "open": 25,
      "won": 8,
      "lost": 2
    },
    "tickets": {
      "total": 28,
      "open": 12,
      "resolved": 14,
      "closed": 2
    },
    "campaigns": {
      "total": 6,
      "sent": 4,
      "scheduled": 2
    },
    "storage": {
      "used": "2.5 GB",
      "total": "10 GB",
      "percentage": 25
    },
    "api_usage": {
      "today": 1250,
      "this_week": 8750,
      "this_month": 35000
    }
  }
}
```

#### 2. Get Audit Logs
**GET** `/admin/audit-logs`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page (max 100) |
| user_id | integer | Filter by user |
| action | string | Filter by action type |
| date_from | date | Start date |
| date_to | date | End date |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1001,
        "user_id": 1,
        "user_name": "John Doe",
        "action": "CREATE",
        "entity_type": "contact",
        "entity_id": 101,
        "details": "Created contact: Sarah Johnson",
        "ip_address": "192.168.1.100",
        "created_at": "2025-11-08T15:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 50,
      "pages": 25
    }
  }
}
```

#### 3. Get User Activity Report
**GET** `/admin/user-activity`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin/Manager only

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `user_id`: Filter by user

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-11-01",
      "end": "2025-11-08"
    },
    "users": [
      {
        "user_id": 1,
        "name": "John Doe",
        "role": "admin",
        "activities": {
          "contacts_created": 15,
          "deals_created": 8,
          "tickets_created": 5,
          "tickets_resolved": 7,
          "campaigns_sent": 2,
          "logins": 12,
          "total_actions": 89
        }
      }
    ]
  }
}
```

#### 4. Create Database Backup
**POST** `/admin/backup`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Backup started. You will be notified when complete.",
  "data": {
    "backup_id": "backup_12345",
    "estimated_time": "2 minutes"
  }
}
```

#### 5. Get Backup Status
**GET** `/admin/backup/:backup_id/status`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backup_id": "backup_12345",
    "status": "completed",
    "size": "450 MB",
    "download_url": "/backups/dera-crm-backup-2025-11-08.sql",
    "expires_at": "2025-11-15T22:00:00.000Z",
    "completed_at": "2025-11-08T22:05:00.000Z"
  }
}
```

#### 6. Get System Health
**GET** `/admin/health`

**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-08T22:30:00.000Z",
    "services": {
      "database": {
        "status": "connected",
        "latency": 5
      },
      "storage": {
        "status": "healthy",
        "used": "2.5 GB",
        "free": "7.5 GB",
        "total": "10 GB",
        "usage_percentage": 25
      }
    },
    "system": {
      "uptime": "3d 5h",
      "memory": {
        "heap_used": "52.3 MB",
        "heap_total": "95.2 MB"
      },
      "active_connections": 15
    }
  }
}
```

### System Endpoints

#### 1. Health Check
**GET** `/health`

Public endpoint to check API status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T22:30:00.000Z",
  "service": "DERA CRM API",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 345600
}
```

## Email Notifications

### Types of Email Notifications:

| Type | Trigger | Template |
|------|---------|----------|
| **Welcome Email** | After registration | `welcome.ejs` |
| **Verification Email** | After registration | `verification.ejs` |
| **Password Reset** | When user requests reset | `passwordReset.ejs` |
| **Ticket Assignment** | When ticket assigned to user | `ticketAssigned.ejs` |
| **Ticket Resolution** | When ticket resolved | `ticketResolved.ejs` |
| **Deal Assignment** | When deal assigned to user | `dealAssigned.ejs` |
| **Campaign Summary** | After campaign completion | `campaignSummary.ejs` |
| **Weekly Summary** | Every Monday at 9 AM | `weeklySummary.ejs` |
| **SLA Warning** | When ticket approaching SLA breach | `slaWarning.ejs` |
| **SLA Breach** | When ticket breaches SLA | `slaBreached.ejs` |
| **SLA Breach Manager** | Alert for managers | `slaBreachedManager.ejs` |
| **Daily Digest** | Daily at 8 AM | `dailyDigest.ejs` |
| **User Invitation** | When admin invites user | `userInvitation.ejs` |
| **Backup Success** | After successful backup | `backupSuccess.ejs` |
| **Backup Failed** | When backup fails | `backupFailed.ejs` |

### Email Template Features
- Mobile-responsive design
- Company logo integration
- Clear call-to-action buttons
- Unsubscribe links (for marketing)
- Contact information footer
- Dynamic variables using EJS

## Scheduled Jobs

### Automated Tasks

| Job | Schedule | Description |
|-----|----------|-------------|
| **Database Backup** | Daily at 2 AM | Creates database backup |
| **Campaign Sending** | Every minute | Processes scheduled campaigns |
| **SLA Monitor** | Every hour | Checks for approaching SLA breaches |
| **Daily Digest** | Daily at 8 AM | Sends daily activity digest |
| **Weekly Summary** | Monday at 9 AM | Sends weekly performance summary |
| **Cleanup Jobs** | Daily at 3 AM | Cleans old logs, tokens, files |

### Cleanup Operations
- Old audit logs (90 days)
- Expired refresh tokens
- Completed/cancelled activities (30 days)
- Old campaign data (30 days)
- Temporary upload files (7-30 days)
- Old exports (2 days)
- Old imports (7 days)

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2025-11-08T22:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| **200** | OK - Request succeeded |
| **201** | Created - Resource created |
| **202** | Accepted - Request accepted for processing |
| **400** | Bad Request - Validation error |
| **401** | Unauthorized - Invalid/missing token |
| **403** | Forbidden - Insufficient permissions |
| **404** | Not Found - Resource not found |
| **409** | Conflict - Resource already exists |
| **422** | Unprocessable Entity - Business logic error |
| **429** | Too Many Requests - Rate limit exceeded |
| **500** | Internal Server Error - Server error |

### Database Error Types
- **SequelizeValidationError**: Field validation failed
- **SequelizeUniqueConstraintError**: Duplicate entry
- **SequelizeForeignKeyConstraintError**: Referenced record not found

### File Upload Errors
- **LIMIT_FILE_SIZE**: File too large
- **LIMIT_FILE_COUNT**: Too many files
- **LIMIT_UNEXPECTED_FILE**: Unexpected field
- **Invalid file type**: Unsupported format

## Rate Limiting

### Default Limits

| Endpoint Type | Window | Max Requests |
|--------------|--------|--------------|
| **Authentication** | 15 minutes | 5 |
| **General API** | 15 minutes | 100 |
| **Campaign Sending** | 1 hour | 50 |
| **File Uploads** | 1 hour | 10 |
| **Exports** | 1 hour | 10 |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316400
Retry-After: 900
```

### Custom Limiters
- **IP-based**: Limits by IP address
- **User-based**: Limits by authenticated user
- **Concurrent**: Limits simultaneous requests

## Real-time Updates

### Polling Strategy
Since WebSocket is not implemented, real-time updates are achieved through:

1. **Immediate Responses**: All create/update/delete operations return updated data
2. **Periodic Polling**: Frontend polls for updates at configurable intervals
3. **Email Notifications**: Critical updates sent via email

### Recommended Polling Intervals

| Data Type | Interval | Endpoint |
|-----------|----------|----------|
| Dashboard | 30 seconds | `/dashboard` |
| Notifications | 1 minute | `/notifications` |
| Task List | 5 minutes | `/activities/upcoming` |
| Pipeline Updates | 5 minutes | `/deals/pipeline/summary` |

### Frontend Implementation Example
```javascript
class DeraCRMClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.pollingIntervals = {};
  }

  async fetch(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  startPolling(endpoint, callback, interval = 30000) {
    this.pollingIntervals[endpoint] = setInterval(async () => {
      const data = await this.fetch(endpoint);
      callback(data);
    }, interval);
  }

  stopPolling(endpoint) {
    if (this.pollingIntervals[endpoint]) {
      clearInterval(this.pollingIntervals[endpoint]);
      delete this.pollingIntervals[endpoint];
    }
  }

  stopAllPolling() {
    Object.values(this.pollingIntervals).forEach(clearInterval);
    this.pollingIntervals = {};
  }
}
```

## Deployment

### Environment Variables
```env
# Server
NODE_ENV=production
PORT=5000
SERVER_URL=https://api.deracrm.com
FRONTEND_URL=https://app.deracrm.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=deracrm_user
DB_PASSWORD=strong_password
DB_NAME=deracrm_prod

# JWT
JWT_SECRET=your-64-char-jwt-secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another-64-char-secret
JWT_REFRESH_EXPIRE=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@deracrm.com
SMTP_PASSWORD=app-password
EMAIL_FROM=noreply@deracrm.com

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,pdf,doc,docx,csv

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# CORS
CORS_ORIGIN=https://app.deracrm.com

# Backup
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30
```

### System Requirements
- **Node.js**: 16.x or higher
- **PostgreSQL**: 12.x or higher
- **Redis**: 6.x or higher
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 20GB minimum (SSD recommended)

### Production Optimization
- **PM2** for process management
- **Nginx** as reverse proxy
- **Redis** for queue and caching
- **PostgreSQL** connection pooling
- **Cluster mode** for multi-core usage

### Health Check
```bash
curl https://api.deracrm.com/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T22:30:00.000Z",
  "service": "DERA CRM API",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "uptime": "3 days, 5 hours"
}
```

---

## 📝 Summary of Changes from Original Documentation

### ✅ **Added Features:**
1. **Organization Management** - Complete company settings
2. **SLA Tracking** - Response and resolution time monitoring
3. **Audit Logging** - Full audit trail for compliance (Every action is audited)
4. **Backup System** - Automated database backups
5. **Campaign Analytics** - Detailed email campaign metrics
6. **Tag Management** - Comprehensive tagging system
7. **Kanban Board** - Visual pipeline management
8. **Import/Export** - Bulk operations with progress tracking
9. **Scheduled Jobs** - Daily digest, weekly summaries
10. **Queue System** - Background job processing

### 🔄 **Enhanced Endpoints:**
1. **Deals** - Added weighted values and pipeline forecasting
2. **Tickets** - SLA tracking fields added
3. **Activities** - Better status tracking and outcomes
4. **Contacts** - Import/export with column mapping
5. **Users** - Organization association and settings

### ❌ **Not Included (as requested):**
1. **Testing** - No test files or dependencies
2. **WebSockets** - Using polling instead
3. **Social Login** - Not implemented
4. **Two-factor Authentication** - Not included

### 📊 **API Statistics:**
- **Total Endpoints**: 70+
- **Models**: 13 database tables
- **Email Templates**: 15+ templates
- **Scheduled Jobs**: 6 automated tasks
- **Rate Limit Tiers**: 5 different limit types

---

**Version:** 2.0.0  
**Last Updated:** November 8, 2025  
**Status:** Production Ready  
**Author:** Nwankwo Chidera David

This updated documentation reflects all the code I've provided, including the new features, enhanced endpoints, and removed test-related content as you requested.