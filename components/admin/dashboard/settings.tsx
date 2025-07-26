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
import { useWebsiteSettings } from '@/contexts/website-settings-extended';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
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
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/website-settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load settings');
      }

      setSettings(result.data);
    } catch (error) {
      logger.error('Error loading settings:', error);
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
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/website-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      logger.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      logger.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const createBackup = async () => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      logger.error('Error creating backup:', error);
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="theme" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Theme</span>
          </TabsTrigger>
          <TabsTrigger value="homepage" className="flex items-center space-x-2">
            <Layout className="h-4 w-4" />
            <span>Homepage</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Services</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Contact</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Footer</span>
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            <span>Brand</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Advanced</span>
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

        {/* Homepage Settings */}
        <TabsContent value="homepage">
          <div className="space-y-6">
            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="mr-2 h-5 w-5" />
                  Hero Trust Indicators
                </CardTitle>
                <CardDescription>
                  Configure the trust indicators displayed in the hero section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hero-trust-1-number">Trust Indicator 1 - Number</Label>
                    <Input
                      id="hero-trust-1-number"
                      value={settings.home_hero_trust_1_number?.value || ''}
                      onChange={(e) => updateSetting('home_hero_trust_1_number', e.target.value)}
                      placeholder="500+"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-trust-1-label">Trust Indicator 1 - Label</Label>
                    <Input
                      id="hero-trust-1-label"
                      value={settings.home_hero_trust_1_label?.value || ''}
                      onChange={(e) => updateSetting('home_hero_trust_1_label', e.target.value)}
                      placeholder="Happy Customers"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      {settings.home_hero_trust_1_number?.value || '500+'} {settings.home_hero_trust_1_label?.value || 'Happy Customers'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hero-trust-2-number">Trust Indicator 2 - Number</Label>
                    <Input
                      id="hero-trust-2-number"
                      value={settings.home_hero_trust_2_number?.value || ''}
                      onChange={(e) => updateSetting('home_hero_trust_2_number', e.target.value)}
                      placeholder="24/7"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-trust-2-label">Trust Indicator 2 - Label</Label>
                    <Input
                      id="hero-trust-2-label"
                      value={settings.home_hero_trust_2_label?.value || ''}
                      onChange={(e) => updateSetting('home_hero_trust_2_label', e.target.value)}
                      placeholder="Available Service"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      {settings.home_hero_trust_2_number?.value || '24/7'} {settings.home_hero_trust_2_label?.value || 'Available Service'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hero-trust-3-number">Trust Indicator 3 - Number</Label>
                    <Input
                      id="hero-trust-3-number"
                      value={settings.home_hero_trust_3_number?.value || ''}
                      onChange={(e) => updateSetting('home_hero_trust_3_number', e.target.value)}
                      placeholder="100%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-trust-3-label">Trust Indicator 3 - Label</Label>
                    <Input
                      id="hero-trust-3-label"
                      value={settings.home_hero_trust_3_label?.value || ''}
                      onChange={(e) => updateSetting('home_hero_trust_3_label', e.target.value)}
                      placeholder="Satisfaction"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      {settings.home_hero_trust_3_number?.value || '100%'} {settings.home_hero_trust_3_label?.value || 'Satisfaction'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us Section */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us Section</CardTitle>
                <CardDescription>
                  Configure the "Why Choose Us" section with features and benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="why-choose-badge">Section Badge</Label>
                    <Input
                      id="why-choose-badge"
                      value={settings.home_why_choose_badge?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_badge', e.target.value)}
                      placeholder="Why Choose Us"
                    />
                  </div>
                  <div>
                    <Label htmlFor="why-choose-title">Title (First Part)</Label>
                    <Input
                      id="why-choose-title"
                      value={settings.home_why_choose_title?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_title', e.target.value)}
                      placeholder="Trusted by"
                    />
                  </div>
                  <div>
                    <Label htmlFor="why-choose-title-highlight">Title (Highlighted Part)</Label>
                    <Input
                      id="why-choose-title-highlight"
                      value={settings.home_why_choose_title_highlight?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_title_highlight', e.target.value)}
                      placeholder="Thousands"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="why-choose-description">Section Description</Label>
                  <Textarea
                    id="why-choose-description"
                    value={settings.home_why_choose_description?.value || ''}
                    onChange={(e) => updateSetting('home_why_choose_description', e.target.value)}
                    placeholder="We're committed to providing exceptional service with every job, backed by years of experience and countless satisfied customers"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feature-1">Feature 1</Label>
                    <Input
                      id="feature-1"
                      value={settings.home_why_choose_feature_1?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_feature_1', e.target.value)}
                      placeholder="Licensed & Insured"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feature-2">Feature 2</Label>
                    <Input
                      id="feature-2"
                      value={settings.home_why_choose_feature_2?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_feature_2', e.target.value)}
                      placeholder="Same Day Service"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feature-3">Feature 3</Label>
                    <Input
                      id="feature-3"
                      value={settings.home_why_choose_feature_3?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_feature_3', e.target.value)}
                      placeholder="Eco-Friendly Disposal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feature-4">Feature 4</Label>
                    <Input
                      id="feature-4"
                      value={settings.home_why_choose_feature_4?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_feature_4', e.target.value)}
                      placeholder="Upfront Pricing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feature-5">Feature 5</Label>
                    <Input
                      id="feature-5"
                      value={settings.home_why_choose_feature_5?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_feature_5', e.target.value)}
                      placeholder="Professional Team"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feature-6">Feature 6</Label>
                    <Input
                      id="feature-6"
                      value={settings.home_why_choose_feature_6?.value || ''}
                      onChange={(e) => updateSetting('home_why_choose_feature_6', e.target.value)}
                      placeholder="100% Satisfaction Guarantee"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Section */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics Section</CardTitle>
                <CardDescription>
                  Configure the statistics that build trust with customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stat-1-number">Statistic 1 - Number</Label>
                        <Input
                          id="stat-1-number"
                          value={settings.home_stat_1_number?.value || ''}
                          onChange={(e) => updateSetting('home_stat_1_number', e.target.value)}
                          placeholder="500+"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stat-1-label">Statistic 1 - Label</Label>
                        <Input
                          id="stat-1-label"
                          value={settings.home_stat_1_label?.value || ''}
                          onChange={(e) => updateSetting('home_stat_1_label', e.target.value)}
                          placeholder="Projects Completed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stat-2-number">Statistic 2 - Number</Label>
                        <Input
                          id="stat-2-number"
                          value={settings.home_stat_2_number?.value || ''}
                          onChange={(e) => updateSetting('home_stat_2_number', e.target.value)}
                          placeholder="98%"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stat-2-label">Statistic 2 - Label</Label>
                        <Input
                          id="stat-2-label"
                          value={settings.home_stat_2_label?.value || ''}
                          onChange={(e) => updateSetting('home_stat_2_label', e.target.value)}
                          placeholder="Customer Satisfaction"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stat-3-number">Statistic 3 - Number</Label>
                        <Input
                          id="stat-3-number"
                          value={settings.home_stat_3_number?.value || ''}
                          onChange={(e) => updateSetting('home_stat_3_number', e.target.value)}
                          placeholder="24/7"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stat-3-label">Statistic 3 - Label</Label>
                        <Input
                          id="stat-3-label"
                          value={settings.home_stat_3_label?.value || ''}
                          onChange={(e) => updateSetting('home_stat_3_label', e.target.value)}
                          placeholder="Support Available"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stat-4-number">Statistic 4 - Number</Label>
                        <Input
                          id="stat-4-number"
                          value={settings.home_stat_4_number?.value || ''}
                          onChange={(e) => updateSetting('home_stat_4_number', e.target.value)}
                          placeholder="5★"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stat-4-label">Statistic 4 - Label</Label>
                        <Input
                          id="stat-4-label"
                          value={settings.home_stat_4_label?.value || ''}
                          onChange={(e) => updateSetting('home_stat_4_label', e.target.value)}
                          placeholder="Average Rating"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Statistics Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{settings.home_stat_1_number?.value || '500+'}</div>
                      <div className="text-sm text-gray-600">{settings.home_stat_1_label?.value || 'Projects Completed'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">{settings.home_stat_2_number?.value || '98%'}</div>
                      <div className="text-sm text-gray-600">{settings.home_stat_2_label?.value || 'Customer Satisfaction'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">{settings.home_stat_3_number?.value || '24/7'}</div>
                      <div className="text-sm text-gray-600">{settings.home_stat_3_label?.value || 'Support Available'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-orange-600">{settings.home_stat_4_number?.value || '5★'}</div>
                      <div className="text-sm text-gray-600">{settings.home_stat_4_label?.value || 'Average Rating'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card>
              <CardHeader>
                <CardTitle>Call-to-Action Section</CardTitle>
                <CardDescription>
                  Configure the final section that encourages visitors to take action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cta-badge">CTA Badge</Label>
                    <Input
                      id="cta-badge"
                      value={settings.home_cta_badge?.value || ''}
                      onChange={(e) => updateSetting('home_cta_badge', e.target.value)}
                      placeholder="Join 500+ Satisfied Customers"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta-guarantee">Guarantee Text</Label>
                    <Input
                      id="cta-guarantee"
                      value={settings.home_cta_guarantee?.value || ''}
                      onChange={(e) => updateSetting('home_cta_guarantee', e.target.value)}
                      placeholder="Free estimates • Same-day service • 100% satisfaction guaranteed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cta-primary-button">Primary Button Text</Label>
                    <Input
                      id="cta-primary-button"
                      value={settings.home_cta_primary_button?.value || ''}
                      onChange={(e) => updateSetting('home_cta_primary_button', e.target.value)}
                      placeholder="Schedule Service Now"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta-secondary-button">Secondary Button Text</Label>
                    <Input
                      id="cta-secondary-button"
                      value={settings.home_cta_secondary_button?.value || ''}
                      onChange={(e) => updateSetting('home_cta_secondary_button', e.target.value)}
                      placeholder="Call"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cta-trust-1">Trust Badge 1</Label>
                    <Input
                      id="cta-trust-1"
                      value={settings.home_cta_trust_1?.value || ''}
                      onChange={(e) => updateSetting('home_cta_trust_1', e.target.value)}
                      placeholder="Licensed & Insured"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta-trust-2">Trust Badge 2</Label>
                    <Input
                      id="cta-trust-2"
                      value={settings.home_cta_trust_2?.value || ''}
                      onChange={(e) => updateSetting('home_cta_trust_2', e.target.value)}
                      placeholder="24/7 Available"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta-trust-3">Trust Badge 3</Label>
                    <Input
                      id="cta-trust-3"
                      value={settings.home_cta_trust_3?.value || ''}
                      onChange={(e) => updateSetting('home_cta_trust_3', e.target.value)}
                      placeholder="5-Star Rated"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Brand Settings */}
        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layout className="mr-2 h-5 w-5" />
                Header & Navigation
              </CardTitle>
              <CardDescription>
                Configure your website header logo and navigation menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input
                      id="logo-url"
                      value={settings.brand_logo_url?.value || ''}
                      onChange={(e) => updateSetting('brand_logo_url', e.target.value, 'image')}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-sm text-gray-500 mt-1">Logo displayed in header (recommended: 100x100px)</p>
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
                          className="h-10 w-10 rounded-xl object-cover shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">This is how your logo appears in the header</p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Navigation Menu</h4>
                    <p className="text-sm text-blue-700">
                      Your navigation includes: Home, Services, Book Now, Contact
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      The "Book Now" button is highlighted with your primary color
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Section Settings */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Configure the main banner section at the top of your homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hero-title">Main Headline</Label>
                  <Input
                    id="hero-title"
                    value={settings.hero_title?.value || ''}
                    onChange={(e) => updateSetting('hero_title', e.target.value)}
                    placeholder="Professional Cleanout Services"
                  />
                  <p className="text-sm text-gray-500 mt-1">Large text displayed prominently in hero section</p>
                </div>

                <div>
                  <Label htmlFor="hero-subtitle">Subtitle</Label>
                  <Input
                    id="hero-subtitle"
                    value={settings.hero_subtitle?.value || ''}
                    onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                    placeholder="Fast, reliable, and eco-friendly services"
                  />
                  <p className="text-sm text-gray-500 mt-1">Supporting text under the main headline</p>
                </div>

                <div>
                  <Label htmlFor="hero-background">Background Image URL</Label>
                  <Input
                    id="hero-background"
                    value={settings.hero_background_image?.value || ''}
                    onChange={(e) => updateSetting('hero_background_image', e.target.value, 'image')}
                    placeholder="https://example.com/hero-bg.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-1">Background image for hero section (recommended: 1200x600px)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hero-cta">Primary Button Text</Label>
                    <Input
                      id="hero-cta"
                      value={settings.hero_cta_text?.value || ''}
                      onChange={(e) => updateSetting('hero_cta_text', e.target.value)}
                      placeholder="Book Now"
                    />
                    <p className="text-sm text-gray-500 mt-1">Main action button (links to booking)</p>
                  </div>

                  <div>
                    <Label htmlFor="hero-secondary-cta">Secondary Button Text</Label>
                    <Input
                      id="hero-secondary-cta"
                      value={settings.hero_secondary_cta_text?.value || ''}
                      onChange={(e) => updateSetting('hero_secondary_cta_text', e.target.value)}
                      placeholder="Get Free Quote"
                    />
                    <p className="text-sm text-gray-500 mt-1">Secondary button (links to contact)</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Trust Indicators</h4>
                  <p className="text-sm text-yellow-700">
                    Your hero section also displays: "500+ Happy Customers", "24/7 Available Service", "100% Satisfaction"
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    These help build trust with potential customers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Section Settings */}
        {/* Contact Page Settings */}
        <TabsContent value="contact">
          <div className="space-y-6">
            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Contact Hero Section
                </CardTitle>
                <CardDescription>
                  Configure the hero section at the top of the contact page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact-hero-badge">Hero Badge</Label>
                    <Input
                      id="contact-hero-badge"
                      value={settings.contact_hero_badge?.value || ''}
                      onChange={(e) => updateSetting('contact_hero_badge', e.target.value)}
                      placeholder="24/7 Customer Support"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-hero-title">Hero Title</Label>
                    <Input
                      id="contact-hero-title"
                      value={settings.contact_hero_title?.value || ''}
                      onChange={(e) => updateSetting('contact_hero_title', e.target.value)}
                      placeholder="Get in"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-hero-title-highlight">Hero Title (Highlighted)</Label>
                    <Input
                      id="contact-hero-title-highlight"
                      value={settings.contact_hero_title_highlight?.value || ''}
                      onChange={(e) => updateSetting('contact_hero_title_highlight', e.target.value)}
                      placeholder="Touch"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact-hero-description">Hero Description</Label>
                  <Textarea
                    id="contact-hero-description"
                    value={settings.contact_hero_description?.value || ''}
                    onChange={(e) => updateSetting('contact_hero_description', e.target.value)}
                    placeholder="Ready to transform your space? Our expert team is here to help with quotes, questions, and scheduling your perfect service solution."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Section */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information Section</CardTitle>
                <CardDescription>
                  Configure the contact information display
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-info-title">Section Title</Label>
                    <Input
                      id="contact-info-title"
                      value={settings.contact_info_title?.value || ''}
                      onChange={(e) => updateSetting('contact_info_title', e.target.value)}
                      placeholder="Get in Touch"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-info-description">Section Description</Label>
                    <Input
                      id="contact-info-description"
                      value={settings.contact_info_description?.value || ''}
                      onChange={(e) => updateSetting('contact_info_description', e.target.value)}
                      placeholder="Reach out to us through any of these channels for immediate assistance"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions Section</CardTitle>
                <CardDescription>
                  Configure the quick action buttons in the contact sidebar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="quick-actions-title">Section Title</Label>
                  <Input
                    id="quick-actions-title"
                    value={settings.contact_quick_actions_title?.value || ''}
                    onChange={(e) => updateSetting('contact_quick_actions_title', e.target.value)}
                    placeholder="Quick Actions"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Quick Action 1</h4>
                    <div>
                      <Label htmlFor="quick-action-1-title">Title</Label>
                      <Input
                        id="quick-action-1-title"
                        value={settings.contact_quick_action_1_title?.value || ''}
                        onChange={(e) => updateSetting('contact_quick_action_1_title', e.target.value)}
                        placeholder="Get a Quote"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quick-action-1-description">Description</Label>
                      <Input
                        id="quick-action-1-description"
                        value={settings.contact_quick_action_1_description?.value || ''}
                        onChange={(e) => updateSetting('contact_quick_action_1_description', e.target.value)}
                        placeholder="Request a custom quote for your project"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Quick Action 2</h4>
                    <div>
                      <Label htmlFor="quick-action-2-title">Title</Label>
                      <Input
                        id="quick-action-2-title"
                        value={settings.contact_quick_action_2_title?.value || ''}
                        onChange={(e) => updateSetting('contact_quick_action_2_title', e.target.value)}
                        placeholder="Ask a Question"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quick-action-2-description">Description</Label>
                      <Input
                        id="quick-action-2-description"
                        value={settings.contact_quick_action_2_description?.value || ''}
                        onChange={(e) => updateSetting('contact_quick_action_2_description', e.target.value)}
                        placeholder="Have questions about our services?"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Form Section</CardTitle>
                <CardDescription>
                  Configure the main contact form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-form-title">Form Title</Label>
                    <Input
                      id="contact-form-title"
                      value={settings.contact_form_title?.value || ''}
                      onChange={(e) => updateSetting('contact_form_title', e.target.value)}
                      placeholder="Send us a Message"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-form-description">Form Description</Label>
                    <Input
                      id="contact-form-description"
                      value={settings.contact_form_description?.value || ''}
                      onChange={(e) => updateSetting('contact_form_description', e.target.value)}
                      placeholder="Fill out the form below and we'll get back to you within 24 hours"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Success Message</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="form-success-title">Success Title</Label>
                      <Input
                        id="form-success-title"
                        value={settings.contact_form_success_title?.value || ''}
                        onChange={(e) => updateSetting('contact_form_success_title', e.target.value)}
                        placeholder="Message Sent Successfully!"
                      />
                    </div>
                    <div>
                      <Label htmlFor="form-success-button">Success Button</Label>
                      <Input
                        id="form-success-button"
                        value={settings.contact_form_success_button?.value || ''}
                        onChange={(e) => updateSetting('contact_form_success_button', e.target.value)}
                        placeholder="Send Another Message"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="form-success-description">Success Description</Label>
                    <Textarea
                      id="form-success-description"
                      value={settings.contact_form_success_description?.value || ''}
                      onChange={(e) => updateSetting('contact_form_success_description', e.target.value)}
                      placeholder="Thank you for contacting us. Our team will get back to you within 24 hours with a personalized response."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information Cards</CardTitle>
                <CardDescription>
                  Configure the three contact cards at the bottom of the page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Card 1</h4>
                    <div>
                      <Label htmlFor="contact-card-1-title">Title</Label>
                      <Input
                        id="contact-card-1-title"
                        value={settings.contact_card_1_title?.value || ''}
                        onChange={(e) => updateSetting('contact_card_1_title', e.target.value)}
                        placeholder="Call for Immediate Service"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-card-1-description">Description</Label>
                      <Textarea
                        id="contact-card-1-description"
                        value={settings.contact_card_1_description?.value || ''}
                        onChange={(e) => updateSetting('contact_card_1_description', e.target.value)}
                        placeholder="Need urgent service? Call us directly for same-day availability and emergency support."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-card-1-button">Button Text</Label>
                      <Input
                        id="contact-card-1-button"
                        value={settings.contact_card_1_button?.value || ''}
                        onChange={(e) => updateSetting('contact_card_1_button', e.target.value)}
                        placeholder="Call"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Card 2</h4>
                    <div>
                      <Label htmlFor="contact-card-2-title">Title</Label>
                      <Input
                        id="contact-card-2-title"
                        value={settings.contact_card_2_title?.value || ''}
                        onChange={(e) => updateSetting('contact_card_2_title', e.target.value)}
                        placeholder="Free Estimates"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-card-2-description">Description</Label>
                      <Textarea
                        id="contact-card-2-description"
                        value={settings.contact_card_2_description?.value || ''}
                        onChange={(e) => updateSetting('contact_card_2_description', e.target.value)}
                        placeholder="Get a free, no-obligation estimate for your project with detailed pricing breakdown."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-card-2-button">Button Text</Label>
                      <Input
                        id="contact-card-2-button"
                        value={settings.contact_card_2_button?.value || ''}
                        onChange={(e) => updateSetting('contact_card_2_button', e.target.value)}
                        placeholder="Request Estimate"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Card 3</h4>
                    <div>
                      <Label htmlFor="contact-card-3-title">Title</Label>
                      <Input
                        id="contact-card-3-title"
                        value={settings.contact_card_3_title?.value || ''}
                        onChange={(e) => updateSetting('contact_card_3_title', e.target.value)}
                        placeholder="24/7 Support"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-card-3-description">Description</Label>
                      <Textarea
                        id="contact-card-3-description"
                        value={settings.contact_card_3_description?.value || ''}
                        onChange={(e) => updateSetting('contact_card_3_description', e.target.value)}
                        placeholder="Questions? We're here to help around the clock with expert guidance and support."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-card-3-button">Button Text</Label>
                      <Input
                        id="contact-card-3-button"
                        value={settings.contact_card_3_button?.value || ''}
                        onChange={(e) => updateSetting('contact_card_3_button', e.target.value)}
                        placeholder="Email Support"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Services Section
              </CardTitle>
              <CardDescription>
                Configure the services section that displays your three main services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="services-title">Section Title (First Part)</Label>
                  <Input
                    id="services-title"
                    value={settings.services_title?.value || ''}
                    onChange={(e) => updateSetting('services_title', e.target.value)}
                    placeholder="Our"
                  />
                  <p className="text-sm text-gray-500 mt-1">First part of the title (e.g., "Our")</p>
                </div>

                <div>
                  <Label htmlFor="services-subtitle">Section Title (Highlighted Part)</Label>
                  <Input
                    id="services-subtitle"
                    value={settings.services_subtitle?.value || ''}
                    onChange={(e) => updateSetting('services_subtitle', e.target.value)}
                    placeholder="Expert Services"
                  />
                  <p className="text-sm text-gray-500 mt-1">Second part with gradient color (e.g., "Expert Services")</p>
                </div>

                <div>
                  <Label htmlFor="services-description">Section Description</Label>
                  <Textarea
                    id="services-description"
                    value={settings.services_description?.value || ''}
                    onChange={(e) => updateSetting('services_description', e.target.value)}
                    placeholder="Professional cleanout and moving services tailored to your needs with unmatched quality and reliability"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">Description text under the title</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Current Services Displayed</h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span><strong>Junk Removal</strong> - Starting at $99</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span><strong>Labor Moving</strong> - Starting at $120/hr</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span><strong>Estate Cleanouts</strong> - Starting at $150</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    These services are managed in the Services section of the admin panel
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Features Section</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Below services, your website shows "Why Choose Us" with these features:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-600">
                    <div>• Licensed & Insured</div>
                    <div>• Same Day Service</div>
                    <div>• Eco-Friendly Disposal</div>
                    <div>• Upfront Pricing</div>
                    <div>• Professional Team</div>
                    <div>• 100% Satisfaction Guarantee</div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Statistics Section</h4>
                  <p className="text-sm text-purple-700 mb-2">
                    Your website also displays these trust indicators:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-purple-600">
                    <div>• 500+ Projects Completed</div>
                    <div>• 98% Customer Satisfaction</div>
                    <div>• 24/7 Support Available</div>
                    <div>• 5★ Average Rating</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Section Settings */}
        <TabsContent value="cta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Call-to-Action Section
              </CardTitle>
              <CardDescription>
                Configure the final section that encourages visitors to take action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cta-title">Main Title</Label>
                  <Input
                    id="cta-title"
                    value={settings.cta_title?.value || ''}
                    onChange={(e) => updateSetting('cta_title', e.target.value)}
                    placeholder="Ready to Get Started?"
                  />
                  <p className="text-sm text-gray-500 mt-1">Large title text (last word will be highlighted in yellow)</p>
                </div>

                <div>
                  <Label htmlFor="cta-description">Description</Label>
                  <Textarea
                    id="cta-description"
                    value={settings.cta_description?.value || ''}
                    onChange={(e) => updateSetting('cta_description', e.target.value)}
                    placeholder="Book your service today and experience the difference professional cleanout services can make."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">Supporting text under the title</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">CTA Buttons</h4>
                  <div className="space-y-2 text-sm text-yellow-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-white rounded border"></div>
                      <span><strong>Schedule Service Now</strong> - White button (links to booking)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border border-white rounded"></div>
                      <span><strong>Call {settings.contact_phone?.value || '(555) 123-4567'}</strong> - Outline button (calls phone)</span>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    Phone number is taken from your contact settings
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Trust Badges</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    At the bottom of this section, these trust indicators are displayed:
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>🛡️ Licensed & Insured</div>
                    <div>🕐 24/7 Available</div>
                    <div>⭐ 5-Star Rated</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Section Features</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div>• Animated gradient background</div>
                    <div>• Floating animation elements</div>
                    <div>• "Join 500+ Satisfied Customers" badge</div>
                    <div>• "Free estimates • Same-day service • 100% satisfaction guaranteed" guarantee text</div>
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
