'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { InvoiceActions } from '@/components/ui/invoice-actions';
import { useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-bookings';
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/constants';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Download, 
  Eye, 
  FileText, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  CreditCard,
  ArrowLeft
} from 'lucide-react';

export default function InvoicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const { booking, loading: bookingLoading, error } = useBooking(bookingId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading || bookingLoading) {
    return <LoadingSpinner text="Loading invoice..." />;
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
              <CardTitle>Invoice Not Found</CardTitle>
              <CardDescription>
                The invoice you're looking for could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/bookings')} className="w-full">
                Back to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Only show invoice for paid bookings
  if (booking.payment_status !== 'paid') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Payment Required</CardTitle>
              <CardDescription>
                This booking has not been paid yet. Please complete payment to view the invoice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push(`/payment?booking_id=${booking.id}`)} 
                className="w-full"
              >
                Complete Payment
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/bookings')} 
                className="w-full"
              >
                Back to Bookings
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
      
      {/* Success Banner */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-green-900">Payment Successful!</h2>
              <p className="text-sm text-green-700">
                Your booking has been confirmed and payment processed successfully.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice & Receipt</h1>
              <p className="text-gray-600">Booking confirmation and payment receipt</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/bookings')}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bookings
              </Button>
              <InvoiceActions bookingId={booking.id} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Invoice Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader className="bg-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">CleanOuts Pro</CardTitle>
                    <CardDescription className="text-blue-100">
                      Professional Cleanout Services
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                    <div className="mt-2 text-blue-100">
                      <p>#{booking.id.slice(-8).toUpperCase()}</p>
                      <p>{format(new Date(), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Service Date</p>
                        <p className="font-medium">{format(new Date(booking.booking_date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-medium">{booking.start_time} - {booking.end_time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-medium">{booking.service?.name || (booking as any).services?.name}</p>
                      <p className="text-sm text-gray-500">{booking.service?.description || (booking as any).services?.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={BOOKING_STATUS_COLORS[booking.status as keyof typeof BOOKING_STATUS_COLORS]}>
                        {booking.status}
                      </Badge>
                      <Badge className={PAYMENT_STATUS_COLORS[booking.payment_status as keyof typeof PAYMENT_STATUS_COLORS]}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Service Notes:</p>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{booking.customer_info?.full_name || (booking.customer_info as any)?.fullName || (booking as any).user?.full_name || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{booking.customer_info?.email || (booking as any).user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {booking.customer_info?.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{booking.customer_info.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {booking.customer_info?.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Service Address</p>
                          <p className="font-medium">{booking.customer_info.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">${booking.service?.base_price || (booking as any).services?.base_price}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor ({booking.duration || 2} hours):</span>
                    <span className="font-medium">${((booking.service?.price_per_hour || (booking as any).services?.price_per_hour || 0) * (booking.duration || 2))}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Paid:</span>
                    <span className="text-green-600">${booking.total_price}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Payment Confirmed</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Paid on {format(new Date(), 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/bookings')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Bookings
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/booking')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Another Service
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/contact')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>You'll receive a confirmation email shortly</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Our team will contact you 24 hours before your service</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Be ready at the scheduled time on {format(new Date(booking.booking_date), 'MMM dd')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}