import { AuditLog} from '../models';
import { AUDIT_ACTIONS, AuditAction, EntityType } from '../config/constants';

interface Change {
  field: string;
  old_value: any;
  new_value: any;
  display_name: string;
}

interface AuditOptions {
  userId: number;
  action: AuditAction; // Use the specific type from constants
  entityType: EntityType; // Use the specific type from constants
  entityId: number;
  entityName?: string;
  req: any; // Express request object
  oldData?: any; // For update operations
  newData?: any; // For update operations
  additionalInfo?: Record<string, any>; // Optional extra info
}

/**
 * Format field names for human readability
 */
function getDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone Number',
    company: 'Company',
    job_title: 'Job Title',
    status: 'Status',
    stage: 'Pipeline Stage',
    amount: 'Amount',
    probability: 'Probability',
    priority: 'Priority',
    subject: 'Subject',
    description: 'Description',
    assigned_to: 'Assigned To',
    due_date: 'Due Date',
    expected_close_date: 'Expected Close Date',
    actual_close_date: 'Actual Close Date',
    notes: 'Notes',
    tags: 'Tags',
    source: 'Source',
    type: 'Type',
    scheduled_date: 'Scheduled Date',
    duration: 'Duration',
    outcome: 'Outcome',
    name: 'Name',
    template_id: 'Template',
    target_count: 'Target Count',
    is_internal: 'Internal Note',
    comment: 'Comment',
    ticket_number: 'Ticket Number',
    role: 'Role',
    is_verified: 'Verified',
    last_login: 'Last Login',
    avatar: 'Avatar',
    company_name: 'Company Name',
    timezone: 'Timezone',
    currency: 'Currency',
    date_format: 'Date Format',
    company_logo: 'Company Logo',

  // Ticket fields
  resolved_at: 'Resolved At',
  
  // Campaign fields
  sent_count: 'Sent Count',
  open_count: 'Open Count',
  click_count: 'Click Count',
  scheduled_at: 'Scheduled At',
  sent_at: 'Sent At',
  
  // Campaign Recipient fields
  campaign_id: 'Campaign',
  contact_id: 'Contact',
  error_message: 'Error Message',
  opened_at: 'Opened At',
  clicked_at: 'Clicked At',
  
  // Organization fields
  company_email: 'Company Email',
  company_phone: 'Company Phone',
  company_address: 'Company Address',
  website: 'Website',
  };
  return displayNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Track changes between old and new data
 */
function trackChanges(oldData: any, newData: any, excludeFields: string[] = ['updated_at', 'created_at', 'id']): Change[] {
  if (!oldData || !newData) return [];
  
  const changes: Change[] = [];
  
  for (const key of Object.keys(newData)) {
    if (excludeFields.includes(key)) continue;
    
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;
    
    changes.push({
      field: key,
      old_value: oldValue,
      new_value: newValue,
      display_name: getDisplayName(key)
    });
  }
  
  return changes;
}

/**
 * Format a single value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return '(empty)';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Generate a human-readable summary of changes
 */
function generateSummary(action: AuditAction, entityType: EntityType, entityName: string, changes: Change[]): string {
  const type = entityType.toLowerCase().replace(/_/g, ' ');
  
  switch (action) {
    case AUDIT_ACTIONS.CREATE:
      return `Created ${type}: ${entityName}`;
    
    case AUDIT_ACTIONS.UPDATE:
      if (changes.length === 0) {
        return `Updated ${type}: ${entityName}`;
      }
      if (changes.length === 1) {
        return `Updated ${type} "${entityName}": Changed ${changes[0].display_name} from "${formatValue(changes[0].old_value)}" to "${formatValue(changes[0].new_value)}"`;
      }
      if (changes.length <= 3) {
        const changesText = changes.map(c => c.display_name).join(', ');
        return `Updated ${type} "${entityName}": Changed ${changesText}`;
      }
      return `Updated ${type} "${entityName}": Changed ${changes.length} fields`;
    
    case AUDIT_ACTIONS.DELETE:
      return `Deleted ${type}: ${entityName}`;
    
    case AUDIT_ACTIONS.VIEW:
      return `Viewed ${type}: ${entityName}`;
    
    case AUDIT_ACTIONS.LOGIN:
      return `User logged in`;
    
    case AUDIT_ACTIONS.LOGOUT:
      return `User logged out`;
    
    case AUDIT_ACTIONS.IMPERSONATE:
      return `Started impersonating user: ${entityName}`;
    
    case AUDIT_ACTIONS.STOP_IMPERSONATING:
      return `Stopped impersonating user`;
    
    case AUDIT_ACTIONS.EXPORT:
      return `Exported ${type}: ${entityName}`;
    
    case AUDIT_ACTIONS.IMPORT:
      return `Imported ${type}: ${entityName}`;
    
    default:
      return `${action} ${type}: ${entityName}`;
  }
}

/**
 * Main function to create detailed audit log
 */
export async function createDetailedAudit(options: AuditOptions): Promise<void> {
  const { userId, action, entityType, entityId, entityName, req, oldData, newData, additionalInfo } = options;
  
  let changes: Change[] = [];
  let summary = '';
  
  // Track changes for update operations
  if (action === AUDIT_ACTIONS.UPDATE && oldData && newData) {
    changes = trackChanges(oldData, newData);
  }
  
  // Generate summary
  const displayName = entityName || `${entityType}_${entityId}`;
  summary = generateSummary(action, entityType, displayName, changes);
  
  // Build detailed audit object
  const auditDetails: any = {
    action,
    entity_id: entityId,
    entity_name: displayName,
    summary,
    changes,
    timestamp: new Date().toISOString(),
    user_id: userId,
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.get('user-agent') || null
  };
  
  // Add additional info if provided
  if (additionalInfo) {
    auditDetails.additional_info = additionalInfo;
  }
  
  // Add old data for delete operations
  if (action === AUDIT_ACTIONS.DELETE && oldData) {
    auditDetails.deleted_data = oldData;
  }
  
  // Create the audit log
  await AuditLog.create({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: JSON.stringify(auditDetails),
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.get('user-agent') || null
  });
}

/**
 * Simplified create audit for operations without change tracking
 */
export async function createSimpleAudit(
  userId: number,
  action: AuditAction,
  entityType: EntityType,
  entityId: number,
  entityName: string,
  req: any
): Promise<void> {
  const auditDetails = {
    action,
    entity_id: entityId,
    entity_name: entityName,
    summary: generateSummary(action, entityType, entityName, []),
    timestamp: new Date().toISOString(),
    user_id: userId,
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.get('user-agent') || null
  };
  
  await AuditLog.create({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: JSON.stringify(auditDetails),
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.get('user-agent') || null
  });
}