# 📊 DERA CRM Backend API Documentation

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users & Profile](#users--profile-endpoints)
   - [Contacts](#contacts-endpoints)
   - [Deals & Sales Pipeline](#deals--sales-pipeline-endpoints)
   - [Activities](#activities-endpoints)
   - [Support Tickets](#support-tickets-endpoints)
   - [Email Marketing](#email-marketing-endpoints)
   - [Dashboard](#dashboard-endpoints)
   - [Administration](#administration-endpoints)
4. [Email Notifications](#email-notifications)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Real-time Updates](#real-time-updates)
8. [Deployment](#deployment)

## API Overview

**Base URL:** `http://localhost:5000/api` (Development)  
**Production URL:** `https://api.deracrm.com/api`

**Content-Type:** `application/json`  
**Authentication:** Bearer Token

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
  "iat": 1516239022,
  "exp": 1516242622
}
```

## Endpoints

### Authentication Endpoints

#### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

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
      "created_at": "2025-11-08T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already registered",
  "errors": [
    {
      "msg": "Email already in use",
      "param": "email",
      "location": "body"
    }
  ]
}
```

#### 2. Login
**POST** `/auth/login`

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
        "name": "Acme Inc",
        "logo": "/uploads/logos/acme-12345.png"
      },
      "settings": {
        "notifications": true,
        "theme": "light",
        "language": "en"
      },
      "created_at": "2025-11-01T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Verify Email
**GET** `/auth/verify-email/:token`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 4. Forgot Password
**POST** `/auth/forgot-password`

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

#### 5. Reset Password
**POST** `/auth/reset-password`

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

#### 6. Resend Verification
**POST** `/auth/resend-verification`

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
    "created_at": "2025-11-01T10:30:00.000Z",
    "updated_at": "2025-11-08T11:30:00.000Z"
  }
}
```

#### 2. Update Profile
**PUT** `/users/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
avatar: [image file]
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar removed successfully"
}
```

#### 6. Get All Users (Admin only)
**GET** `/users`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `role`: Filter by role
- `search`: Search by name/email

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
      },
      {
        "id": 3,
        "email": "bob@example.com",
        "first_name": "Bob",
        "last_name": "Johnson",
        "role": "agent",
        "avatar": null,
        "is_verified": true,
        "last_login": "2025-11-06T14:30:00.000Z",
        "created_at": "2025-11-03T11:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

#### 7. Get User by ID (Admin/Manager only)
**GET** `/users/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### 8. Update User Role (Admin only)
**PUT** `/users/:id/role`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### 9. Delete User (Admin only)
**DELETE** `/users/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Organization Settings

#### 1. Get Organization Settings
**GET** `/organization/settings`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
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

#### 2. Update Organization Settings (Admin only)
**PUT** `/organization/settings`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### 3. Upload Company Logo (Admin only)
**POST** `/organization/logo`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
logo: [image file]
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

### Contacts Endpoints

#### 1. Create Contact
**POST** `/contacts`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "user_id": 1,
      "created_at": "2025-11-08T15:30:00.000Z",
      "updated_at": "2025-11-08T15:30:00.000Z"
    }
  }
}
```

#### 2. Get All Contacts
**GET** `/contacts`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (active/inactive/lead)
- `tag`: Filter by tag
- `search`: Search by name/email/company
- `sort_by`: Field to sort by (default: created_at)
- `sort_order`: asc/desc (default: desc)

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
        "created_at": "2025-11-08T15:30:00.000Z",
        "updated_at": "2025-11-08T15:30:00.000Z",
        "deals_count": 2,
        "tickets_count": 1,
        "last_activity": "2025-11-08T16:00:00.000Z"
      },
      {
        "id": 102,
        "first_name": "Michael",
        "last_name": "Chen",
        "email": "michael.chen@example.com",
        "phone": "+1987654321",
        "company": "Innovate LLC",
        "job_title": "CEO",
        "status": "lead",
        "source": "referral",
        "tags": ["tech", "c-level"],
        "created_at": "2025-11-07T10:15:00.000Z",
        "updated_at": "2025-11-07T10:15:00.000Z",
        "deals_count": 0,
        "tickets_count": 0,
        "last_activity": null
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "pages": 3
    },
    "filters": {
      "statuses": ["active", "inactive", "lead"],
      "tags": ["tech", "marketing", "c-level", "sales"]
    }
  }
}
```

#### 3. Get Contact by ID
**GET** `/contacts/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### 4. Update Contact
**PUT** `/contacts/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "updated_at": "2025-11-08T16:00:00.000Z"
    }
  }
}
```

#### 5. Delete Contact
**DELETE** `/contacts/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

**Error Response (400 Bad Request - Contact has associated data):**
```json
{
  "success": false,
  "message": "Cannot delete contact with existing deals or tickets. Reassign or delete them first."
}
```

#### 6. Import Contacts (CSV)
**POST** `/contacts/import`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [CSV file]
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

#### 7. Get Import Status
**GET** `/contacts/import/:import_id/status`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "row": 45,
        "error": "Missing required field"
      }
    ],
    "completed_at": "2025-11-08T16:30:00.000Z"
  }
}
```

#### 8. Export Contacts
**GET** `/contacts/export`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `format`: csv/excel (default: csv)
- `fields`: Comma-separated list of fields to export
- `filters`: Apply same filters as GET /contacts

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

#### 9. Add Tag to Contact
**POST** `/contacts/:id/tags`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
    "tags": ["tech", "marketing", "vip", "vip"]
  }
}
```

#### 10. Remove Tag from Contact
**DELETE** `/contacts/:id/tags/:tag`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag removed successfully",
  "data": {
    "tags": ["tech", "marketing", "vip"]
  }
}
```

