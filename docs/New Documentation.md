# DERA CRM Backend API Documentation

## Overview

DERA CRM is a comprehensive customer relationship management system designed for sales teams, support agents, and administrators. The API provides endpoints for managing contacts, deals, tickets, activities, email campaigns, and internal communications.

Base URL: `/api/v1`

Authentication: Bearer token in Authorization header

All API responses follow a consistent structure with `success`, `message`, and `data` fields.

## Authentication Endpoints

### POST /auth/register

Registers a new user account.

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

Response: Returns user object with token and refreshToken.

### POST /auth/login

Authenticates a user.

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response: Returns user object with token and refreshToken.

### POST /auth/refresh-token

Refreshes an expired access token.

Request body:
```json
{
  "refresh_token": "uuid-refresh-token"
}
```

Response: Returns new token and refreshToken.

### POST /auth/logout

Logs out a user and revokes refresh token.

Request body:
```json
{
  "refresh_token": "uuid-refresh-token"
}
```

### GET /auth/verify-email/:token

Verifies user email address using token from email.

### POST /auth/forgot-password

Sends password reset email.

Request body:
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password

Resets password using token.

Request body:
```json
{
  "token": "reset-token",
  "password": "NewSecurePass123"
}
```

### POST /auth/resend-verification

Resends verification email.

Request body:
```json
{
  "email": "user@example.com"
}
```

## Users and Profile Endpoints

### GET /users/profile

Returns current user profile.

Response: Returns User object with organization included.

### PUT /users/profile

Updates current user profile.

Request body: UpdateProfileData
- first_name (string, optional)
- last_name (string, optional)
- email (string, optional)

### PUT /users/change-password

Changes user password.

Request body: ChangePasswordData
- current_password (string, required)
- new_password (string, required)

### POST /users/avatar

Uploads user avatar. Content-Type: multipart/form-data.

Form field:
- avatar (file, required, max 2MB, formats: jpg/jpeg/png/gif)

Response: Returns updated avatar URL.

### DELETE /users/avatar

Removes user avatar.

### GET /users

Returns paginated list of users. Admin only.

Query parameters: UserFilters
- page (number, default 1)
- limit (number, default 20, max 100)
- role (string, optional: admin/manager/agent)
- search (string, optional)

Response: UsersResponse with User array and pagination.

### GET /users/:id

Returns user by ID. Admin/Manager only.

Response: User object with stats (contacts_created, deals_owned, tickets_assigned, activities_logged)

### PUT /users/:id/role

Updates user role. Admin only.

Request body:
```json
{
  "role": "manager"
}
```

### DELETE /users/:id

Deletes user. Admin only.

## User Impersonation Endpoints

### POST /users/:id/impersonate

Allows admin to impersonate another user. Admin only.

Response: ImpersonationResponse with isImpersonating=true and impersonatedBy info.

The impersonation token expires in 2 hours.

### POST /users/stop-impersonating

Ends impersonation session and returns to original admin account.

Response: StopImpersonationResponse with isImpersonating=false.

## Organization Endpoints

### GET /organization/settings

Returns organization settings.

Response: Organization object.

### PUT /organization/settings

Updates organization settings. Admin only.

Request body: UpdateOrganizationData
- company_name (string, optional)
- company_email (string, optional)
- company_phone (string, optional)
- company_address (string, optional)
- website (string, optional)
- timezone (string, optional)
- currency (string, optional)

### POST /organization/logo

Uploads company logo. Admin only. Content-Type: multipart/form-data.

Form field:
- logo (file, required, max 3MB, formats: jpg/jpeg/png/gif)

Response: LogoUploadResponse with company_logo URL.

### POST /organization/invite

Invites a new user to the organization. Admin only.

Request body: InviteUserData
- email (string, required)
- first_name (string, required)
- last_name (string, required)
- role (string, required: admin/manager/agent)

### GET /organization/users

Returns organization users. Admin/Manager only.

Same query parameters as GET /users.

## Contact Management Endpoints

### POST /contacts

Creates a new contact.

Request body: CreateContactData
- first_name (string, required)
- last_name (string, required)
- email (string, required)
- phone (string, optional)
- company (string, optional)
- job_title (string, optional)
- status (string, optional: active/inactive/lead, default active)
- source (string, optional: website/referral/social/email/call/event/import/other, default other)
- notes (string, optional)
- tags (string array, optional)

