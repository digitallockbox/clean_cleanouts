'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner, ButtonLoading } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { useServices, useServiceAvailability } from '@/hooks/use-services';
import { useBookings } from '@/hooks/use-bookings';
import { useOptimizedBulkAvailability, useOptimizedRealTimeAvailability } from '@/hooks/use-availability-optimized';
import { bookingSchema } from '@/lib/validations/booking';
import { DURATION_OPTIONS, TIME_SLOTS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { Truck, Clock, Shield, CreditCard, User, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Booking() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { services, loading: servicesLoading } = useServices();
  const { createBooking } = useBookings({ autoFetch: false });
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disabledDates, setDisabledDates] = useState<Set<string>>(new Set());

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: '',
      bookingDate: undefined,
      startTime: '',
      duration: 2,
      notes: '',
      customerInfo: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
      },
    },
  });

  // Use optimized availability hooks
  const {
    availability,
    loading: availabilityLoading,
    checkDateAvailability,
    isDateAvailable,
    availableSlots,
  } = useOptimizedRealTimeAvailability(
    selectedService?.id,
    form.watch('duration'),
    {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
      debounceDelay: 200, // 200ms debounce
      preloadDays: 14, // Preload 2 weeks
    }
  );

  const { checkAvailability: checkBulkAvailability } = useOptimizedBulkAvailability();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      form.setValue('customerInfo.fullName', user.user_metadata?.full_name || '');
      form.setValue('customerInfo.email', user.email || '');
    }
  }, [user, form]);

  // Check bulk availability when service is selected
  useEffect(() => {
    if (selectedService) {
      const checkDatesAvailability = async () => {
        try {
          // Generate dates for the next 30 days
          const dates = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i + 1); // Start from tomorrow
            return date;
          });

          const availabilityResults = await checkBulkAvailability(
            dates,
            selectedService.id,
            form.watch('duration')
          );

          // Create set of fully booked dates (availableSlots === 0)
          const fullyBookedDates = new Set(
            availabilityResults
              .filter(result => result.availableSlots === 0)
              .map(result => result.date)
          );

          setDisabledDates(fullyBookedDates);
        } catch (error) {
          logger.error('Error checking bulk availability:', error);
          // Don't show error to user, just don't disable any dates
          setDisabledDates(new Set());
        }
      };

      checkDatesAvailability();
    } else {
      setDisabledDates(new Set());
    }
  }, [selectedService, form.watch('duration'), checkBulkAvailability]);

  const calculateTotalPrice = () => {
    if (!selectedService) return 0;
    const duration = form.watch('duration');
    return selectedService.base_price + (selectedService.price_per_hour * duration);
  };

  const onSubmit = async (data: any) => {
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }

    logger.info('=== BOOKING FORM SUBMISSION ===');
    logger.info('Raw form data:', data);
    logger.info('Selected service:', selectedService);
    logger.info('Form validation state:', form.formState);
    logger.info('Form errors:', form.formState.errors);

    setIsSubmitting(true);

    try {
      // Ensure date is properly formatted
      const bookingDate = data.bookingDate instanceof Date ? data.bookingDate : new Date(data.bookingDate);
      
      // Validate that we have all required data
      if (!data.startTime) {
        toast.error('Please select a start time');
        setIsSubmitting(false);
        return;
      }

      if (!data.customerInfo?.fullName || !data.customerInfo?.email || !data.customerInfo?.phone || !data.customerInfo?.address) {
        toast.error('Please fill in all customer information fields');
        setIsSubmitting(false);
        return;
      }
      
      const formattedData = {
        serviceId: selectedService.id,
        bookingDate: bookingDate,
        startTime: data.startTime,
        duration: Number(data.duration),
        notes: data.notes || '',
        customerInfo: {
          fullName: data.customerInfo.fullName.trim(),
          email: data.customerInfo.email.trim(),
          phone: data.customerInfo.phone.trim(),
          address: data.customerInfo.address.trim(),
        }
      };

      // Log the data being sent for debugging
      logger.info('Formatted booking data:', formattedData);
      logger.info('Booking date type:', typeof formattedData.bookingDate);
      logger.info('Booking date value:', formattedData.bookingDate);

      // Call API directly instead of using the hook
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();
      logger.info('=== API RESPONSE ===');
      logger.info('Response status:', response.status);
      logger.info('Response data:', result);

      if (!response.ok) {
        logger.error('Booking creation failed:', result);
        throw new Error(result.error || 'Failed to create booking');
      }

      const booking = result.data;
      logger.info('=== BOOKING CREATED ===');
      logger.info('Booking:', booking);
      logger.info('Booking ID:', booking?.id);

      if (booking && booking.id) {
        // Show success toast notification
        toast.success('Booking created successfully!');
        
        // Navigate immediately
        logger.info('Navigating to payment page...');
        const paymentUrl = `/payment?booking_id=${booking.id}`;
        logger.info('Payment URL:', paymentUrl);
        
        // Force navigation
        window.location.href = paymentUrl;
        
      } else {
        logger.error('No booking ID in response');
        toast.error('Failed to create booking. Please try again.');
      }
    } catch (error) {
      logger.error('Error in onSubmit:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Truck className="w-4 h-4 mr-2" />
              Easy Online Booking
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 leading-tight">
              Book Your <span className="text-gradient">Perfect Service</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Select your service, choose your preferred date and time, and let our experts handle the rest
            </p>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Service</CardTitle>
                  <CardDescription>Choose the service you need</CardDescription>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <LoadingSpinner text="Loading services..." />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedService?.id === service.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedService(service);
                            form.setValue('serviceId', service.id);
                          }}
                        >
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                          <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                          <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-blue-600">
                              ${service.base_price} + ${service.price_per_hour}/hr
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Date and Time Selection */}
              {selectedService && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date & Time</CardTitle>
                    <CardDescription>Choose your preferred date and time</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-base font-medium mb-3 block">Available Dates</Label>
                        <FormField
                          control={form.control}
                          name="bookingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setSelectedDate(date);
                                    // Use optimized availability checking
                                    if (date && selectedService) {
                                      checkDateAvailability(date);
                                    }
                                  }}
                                  disabled={(date) => {
                                    // Disable past dates and today
                                    if (date < new Date() || date < addDays(new Date(), 1)) {
                                      return true;
                                    }
                                    
                                    // Disable dates that are fully booked (all time slots taken)
                                    const dateString = date.toISOString().split('T')[0];
                                    return disabledDates.has(dateString);
                                  }}
                                  className="rounded-md border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Available Time Slots</FormLabel>
                              {availabilityLoading ? (
                                <div className="p-4 text-center">
                                  <LoadingSpinner text="Checking availability..." />
                                </div>
                              ) : selectedDate ? (
                                availability && availability.availability ? (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      {availability.availability.map((slot) => (
                                        <button
                                          key={slot.time}
                                          type="button"
                                          onClick={() => {
                                            if (slot.available) {
                                              field.onChange(slot.time);
                                            }
                                          }}
                                          disabled={!slot.available}
                                          className={`
                                            p-3 rounded-lg border text-sm font-medium transition-all
                                            ${slot.available 
                                              ? field.value === slot.time
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-900 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            }
                                          `}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>{slot.time}</span>
                                            {!slot.available && (
                                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                Booked
                                              </span>
                                            )}
                                          </div>
                                          {slot.conflictingBookings && slot.conflictingBookings > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              {slot.conflictingBookings} booking{slot.conflictingBookings > 1 ? 's' : ''}
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                    
                                    {availability.availability.filter(slot => slot.available).length === 0 && (
                                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center space-x-2 text-yellow-800">
                                          <Clock className="h-4 w-4" />
                                          <span className="text-sm font-medium">No Available Time Slots</span>
                                        </div>
                                        <p className="text-xs text-yellow-700 mt-1">
                                          All time slots for this date are booked. Please select a different date.
                                        </p>
                                      </div>
                                    )}
                                    
                                    {availability.availability.filter(slot => slot.available).length > 0 && (
                                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center space-x-2 text-green-800">
                                          <CheckCircle className="h-4 w-4" />
                                          <span className="text-sm font-medium">
                                            {availability.availability.filter(slot => slot.available).length} time slot{availability.availability.filter(slot => slot.available).length > 1 ? 's' : ''} available
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-4 text-center text-gray-500">
                                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm">Click on a date to check availability</p>
                                  </div>
                                )
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-sm">Select a date to view available time slots</p>
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (hours)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DURATION_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any special instructions or requirements..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Customer Information */}
              {selectedService && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                    <CardDescription>Please provide your contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerInfo.fullName"
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
                        name="customerInfo.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="john@example.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerInfo.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="customerInfo.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Address *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="123 Main St, City, State" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Booking Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedService ? (
                    <>
                      <div className="flex items-center space-x-3">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{selectedService.name}</p>
                          <p className="text-sm text-gray-600">{selectedService.description}</p>
                        </div>
                      </div>

                      {selectedDate && (
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
                            {form.watch('startTime') && (
                              <p className="text-sm text-gray-600">
                                {form.watch('startTime')} - {parseInt(form.watch('startTime').split(':')[0]) + form.watch('duration')}:00
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span>Base Price:</span>
                          <span>${selectedService.base_price}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Labor ({form.watch('duration')} hours):</span>
                          <span>${selectedService.price_per_hour * form.watch('duration')}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${calculateTotalPrice()}</span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!form.formState.isValid || isSubmitting}
                      >
                        <ButtonLoading isLoading={isSubmitting} loadingText="Creating Booking...">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Payment
                        </ButtonLoading>
                      </Button>
                      
                      {/* Validation errors */}
                      {!form.formState.isValid && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600 font-medium mb-2">Please complete all required fields:</p>
                          <ul className="text-xs text-red-500 space-y-1">
                            {Object.entries(form.formState.errors).map(([key, error]) => {
                              // Handle nested errors for customerInfo
                              if (key === 'customerInfo' && typeof error === 'object' && error !== null) {
                                return Object.entries(error).map(([nestedKey, nestedError]) => (
                                  <li key={`${key}.${nestedKey}`}>
                                    • {nestedKey}: {nestedError?.message || 'Required'}
                                  </li>
                                ));
                              }
                              return (
                                <li key={key}>
                                  • {key}: {error?.message || 'Required'}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Select a service to see booking details
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>

      <Footer />
    </div>
  );
}