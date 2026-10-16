/**
 * Email delivery is not wired yet. Inserts set email_status = skipped.
 * A later provider can pick pending rows and send without changing in-app flow.
 */
export const NOTIFICATION_EMAIL_READY = false;
