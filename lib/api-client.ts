import { supabase } from '@/lib/supabase';

/**
 * Authenticated API client for admin requests
 */
export class ApiClient {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  static async get(url: string): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return fetch(url, { headers });
  }

  static async post(url: string, data?: any): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(url: string, data?: any): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(url: string): Promise<Response> {
    const headers = await this.getAuthHeaders();
    return fetch(url, {
      method: 'DELETE',
      headers,
    });
  }
}