#### 11. Get All Tags
**GET** `/contacts/tags/all`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "name": "vip",
        "count": 7
      },
      {
        "name": "c-level",
        "count": 12
      }
    ]
  }
}
```

### Deals & Sales Pipeline Endpoints

#### 1. Create Deal
**POST** `/deals`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `stage`: Filter by stage
- `status`: open/won/lost
- `user_id`: Filter by owner
- `contact_id`: Filter by contact
- `search`: Search by name
- `date_from`: Expected close date from
- `date_to`: Expected close date to

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
        "activities_count": 3
      },
      {
        "id": 202,
        "name": "Basic Plan - Innovate LLC",
        "stage": "qualified",
        "amount": 5000.00,
        "probability": 40,
        "expected_close_date": "2025-12-01",
        "status": "open",
        "created_at": "2025-11-07T10:15:00.000Z",
        "contact": {
          "id": 102,
          "first_name": "Michael",
          "last_name": "Chen",
          "company": "Innovate LLC"
        },
        "user": {
          "id": 2,
          "first_name": "Jane",
          "last_name": "Smith"
        },
        "activities_count": 1
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
          "completed_date": null,
          "status": "scheduled"
        },
        {
          "id": 402,
          "type": "email",
          "subject": "Sent proposal document",
          "scheduled_date": "2025-11-08T11:30:00.000Z",
          "completed_date": "2025-11-08T11:30:00.000Z",
          "status": "completed"
        }
      ]
    }
  }
}
```

#### 4. Update Deal
**PUT** `/deals/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "actual_close_date": "2025-11-09",
  "notes": "Lost to competitor",
  "loss_reason": "competitor_price"
}
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deal deleted successfully"
}
```

