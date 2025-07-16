'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface WebsiteSettings {
  siteName: string;
  siteDescription: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => Promise<void>;
  loading: boolean;
}

const defaultSettings: WebsiteSettings = {
  siteName: 'CleanOuts Pro',
  siteDescription: 'Professional junk removal and moving services',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  logoUrl: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  heroTitle: 'Professional Cleanout Services',
  heroSubtitle: 'Fast, reliable, and eco-friendly junk removal and moving services',
  heroImage: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop',
  contactEmail: 'info@cleanoutspro.com',
  contactPhone: '(555) 123-4567',
  address: '123 Service St, City, State 12345',
};

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | undefined>(undefined);

export const WebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj: Partial<WebsiteSettings> = {};
        data.forEach((setting) => {
          settingsObj[setting.key as keyof WebsiteSettings] = setting.value;
        });
        setSettings({ ...defaultSettings, ...settingsObj });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<WebsiteSettings>) => {
    try {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value: String(value),
        type: key.includes('Color') ? 'color' as const : 
              key.includes('Url') || key.includes('Image') ? 'image' as const : 'text' as const,
      }));

      for (const update of updates) {
        await supabase
          .from('website_settings')
          .upsert(update, { onConflict: 'key' });
      }

      setSettings({ ...settings, ...newSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <WebsiteSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export const useWebsiteSettings = () => {
  const context = useContext(WebsiteSettingsContext);
  if (context === undefined) {
    throw new Error('useWebsiteSettings must be used within a WebsiteSettingsProvider');
  }
  return context;
};