Response: Returns created Contact object.

### GET /contacts

Returns paginated list of contacts.

Query parameters: ContactFilters
- page (number, default 1)
- limit (number, default 20, max 100)
- status (string, optional)
- tag (string, optional)
- search (string, optional)
- sort_by (string, optional: created_at/first_name/last_name/email/company)
- sort_order (string, optional: asc/desc)

Response: ContactsResponse with Contact array, pagination, and filters object containing available statuses and tags.

### GET /contacts/:id

Returns contact by ID.

Response: ContactDetailResponse with contact, deals, tickets, and activities.

### PUT /contacts/:id

Updates a contact.

Request body: UpdateContactData - all fields optional.

### DELETE /contacts/:id

Deletes a contact. Contact must have no associated deals or tickets.

### POST /contacts/:id/avatar

Uploads contact avatar. Content-Type: multipart/form-data.

Form field:
- avatar (file, required)

### DELETE /contacts/:id/avatar

Removes contact avatar.

### POST /contacts/import

Imports contacts from CSV file. Admin/Manager only. Content-Type: multipart/form-data.

Form fields:
- file (file, required, CSV format)
- column_mapping (string, optional, JSON object mapping CSV columns to DB fields)

Response: ContactImportResponse with import_id.

### GET /contacts/import/:import_id/status

Returns import status. Admin/Manager only.

Response: ContactImportStatusResponse with status (pending/processing/completed/failed) and statistics.

### GET /contacts/export

Exports contacts to CSV or Excel.

Query parameters:
- format (string, optional: csv/excel, default csv)
- fields (string, optional, comma-separated list of fields to include)
- status (string, optional)
- tag (string, optional)

Response: ContactExportResponse with download_url and expires_at.

### POST /contacts/:id/tags

Adds a tag to contact.

Request body:
```json
{
  "tag": "vip"
}
```

### DELETE /contacts/:id/tags/:tag

Removes a tag from contact.

### GET /contacts/tags/all

Returns all tags with usage counts.

Response: TagResponse with tags array containing name and count.

## Contact Attachments Endpoints

### POST /contacts/:contactId/attachments

Uploads a file attachment for a contact. Content-Type: multipart/form-data.

URL parameter: contactId (integer)

Form fields:
- file (file, required)
- description (string, optional)

File size limits by type:
- Images: 5MB
- Videos: 25MB
- Audio: 10MB
- Documents: 5MB
- Other types: 5MB

Response: Returns attachment object with id, filename, original_name, file_size, mime_type, file_type, description, and created_at.

### GET /contacts/:contactId/attachments

Returns all attachments for a contact.

Response: Returns attachments array with file_size_formatted string and uploader info.

### DELETE /contacts/:contactId/attachments/:attachmentId

Deletes an attachment. Contact owner or uploader only.

## Deal Management Endpoints

### POST /deals

Creates a new deal.

Request body: CreateDealData
- name (string, required)
- contact_id (integer, required)
- stage (string, required: lead/qualified/proposal/negotiation/won/lost)
- amount (number, required)
- probability (number, required, 0-100)
- expected_close_date (string, optional, ISO date)
- notes (string, optional)
- user_id (integer, optional, assigns to another user, admin/manager only)

### GET /deals

Returns paginated list of deals.

Query parameters: DealFilters
- page (number)
- limit (number)
- stage (string)
- status (string: open/won/lost)
- user_id (integer)
- contact_id (integer)
- search (string)
- date_from (string, ISO date)
- date_to (string, ISO date)
- min_amount (number)
- max_amount (number)

Response: DealsResponse with deals array, pagination, and pipeline summary.

### GET /deals/:id

Returns deal by ID.

Response: DealDetailResponse with deal, contact, owner, and activities.

### PUT /deals/:id

Updates a deal.

Request body: UpdateDealData - all fields optional.

### PATCH /deals/:id/stage

Updates deal stage for drag-and-drop functionality.

Request body:
```json
{
  "stage": "won",
  "actual_close_date": "2025-12-15"
}
```

### POST /deals/:id/win

Marks deal as won.

Request body: WinDealData
- actual_close_date (string, required, ISO date)
- notes (string, optional)

### POST /deals/:id/lost

Marks deal as lost.

Request body: LostDealData
- actual_close_date (string, required, ISO date)
- notes (string, optional)
- loss_reason (string, optional: competitor_price/competitor_features/budget/timing/other)

