
'use client';

import React from 'react';
import { usePaymentHistory } from '@/hooks/use-payment-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
import { CreditCard, RefreshCw } from 'lucide-react';

export function PaymentHistory() {
  const { payments, loading, error, refetch, isStale } = usePaymentHistory({
    autoFetch: true,
    cacheTime: 10 * 60 * 1000 // 10 minutes cache
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading payment history..." />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment History
              {isStale && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Data may be outdated
                </Badge>
              )}
            </CardTitle>
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
              <p className="font-medium">Error loading payment history</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {payment.bookings?.services?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      ${(payment.amount / 100).toFixed(2)} {/* Stripe amounts are in cents */}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                    <p className="text-gray-600">
                      You haven't made any payments yet.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
