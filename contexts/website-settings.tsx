'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface WebsiteSettings {
  // Brand & Company
  brand_company_name: string;
  brand_tagline: string;
  brand_logo_url: string;
  brand_favicon_url: string;
  
  // Theme
  theme_primary_color: string;
  theme_secondary_color: string;
  theme_accent_color: string;
  theme_font_family: string;
  
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_background_image: string;
  hero_cta_text: string;
  hero_secondary_cta_text: string;
  
  // Contact Info
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  contact_hours: string;
  
  // Footer
  footer_company_description: string;
  footer_copyright_text: string;
  
  // Social Media
  social_facebook_url: string;
  social_twitter_url: string;
  social_instagram_url: string;
  social_linkedin_url: string;
  
  // SEO
  seo_meta_title: string;
  seo_meta_description: string;
  seo_meta_keywords: string;
  
  // Features
  featured_services_enabled: string;
  testimonials_enabled: string;
  about_enabled: string;
  
  // Advanced
  custom_css: string;
  maintenance_mode: string;
  analytics_google_id: string;
}

interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  rawSettings: Record<string, any>;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => Promise<void>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: WebsiteSettings = {
  brand_company_name: 'CleanOuts Pro',
  brand_tagline: 'Professional junk removal and moving services',
  brand_logo_url: '',
  brand_favicon_url: '',
  
  theme_primary_color: '#2563eb',
  theme_secondary_color: '#1e40af',
  theme_accent_color: '#3b82f6',
  theme_font_family: 'Inter',
  
  hero_title: 'Professional Cleanout Services',
  hero_subtitle: 'Fast, reliable, and eco-friendly junk removal and moving services',
  hero_description: 'Get your space back with our professional cleanout services.',
  hero_background_image: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop',
  hero_cta_text: 'Book Now',
  hero_secondary_cta_text: 'Learn More',
  
  contact_email: 'info@cleanoutspro.com',
  contact_phone: '(555) 123-4567',
  contact_address: '123 Service St, City, State 12345',
  contact_hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
  
  footer_company_description: 'Professional junk removal and moving services.',
  footer_copyright_text: '© 2024 CleanOuts Pro. All rights reserved.',
  
  social_facebook_url: '',
  social_twitter_url: '',
  social_instagram_url: '',
  social_linkedin_url: '',
  
  seo_meta_title: 'CleanOuts Pro - Professional Junk Removal & Moving Services',
  seo_meta_description: 'Professional junk removal and moving services.',
  seo_meta_keywords: 'junk removal, moving services, cleanout',
  
  featured_services_enabled: 'true',
  testimonials_enabled: 'true',
  about_enabled: 'true',
  
  custom_css: '',
  maintenance_mode: 'false',
  analytics_google_id: '',
};

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | undefined>(undefined);

export const WebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [rawSettings, setRawSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('website_settings')
        .select('*');

      if (error) {
        console.error('Error loading website settings:', error);
        return;
      }

      if (data && data.length > 0) {
        // Create raw settings object for admin panel
        const rawSettingsObj: Record<string, any> = {};
        data.forEach((setting) => {
          rawSettingsObj[setting.key] = {
            value: setting.value,
            type: setting.type,
            updated_at: setting.updated_at
          };
        });
        setRawSettings(rawSettingsObj);

        // Create typed settings object for frontend use
        const settingsObj: Partial<WebsiteSettings> = {};
        data.forEach((setting) => {
          if (setting.key in defaultSettings) {
            settingsObj[setting.key as keyof WebsiteSettings] = setting.value;
          }
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
        type: key.includes('color') ? 'color' as const : 
              key.includes('url') || key.includes('image') ? 'image' as const : 'text' as const,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('website_settings')
          .upsert(update, { onConflict: 'key' });
        
        if (error) {
          console.error('Error updating setting:', update.key, error);
        }
      }

      // Update local state
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // Refresh to get latest data
      await loadSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <WebsiteSettingsContext.Provider value={{ 
      settings, 
      rawSettings, 
      updateSettings, 
      loading, 
      refreshSettings 
    }}>
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

// Legacy compatibility - maps new settings to old interface
export const useLegacySettings = () => {
  const { settings, loading } = useWebsiteSettings();
  
  // Return null while loading to prevent flash of default content
  if (loading) {
    return {
      siteName: '',
      siteDescription: '',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logoUrl: '',
      heroTitle: '',
      heroSubtitle: '',
      heroImage: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    };
  }
  
  return {
    siteName: settings.brand_company_name,
    siteDescription: settings.brand_tagline,
    primaryColor: settings.theme_primary_color,
    secondaryColor: settings.theme_secondary_color,
    logoUrl: settings.brand_logo_url,
    heroTitle: settings.hero_title,
    heroSubtitle: settings.hero_subtitle,
    heroImage: settings.hero_background_image,
    contactEmail: settings.contact_email,
    contactPhone: settings.contact_phone,
    address: settings.contact_address,
  };
};