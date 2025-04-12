// Firebase Firestore Schema Reference

/**
 * Partners Collection
 * 
 * Main collection for all partners and admin users
 * 
 * @collection partners
 * 
 * @property {string} id - Unique identifier (Firebase Auth UID)
 * @property {string} name - Partner name
 * @property {string} email - Partner email
 * @property {string} role - Role (partner, admin, sponsor)
 * @property {boolean} active - Whether the partner is active
 * @property {timestamp} createdAt - When the partner was created
 * @property {timestamp} updatedAt - When the partner was last updated
 * @property {string} subscription - Subscription tier (none, basic, professional, enterprise)
 * @property {number} maxLeads - Maximum number of leads allowed
 * @property {number} currentLeads - Current number of leads
 * @property {object} responseMetrics - Lead response metrics
 * @property {object} notificationSettings - Notification preferences
 * @property {object} siteDetails - Research site details
 * @property {object} billing - Billing information
 * 
 * Subcollections:
 * - leads: Partner's leads
 * - notifications: Partner's notifications
 * - messages: Partner's messages
 * - sites: Partner's research sites
 */

/**
 * Leads Subcollection
 * 
 * Stored under partners/{partnerId}/leads
 * 
 * @subcollection partners/{partnerId}/leads
 * 
 * @property {string} id - Unique identifier
 * @property {string} firstName - Lead first name
 * @property {string} lastName - Lead last name
 * @property {string} email - Lead email
 * @property {string} phone - Lead phone number
 * @property {string} status - Lead status (new, not_contacted, contacted, qualified, converted, lost)
 * @property {string} quality - Lead quality (hot, warm, cold)
 * @property {timestamp} createdAt - When the lead was created
 * @property {timestamp} lastUpdated - When the lead was last updated
 * @property {timestamp} lastViewed - When the lead was last viewed
 * @property {string} notes - Notes about the lead
 * @property {string} indication - Medical indication/condition
 * @property {string} protocol - Protocol number
 * @property {array} statusHistory - History of status changes
 * @property {array} assignmentHistory - History of partner assignments
 */

/**
 * Notifications Subcollection
 * 
 * Stored under partners/{partnerId}/notifications
 * 
 * @subcollection partners/{partnerId}/notifications
 * 
 * @property {string} id - Unique identifier
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {string} type - Notification type (system, admin, lead)
 * @property {boolean} read - Whether the notification has been read
 * @property {timestamp} createdAt - When the notification was created
 * @property {string} leadId - Optional reference to a lead
 */

/**
 * Messages Subcollection
 * 
 * Stored under partners/{partnerId}/messages
 * 
 * @subcollection partners/{partnerId}/messages
 * 
 * @property {string} id - Unique identifier
 * @property {string} content - Message content
 * @property {string} senderId - Sender ID
 * @property {string} recipientId - Recipient ID
 * @property {timestamp} timestamp - When the message was sent
 * @property {boolean} read - Whether the message has been read
 * @property {string} leadId - Optional reference to a lead
 */

/**
 * Sites Subcollection
 * 
 * Stored under partners/{partnerId}/sites
 * 
 * @subcollection partners/{partnerId}/sites
 * 
 * @property {string} id - Unique identifier
 * @property {string} name - Site name
 * @property {string} address - Site address
 * @property {string} city - Site city
 * @property {string} state - Site state
 * @property {string} zipCode - Site zip code
 * @property {string} phone - Site phone number
 * @property {string} principalInvestigator - Principal investigator name
 * @property {string} status - Site status (active, inactive)
 * @property {number} leads - Number of leads assigned to the site
 * @property {string} responseRate - Response rate percentage
 * @property {timestamp} createdAt - When the site was created
 */

/**
 * Global Collections
 */

/**
 * Notifications Collection (Global)
 * 
 * Global collection for real-time notifications
 * 
 * @collection notifications
 * 
 * @property {string} id - Unique identifier
 * @property {string} partnerId - Target partner ID
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {string} type - Notification type (system, admin, lead)
 * @property {boolean} read - Whether the notification has been read
 * @property {timestamp} createdAt - When the notification was created
 * @property {string} createdBy - Who created the notification
 * @property {string} leadId - Optional reference to a lead
 */

/**
 * Messages Collection (Global)
 * 
 * Global collection for message oversight by admins
 * 
 * @collection messages
 * 
 * @property {string} id - Unique identifier
 * @property {string} content - Message content
 * @property {string} senderId - Sender ID
 * @property {string} recipientId - Recipient ID
 * @property {timestamp} timestamp - When the message was sent
 * @property {boolean} read - Whether the message has been read
 * @property {string} leadId - Optional reference to a lead
 * @property {string} notificationId - Optional reference to a notification
 */

/**
 * ScreenerForms Collection
 * 
 * Global collection for patient screener forms
 * 
 * @collection screenerForms
 * 
 * @property {string} id - Unique identifier
 * @property {string} name - Form name
 * @property {string} description - Form description
 * @property {timestamp} createdAt - When the form was created
 * @property {timestamp} updatedAt - When the form was last updated
 * @property {string} status - Form status (draft, published)
 * @property {array} fields - Form fields
 * @property {string} embedCode - Form embed code
 * @property {array} assignedPartners - Partner IDs assigned to the form
 */

/**
 * Customers Collection
 * 
 * Global collection for customer data
 * 
 * @collection customers
 * 
 * @property {string} id - Unique identifier
 * @property {string} partnerId - Partner ID that owns the customer
 * @property {string} name - Customer name
 * @property {string} email - Customer email
 * @property {string} phone - Customer phone number
 * @property {string} status - Customer status (active, inactive, pending)
 * @property {timestamp} createdAt - When the customer was created
 * @property {timestamp} updatedAt - When the customer was last updated
 * @property {string} notes - Notes about the customer
 */

/**
 * Stripe Integration Collections
 */

/**
 * Stripe Checkout Sessions
 * 
 * Used for creating new subscription checkout sessions
 * 
 * @collection stripe_checkout_sessions
 * 
 * @property {string} id - Unique identifier
 * @property {string} price - Stripe price ID
 * @property {string} success_url - Redirect URL on success
 * @property {string} cancel_url - Redirect URL on cancel
 * @property {string} mode - Checkout mode (subscription, payment)
 * @property {array} payment_method_types - Payment method types
 * @property {object} metadata - Additional metadata
 * @property {string} sessionId - Stripe session ID (added by function)
 * @property {timestamp} created - When the session was created
 */

/**
 * Stripe Portal Sessions
 * 
 * Used for creating customer portal sessions
 * 
 * @collection stripe_portal_sessions
 * 
 * @property {string} id - Unique identifier
 * @property {string} partnerId - Partner ID
 * @property {string} returnUrl - URL to return to after session
 * @property {string} url - Portal URL (added by function)
 * @property {timestamp} created - When the session was created
 */