
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { LoadingSpinner, ButtonLoading } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Settings, RefreshCw } from 'lucide-react';

const preferencesSchema = z.object({
  email_notifications: z.boolean().default(true),
  sms_notifications: z.boolean().default(false),
  marketing_emails: z.boolean().default(true),
  booking_reminders: z.boolean().default(true),
  preferred_contact_method: z.enum(['email', 'phone', 'sms']).default('email'),
  timezone: z.string().default('America/New_York'),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export function PreferenceManager() {
  const { preferences, loading, error, refetch, updatePreferences, isStale } = useUserPreferences({
    autoFetch: true,
    cacheTime: 15 * 60 * 1000 // 15 minutes cache
  });

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: true,
      booking_reminders: true,
      preferred_contact_method: 'email',
      timezone: 'America/New_York',
    },
  });

  // Update form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        email_notifications: preferences.email_notifications,
        sms_notifications: preferences.sms_notifications,
        marketing_emails: preferences.marketing_emails,
        booking_reminders: preferences.booking_reminders,
        preferred_contact_method: preferences.preferred_contact_method,
        timezone: preferences.timezone,
      });
    }
  }, [preferences, form]);

  const onSubmit = async (data: PreferencesFormValues) => {
    const success = await updatePreferences(data);
    if (success) {
      // Form will be updated automatically through the preferences state
    }
  };

  if (loading && !preferences) {
    return <LoadingSpinner text="Loading preferences..." />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Notification Preferences
              {isStale && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Data may be outdated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications and communications from us.
            </CardDescription>
          </div>
          {!loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <p className="font-medium">Error loading preferences</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Settings</h3>
                
                <FormField
                  control={form.control}
                  name="email_notifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications about your bookings and account activity via email.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sms_notifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SMS Notifications</FormLabel>
                        <FormDescription>
                          Receive important notifications via text message.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="booking_reminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Booking Reminders</FormLabel>
                        <FormDescription>
                          Get reminded about upcoming appointments.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketing_emails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Marketing Emails</FormLabel>
                        <FormDescription>
                          Receive promotional offers and service updates.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Communication Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Communication Preferences</h3>
                
                <FormField
                  control={form.control}
                  name="preferred_contact_method"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="text-base">Preferred Contact Method</FormLabel>
                      <FormDescription>
                        How would you like us to contact you for important updates?
                      </FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <FormLabel className="text-base">Timezone</FormLabel>
                      <FormDescription>
                        Your local timezone for scheduling and notifications.
                      </FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                          <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <ButtonLoading isLoading={loading} loadingText="Saving...">
                  Save Preferences
                </ButtonLoading>
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