### DELETE /deals/:id

Deletes a deal.

### GET /deals/pipeline/summary

Returns pipeline summary.

Query parameter:
- user_id (integer, optional, filter by owner)

Response: PipelineSummaryResponse with stages, totals, and forecast.

### GET /deals/kanban

Returns kanban board view.

Query parameter:
- user_id (integer, optional)

Response: KanbanBoardResponse with columns containing deals grouped by stage.

## Activity Management Endpoints

### POST /activities

Creates a new activity.

Request body: CreateActivityData
- type (string, required: call/email/meeting/task/note/follow-up)
- subject (string, required)
- description (string, optional)
- contact_id (integer, optional)
- deal_id (integer, optional)
- scheduled_date (string, required, ISO datetime)
- duration (integer, optional, minutes)
- user_id (integer, optional, assigns to another user, admin/manager only)

Note: Activities of type "note" are automatically completed immediately with scheduled_date set to current time.

### GET /activities

Returns paginated list of activities.

Query parameters: ActivityFilters
- page (number)
- limit (number)
- type (string)
- contact_id (integer)
- deal_id (integer)
- user_id (integer)
- status (string: scheduled/completed/cancelled/overdue)
- date_from (string, ISO date)
- date_to (string, ISO date)

### GET /activities/:id

Returns activity by ID.

Response: ActivityDetailResponse with activity, contact, deal, and user.

### PUT /activities/:id

Updates an activity.

Request body: UpdateActivityData - all fields optional.

Note: Activities already completed cannot be updated.

### POST /activities/:id/complete

Marks activity as completed.

Request body: CompleteActivityData
- outcome (string, required)
- duration (integer, optional)

### DELETE /activities/:id

Deletes an activity.

### GET /activities/today

Returns today's activities.

Query parameter:
- user_id (integer, optional)

Response: TodayActivitiesResponse with date, activities, and summary.

### GET /activities/upcoming

Returns upcoming activities.

Query parameters:
- days (integer, optional, default 7)
- user_id (integer, optional)

Response: UpcomingActivitiesResponse with range, activities, and grouped_by_date.

## Support Ticket Endpoints

### POST /tickets

Creates a new support ticket.

Request body: CreateTicketData
- subject (string, required)
- description (string, required)
- contact_id (integer, required)
- priority (string, optional: low/medium/high/urgent, default medium)
- due_date (string, optional, ISO date)
- assigned_to (integer, optional)

Ticket numbers are auto-generated in format TKT-YYYY-XXXX.

### GET /tickets

Returns paginated list of tickets.

Query parameters: TicketFilters
- page (number)
- limit (number)
- status (string: new/open/pending/resolved/closed)
- priority (string)
- assigned_to (integer)
- contact_id (integer)
- search (string)

Response: TicketsResponse with ticket array, pagination, and summary (by_status and by_priority).

### GET /tickets/:id

Returns ticket by ID.

Response: TicketDetailResponse with ticket, contact, createdBy, assignedTo, comments, SLA metrics, and time spent.

### PUT /tickets/:id

Updates a ticket.

Request body: UpdateTicketData - all fields optional.

Cannot update tickets with status resolved or closed.

### PATCH /tickets/:id/status

Updates ticket status.

Request body: UpdateTicketStatusData
- status (string, required: new/open/pending/resolved/closed)
- resolution_notes (string, optional, added as internal comment when resolving)

When status changes to resolved, resolved_at is automatically set and email notification sent to creator.

### POST /tickets/:id/assign

Assigns or unassigns a ticket. Admin/Manager only.

Request body: AssignTicketData
- assigned_to (integer or null)

### POST /tickets/:id/comments

Adds a comment to a ticket.

Request body: CreateCommentData
- comment (string, required)
- is_internal (boolean, optional, default false)

Internal comments are only visible to admins, managers, and assigned agent.

### GET /tickets/:id/comments

Returns ticket comments.

Query parameter:
- include_internal (boolean, optional, staff only)

Response: CommentsResponse with comments array and total count.

### DELETE /tickets/:id

Deletes a ticket. Admin only.

### GET /tickets/sla/report

Returns SLA compliance report. Admin/Manager only.

Query parameters:
- start_date (string, optional, ISO date)
- end_date (string, optional, ISO date)

Response: SLAReportResponse with response_times, resolution_times, by_priority, and daily_breaches.