#### 9. Get Pipeline Summary
**GET** `/deals/pipeline/summary`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "id": "proposal",
        "title": "Proposal",
        "color": "#F59E0B",
        "limit": 10,
        "deals": [
          {
            "id": 204,
            "name": "Enterprise Plan - Global Inc",
            "amount": 25000.00,
            "probability": 60,
            "expected_close_date": "2025-12-10",
            "contact_name": "Lisa Wang",
            "contact_company": "Global Inc",
            "avatar": "/uploads/avatars/contact-204.jpg",
            "has_activity_today": false
          }
        ]
      },
      {
        "id": "negotiation",
        "title": "Negotiation",
        "color": "#EF4444",
        "limit": 10,
        "deals": [
          {
            "id": 201,
            "name": "Enterprise Plan - Tech Solutions",
            "amount": 16500.00,
            "probability": 80,
            "expected_close_date": "2025-12-10",
            "contact_name": "Sarah Johnson",
            "contact_company": "Tech Solutions Ltd",
            "avatar": null,
            "has_activity_today": true
          }
        ]
      },
      {
        "id": "won",
        "title": "Won",
        "color": "#10B981",
        "limit": 10,
        "deals": [
          {
            "id": 205,
            "name": "Pro Plan - Startup Co",
            "amount": 12000.00,
            "probability": 100,
            "expected_close_date": "2025-11-05",
            "actual_close_date": "2025-11-05",
            "contact_name": "David Kim",
            "contact_company": "Startup Co",
            "avatar": null
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "created_at": "2025-11-08T17:00:00.000Z",
      "updated_at": "2025-11-08T17:00:00.000Z"
    }
  }
}
```

#### 2. Get Activities
**GET** `/activities`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: call/email/meeting/task
- `contact_id`: Filter by contact
- `deal_id`: Filter by deal
- `user_id`: Filter by owner
- `status`: scheduled/completed/cancelled
- `date_from`: Scheduled date from
- `date_to`: Scheduled date to

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
      },
      {
        "id": 402,
        "type": "email",
        "subject": "Sent proposal document",
        "description": "Sent detailed proposal with pricing",
        "scheduled_date": "2025-11-08T11:30:00.000Z",
        "completed_date": "2025-11-08T11:30:00.000Z",
        "duration": null,
        "status": "completed",
        "outcome": "Positive response, scheduling follow-up",
        "contact": {
          "id": 102,
          "first_name": "Michael",
          "last_name": "Chen",
          "company": "Innovate LLC"
        },
        "deal": {
          "id": 202,
          "name": "Basic Plan - Innovate LLC",
          "amount": 5000.00
        },
        "user": {
          "id": 2,
          "first_name": "Jane",
          "last_name": "Smith"
        },
        "created_at": "2025-11-08T11:30:00.000Z"
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

#### 7. Get Today's Activities
**GET** `/activities/today`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "id": 404,
        "type": "meeting",
        "subject": "Product demo - Innovate LLC",
        "scheduled_date": "2025-11-08T14:30:00.000Z",
        "status": "scheduled",
        "contact": {
          "name": "Michael Chen",
          "company": "Innovate LLC"
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "id": 405,
        "type": "meeting",
        "subject": "Contract signing",
        "scheduled_date": "2025-11-12T11:00:00.000Z",
        "status": "scheduled",
        "contact": {
          "name": "Robert Brown",
          "company": "New Co Ltd"
        }
      }
    ],
    "grouped_by_date": {
      "2025-11-09": [401],
      "2025-11-12": [405]
    }
  }
}
```

### Support Tickets Endpoints

#### 1. Create Ticket
**POST** `/tickets`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "subject": "Cannot access premium features",
  "description": "User upgraded to premium but features are still locked",
  "contact_id": 101,
  "priority": "high",
  "due_date": "2025-11-10"
}
```

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
      "assigned_to": null,
      "priority": "high",
      "status": "new",
      "due_date": "2025-11-10",
      "resolved_at": null,
      "created_at": "2025-11-08T18:00:00.000Z",
      "updated_at": "2025-11-08T18:00:00.000Z",
      "sla": {
        "response_due": "2025-11-08T20:00:00.000Z",
        "resolution_due": "2025-11-10T18:00:00.000Z"
      }
    }
  }
}
```

