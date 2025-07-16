'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner, ButtonLoading } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-bookings';
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/constants/index';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreditCard, Lock, CheckCircle, MapPin, User, Mail, Phone } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Stripe card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Payment Form Component
function PaymentForm({ booking }: { booking: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: booking.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create payment intent');
        }

        setClientSecret(result.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [booking.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: booking.customer_info?.fullName || booking.customer_info?.full_name || booking.user?.full_name,
            email: booking.customer_info?.email || booking.user?.email,
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment completed successfully!');
        
        // Update payment status immediately to avoid timing issues with webhook
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          const updateResponse = await fetch(`/api/bookings/${booking.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              payment_status: 'paid',
              status: 'confirmed'
            }),
          });

          if (!updateResponse.ok) {
            const errorResult = await updateResponse.json();
            console.error('Failed to update booking status after payment:', errorResult);
            throw new Error(errorResult.error || 'Failed to update booking status');
          }

          const result = await updateResponse.json();
          console.log('Booking status updated successfully:', result);
          
        } catch (updateError) {
          console.error('Error updating booking status:', updateError);
          // Don't fail the redirect if update fails - webhook will handle it
        }
        
        // Longer delay to ensure database update completes and propagates
        setTimeout(() => {
          router.push(`/invoice/${booking.id}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="mr-2 h-5 w-5" />
          Secure Payment
        </CardTitle>
        <CardDescription>
          Complete your booking payment securely with Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">Payment Amount</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            ${booking.total_price}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-white">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment is secure and encrypted</span>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isProcessing || !clientSecret}
          >
            <ButtonLoading 
              isLoading={isProcessing} 
              loadingText="Processing Payment..."
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${booking.total_price}
            </ButtonLoading>
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/bookings')}
              className="text-sm"
            >
              Back to Bookings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Payment() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const { booking, loading: bookingLoading, error } = useBooking(bookingId || '');

  // Debug logging and error checking
  useEffect(() => {
    if (booking) {
      console.log('=== PAYMENT PAGE BOOKING DATA ===');
      console.log('Full booking object:', booking);
      console.log('Service data (singular):', booking.service);
      console.log('Services data (plural):', (booking as any).services);
      console.log('Service ID:', booking.service_id);
      console.log('Customer info:', booking.customer_info);
      console.log('Total price:', booking.total_price);
      console.log('Duration:', booking.duration);
      console.log('Status:', booking.status);
      console.log('Payment status:', booking.payment_status);
      
      // Enhanced service data debugging
      console.log('=== SERVICE DATA ANALYSIS ===');
      if (booking.service) {
        console.log('booking.service exists:', booking.service);
        console.log('booking.service.base_price:', booking.service.base_price);
        console.log('booking.service.price_per_hour:', booking.service.price_per_hour);
      }
      if ((booking as any).services) {
        console.log('booking.services exists:', (booking as any).services);
        console.log('booking.services.base_price:', (booking as any).services.base_price);
        console.log('booking.services.price_per_hour:', (booking as any).services.price_per_hour);
      }
      
      // Check for missing data
      const serviceData = booking.service || (booking as any).services;
      if (!serviceData) {
        console.error('ERROR: No service data found in booking');
        console.error('Available keys:', Object.keys(booking));
      } else {
        console.log('Service data found:', serviceData);
        console.log('Service data keys:', Object.keys(serviceData));
      }
      if (!booking.customer_info) {
        console.error('ERROR: No customer info found in booking');
      }
      if (!booking.total_price) {
        console.error('ERROR: No total price found in booking');
      }
    }
    
    if (error) {
      console.error('=== BOOKING FETCH ERROR ===');
      console.error('Error:', error);
    }
  }, [booking, error]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!bookingId) {
      router.push('/booking');
    }
  }, [bookingId, router]);

  if (authLoading || bookingLoading) {
    return <LoadingSpinner text="Loading payment details..." />;
  }

  if (!user) {
    return null;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Booking Not Found</CardTitle>
              <CardDescription>
                The booking you're trying to pay for could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/booking')} className="w-full">
                Create New Booking
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Additional validation for booking data
  const serviceData = booking?.service || (booking as any)?.services;
  if (booking && (!booking.total_price || !serviceData)) {
    console.error('Payment page error - incomplete booking data:', booking);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Incomplete Booking Data</CardTitle>
              <CardDescription>
                This booking is missing required information for payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Booking ID:</strong> {bookingId}</p>
                <p><strong>Issue:</strong> Missing service or pricing information</p>
              </div>
              <Button onClick={() => router.push('/booking')} className="w-full">
                Create New Booking
              </Button>
              <Button 
                onClick={() => router.push('/bookings')} 
                variant="outline" 
                className="w-full"
              >
                View My Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (booking.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Payment Complete</CardTitle>
              <CardDescription>
                Your booking has been confirmed and paid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/bookings')} 
                className="w-full"
              >
                View My Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Review your booking details and complete payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Service:</span>
                  <span>{booking?.service?.name || (booking as any)?.services?.name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Date:</span>
                  <span>
                    {booking.booking_date 
                      ? format(new Date(booking.booking_date), 'MMMM d, yyyy')
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Time:</span>
                  <span>
                    {booking.start_time && booking.end_time 
                      ? `${booking.start_time} - ${booking.end_time}`
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={booking.status && BOOKING_STATUS_COLORS[booking.status as keyof typeof BOOKING_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                    {booking.status || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Status:</span>
                  <Badge className={booking.payment_status && PAYMENT_STATUS_COLORS[booking.payment_status as keyof typeof PAYMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                    {booking.payment_status || 'Unknown'}
                  </Badge>
                </div>

                {booking.notes && (
                  <div>
                    <span className="font-medium block mb-1">Notes:</span>
                    <p className="text-gray-600 text-sm">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{booking.customer_info?.full_name || (booking.customer_info as any)?.fullName || (booking as any).user?.full_name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{booking.customer_info?.email || (booking as any).user?.email}</span>
                </div>
                
                {booking.customer_info?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{booking.customer_info.phone}</span>
                  </div>
                )}
                
                {booking.customer_info?.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{booking.customer_info.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const basePrice = (booking as any).services?.base_price || 0;
                  const pricePerHour = (booking as any).services?.price_per_hour || 0;
                  const duration = booking.duration || 2;
                  const laborCost = pricePerHour * duration;
                  const calculatedTotal = basePrice + laborCost;
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>${basePrice}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Labor: ${pricePerHour} × {duration} hours</span>
                        <span>${laborCost}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${calculatedTotal}</span>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Elements stripe={stripePromise}>
              <PaymentForm booking={booking} />
            </Elements>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}