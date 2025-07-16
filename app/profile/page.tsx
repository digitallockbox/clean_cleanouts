'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner, ButtonLoading } from '@/components/ui/loading-spinner';
import { PaymentMethodsManager } from '@/components/ui/payment-methods';
import { PreferenceManager } from '@/components/ui/preference-manager';
import { PaymentHistory } from '@/components/ui/payment-history';

import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { updateProfileSchema } from '@/lib/validations/auth';
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Settings,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  DollarSign,
  History
} from 'lucide-react';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { bookings, loading: bookingsLoading, error: bookingsError, refetch, isStale } = useBookings({ 
    autoFetch: true,
    cacheTime: 10 * 60 * 1000 // 10 minutes cache for profile page
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      // Try to get profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      let profileData;

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create default from user metadata
        profileData = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          phone: '',
          created_at: user.created_at,
          updated_at: user.created_at,
        };

        // Try to create the profile in the database
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData);
          
          if (insertError) {
            console.log('Could not create profile in database:', insertError);
            // Continue with default profile data
          }
        } catch (insertErr) {
          console.log('Profile table may not exist yet:', insertErr);
          // Continue with default profile data
        }
      } else if (error) {
        console.log('Profile loading error (non-critical):', error);
        // Use default profile data
        profileData = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          phone: '',
          created_at: user.created_at,
          updated_at: user.created_at,
        };
      } else {
        profileData = data;
      }

      setProfile(profileData);
      form.reset({
        fullName: profileData.full_name || '',
        email: user.email || '',
        phone: profileData.phone || '',
      });

    } catch (error) {
      console.log('Profile loading error (using fallback):', error);
      // Use fallback profile data from user
      const fallbackProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        phone: '',
        created_at: user.created_at,
        updated_at: user.created_at,
      };
      
      setProfile(fallbackProfile);
      form.reset({
        fullName: fallbackProfile.full_name || '',
        email: user.email || '',
        phone: fallbackProfile.phone || '',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (data: any) => {
    if (!user) return;

    setIsUpdating(true);

    try {
      // Try to update profile in profiles table
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: data.fullName,
            phone: data.phone,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.log('Profile table update error:', profileError);
          // Continue to update auth metadata
        }
      } catch (profileErr) {
        console.log('Profile table may not exist, updating auth metadata only:', profileErr);
      }

      // Update auth user metadata (this is the primary source)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phone,
        }
      });

      if (authError) {
        throw authError;
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await loadProfile();

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      totalSpent: bookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.total_price, 0),
    };
    return stats;
  };

  if (authLoading || profileLoading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!user) {
    return null;
  }

  const stats = getBookingStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and view your booking history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="John Doe" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="john@example.com" 
                                  className="pl-10" 
                                  disabled 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-gray-500">Email cannot be changed</p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="(555) 123-4567" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2 pt-2">
                        <Button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1"
                        >
                          <ButtonLoading isLoading={isUpdating} loadingText="Saving...">
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </ButtonLoading>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
                        <p className="text-sm text-gray-600">Full Name</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-600">Email Address</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                        <p className="text-sm text-gray-600">Phone Number</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">Member Since</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-600">Total Bookings</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Spent</span>
                  <span className="font-bold text-lg">${stats.totalSpent}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Bookings</span>
                  <Badge variant={stats.pending > 0 ? 'default' : 'secondary'}>
                    {stats.pending}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking History and Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="bookings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bookings">Booking History</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <History className="mr-2 h-5 w-5" />
                          Recent Bookings
                          {isStale && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Data may be outdated
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Your booking history and current appointments
                        </CardDescription>
                      </div>
                      {!bookingsLoading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refetch()}
                          className="flex items-center"
                        >
                          <History className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bookingsLoading ? (
                      <LoadingSpinner text="Loading bookings..." />
                    ) : bookingsError ? (
                      <div className="text-center py-8">
                        <div className="text-red-500 mb-4">
                          <p className="font-medium">Error loading bookings</p>
                          <p className="text-sm">{bookingsError}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => refetch()}
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
                        <p className="text-gray-600 mb-4">
                          You haven't made any bookings yet. Start by booking your first service!
                        </p>
                        <Button onClick={() => router.push('/booking')}>
                          Book a Service
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => refetch()} 
                          className="ml-2"
                        >
                          Refresh Bookings
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.slice(0, 5).map((booking) => (
                          <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{booking.service?.name}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className={BOOKING_STATUS_COLORS[booking.status as keyof typeof BOOKING_STATUS_COLORS]}>
                                  {booking.status}
                                </Badge>
                                <Badge className={PAYMENT_STATUS_COLORS[booking.payment_status as keyof typeof PAYMENT_STATUS_COLORS]}>
                                  {booking.payment_status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(booking.booking_date), 'MMM d')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{booking.start_time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{booking.customer_info?.address || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>${booking.total_price}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {bookings.length > 5 && (
                          <div className="text-center pt-4">
                            <Button variant="outline" onClick={() => router.push('/bookings')}>
                              View All Bookings ({bookings.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <PaymentHistory />
              </TabsContent>

              <TabsContent value="preferences">
                <PreferenceManager />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
