'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingSpinner, ButtonLoading } from '@/components/ui/loading-spinner';
import { InvoiceButton } from '@/components/ui/invoice-actions';
import { ReviewForm } from '@/components/ui/review-system';
import { useAuth } from '@/hooks/use-auth';
import { useBookings } from '@/hooks/use-bookings';
import { BOOKING_STATUS_COLORS, PAYMENT_STATUS_COLORS, TIME_SLOTS, DURATION_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  FileText,
  Star
} from 'lucide-react';

export default function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bookingDate: undefined as Date | undefined,
    startTime: '',
    duration: 2,
    notes: '',
  });

  const {
    bookings,
    loading,
    error,
    refetch,
    updateBooking,
    cancelBooking
  } = useBookings({
    filters: statusFilter !== 'all' ? { status: [statusFilter as any] } : undefined,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    return (
      booking.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_date.includes(searchTerm) ||
      booking.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    setEditForm({
      bookingDate: new Date(booking.booking_date),
      startTime: booking.start_time,
      duration: booking.duration || 2,
      notes: booking.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking || !editForm.bookingDate) return;

    setIsUpdating(true);
    try {
      await updateBooking(selectedBooking.id, {
        bookingDate: editForm.bookingDate,
        startTime: editForm.startTime,
        duration: editForm.duration,
        notes: editForm.notes,
      });
      setIsEditDialogOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      logger.error('Error updating booking:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setIsCancelling(true);
    try {
      await cancelBooking(selectedBooking.id);
      setIsCancelDialogOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      logger.error('Error cancelling booking:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const isSameDayBooking = (bookingDate: string) => {
    const today = new Date();
    const booking = new Date(bookingDate);
    return (
      today.getFullYear() === booking.getFullYear() &&
      today.getMonth() === booking.getMonth() &&
      today.getDate() === booking.getDate()
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (authLoading) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">Manage your service bookings and appointments</p>
          </div>
          <Button onClick={() => router.push('/booking')} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {loading ? (
          <LoadingSpinner text="Loading bookings..." />
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookings</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={refetch}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No bookings match your search criteria.' 
                    : "You haven't made any bookings yet."
                  }
                </p>
                <Button onClick={() => router.push('/booking')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{booking.service?.name}</h3>
                        <Badge className={BOOKING_STATUS_COLORS[booking.status as keyof typeof BOOKING_STATUS_COLORS]}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(booking.status)}
                            <span>{booking.status}</span>
                          </div>
                        </Badge>
                        <Badge className={PAYMENT_STATUS_COLORS[booking.payment_status as keyof typeof PAYMENT_STATUS_COLORS]}>
                          {booking.payment_status}
                        </Badge>
                        {isSameDayBooking(booking.booking_date) && (
                          <Badge variant="destructive">Same-day</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{booking.start_time} - {booking.end_time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.customer_info?.address || 'Address not provided'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${booking.total_price}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="text-sm text-gray-600">
                          <strong>Notes:</strong> {booking.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBooking(booking)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsCancelDialogOpen(true);
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.payment_status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/payment?booking_id=${booking.id}`)}
                        >
                          Pay Now
                        </Button>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'completed') && (
                        <InvoiceButton
                          bookingId={booking.id}
                          action="download"
                          size="sm"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Invoice
                        </InvoiceButton>
                      )}
                      {booking.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Booking Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Update your booking details. Changes are subject to availability.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.bookingDate ? format(editForm.bookingDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editForm.bookingDate}
                      onSelect={(date) => setEditForm({ ...editForm, bookingDate: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>
                <Select value={editForm.startTime} onValueChange={(value) => setEditForm({ ...editForm, startTime: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Duration</label>
                <Select value={editForm.duration.toString()} onValueChange={(value) => setEditForm({ ...editForm, duration: Number(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBooking} disabled={isUpdating}>
                <ButtonLoading isLoading={isUpdating} loadingText="Updating...">
                  Update Booking
                </ButtonLoading>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Booking Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="font-medium">{selectedBooking.service?.name}</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(selectedBooking.booking_date), 'MMM d, yyyy')} at {selectedBooking.start_time}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: ${selectedBooking.total_price}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
                <ButtonLoading isLoading={isCancelling} loadingText="Cancelling...">
                  Cancel Booking
                </ButtonLoading>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review Service</DialogTitle>
              <DialogDescription>
                Share your experience to help other customers
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <ReviewForm
                bookingId={selectedBooking.id}
                serviceId={selectedBooking.service_id}
                serviceName={selectedBooking.service?.name || 'Service'}
                onReviewSubmitted={() => {
                  setIsReviewDialogOpen(false);
                  setSelectedBooking(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  );
}