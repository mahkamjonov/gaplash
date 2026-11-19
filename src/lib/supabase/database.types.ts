/**
 * Mirrors supabase/migrations. Once a project is linked, this file can be replaced by
 * `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Enums = Database["public"]["Enums"];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          goal: Enums["practice_goal"];
          level: Enums["cefr_level"] | null;
          target_band: number | null;
          exam_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          goal: Enums["practice_goal"];
          level?: Enums["cefr_level"] | null;
          target_band?: number | null;
          exam_date?: string | null;
        };
        Update: {
          display_name?: string;
          goal?: Enums["practice_goal"];
          level?: Enums["cefr_level"] | null;
          target_band?: number | null;
          exam_date?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          host_id: string;
          guest_id: string | null;
          mode: Enums["session_mode"];
          status: Enums["session_status"];
          scheduled_at: string;
          invite_code: string;
          room_state: Json;
          room_version: number;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_session: {
        Args: { p_mode: Enums["session_mode"]; p_scheduled_at?: string | null };
        Returns: Database["public"]["Tables"]["sessions"]["Row"];
      };
      get_invite: {
        Args: { p_code: string };
        Returns: {
          session_id: string;
          mode: Enums["session_mode"];
          status: Enums["session_status"];
          scheduled_at: string;
          host_name: string | null;
          is_host: boolean;
          is_guest: boolean;
          is_full: boolean;
        }[];
      };
      join_session: {
        Args: { p_code: string };
        Returns: string;
      };
      my_sessions: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          mode: Enums["session_mode"];
          status: Enums["session_status"];
          scheduled_at: string;
          started_at: string | null;
          ended_at: string | null;
          is_host: boolean;
          partner_name: string | null;
          invite_code: string | null;
        }[];
      };
      get_room: {
        Args: { p_session_id: string };
        Returns: {
          session_id: string;
          mode: Enums["session_mode"];
          status: Enums["session_status"];
          scheduled_at: string;
          is_host: boolean;
          my_id: string;
          my_name: string | null;
          partner_id: string | null;
          partner_name: string | null;
          invite_code: string | null;
          room_state: Json;
          room_version: number;
          server_now: string;
        }[];
      };
      update_room: {
        Args: {
          p_session_id: string;
          p_expected_version: number;
          p_state: Json;
          p_status?: Enums["session_status"] | null;
        };
        Returns: {
          applied: boolean;
          room_version: number;
          room_state: Json;
          status: Enums["session_status"];
          server_now: string;
        }[];
      };
      cancel_session: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      practice_goal: "ielts" | "free_talk";
      cefr_level: "A2" | "B1" | "B2" | "C1";
      session_mode: "ielts" | "free_talk";
      session_status: "scheduled" | "live" | "completed" | "cancelled";
    };
    CompositeTypes: Record<never, never>;
  };
};
