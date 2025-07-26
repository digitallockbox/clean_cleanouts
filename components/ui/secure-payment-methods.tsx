'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ButtonLoading, LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { CreditCard, Trash2, Plus, Star, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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

// Types
interface StripePaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
  isDefault: boolean;
  created: number;
}

// Payment Method Card Component
interface PaymentMethodCardProps {
  method: StripePaymentMethod;
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
  const expired = method.card && 
    new Date(method.card.exp_year, method.card.exp_month - 1) < new Date();

  const displayText = method.card
    ? `${method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} ending in ${method.card.last4}`
    : 'Payment Method';

  return (
    <Card className={`${method.isDefault ? 'ring-2 ring-blue-500' : ''} ${expired ? 'opacity-60' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium">{displayText}</p>
              {method.card && (
                <p className="text-sm text-gray-500">
                  Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                  {expired && <span className="text-red-500 ml-2">(Expired)</span>}
                </p>
              )}
              <div className="flex items-center mt-1">
                <Shield className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Securely stored by Stripe</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {method.isDefault && (
              <Badge className="flex items-center">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
            
            {!method.isDefault && (
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
  onCancel: () => void;
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create setup intent when component mounts
    const createSetupIntent = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/payments/setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create setup intent');
        }

        setClientSecret(result.clientSecret);
      } catch (error) {
        logger.error('Error creating setup intent:', error);
        toast.error('Failed to initialize payment method setup');
      }
    };

    createSetupIntent();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || !user) {
      return;
    }

    setIsSubmitting(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.user_metadata?.full_name || user.email,
            email: user.email,
          },
        },
      });

      if (error) {
        logger.error('Setup failed:', error);
        toast.error(error.message || 'Failed to save payment method');
      } else if (setupIntent.status === 'succeeded') {
        toast.success('Payment method saved successfully!');
        onSuccess();
      }
    } catch (error) {
      logger.error('Setup error:', error);
      toast.error('Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        <Shield className="h-4 w-4 text-green-500" />
        <span>Your payment information is securely stored by Stripe</span>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button
          type="submit"
          disabled={!stripe || isSubmitting || !clientSecret}
          className="flex-1"
        >
          <ButtonLoading 
            isLoading={isSubmitting} 
            loadingText="Saving..."
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Save Payment Method
          </ButtonLoading>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

// Main Secure Payment Methods Component
export const SecurePaymentMethodsManager: React.FC = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<StripePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/payments/payment-methods?userId=${user.id}`);
      const result = await response.json();

      if (response.ok) {
        setPaymentMethods(result.paymentMethods || []);
      } else {
        logger.error('Error fetching payment methods:', result.error);
        toast.error('Failed to load payment methods');
      }
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [user]);

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!user) return;

    setIsActionLoading(true);
    try {
      const response = await fetch('/api/payments/payment-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          paymentMethodId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Default payment method updated');
        fetchPaymentMethods(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to update default payment method');
      }
    } catch (error) {
      logger.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/payments/payment-methods', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Payment method removed');
        fetchPaymentMethods(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to remove payment method');
      }
    } catch (error) {
      logger.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    fetchPaymentMethods(); // Refresh the list
  };

  if (loading) {
    return <LoadingSpinner text="Loading payment methods..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Secure Payment Methods</h3>
          <p className="text-sm text-gray-600">
            Payment methods are securely stored by Stripe and never touch our servers
          </p>
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
              <DialogTitle>Add Secure Payment Method</DialogTitle>
              <DialogDescription>
                Your payment information will be securely stored by Stripe
              </DialogDescription>
            </DialogHeader>
            <Elements stripe={stripePromise}>
              <AddPaymentMethodForm
                onSuccess={handleAddSuccess}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </Elements>
          </DialogContent>
        </Dialog>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
              <p className="text-gray-600 mb-4">
                Add a secure payment method to make booking easier
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