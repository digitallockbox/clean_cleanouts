'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useLegacySettings, useWebsiteSettings } from '@/contexts/website-settings';
import { signOut, isAdmin } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';
import { User, LogOut, Settings, Calendar, Menu, X, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const Header: React.FC = () => {
  const { user, loading } = useAuth();
  const settings = useLegacySettings();
  const { loading: settingsLoading } = useWebsiteSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/booking', label: 'Book Now', highlight: true },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50'
          : 'bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              {settingsLoading ? (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse shadow-md" />
              ) : (
                <img
                  src={settings.logoUrl || 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
                  alt={settings.siteName || 'Logo'}
                  className="h-10 w-10 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-all duration-300"
                />
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              {settingsLoading ? (
                <div className="h-6 w-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded" />
              ) : (
                <span className="text-xl font-black text-gradient group-hover:scale-105 transition-transform duration-300">
                  {settings.siteName || 'Loading...'}
                </span>
              )}
              <span className="text-xs text-gray-500 font-medium -mt-1">Professional Service</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  link.highlight
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <NotificationDropdown />
                {isAdmin(user) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300"
                    asChild
                  >
                    <Link href="/admin" className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Admin Panel</span>
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:shadow-md transition-all duration-300">
                      <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass border-gray-200/50" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center hover:bg-blue-50 transition-colors">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50 text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" className="font-medium hover:bg-blue-50 hover:text-blue-600" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button className="btn-gradient shadow-md hover:shadow-lg font-medium" asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    link.highlight
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {!loading && !user && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Button variant="ghost" className="w-full justify-start font-medium" asChild>
                    <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button className="w-full btn-gradient font-medium" asChild>
                    <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};