#### 2. Get All Tickets
**GET** `/tickets`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: new/open/pending/resolved/closed
- `priority`: low/medium/high/urgent
- `assigned_to`: Filter by assignee
- `contact_id`: Filter by contact
- `search`: Search in subject/description

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": 301,
        "ticket_number": "TKT-2025-0001",
        "subject": "Cannot access premium features",
        "priority": "high",
        "status": "open",
        "due_date": "2025-11-10",
        "created_at": "2025-11-08T18:00:00.000Z",
        "contact": {
          "id": 101,
          "first_name": "Sarah",
          "last_name": "Johnson",
          "email": "sarah.johnson@example.com"
        },
        "assigned_to": {
          "id": 3,
          "first_name": "Bob",
          "last_name": "Johnson"
        },
        "comment_count": 2,
        "sla_breach": false,
        "response_time": 15
      },
      {
        "id": 302,
        "ticket_number": "TKT-2025-0002",
        "subject": "Billing question about invoice",
        "priority": "medium",
        "status": "new",
        "due_date": "2025-11-12",
        "created_at": "2025-11-08T16:30:00.000Z",
        "contact": {
          "id": 102,
          "first_name": "Michael",
          "last_name": "Chen",
          "email": "michael.chen@example.com"
        },
        "assigned_to": null,
        "comment_count": 0,
        "sla_breach": false,
        "response_time": null
      }
    ],
    "pagination": {
      "total": 18,
      "page": 1,
      "limit": 20,
      "pages": 1
    },
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

#### 3. Get Ticket by ID
**GET** `/tickets/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "due_date": "2025-11-10",
      "resolved_at": null,
      "created_at": "2025-11-08T18:00:00.000Z",
      "updated_at": "2025-11-08T18:30:00.000Z",
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "+1234567890"
      },
      "created_by": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      },
      "assigned_to_user": {
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
        },
        {
          "id": 502,
          "comment": "Found the issue - account not properly upgraded in billing system",
          "is_internal": true,
          "created_at": "2025-11-08T18:30:00.000Z",
          "user": {
            "id": 3,
            "first_name": "Bob",
            "last_name": "Johnson"
          }
        }
      ],
      "sla": {
        "response_time": 15,
        "response_due": "2025-11-08T20:00:00.000Z",
        "response_breached": false,
        "resolution_due": "2025-11-10T18:00:00.000Z",
        "resolution_breached": false
      },
      "time_spent": {
        "total": 45,
        "breached": false
      }
    }
  }
}
```

#### 4. Update Ticket
**PUT** `/tickets/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "subject": "Cannot access premium features - URGENT",
  "priority": "urgent",
  "due_date": "2025-11-09"
}
```

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
      "due_date": "2025-11-09",
      "updated_at": "2025-11-08T18:45:00.000Z"
    },
    "sla": {
      "response_due": "2025-11-08T20:00:00.000Z",
      "resolution_due": "2025-11-09T18:00:00.000Z"
    }
  }
}
```

#### 5. Update Ticket Status
**PATCH** `/tickets/:id/status`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "status": "resolved",
  "resolution_notes": "Fixed by upgrading account in billing system"
}
```

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
      "resolution_time": 60
    },
    "sla": {
      "resolution_time": 60,
      "resolution_breached": false
    }
  }
}
```

#### 6. Assign Ticket
**POST** `/tickets/:id/assign`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "assigned_to": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket assigned successfully",
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

#### 7. Add Ticket Comment
**POST** `/tickets/:id/comments`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "comment": "Customer confirmed the issue is resolved",
  "is_internal": false
}
```

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
        "last_name": "Johnson"
      }
    }
  }
}
```

#### 8. Get Ticket Comments
**GET** `/tickets/:id/comments`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `include_internal`: true/false (default: false for non-admin)

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
        "id": 503,
        "comment": "Customer confirmed the issue is resolved",
        "is_internal": false,
        "created_at": "2025-11-08T19:30:00.000Z",
        "user": {
          "id": 3,
          "first_name": "Bob",
          "last_name": "Johnson"
        }
      }
    ],
    "total": 3
  }
}
```

