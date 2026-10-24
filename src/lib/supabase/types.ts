/**
 * Database types aligned with the Alvora `profiles` table.
 * Regenerate via `supabase gen types` when your live schema diverges.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "warned" | "suspended" | "banned";
export type ModerationStatus = "visible" | "hidden" | "flagged";

export type Profile = {
  id: string;
  user_id: string | null;
  username: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  reputation_score: number | null;
  role: UserRole;
  account_status: AccountStatus;
  is_founding_mentor: boolean;
  expertise: string[];
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  user_id?: string | null;
  username: string;
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;
  reputation_score?: number | null;
  role?: UserRole;
  account_status?: AccountStatus;
  is_founding_mentor?: boolean;
  expertise?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<ProfileInsert, "id">>;

export type ProjectStatus = "draft" | "published" | "archived";

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
  github_url: string | null;
  demo_url: string | null;
  thumbnail_url: string | null;
  status: ProjectStatus;
  validation_score: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectInsert = {
  id?: string;
  owner_id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  github_url?: string | null;
  demo_url?: string | null;
  thumbnail_url?: string | null;
  status?: ProjectStatus;
  validation_score?: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProjectUpdate = Partial<Omit<ProjectInsert, "id" | "owner_id">>;

export type ValidationType =
  | "product_validation"
  | "ux_validation"
  | "technical_review"
  | "idea_validation"
  | "ai_agent_validation";

export type ValidationStatus = "open" | "in_review" | "completed";

export type ValidationRequest = {
  id: string;
  project_id: string;
  requested_by: string;
  validation_type: ValidationType;
  request_title: string;
  request_text: string | null;
  status: ValidationStatus;
  created_at: string;
};

export type ValidationRequestInsert = {
  id?: string;
  project_id: string;
  requested_by: string;
  validation_type: ValidationType;
  request_title: string;
  request_text?: string | null;
  status?: ValidationStatus;
  created_at?: string;
};

export type ValidationRequestUpdate = Partial<
  Omit<ValidationRequestInsert, "id" | "requested_by" | "project_id">
>;

export type Review = {
  id: string;
  project_id: string;
  reviewer_id: string;
  validation_request_id: string | null;
  rating: number;
  review_text: string | null;
  what_works_well: string | null;
  improvement_areas: string | null;
  recommendations: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
};

export type ReviewInsert = {
  id?: string;
  project_id: string;
  reviewer_id: string;
  validation_request_id?: string | null;
  rating: number;
  review_text?: string | null;
  what_works_well?: string | null;
  improvement_areas?: string | null;
  recommendations?: string | null;
  moderation_status?: ModerationStatus;
  created_at?: string;
};

export type ReviewUpdate = Partial<Omit<ReviewInsert, "id" | "reviewer_id">>;

export type ReputationEvent = {
  id: string;
  user_id: string;
  event_type: string;
  points: number;
  source_id: string | null;
  metadata: Json | null;
  created_at: string;
};

export type ReputationEventInsert = {
  id?: string;
  user_id: string;
  event_type: string;
  points: number;
  source_id?: string | null;
  metadata?: Json | null;
  created_at?: string;
};

export type ReputationEventUpdate = Partial<
  Omit<ReputationEventInsert, "id" | "user_id">
>;

export type NotificationTypeName =
  | "review_received"
  | "validation_completed"
  | "reputation_level_up"
  | "project_published"
  | "support_ticket_updated"
  | "support_ticket_resolved"
  | "account_warned"
  | "project_score_updated"
  | "reputation_increased"
  | "validation_opportunity"
  | "validation_request_accepted"
  | "validation_request_declined"
  | "review_acknowledged";

export type NotificationEntityType =
  | "user"
  | "project"
  | "review"
  | "validation_request"
  | "support_ticket";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationTypeName;
  title: string;
  message: string | null;
  body: string | null;
  href: string | null;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  source_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  channel?: "in_app" | "email" | "both";
  email_status?: "pending" | "sent" | "skipped" | null;
};

export type AppNotificationInsert = {
  id?: string;
  user_id: string;
  type: NotificationTypeName;
  title: string;
  message?: string | null;
  body?: string | null;
  href?: string | null;
  entity_type?: NotificationEntityType | null;
  entity_id?: string | null;
  source_id?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
  channel?: "in_app" | "email" | "both";
  email_status?: "pending" | "sent" | "skipped" | null;
};

export type AppNotificationUpdate = Partial<
  Omit<AppNotificationInsert, "id" | "user_id">
>;

export type ReportTargetTypeName =
  | "user"
  | "project"
  | "validation_request"
  | "review";

export type ReportStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "dismissed";

export type Report = {
  id: string;
  reporter_id: string;
  entity_type: ReportTargetTypeName;
  entity_id: string;
  target_type: ReportTargetTypeName;
  target_id: string;
  reason: string;
  description: string | null;
  details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportInsert = {
  id?: string;
  reporter_id: string;
  entity_type?: ReportTargetTypeName;
  entity_id?: string;
  target_type: ReportTargetTypeName;
  target_id: string;
  reason: string;
  description?: string | null;
  details?: string | null;
  status?: ReportStatus;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReportUpdate = Partial<Omit<ReportInsert, "id" | "reporter_id">>;

export type SupportCategoryName =
  | "account"
  | "project"
  | "validation"
  | "review"
  | "bug_report"
  | "feature_request"
  | "contact_founder";

export type SupportPriority = "low" | "medium" | "high" | "critical";

export type SupportTicketStatus = "open" | "assigned" | "resolved" | "closed";

export type SupportTicket = {
  id: string;
  user_id: string;
  category: SupportCategoryName;
  priority: SupportPriority;
  subject: string;
  message: string;
  description: string | null;
  status: SupportTicketStatus;
  admin_reply: string | null;
  user_follow_up: string | null;
  user_follow_up_at: string | null;
  assigned_admin_id: string | null;
  first_response_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportTicketInsert = {
  id?: string;
  user_id: string;
  category: SupportCategoryName;
  priority?: SupportPriority;
  subject: string;
  message: string;
  description?: string | null;
  status?: SupportTicketStatus;
  admin_reply?: string | null;
  user_follow_up?: string | null;
  user_follow_up_at?: string | null;
  assigned_admin_id?: string | null;
  first_response_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SupportTicketUpdate = Partial<
  Omit<SupportTicketInsert, "id" | "user_id">
>;

export type ModerationAction = {
  id: string;
  admin_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  reason: string | null;
  created_at: string;
};

export type ModerationActionInsert = {
  id?: string;
  admin_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  reason?: string | null;
  created_at?: string;
};

export type ModerationActionUpdate = Partial<
  Omit<ModerationActionInsert, "id" | "admin_id">
>;

export type AdminAlertSeverity = "info" | "warning" | "critical";

export type AdminAlert = {
  id: string;
  type: string;
  severity: AdminAlertSeverity;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type AdminAlertInsert = {
  id?: string;
  type: string;
  severity?: AdminAlertSeverity;
  title: string;
  message?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read?: boolean;
  created_at?: string;
};

export type AdminAlertUpdate = Partial<Omit<AdminAlertInsert, "id">>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      validation_requests: {
        Row: ValidationRequest;
        Insert: ValidationRequestInsert;
        Update: ValidationRequestUpdate;
        Relationships: [
          {
            foreignKeyName: "validation_requests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: Review;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
        Relationships: [
          {
            foreignKeyName: "reviews_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      reputation_events: {
        Row: ReputationEvent;
        Insert: ReputationEventInsert;
        Update: ReputationEventUpdate;
        Relationships: [];
      };
      notifications: {
        Row: AppNotification;
        Insert: AppNotificationInsert;
        Update: AppNotificationUpdate;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: ReportInsert;
        Update: ReportUpdate;
        Relationships: [];
      };
      support_tickets: {
        Row: SupportTicket;
        Insert: SupportTicketInsert;
        Update: SupportTicketUpdate;
        Relationships: [];
      };
      moderation_actions: {
        Row: ModerationAction;
        Insert: ModerationActionInsert;
        Update: ModerationActionUpdate;
        Relationships: [];
      };
      admin_alerts: {
        Row: AdminAlert;
        Insert: AdminAlertInsert;
        Update: AdminAlertUpdate;
        Relationships: [];
      };
      auth_rate_limits: {
        Row: {
          id: string;
          action: string;
          bucket: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          bucket: string;
          created_at?: string;
        };
        Update: {
          action?: string;
          bucket?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
