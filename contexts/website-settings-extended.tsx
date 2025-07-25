'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface ExtendedWebsiteSettings {
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
  theme_font_size: string;
  theme_border_radius: string;
  
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_background_image: string;
  hero_cta_text: string;
  hero_secondary_cta_text: string;
  
  // About Section
  about_title: string;
  about_description: string;
  about_image: string;
  about_features: string;
  
  // Services Section
  services_title: string;
  services_subtitle: string;
  services_description: string;
  
  // Testimonials Section
  testimonials_title: string;
  testimonials_subtitle: string;
  
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
  
  // Navigation
  nav_show_services: string;
  nav_show_about: string;
  nav_show_contact: string;
  nav_show_booking: string;
  
  // CTA Sections
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  
  // Pricing
  pricing_enabled: string;
  pricing_title: string;
  pricing_subtitle: string;
  
  // Advanced
  custom_css: string;
  custom_head_code: string;
  maintenance_mode: string;
  analytics_google_id: string;

  // Homepage - Why Choose Us Section
  home_why_choose_badge: string;
  home_why_choose_title: string;
  home_why_choose_title_highlight: string;
  home_why_choose_description: string;
  home_why_choose_feature_1: string;
  home_why_choose_feature_2: string;
  home_why_choose_feature_3: string;
  home_why_choose_feature_4: string;
  home_why_choose_feature_5: string;
  home_why_choose_feature_6: string;

  // Homepage - Stats Section
  home_stat_1_number: string;
  home_stat_1_label: string;
  home_stat_2_number: string;
  home_stat_2_label: string;
  home_stat_3_number: string;
  home_stat_3_label: string;
  home_stat_4_number: string;
  home_stat_4_label: string;

  // Homepage - Hero Trust Indicators
  home_hero_trust_1_number: string;
  home_hero_trust_1_label: string;
  home_hero_trust_2_number: string;
  home_hero_trust_2_label: string;
  home_hero_trust_3_number: string;
  home_hero_trust_3_label: string;

  // Homepage - CTA Section
  home_cta_badge: string;
  home_cta_guarantee: string;
  home_cta_primary_button: string;
  home_cta_secondary_button: string;

  // Homepage - CTA Trust Badges
  home_cta_trust_1: string;
  home_cta_trust_2: string;
  home_cta_trust_3: string;

  // Services Page - Hero Section
  services_hero_badge: string;
  services_hero_title: string;
  services_hero_title_highlight: string;
  services_hero_description: string;

  // Services Page - Hero Features
  services_hero_feature_1: string;
  services_hero_feature_2: string;
  services_hero_feature_3: string;
  services_hero_feature_4: string;

  // Services Page - Services Grid Section
  services_grid_badge: string;
  services_grid_title: string;
  services_grid_title_highlight: string;

  // Services Page - Custom Solutions Section
  services_custom_badge: string;
  services_custom_title: string;
  services_custom_title_highlight: string;
  services_custom_description: string;
  services_custom_guarantee: string;
  services_custom_primary_button: string;
  services_custom_secondary_button: string;

  // Contact Page - Hero Section
  contact_hero_badge: string;
  contact_hero_title: string;
  contact_hero_title_highlight: string;
  contact_hero_description: string;

  // Contact Page - Contact Info Section
  contact_info_title: string;
  contact_info_description: string;

  // Contact Page - Quick Actions
  contact_quick_actions_title: string;
  contact_quick_action_1_title: string;
  contact_quick_action_1_description: string;
  contact_quick_action_2_title: string;
  contact_quick_action_2_description: string;

  // Contact Page - Contact Form
  contact_form_title: string;
  contact_form_description: string;
  contact_form_success_title: string;
  contact_form_success_description: string;
  contact_form_success_button: string;

  // Contact Page - Additional Info Cards
  contact_card_1_title: string;
  contact_card_1_description: string;
  contact_card_1_button: string;
  contact_card_2_title: string;
  contact_card_2_description: string;
  contact_card_2_button: string;
  contact_card_3_title: string;
  contact_card_3_description: string;
  contact_card_3_button: string;

  // Footer - Services List
  footer_services_title: string;
  footer_service_1: string;
  footer_service_2: string;
  footer_service_3: string;
  footer_service_4: string;
  footer_service_5: string;
  footer_service_6: string;

  // Footer - Quick Links
  footer_links_title: string;
  footer_link_1_label: string;
  footer_link_1_url: string;
  footer_link_2_label: string;
  footer_link_2_url: string;
  footer_link_3_label: string;
  footer_link_3_url: string;
  footer_link_4_label: string;
  footer_link_4_url: string;
  footer_link_5_label: string;
  footer_link_5_url: string;

  // Footer - Social Media
  footer_social_title: string;

  // Footer - Trust Badges
  footer_trust_badge_1: string;
  footer_trust_badge_2: string;
  footer_trust_badge_3: string;

  // Footer - Copyright
  footer_copyright_prefix: string;
  footer_copyright_suffix: string;
  footer_made_with_love: string;

  // Additional Settings
  footer_company_tagline_suffix: string;
}