#### 9. Delete Ticket
**DELETE** `/tickets/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

#### 10. Get SLA Report
**GET** `/tickets/sla/report`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-11-01",
      "end": "2025-11-08"
    },
    "response_times": {
      "average": 25,
      "median": 15,
      "min": 5,
      "max": 180,
      "breached": 2,
      "total": 18,
      "compliance_rate": 88.9
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
        "resolution_compliance": 95
      },
      "high": {
        "response_compliance": 90,
        "resolution_compliance": 92
      },
      "medium": {
        "response_compliance": 88,
        "resolution_compliance": 90
      },
      "low": {
        "response_compliance": 95,
        "resolution_compliance": 93
      }
    },
    "daily_breaches": [
      {
        "date": "2025-11-05",
        "response_breaches": 1,
        "resolution_breaches": 0
      },
      {
        "date": "2025-11-07",
        "response_breaches": 1,
        "resolution_breaches": 1
      }
    ]
  }
}
```

### Email Marketing Endpoints

#### 1. Create Email Template
**POST** `/email-templates`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "id": 602,
        "name": "Follow-up Email",
        "subject": "Following up on our conversation",
        "preview": "Hi {{first_name}}, I wanted to follow up on our recent...",
        "variables": ["first_name", "sales_rep_name"],
        "created_at": "2025-11-07T15:30:00.000Z",
        "updated_at": "2025-11-07T15:30:00.000Z",
        "campaigns_count": 0
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email template deleted successfully"
}
```

**Error Response (400 Bad Request - Template in use):**
```json
{
  "success": false,
  "message": "Cannot delete template that is used in campaigns. Delete campaigns first."
}
```

#### 6. Preview Email Template
**POST** `/email-templates/:id/preview`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

### Campaigns Endpoints

#### 1. Create Campaign
**POST** `/campaigns`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "updated_at": "2025-11-08T21:00:00.000Z"
    }
  }
}
```

#### 2. Get Campaigns
**GET** `/campaigns`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "id": 702,
        "name": "Monthly Newsletter - November",
        "status": "sent",
        "target_count": 150,
        "sent_count": 150,
        "open_count": 89,
        "click_count": 34,
        "open_rate": 59.3,
        "click_rate": 22.7,
        "scheduled_at": "2025-11-01T09:00:00.000Z",
        "sent_at": "2025-11-01T09:05:00.000Z",
        "created_at": "2025-10-25T14:00:00.000Z",
        "template": {
          "id": 603,
          "name": "Newsletter Template",
          "subject": "Your Monthly Update from {{company_name}}"
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "template": {
        "id": 603,
        "name": "Newsletter Template",
        "subject": "Your Monthly Update from {{company_name}}",
        "body": "<h1>Hello {{first_name}},</h1><p>Here's what's new this month...</p>"
      },
      "analytics": {
        "open_rate": 59.3,
        "click_rate": 22.7,
        "unique_opens": 89,
        "unique_clicks": 34,
        "bounces": 2,
        "unsubscribes": 1,
        "complaints": 0
      },
      "recipients": [
        {
          "contact_id": 101,
          "email": "sarah.johnson@example.com",
          "status": "sent",
          "opened_at": "2025-11-01T09:30:00.000Z",
          "clicked_at": null
        },
        {
          "contact_id": 102,
          "email": "michael.chen@example.com",
          "status": "sent",
          "opened_at": "2025-11-01T10:15:00.000Z",
          "clicked_at": "2025-11-01T10:20:00.000Z"
        }
      ]
    }
  }
}
```

#### 4. Update Campaign
**PUT** `/campaigns/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "hour": "10:00",
        "opens": 28
      },
      {
        "hour": "11:00",
        "opens": 22
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
      },
      {
        "url": "https://deracrm.com/pricing",
        "clicks": 12
      },
      {
        "url": "https://deracrm.com/blog",
        "clicks": 4
      }
    ]
  }
}
```

### Dashboard Endpoints

#### 1. Get Dashboard
**GET** `/dashboard`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      "stages": ["Lead", "Qualified", "Proposal", "Negotiation"],
      "values": [75000, 120000, 145000, 55000]
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
      },
      {
        "id": 406,
        "type": "ticket",
        "subject": "Password reset issue",
        "scheduled_date": "2025-11-08T22:00:00.000Z",
        "status": "resolved",
        "contact": {
          "id": 105,
          "first_name": "Emily",
          "last_name": "Davis",
          "company": "Startup Co"
        },
        "user": {
          "id": 3,
          "first_name": "Bob",
          "last_name": "Johnson"
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
      },
      {
        "id": 408,
        "type": "meeting",
        "description": "Team meeting - weekly sync",
        "due_date": "2025-11-09T10:00:00.000Z",
        "priority": "medium"
      }
    ],
    "top_performers": [
      {
        "user_id": 1,
        "name": "John Doe",
        "deals_won": 8,
        "deals_value": 125000,
        "tickets_resolved": 15
      },
      {
        "user_id": 2,
        "name": "Jane Smith",
        "deals_won": 6,
        "deals_value": 98000,
        "tickets_resolved": 22
      }
    ]
  }
}
```

