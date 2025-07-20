-- Add website customization settings to existing website_settings table
-- This migration adds new settings for theme, branding, and content customization

-- Insert website customization settings
INSERT INTO public.website_settings (key, value, type) VALUES
-- Theme Settings
('theme_primary_color', '#2563eb', 'color'),
('theme_secondary_color', '#1e40af', 'color'),
('theme_accent_color', '#3b82f6', 'color'),
('theme_background_color', '#ffffff', 'color'),
('theme_text_color', '#1f2937', 'color'),
('theme_font_family', 'Inter', 'text'),
('theme_font_size', 'medium', 'text'),
('theme_border_radius', 'medium', 'text'),
('theme_layout_style', 'modern', 'text'),

-- Logo & Branding
('brand_logo_url', '', 'image'),
('brand_favicon_url', '', 'image'),
('brand_logo_alt', 'Company Logo', 'text'),
('brand_company_name', 'CleanOuts Pro', 'text'),
('brand_tagline', 'Professional junk removal and moving services', 'text'),

-- Homepage Content
('hero_title', 'Professional Cleanout Services', 'text'),
('hero_subtitle', 'Fast, reliable, and eco-friendly junk removal and moving services', 'text'),
('hero_description', 'Get your space back with our professional cleanout services. We handle everything from junk removal to complete estate cleanouts.', 'text'),
('hero_background_image', 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop', 'image'),
('hero_cta_text', 'Book Now', 'text'),
('hero_secondary_cta_text', 'Learn More', 'text'),

-- Featured Services Section
('featured_services_title', 'Our Services', 'text'),
('featured_services_subtitle', 'Professional services tailored to your needs', 'text'),
('featured_services_enabled', 'true', 'text'),

-- Testimonials Section
('testimonials_title', 'What Our Customers Say', 'text'),
('testimonials_subtitle', 'Real feedback from satisfied customers', 'text'),
('testimonials_enabled', 'true', 'text'),

-- About Section
('about_title', 'About Us', 'text'),
('about_content', 'We are a professional cleanout service company dedicated to helping you reclaim your space. With years of experience and a commitment to eco-friendly practices, we make decluttering easy and stress-free.', 'text'),
('about_image', 'https://images.pexels.com/photos/4107120/pexels-photo-4107120.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop', 'image'),
('about_enabled', 'true', 'text'),

-- Footer Content
('footer_company_description', 'Professional junk removal and moving services. Fast, reliable, and eco-friendly solutions for your cleanout needs.', 'text'),
('footer_copyright_text', '© 2024 CleanOuts Pro. All rights reserved.', 'text'),

-- Contact Information
('contact_email', 'info@cleanoutspro.com', 'text'),
('contact_phone', '(555) 123-4567', 'text'),
('contact_address', '123 Service St, City, State 12345', 'text'),
('contact_hours', 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM', 'text'),

-- Social Media Links
('social_facebook_url', '', 'text'),
('social_twitter_url', '', 'text'),
('social_instagram_url', '', 'text'),
('social_linkedin_url', '', 'text'),
('social_youtube_url', '', 'text'),

-- Footer Links
('footer_links', '{"quick_links": [{"label": "Services", "url": "/services"}, {"label": "About", "url": "/about"}, {"label": "Contact", "url": "/contact"}], "legal_links": [{"label": "Privacy Policy", "url": "/privacy"}, {"label": "Terms of Service", "url": "/terms"}]}', 'json'),

-- Custom CSS
('custom_css', '', 'text'),
('custom_head_code', '', 'text'),
('custom_footer_code', '', 'text'),

-- SEO Settings
('seo_meta_title', 'CleanOuts Pro - Professional Junk Removal & Moving Services', 'text'),
('seo_meta_description', 'Professional junk removal and moving services. Fast, reliable, and eco-friendly solutions for your cleanout needs.', 'text'),
('seo_meta_keywords', 'junk removal, moving services, cleanout, estate cleanout, professional', 'text'),

-- Advanced Settings
('maintenance_mode', 'false', 'text'),
('analytics_google_id', '', 'text'),
('analytics_facebook_pixel', '', 'text')

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_settings_key ON public.website_settings(key);
CREATE INDEX IF NOT EXISTS idx_website_settings_type ON public.website_settings(type);

-- Add comment to table
COMMENT ON TABLE public.website_settings IS 'Stores website customization settings including theme, branding, content, and configuration options';