interface ExtendedWebsiteSettingsContextType {
  settings: ExtendedWebsiteSettings;
  rawSettings: Record<string, any>;
  updateSettings: (newSettings: Partial<ExtendedWebsiteSettings>) => Promise<void>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultExtendedSettings: ExtendedWebsiteSettings = {
  // Existing settings
  brand_company_name: 'CleanOuts Pro',
  brand_tagline: 'Professional junk removal and moving services',
  brand_logo_url: '',
  brand_favicon_url: '',
  
  theme_primary_color: '#2563eb',
  theme_secondary_color: '#1e40af',
  theme_accent_color: '#3b82f6',
  theme_font_family: 'Inter',
  theme_font_size: 'medium',
  theme_border_radius: 'medium',
  
  hero_title: 'Professional Cleanout Services',
  hero_subtitle: 'Fast, reliable, and eco-friendly junk removal and moving services',
  hero_description: 'Get your space back with our professional cleanout services.',
  hero_background_image: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop',
  hero_cta_text: 'Book Now',
  hero_secondary_cta_text: 'Learn More',
  
  about_title: 'About Our Services',
  about_description: 'We provide professional cleanout and junk removal services with a focus on customer satisfaction and environmental responsibility.',
  about_image: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
  about_features: 'Fast Service, Eco-Friendly, Licensed & Insured, Affordable Pricing',
  
  services_title: 'Our',
  services_subtitle: 'Expert Services',
  services_description: 'Professional cleanout and moving services tailored to your needs with unmatched quality and reliability',
  
  testimonials_title: 'What Our Customers Say',
  testimonials_subtitle: 'Real feedback from satisfied customers',
  
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
  
  nav_show_services: 'true',
  nav_show_about: 'true',
  nav_show_contact: 'true',
  nav_show_booking: 'true',
  
  cta_title: 'Ready to Get Started?',
  cta_description: 'Contact us today for a free estimate and let us help you reclaim your space.',
  cta_button_text: 'Get Free Quote',
  
  pricing_enabled: 'true',
  pricing_title: 'Transparent Pricing',
  pricing_subtitle: 'No hidden fees, just honest pricing',
  
  custom_css: '',
  custom_head_code: '',
  maintenance_mode: 'false',
  analytics_google_id: '',

  // New settings with defaults
  home_why_choose_badge: 'Why Choose Us',
  home_why_choose_title: 'Trusted by',
  home_why_choose_title_highlight: 'Thousands',
  home_why_choose_description: 'We\'re committed to providing exceptional service with every job, backed by years of experience and countless satisfied customers',
  home_why_choose_feature_1: 'Licensed & Insured',
  home_why_choose_feature_2: 'Same Day Service',
  home_why_choose_feature_3: 'Eco-Friendly Disposal',
  home_why_choose_feature_4: 'Upfront Pricing',
  home_why_choose_feature_5: 'Professional Team',
  home_why_choose_feature_6: '100% Satisfaction Guarantee',

  home_stat_1_number: '500+',
  home_stat_1_label: 'Projects Completed',
  home_stat_2_number: '98%',
  home_stat_2_label: 'Customer Satisfaction',
  home_stat_3_number: '24/7',
  home_stat_3_label: 'Support Available',
  home_stat_4_number: '5★',
  home_stat_4_label: 'Average Rating',

  home_hero_trust_1_number: '500+',
  home_hero_trust_1_label: 'Happy Customers',
  home_hero_trust_2_number: '24/7',
  home_hero_trust_2_label: 'Available Service',
  home_hero_trust_3_number: '100%',
  home_hero_trust_3_label: 'Satisfaction',

  home_cta_badge: 'Join 500+ Satisfied Customers',
  home_cta_guarantee: 'Free estimates • Same-day service • 100% satisfaction guaranteed',
  home_cta_primary_button: 'Schedule Service Now',
  home_cta_secondary_button: 'Call',

  home_cta_trust_1: 'Licensed & Insured',
  home_cta_trust_2: '24/7 Available',
  home_cta_trust_3: '5-Star Rated',

  services_hero_badge: 'Professional Service Excellence',
  services_hero_title: 'Our',
  services_hero_title_highlight: 'Expert Services',
  services_hero_description: 'Professional cleanout and removal services tailored to your specific needs. From residential junk removal to commercial cleanouts, we deliver excellence every time.',

  services_hero_feature_1: 'Licensed & Insured',
  services_hero_feature_2: 'Same Day Service',
  services_hero_feature_3: 'Eco-Friendly Disposal',
  services_hero_feature_4: '100% Satisfaction Guarantee',

  services_grid_badge: 'Choose Your Service',
  services_grid_title: 'Premium',
  services_grid_title_highlight: 'Service Options',

  services_custom_badge: 'Custom Solutions Available',
  services_custom_title: 'Need a',
  services_custom_title_highlight: 'Custom Solution?',
  services_custom_description: 'Don\'t see exactly what you need? Our expert team can create a custom solution tailored to your specific requirements.',
  services_custom_guarantee: 'Free consultation • Flexible pricing • Guaranteed satisfaction',
  services_custom_primary_button: 'Get Custom Quote',
  services_custom_secondary_button: 'Book Standard Service',

  contact_hero_badge: '24/7 Customer Support',
  contact_hero_title: 'Get in',
  contact_hero_title_highlight: 'Touch',
  contact_hero_description: 'Ready to transform your space? Our expert team is here to help with quotes, questions, and scheduling your perfect service solution.',

  contact_info_title: 'Get in Touch',
  contact_info_description: 'Reach out to us through any of these channels for immediate assistance',

  contact_quick_actions_title: 'Quick Actions',
  contact_quick_action_1_title: 'Get a Quote',
  contact_quick_action_1_description: 'Request a custom quote for your project',
  contact_quick_action_2_title: 'Ask a Question',
  contact_quick_action_2_description: 'Have questions about our services?',

  contact_form_title: 'Send us a Message',
  contact_form_description: 'Fill out the form below and we\'ll get back to you within 24 hours',
  contact_form_success_title: 'Message Sent Successfully!',
  contact_form_success_description: 'Thank you for contacting us. Our team will get back to you within 24 hours with a personalized response.',
  contact_form_success_button: 'Send Another Message',

  contact_card_1_title: 'Call for Immediate Service',
  contact_card_1_description: 'Need urgent service? Call us directly for same-day availability and emergency support.',
  contact_card_1_button: 'Call',
  contact_card_2_title: 'Free Estimates',
  contact_card_2_description: 'Get a free, no-obligation estimate for your project with detailed pricing breakdown.',
  contact_card_2_button: 'Request Estimate',
  contact_card_3_title: '24/7 Support',
  contact_card_3_description: 'Questions? We\'re here to help around the clock with expert guidance and support.',
  contact_card_3_button: 'Email Support',

  footer_services_title: 'Our Services',
  footer_service_1: 'Junk Removal',
  footer_service_2: 'Labor Moving',
  footer_service_3: 'Estate Cleanouts',
  footer_service_4: 'Construction Debris',
  footer_service_5: 'Appliance Removal',
  footer_service_6: 'Office Cleanouts',

  footer_links_title: 'Quick Links',
  footer_link_1_label: 'Home',
  footer_link_1_url: '/',
  footer_link_2_label: 'All Services',
  footer_link_2_url: '/services',
  footer_link_3_label: 'Book Now',
  footer_link_3_url: '/booking',
  footer_link_4_label: 'Contact Us',
  footer_link_4_url: '/contact',
  footer_link_5_label: 'Customer Portal',
  footer_link_5_url: '/auth/signin',

  footer_social_title: 'Follow Us',

  footer_trust_badge_1: 'Licensed & Insured',
  footer_trust_badge_2: '5-Star Rated',
  footer_trust_badge_3: '24/7 Support',

  footer_copyright_prefix: '© 2024',
  footer_copyright_suffix: '. All rights reserved.',
  footer_made_with_love: 'Made with ❤️ for our amazing customers',

  footer_company_tagline_suffix: '. We\'re committed to providing exceptional service with every project, ensuring your complete satisfaction.',
};

const ExtendedWebsiteSettingsContext = createContext<ExtendedWebsiteSettingsContextType | undefined>(undefined);

export const ExtendedWebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ExtendedWebsiteSettings>(defaultExtendedSettings);
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
        logger.error('Error loading website settings:', error);
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
        const settingsObj: Partial<ExtendedWebsiteSettings> = {};
        data.forEach((setting) => {
          if (setting.key in defaultExtendedSettings) {
            settingsObj[setting.key as keyof ExtendedWebsiteSettings] = setting.value;
          }
        });
        
        setSettings({ ...defaultExtendedSettings, ...settingsObj });
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ExtendedWebsiteSettings>) => {
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
          logger.error('Error updating setting:', { key: update.key, error });
        }
      }

      // Update local state
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // Refresh to get latest data
      await loadSettings();
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <ExtendedWebsiteSettingsContext.Provider value={{ 
      settings, 
      rawSettings, 
      updateSettings, 
      loading, 
      refreshSettings 
    }}>
      {children}
    </ExtendedWebsiteSettingsContext.Provider>
  );
};

export const useExtendedWebsiteSettings = () => {
  const context = useContext(ExtendedWebsiteSettingsContext);
  if (context === undefined) {
    throw new Error('useExtendedWebsiteSettings must be used within an ExtendedWebsiteSettingsProvider');
  }
  return context;
};

// Backward compatibility hook
export const useWebsiteSettings = () => {
  return useExtendedWebsiteSettings();
};