'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InvoiceData } from '@/lib/pdf-generator';
import { format } from 'date-fns';

interface InvoicePreviewProps {
  data: InvoiceData;
  className?: string;
  id?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  data,
  className = '',
  id = 'invoice-preview'
}) => {
  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div id={id} className={`bg-white p-8 max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{data.companyName}</h1>
            <div className="mt-2 text-blue-100">
              <p>{data.companyAddress}</p>
              <p>Phone: {data.companyPhone}</p>
              <p>Email: {data.companyEmail}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <div className="mt-2 text-blue-100">
              <p>#{data.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill To */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-medium">{data.customerName}</p>
              {data.customerAddress && <p>{data.customerAddress}</p>}
              <p>Email: {data.customerEmail}</p>
              {data.customerPhone && <p>Phone: {data.customerPhone}</p>}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Invoice Date:</span>
                <span>{format(new Date(data.invoiceDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Booking ID:</span>
                <span>#{data.bookingId.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Payment Status:</span>
                <Badge className={getPaymentStatusColor(data.paymentStatus)}>
                  {data.paymentStatus.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Booking Status:</span>
                <Badge className={getBookingStatusColor(data.bookingStatus)}>
                  {data.bookingStatus.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{data.serviceName}</div>
                    {data.serviceDescription && (
                      <div className="text-sm text-gray-500">{data.serviceDescription}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {format(new Date(data.bookingDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {data.startTime} - {data.endTime}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {data.duration} hours
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                  ${data.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cost Breakdown */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Price:</span>
                  <span>${data.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Labor Cost ({data.duration} hours):</span>
                  <span>${data.laborCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>${data.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Notes:</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">{data.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-6 rounded-b-lg text-center">
        <p className="text-sm text-gray-600">Thank you for your business!</p>
        <p className="text-xs text-gray-500 mt-1">
          Generated on {format(new Date(), 'MMM dd, yyyy')}
        </p>
      </div>
    </div>
  );
};
