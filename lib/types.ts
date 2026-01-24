export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          family_id: string | null;
          name: string | null;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id: string;
          family_id?: string | null;
          name?: string | null;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string | null;
          name?: string | null;
          role?: "admin" | "member";
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          quantity: number;
          unit: string | null;
          price: number | null;
          store: string | null;
          low_stock_threshold: number | null;
          category: string | null;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          quantity?: number;
          unit?: string | null;
          price?: number | null;
          store?: string | null;
          low_stock_threshold?: number | null;
          category?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          quantity?: number;
          unit?: string | null;
          price?: number | null;
          store?: string | null;
          low_stock_threshold?: number | null;
          category?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shopping_list_items: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          quantity: number;
          unit: string | null;
          preferred_store: string | null;
          added_by: string | null;
          notes: string | null;
          is_checked: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          quantity?: number;
          unit?: string | null;
          preferred_store?: string | null;
          added_by?: string | null;
          notes?: string | null;
          is_checked?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          quantity?: number;
          unit?: string | null;
          preferred_store?: string | null;
          added_by?: string | null;
          notes?: string | null;
          is_checked?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InventoryItem = Tables<"inventory_items">;
export type ShoppingListItem = Tables<"shopping_list_items">;