#### 2. Get Sales Chart Data
**GET** `/dashboard/sales-chart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "month": "February",
        "won": 15000,
        "lost": 6000
      },
      {
        "month": "March",
        "won": 18000,
        "lost": 4000
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

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
        "color": "#3B82F6"
      },
      {
        "name": "Qualified",
        "count": 8,
        "value": 120000,
        "color": "#8B5CF6"
      },
      {
        "name": "Proposal",
        "count": 9,
        "value": 145000,
        "color": "#F59E0B"
      },
      {
        "name": "Negotiation",
        "count": 3,
        "value": 55000,
        "color": "#EF4444"
      }
    ],
    "total_value": 395000,
    "weighted_value": 217500
  }
}
```

#### 4. Get Ticket Chart Data
**GET** `/dashboard/ticket-chart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "date": "2025-11-03",
        "new": 7,
        "resolved": 6
      },
      {
        "date": "2025-11-04",
        "new": 8,
        "resolved": 7
      },
      {
        "date": "2025-11-05",
        "new": 6,
        "resolved": 5
      },
      {
        "date": "2025-11-06",
        "new": 9,
        "resolved": 8
      },
      {
        "date": "2025-11-07",
        "new": 3,
        "resolved": 2
      },
      {
        "date": "2025-11-08",
        "new": 2,
        "resolved": 1
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

#### 1. Get System Stats (Admin only)
**GET** `/admin/stats`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### 2. Get Audit Logs (Admin only)
**GET** `/admin/audit-logs`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `user_id`: Filter by user
- `action`: Filter by action type
- `date_from`: Start date
- `date_to`: End date

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
      },
      {
        "id": 1002,
        "user_id": 3,
        "user_name": "Bob Johnson",
        "action": "UPDATE",
        "entity_type": "ticket",
        "entity_id": 301,
        "details": "Updated ticket status to resolved",
        "ip_address": "192.168.1.105",
        "created_at": "2025-11-08T19:00:00.000Z"
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

#### 3. Get User Activity Report (Admin/Manager only)
**GET** `/admin/user-activity`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
      },
      {
        "user_id": 2,
        "name": "Jane Smith",
        "role": "manager",
        "activities": {
          "contacts_created": 22,
          "deals_created": 12,
          "tickets_created": 8,
          "tickets_resolved": 15,
          "campaigns_sent": 1,
          "logins": 10,
          "total_actions": 112
        }
      }
    ]
  }
}
```

#### 4. Get Database Backup (Admin only)
**POST** `/admin/backup`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

#### 5. Get Backup Status (Admin only)
**GET** `/admin/backup/:backup_id/status`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

## Email Notifications

### Types of Email Notifications:
1. **Welcome Email**: Sent after registration
2. **Verification Email**: Email address verification
3. **Password Reset Email**: For password recovery
4. **Ticket Assignment**: When a ticket is assigned to a user
5. **Ticket Resolution**: When a ticket is resolved
6. **Deal Assignment**: When a deal is assigned
7. **Campaign Summary**: After campaign completion
8. **Weekly Summary**: Weekly activity summary
9. **SLA Breach Alert**: When SLA is about to be breached
10. **Daily Digest**: Daily activity digest

### Email Templates
All emails are mobile-responsive and include:
- Company logo
- Clear call-to-action buttons
- Unsubscribe link (for marketing emails)
- Contact information

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "msg": "Field validation error",
      "param": "field_name",
      "location": "body"
    }
  ],
  "timestamp": "2025-11-08T22:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### Common Error Codes
