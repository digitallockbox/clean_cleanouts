'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn, isAdmin } from '@/lib/auth';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Check if user is admin and redirect accordingly
        if (isAdmin(data.user as any)) {
          toast.success('Welcome Admin! Redirecting to admin panel...');
          router.push('/admin');
        } else {
          toast.success('Signed in successfully!');
          router.push('/');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black text-gradient">Welcome Back</CardTitle>
          <CardDescription className="text-base text-gray-600 leading-relaxed">
            Sign in to your account to access our premium services
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  className="pl-12 h-12 text-base border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-8 w-8 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold btn-gradient shadow-lg group"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">New to our platform?</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Don't have an account yet?
            </p>
            <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-blue-50 hover:border-blue-300" asChild>
              <Link href="/auth/signup">
                <Sparkles className="mr-2 h-4 w-4" />
                Create New Account
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-bold text-gradient">500+</div>
                <div className="text-xs text-gray-500">Happy Customers</div>
              </div>
              <div>
                <div className="text-sm font-bold text-gradient">24/7</div>
                <div className="text-xs text-gray-500">Support</div>
              </div>
              <div>
                <div className="text-sm font-bold text-gradient">100%</div>
                <div className="text-xs text-gray-500">Secure</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}