const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const defaultSettings = [
  // Theme Settings
  { key: 'theme_primary_color', value: '#2563eb', type: 'color' },
  { key: 'theme_secondary_color', value: '#1e40af', type: 'color' },
  { key: 'theme_accent_color', value: '#3b82f6', type: 'color' },
  { key: 'theme_background_color', value: '#ffffff', type: 'color' },
  { key: 'theme_text_color', value: '#1f2937', type: 'color' },
  { key: 'theme_font_family', value: 'Inter', type: 'text' },
  { key: 'theme_font_size', value: 'medium', type: 'text' },
  { key: 'theme_border_radius', value: 'medium', type: 'text' },
  { key: 'theme_layout_style', value: 'modern', type: 'text' },

  // Logo & Branding
  { key: 'brand_logo_url', value: '', type: 'image' },
  { key: 'brand_favicon_url', value: '', type: 'image' },
  { key: 'brand_logo_alt', value: 'Company Logo', type: 'text' },
  { key: 'brand_company_name', value: 'CleanOuts Pro', type: 'text' },
  { key: 'brand_tagline', value: 'Professional junk removal and moving services', type: 'text' },

  // Homepage Content
  { key: 'hero_title', value: 'Professional Cleanout Services', type: 'text' },
  { key: 'hero_subtitle', value: 'Fast, reliable, and eco-friendly junk removal and moving services', type: 'text' },
  { key: 'hero_description', value: 'Get your space back with our professional cleanout services. We handle everything from junk removal to complete estate cleanouts.', type: 'text' },
  { key: 'hero_background_image', value: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop', type: 'image' },
  { key: 'hero_cta_text', value: 'Book Now', type: 'text' },
  { key: 'hero_secondary_cta_text', value: 'Learn More', type: 'text' },

  // Featured Services Section
  { key: 'featured_services_title', value: 'Our Services', type: 'text' },
  { key: 'featured_services_subtitle', value: 'Professional services tailored to your needs', type: 'text' },
  { key: 'featured_services_enabled', value: 'true', type: 'text' },

  // Testimonials Section
  { key: 'testimonials_title', value: 'What Our Customers Say', type: 'text' },
  { key: 'testimonials_subtitle', value: 'Real feedback from satisfied customers', type: 'text' },
  { key: 'testimonials_enabled', value: 'true', type: 'text' },

  // About Section
  { key: 'about_title', value: 'About Us', type: 'text' },
  { key: 'about_content', value: 'We are a professional cleanout service company dedicated to helping you reclaim your space. With years of experience and a commitment to eco-friendly practices, we make decluttering easy and stress-free.', type: 'text' },
  { key: 'about_image', value: 'https://images.pexels.com/photos/4107120/pexels-photo-4107120.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop', type: 'image' },
  { key: 'about_enabled', value: 'true', type: 'text' },

  // Footer Content
  { key: 'footer_company_description', value: 'Professional junk removal and moving services. Fast, reliable, and eco-friendly solutions for your cleanout needs.', type: 'text' },
  { key: 'footer_copyright_text', value: '© 2024 CleanOuts Pro. All rights reserved.', type: 'text' },

  // Contact Information
  { key: 'contact_email', value: 'info@cleanoutspro.com', type: 'text' },
  { key: 'contact_phone', value: '(555) 123-4567', type: 'text' },
  { key: 'contact_address', value: '123 Service St, City, State 12345', type: 'text' },
  { key: 'contact_hours', value: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM', type: 'text' },

  // Social Media Links
  { key: 'social_facebook_url', value: '', type: 'text' },
  { key: 'social_twitter_url', value: '', type: 'text' },
  { key: 'social_instagram_url', value: '', type: 'text' },
  { key: 'social_linkedin_url', value: '', type: 'text' },
  { key: 'social_youtube_url', value: '', type: 'text' },

  // Footer Links
  { key: 'footer_links', value: '{"quick_links": [{"label": "Services", "url": "/services"}, {"label": "About", "url": "/about"}, {"label": "Contact", "url": "/contact"}], "legal_links": [{"label": "Privacy Policy", "url": "/privacy"}, {"label": "Terms of Service", "url": "/terms"}]}', type: 'json' },

  // Custom CSS
  { key: 'custom_css', value: '', type: 'text' },
  { key: 'custom_head_code', value: '', type: 'text' },
  { key: 'custom_footer_code', value: '', type: 'text' },

  // SEO Settings
  { key: 'seo_meta_title', value: 'CleanOuts Pro - Professional Junk Removal & Moving Services', type: 'text' },
  { key: 'seo_meta_description', value: 'Professional junk removal and moving services. Fast, reliable, and eco-friendly solutions for your cleanout needs.', type: 'text' },
  { key: 'seo_meta_keywords', value: 'junk removal, moving services, cleanout, estate cleanout, professional', type: 'text' },

  // Advanced Settings
  { key: 'maintenance_mode', value: 'false', type: 'text' },
  { key: 'analytics_google_id', value: '', type: 'text' },
  { key: 'analytics_facebook_pixel', value: '', type: 'text' }
];

async function seedWebsiteSettings() {
  try {
    console.log('Starting to seed website settings...');

    // Insert settings one by one to handle conflicts
    for (const setting of defaultSettings) {
      const { data, error } = await supabase
        .from('website_settings')
        .upsert(setting, {
          onConflict: 'key'
        });

      if (error) {
        console.error(`Error inserting setting ${setting.key}:`, error);
      } else {
        console.log(`✓ Inserted/Updated setting: ${setting.key}`);
      }
    }

    console.log('✅ Website settings seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding website settings:', error);
  }
}

// Run the seeding function
seedWebsiteSettings();