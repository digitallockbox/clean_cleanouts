'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ButtonLoading } from '@/components/ui/loading-spinner';
import { usePaymentMethods, PaymentMethod } from '@/hooks/use-payment-methods';
import { CreditCard, Trash2, Plus, Star, Building2 } from 'lucide-react';
import { z } from 'zod';

// Form validation schema
const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account']),
  card_last_four: z.string().optional(),
  card_brand: z.string().optional(),
  card_exp_month: z.number().min(1).max(12).optional(),
  card_exp_year: z.number().min(new Date().getFullYear()).optional(),
  bank_name: z.string().optional(),
  account_last_four: z.string().optional(),
  is_default: z.boolean().default(false),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

// Payment Method Card Component
interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  onSetDefault,
  onDelete,
  isLoading = false,
}) => {
  const expired = method.type === 'card' && method.card_exp_month && method.card_exp_year && 
    new Date(method.card_exp_year, method.card_exp_month - 1) < new Date();

  const displayText = method.type === 'card'
    ? `${method.card_brand ? method.card_brand.charAt(0).toUpperCase() + method.card_brand.slice(1) : 'Card'} ending in ${method.card_last_four}`
    : `${method.bank_name || 'Bank'} ending in ${method.account_last_four}`;

  return (
    <Card className={`${method.is_default ? 'ring-2 ring-blue-500' : ''} ${expired ? 'opacity-60' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {method.type === 'card' ? (
              <CreditCard className="h-8 w-8 text-gray-400" />
            ) : (
              <Building2 className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <p className="font-medium">{displayText}</p>
              {method.type === 'card' && method.card_exp_month && method.card_exp_year && (
                <p className="text-sm text-gray-500">
                  Expires {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
                  {expired && <span className="text-red-500 ml-2">(Expired)</span>}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {method.is_default && (
              <Badge className="flex items-center">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
            
            {!method.is_default && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetDefault(method.id)}
                disabled={isLoading}
              >
                Set Default
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(method.id)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Add Payment Method Form
interface AddPaymentMethodFormProps {
  onSuccess: () => void;
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onSuccess }) => {
  const { addPaymentMethod } = usePaymentMethods({ autoFetch: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'card',
      card_last_four: '',
      card_brand: '',
      card_exp_month: undefined,
      card_exp_year: undefined,
      bank_name: '',
      account_last_four: '',
      is_default: false,
    },
  });

  const watchType = form.watch('type');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addPaymentMethod(data);
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === 'card' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="card_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Brand</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="discover">Discover</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_last_four"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last 4 Digits</FormLabel>
                    <FormControl>
                      <Input placeholder="1234" maxLength={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="card_exp_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Month</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {month.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_exp_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Year</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {watchType === 'bank_account' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Bank of America" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_last_four"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last 4 Digits</FormLabel>
                  <FormControl>
                    <Input placeholder="1234" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            <p>Note: This is a demo. In production, payment methods would be securely stored via Stripe.</p>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <ButtonLoading isLoading={isSubmitting} loadingText="Adding...">
              Add Payment Method
            </ButtonLoading>
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Main Payment Methods Component
export const PaymentMethodsManager: React.FC = () => {
  const {
    paymentMethods,
    loading,
    setDefaultPaymentMethod,
    deletePaymentMethod,
  } = usePaymentMethods();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleSetDefault = async (id: string) => {
    setIsActionLoading(true);
    try {
      await setDefaultPaymentMethod(id);
    } catch (error) {
      console.error('Error setting default payment method:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsActionLoading(true);
    try {
      await deletePaymentMethod(id);
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Payment Methods</h3>
          <p className="text-sm text-gray-600">Manage your saved payment methods</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account
              </DialogDescription>
            </DialogHeader>
            <AddPaymentMethodForm
              onSuccess={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
              <p className="text-gray-600 mb-4">
                Add a payment method to make booking easier
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              isLoading={isActionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};
