'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';

interface BookingsProps {
  recentBookings: any[];
  getStatusColor: (status: string) => string;
  updateBookingStatus: (bookingId: string, status: string) => void;
}

export const Bookings: React.FC<BookingsProps> = ({ recentBookings, getStatusColor, updateBookingStatus }) => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
        <CardDescription>Manage and track recent service bookings</CardDescription>
      </CardHeader>
      <CardContent>
        {recentBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Bookings</h3>
            <p className="text-gray-600">There are no bookings in the selected period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{booking.services?.name}</p>
                      <p className="text-sm text-gray-600">
                        {booking.profiles?.full_name} ({booking.profiles?.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(booking.booking_date), 'MMM d, yyyy')} at {booking.start_time}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${booking.total_price}</p>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span>Booking Details</span>
                        </DialogTitle>
                        <DialogDescription>
                          Full details of the customer booking
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Booking Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Service</label>
                            <p className="text-gray-900 font-semibold">{booking.services?.name}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Customer</label>
                            <p className="text-gray-900 font-semibold">{booking.profiles?.full_name}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <p className="text-gray-900">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Time</label>
                            <p className="text-gray-900">{booking.start_time} - {booking.end_time}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Total Price</label>
                            <p className="text-gray-900 font-semibold">${booking.total_price}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Customer Information</label>
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <p className="text-gray-900">Email: {booking.profiles?.email}</p>
                            <p className="text-gray-900">Phone: {booking.profiles?.phone || 'Not provided'}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {booking.status === 'pending' && (
                          <div className="flex space-x-3 pt-4 border-t">
                            <Button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Booking
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};