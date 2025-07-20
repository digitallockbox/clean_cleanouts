import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Export createClient function for server-side usage
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};

export type Database = {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          name: string;
          description: string;
          base_price: number;
          price_per_hour: number;
          image_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          base_price: number;
          price_per_hour: number;
          image_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          base_price?: number;
          price_per_hour?: number;
          image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          service_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          total_price: number;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          payment_status: 'pending' | 'paid' | 'failed';
          payment_intent_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          total_price: number;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          payment_status?: 'pending' | 'paid' | 'failed';
          payment_intent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          total_price?: number;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          payment_status?: 'pending' | 'paid' | 'failed';
          payment_intent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      website_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          type: 'text' | 'image' | 'color' | 'json';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          type: 'text' | 'image' | 'color' | 'json';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          type?: 'text' | 'image' | 'color' | 'json';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};