- **400**: Bad Request - Validation errors
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Business logic errors
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error

### Example Error Responses

#### Validation Error (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Email must be valid",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 8 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

#### Unauthorized (401):
```json
{
  "success": false,
  "message": "Please authenticate"
}
```

#### Forbidden (403):
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

#### Not Found (404):
```json
{
  "success": false,
  "message": "Contact not found"
}
```

#### Conflict (409):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### Rate Limit (429):
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

## Rate Limiting

### Limits
- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Email campaigns**: 50 requests per hour
- **File uploads**: 10 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316400
Retry-After: 900
```

## Real-time Updates

### Polling Mechanism
Since WebSocket is not used, real-time updates are achieved through:

1. **Immediate Responses**: All create/update/delete operations return updated data
2. **Periodic Polling**: Frontend can poll for updates at intervals
3. **Email Notifications**: Critical updates sent via email

### Frontend Implementation Example:
```javascript
class DeraCRMClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.dashboardData = null;
  }

  async getDashboard() {
    const response = await fetch(`${this.baseURL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      this.dashboardData = result.data;
      return result;
    }
    
    return result;
  }

  // Poll for dashboard updates
  startDashboardPolling(interval = 30000) {
    this.pollingInterval = setInterval(async () => {
      await this.getDashboard();
      this.onDashboardUpdate(this.dashboardData);
    }, interval);
  }

  onDashboardUpdate(data) {
    // Override this method to handle updates
    console.log('Dashboard updated:', data);
  }
}
```

## Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
SERVER_URL=https://api.deracrm.com

# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=dera_crm

# JWT
JWT_SECRET=your-strong-jwt-secret
JWT_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@deracrm.com

# Frontend
FRONTEND_URL=https://app.deracrm.com

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,pdf,doc,docx,csv

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
```

### Health Check Endpoint
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "success": true,
  "timestamp": "2025-11-08T22:30:00.000Z",
  "service": "Dera CRM API",
  "version": "1.0.0",
  "database": "connected",
  "uptime": "3 days, 5 hours",
  "memory": {
    "heapUsed": "52.3 MB",
    "heapTotal": "95.2 MB"
  }
}
```

## Quick Start Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'http://localhost:5000/api';

class DeraCRMAPI {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.success) {
      this.token = result.data.token;
      this.headers.Authorization = `Bearer ${this.token}`;
    }
    return result;
  }

  async getContacts() {
    const response = await fetch(`${API_BASE}/contacts`, {
      headers: this.headers
    });
    return await response.json();
  }

  async createContact(contact) {
    const response = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(contact)
    });
    return await response.json();
  }

  async createDeal(deal) {
    const response = await fetch(`${API_BASE}/deals`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(deal)
    });
    return await response.json();
  }
}
```

### cURL Examples

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Create Contact:
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah.johnson@example.com",
    "phone": "+1234567890",
    "company": "Tech Solutions Ltd"
  }'
```

#### Create Deal:
```bash
curl -X POST http://localhost:5000/api/deals \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Plan",
    "contact_id": 101,
    "stage": "lead",
    "amount": 15000.00
  }'
```

#### Upload Avatar:
```bash
curl -X POST http://localhost:5000/api/users/avatar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "avatar=@/path/to/avatar.jpg"
```

## Testing

### Test Credentials
```json
{
  "admin": {
    "email": "admin@example.com",
    "password": "Admin123!"
  },
  "manager": {
    "email": "manager@example.com",
    "password": "Manager123!"
  },
  "agent": {
    "email": "agent@example.com",
    "password": "Agent123!"
  }
}
```

### Test Data
```json
{
  "contact": {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "+1234567890"
  },
  "deal": {
    "name": "Test Deal",
    "amount": 10000,
    "stage": "lead"
  },
  "ticket": {
    "subject": "Test Ticket",
    "description": "This is a test ticket",
    "priority": "medium"
  }
}
```

---

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** Production Ready  
**Author:** Nwankwo Chidera David