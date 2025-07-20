'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useWebsiteSettings } from '@/contexts/website-settings';
import { toast } from 'sonner';
import { 
  Settings, 
  Palette, 
  Image, 
  Layout, 
  FileText, 
  Download, 
  Database,
  Save,
  RefreshCw,
  Upload,
  Eye,
  Code
} from 'lucide-react';

interface WebsiteSettings {
  [key: string]: {
    value: string;
    type: string;
    updated_at: string;
  };
}

export const SettingsComponent: React.FC = () => {
  const { refreshSettings } = useWebsiteSettings();
  const [settings, setSettings] = useState<WebsiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/website-settings');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load settings');
      }

      setSettings(result.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string, type: string = 'text') => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        value,
        type,
        updated_at: new Date().toISOString()
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/website-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully');
      setHasChanges(false);
      
      // Refresh the website settings context to update the frontend
      await refreshSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tables: ['bookings', 'services', 'profiles', 'contact_submissions', 'service_reviews'],
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'full',
          includeFiles: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your website appearance and system preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="theme" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Theme</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <Layout className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Footer</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* Theme Settings */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Customize your website's color scheme and typography
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={settings.theme_primary_color?.value || '#2563eb'}
                        onChange={(e) => updateSetting('theme_primary_color', e.target.value, 'color')}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.theme_primary_color?.value || '#2563eb'}
                        onChange={(e) => updateSetting('theme_primary_color', e.target.value, 'color')}
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={settings.theme_secondary_color?.value || '#1e40af'}
                        onChange={(e) => updateSetting('theme_secondary_color', e.target.value, 'color')}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.theme_secondary_color?.value || '#1e40af'}
                        onChange={(e) => updateSetting('theme_secondary_color', e.target.value, 'color')}
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={settings.theme_accent_color?.value || '#3b82f6'}
                        onChange={(e) => updateSetting('theme_accent_color', e.target.value, 'color')}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.theme_accent_color?.value || '#3b82f6'}
                        onChange={(e) => updateSetting('theme_accent_color', e.target.value, 'color')}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="font-family">Font Family</Label>
                    <Select
                      value={settings.theme_font_family?.value || 'Inter'}
                      onValueChange={(value) => updateSetting('theme_font_family', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select
                      value={settings.theme_font_size?.value || 'medium'}
                      onValueChange={(value) => updateSetting('theme_font_size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="border-radius">Border Radius</Label>
                    <Select
                      value={settings.theme_border_radius?.value || 'medium'}
                      onValueChange={(value) => updateSetting('theme_border_radius', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select border radius" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Logo & Branding
              </CardTitle>
              <CardDescription>
                Upload your logo and configure brand identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={settings.brand_company_name?.value || ''}
                      onChange={(e) => updateSetting('brand_company_name', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={settings.brand_tagline?.value || ''}
                      onChange={(e) => updateSetting('brand_tagline', e.target.value)}
                      placeholder="Your company tagline"
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input
                      id="logo-url"
                      value={settings.brand_logo_url?.value || ''}
                      onChange={(e) => updateSetting('brand_logo_url', e.target.value, 'image')}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="favicon-url">Favicon URL</Label>
                    <Input
                      id="favicon-url"
                      value={settings.brand_favicon_url?.value || ''}
                      onChange={(e) => updateSetting('brand_favicon_url', e.target.value, 'image')}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {settings.brand_logo_url?.value && (
                    <div>
                      <Label>Logo Preview</Label>
                      <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                        <img
                          src={settings.brand_logo_url.value}
                          alt="Logo Preview"
                          className="max-h-20 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layout className="mr-2 h-5 w-5" />
                Homepage Content
              </CardTitle>
              <CardDescription>
                Configure your homepage hero section and featured content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hero-title">Hero Title</Label>
                  <Input
                    id="hero-title"
                    value={settings.hero_title?.value || ''}
                    onChange={(e) => updateSetting('hero_title', e.target.value)}
                    placeholder="Professional Cleanout Services"
                  />
                </div>

                <div>
                  <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                  <Input
                    id="hero-subtitle"
                    value={settings.hero_subtitle?.value || ''}
                    onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                    placeholder="Fast, reliable, and eco-friendly services"
                  />
                </div>

                <div>
                  <Label htmlFor="hero-description">Hero Description</Label>
                  <Textarea
                    id="hero-description"
                    value={settings.hero_description?.value || ''}
                    onChange={(e) => updateSetting('hero_description', e.target.value)}
                    placeholder="Detailed description of your services..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="hero-background">Hero Background Image URL</Label>
                  <Input
                    id="hero-background"
                    value={settings.hero_background_image?.value || ''}
                    onChange={(e) => updateSetting('hero_background_image', e.target.value, 'image')}
                    placeholder="https://example.com/hero-bg.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hero-cta">Primary CTA Text</Label>
                    <Input
                      id="hero-cta"
                      value={settings.hero_cta_text?.value || ''}
                      onChange={(e) => updateSetting('hero_cta_text', e.target.value)}
                      placeholder="Book Now"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hero-secondary-cta">Secondary CTA Text</Label>
                    <Input
                      id="hero-secondary-cta"
                      value={settings.hero_secondary_cta_text?.value || ''}
                      onChange={(e) => updateSetting('hero_secondary_cta_text', e.target.value)}
                      placeholder="Learn More"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Section Toggles</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="featured-services-toggle">Featured Services Section</Label>
                      <p className="text-sm text-gray-600">Show featured services on homepage</p>
                    </div>
                    <Switch
                      id="featured-services-toggle"
                      checked={settings.featured_services_enabled?.value === 'true'}
                      onCheckedChange={(checked) => updateSetting('featured_services_enabled', checked.toString())}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="testimonials-toggle">Testimonials Section</Label>
                      <p className="text-sm text-gray-600">Show customer testimonials</p>
                    </div>
                    <Switch
                      id="testimonials-toggle"
                      checked={settings.testimonials_enabled?.value === 'true'}
                      onCheckedChange={(checked) => updateSetting('testimonials_enabled', checked.toString())}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="about-toggle">About Section</Label>
                      <p className="text-sm text-gray-600">Show about us section</p>
                    </div>
                    <Switch
                      id="about-toggle"
                      checked={settings.about_enabled?.value === 'true'}
                      onCheckedChange={(checked) => updateSetting('about_enabled', checked.toString())}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Footer Content
              </CardTitle>
              <CardDescription>
                Configure footer links, contact information, and social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="footer-description">Company Description</Label>
                    <Textarea
                      id="footer-description"
                      value={settings.footer_company_description?.value || ''}
                      onChange={(e) => updateSetting('footer_company_description', e.target.value)}
                      placeholder="Brief description of your company..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="copyright-text">Copyright Text</Label>
                    <Input
                      id="copyright-text"
                      value={settings.footer_copyright_text?.value || ''}
                      onChange={(e) => updateSetting('footer_copyright_text', e.target.value)}
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  
                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={settings.contact_email?.value || ''}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      placeholder="info@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      value={settings.contact_phone?.value || ''}
                      onChange={(e) => updateSetting('contact_phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-address">Address</Label>
                    <Input
                      id="contact-address"
                      value={settings.contact_address?.value || ''}
                      onChange={(e) => updateSetting('contact_address', e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-hours">Business Hours</Label>
                    <Input
                      id="contact-hours"
                      value={settings.contact_hours?.value || ''}
                      onChange={(e) => updateSetting('contact_hours', e.target.value)}
                      placeholder="Mon-Fri: 8AM-6PM"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook-url">Facebook URL</Label>
                    <Input
                      id="facebook-url"
                      value={settings.social_facebook_url?.value || ''}
                      onChange={(e) => updateSetting('social_facebook_url', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitter-url">Twitter URL</Label>
                    <Input
                      id="twitter-url"
                      value={settings.social_twitter_url?.value || ''}
                      onChange={(e) => updateSetting('social_twitter_url', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram-url">Instagram URL</Label>
                    <Input
                      id="instagram-url"
                      value={settings.social_instagram_url?.value || ''}
                      onChange={(e) => updateSetting('social_instagram_url', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                    <Input
                      id="linkedin-url"
                      value={settings.social_linkedin_url?.value || ''}
                      onChange={(e) => updateSetting('social_linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2 h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Custom CSS, tracking codes, and advanced configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  value={settings.custom_css?.value || ''}
                  onChange={(e) => updateSetting('custom_css', e.target.value)}
                  placeholder="/* Your custom CSS here */"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Add custom CSS to override default styles. Use with caution.
                </p>
              </div>

              <div>
                <Label htmlFor="custom-head-code">Custom Head Code</Label>
                <Textarea
                  id="custom-head-code"
                  value={settings.custom_head_code?.value || ''}
                  onChange={(e) => updateSetting('custom_head_code', e.target.value)}
                  placeholder="<!-- Custom head code (analytics, meta tags, etc.) -->"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="google-analytics">Google Analytics ID</Label>
                <Input
                  id="google-analytics"
                  value={settings.analytics_google_id?.value || ''}
                  onChange={(e) => updateSetting('analytics_google_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Enable to show maintenance page to visitors</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenance_mode?.value === 'true'}
                  onCheckedChange={(checked) => updateSetting('maintenance_mode', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export data and create system backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={exportData}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>

                  <Button
                    onClick={createBackup}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p>• Export Data: Download all your business data in JSON format</p>
                  <p>• Create Backup: Generate a complete system backup including all settings and data</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Current system status and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">Active</div>
                    <div className="text-sm text-gray-600">System Status</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">v1.0</div>
                    <div className="text-sm text-gray-600">Version</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(settings).length}
                    </div>
                    <div className="text-sm text-gray-600">Settings</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">Last Updated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