## Messaging System Endpoints

### POST /messages

Sends a new message to one or more recipients.

Request body:
- subject (string, optional, max 255 chars)
- body (string, required)
- recipient_ids (number array, required)
- parent_id (number, optional, for replies)
- is_private (boolean, optional, default false)

All recipients receive in-app notifications if they have can_receive enabled.

### GET /messages

Returns user's messages.

Query parameters:
- page (number, default 1)
- limit (number, default 20)
- folder (string, default inbox: inbox/sent/all/trash)

Response includes unread_count in the response body.

### GET /messages/:id

Returns message by ID. User must be a participant.

Message is automatically marked as read for the viewing user.

Response includes sender, participants, parent message, and replies.

### POST /messages/:id/reply

Replies to an existing message.

Request body:
- body (string, required)
- is_private (boolean, optional)

All original participants receive the reply and notifications.

### PUT /messages/:id/privacy

Updates message privacy setting for current user.

Request body:
- can_receive (boolean, required)

When can_receive is false, user will not receive notifications for this thread.

### DELETE /messages/:id

Moves message to trash for current user. Message is hidden but not deleted from database.

### GET /messages/unread/count

Returns count of unread messages.

Response:
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

## Notifications Endpoints

### GET /notifications

Returns user's notifications.

Query parameters:
- page (number, default 1)
- limit (number, default 20)
- unread_only (boolean, default false)

Response includes unread_count in the response body.

Notification types include: ticket_assigned, ticket_comment, ticket_resolved, ticket_sla_warning, ticket_sla_breach, deal_assigned, activity_reminder, message_received, campaign_completed, backup_completed, backup_failed, import_completed, import_failed.

### PUT /notifications/:id/read

Marks a single notification as read.

### PUT /notifications/read-all

Marks all notifications as read.

### DELETE /notifications/:id

Deletes a notification.

### GET /notifications/preferences

Returns user's notification preferences.

Response includes preferences array with type, email_enabled, and in_app_enabled for each notification type.

### PUT /notifications/preferences

Updates notification preferences.

Request body:
```json
{
  "preferences": [
    {
      "type": "message_received",
      "email_enabled": false,
      "in_app_enabled": true
    }
  ]
}
```

## Email Template Endpoints

### POST /email-templates

Creates an email template.

Request body: CreateTemplateData
- name (string, required, unique)
- subject (string, required)
- body (string, required, HTML content)
- variables (string array, optional, auto-extracted if not provided)

Variables are extracted from {{variable_name}} placeholders.

### GET /email-templates

Returns paginated list of templates.

Query parameters:
- page (number)
- limit (number)
- search (string)

Response: TemplatesResponse with templates and pagination.

### GET /email-templates/:id

Returns template by ID.

Response: TemplateResponse with template.

### PUT /email-templates/:id

Updates a template.

Request body: UpdateTemplateData - all fields optional.

### DELETE /email-templates/:id

Deletes a template. Cannot delete if used in campaigns.

### POST /email-templates/:id/preview

Previews template with test data.

Request body: PreviewTemplateData
- test_data (object, required, key-value pairs for variables)

Response: PreviewResponse with rendered subject, body, and preview_html.

### POST /email-templates/:id/duplicate

Duplicates a template. Creates copy with "(Copy)" suffix.

## Campaign Endpoints

### POST /campaigns

Creates an email campaign.

Request body: CreateCampaignData
- name (string, required)
- template_id (integer, required)
- target_list (object, required)
  - contact_ids (number array, optional)
  - filters (object, optional)
    - tags (string array)
    - status (string)
- scheduled_at (string, optional, ISO datetime)

### GET /campaigns

Returns paginated list of campaigns.

Query parameters: CampaignFilters
- page (number)
- limit (number)
- status (string: draft/scheduled/sending/sent/cancelled)
- search (string)

Response: CampaignsResponse with campaign array and pagination.

### GET /campaigns/:id

Returns campaign by ID.

Response: CampaignDetailResponse with campaign, template, recipients, createdBy, and analytics.

### PUT /campaigns/:id

Updates a campaign.

Request body: UpdateCampaignData - all fields optional.

### POST /campaigns/:id/send

Starts sending a campaign.

Request body:
- send_immediately (boolean, default true)

### POST /campaigns/:id/cancel

Cancels a scheduled or sending campaign.

