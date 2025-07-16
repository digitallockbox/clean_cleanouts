
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';

export function CustomerManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setCustomers(data);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading customers..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.full_name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{format(new Date(customer.created_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
