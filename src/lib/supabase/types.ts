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

export type Profile = {
  id: string;
  user_id: string | null;
  username: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  reputation_score: number | null;
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
  website?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;
  reputation_score?: number | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