### POST /campaigns/:id/test

Sends test email.

Request body: TestEmailData
- test_email (string, required)
- test_data (object, required)

### GET /campaigns/:id/analytics

Returns campaign analytics.

Response: CampaignAnalyticsResponse with summary, rates, hourly_opens, device_breakdown, and top_links.

### POST /campaigns/:id/duplicate

Duplicates a campaign. Creates copy with "(Copy)" suffix.

## Dashboard Endpoints

### GET /dashboard

Returns dashboard data for current user.

Query parameter:
- user_id (integer, optional, admin only)

Response: DashboardResponse with summary, sales_chart, pipeline_value_chart, ticket_volume_chart, recent_activities, task_list, and top_performers.

### GET /dashboard/sales-chart

Returns sales chart data.

Query parameters:
- period (string, optional: month/quarter/year, default month)
- year (integer, optional)

### GET /dashboard/pipeline-chart

Returns pipeline chart data.

### GET /dashboard/ticket-chart

Returns ticket volume chart data.

Query parameters:
- days (integer, optional, default 7)

## Administration Endpoints

### GET /admin/stats

Returns system statistics. Admin only.

Response: SystemStatsResponse with users, contacts, deals, tickets, campaigns, storage, and api_usage.

### GET /admin/audit-logs

Returns paginated audit logs. Admin only.

Query parameters: AuditLogFilters
- page (number)
- limit (number, max 100)
- user_id (integer)
- action (string)
- entity_type (string)
- date_from (string, ISO date)
- date_to (string, ISO date)

Response: AuditLogsResponse with logs array and pagination.

### GET /admin/audit-logs/:id/detail

Returns detailed audit log by ID. Admin only.

Response: AuditLogDetailResponse with parsed details object.

### GET /admin/audit-logs/entity/:entityType/:entityId

Returns change history for a specific entity. Admin/Manager only.

Response: EntityChangeHistory with history items and pagination.

### GET /admin/audit-logs/summary

Returns audit log summary. Admin only.

Query parameters:
- days (integer, optional, default 30)
- entity_type (string, optional)

Response: AuditLogSummaryResponse with summary statistics.

### GET /admin/user-activity

Returns user activity report. Admin/Manager only.

Query parameters:
- start_date (string, ISO date)
- end_date (string, ISO date)
- user_id (integer, optional)

Response: UserActivityResponse with period and users array.

### POST /admin/backup

Creates database backup. Admin only.

Response: BackupResponse with backup_id and estimated_time.

### GET /admin/backup/:backup_id/status

Returns backup status. Admin only.

Response: BackupStatusResponse with status (processing/completed/failed), size, download_url, expires_at, and completed_at.

### GET /admin/health

Returns system health. Admin only.

Response: SystemHealthResponse with status, services, and system metrics.

## System Endpoints

### GET /health

Public health check endpoint.

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T22:30:00.000Z",
  "service": "DERA CRM API",
  "version": "1.0.0",
  "environment": "production"
}
```

## Common Types

### User
```typescript
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'agent';
  avatar: string | null;
  is_verified: boolean;
  last_login: string;
  organization?: Organization;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
}
```

### Contact
```typescript
interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: 'active' | 'inactive' | 'lead';
  source: string | null;
  notes: string | null;
  tags: string[];
  user_id: number;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}
```

### Organization
```typescript
interface Organization {
  id: number;
  company_name: string;
  company_logo: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  website: string | null;
  timezone: string;
  date_format: string;
  currency: string;
  created_at: string;
  updated_at: string;
}
```

## Pagination

All list endpoints support pagination with the same response structure:

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}
```

## Error Handling

Error responses include:

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

Common HTTP status codes:
- 200: Success
- 201: Created
- 202: Accepted for processing
- 400: Bad request (validation error)
- 401: Unauthorized (invalid or missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 409: Conflict (duplicate resource)
- 429: Too many requests (rate limit exceeded)
- 500: Internal server error

## Rate Limiting

Rate limits are applied per IP address or authenticated user:

- Authentication endpoints: 5 requests per 15 minutes
- General API: 100 requests per 15 minutes
- Campaign sending: 50 requests per hour
- File uploads: 10 requests per hour
- Exports: 10 requests per hour

## Authentication

All endpoints except public authentication endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from the login or register endpoints and expire after 7 days. Use the refresh token endpoint to obtain a new token.