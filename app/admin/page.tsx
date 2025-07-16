'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { isAdmin, signOut } from '@/lib/auth';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Overview } from '@/components/admin/dashboard/overview';
import { Bookings } from '@/components/admin/dashboard/bookings';
import { Contacts } from '@/components/admin/dashboard/contacts';
import { Analytics } from '@/components/admin/dashboard/analytics';
import { SettingsComponent } from '@/components/admin/dashboard/settings';
import { Sidebar } from '@/components/admin/dashboard/sidebar';
import { Header } from '@/components/admin/dashboard/header';
import { CustomerManager } from '@/components/admin/customer-manager';

interface DashboardData {
  stats: {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalUsers: number;
    newUsers: number;
    activeServices: number;
    totalContacts: number;
    newContacts: number;
  };
  charts: {
    dailyRevenue: Array<{ date: string; revenue: number; bookings: number }>;
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
    servicePerformance: Array<{ id: string; name: string; bookings: number; revenue: number }>;
  };
  recent: {
    bookings: any[];
    contacts: any[];
  };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataCache, setDataCache] = useState<Record<string, { data: DashboardData; timestamp: number }>>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user))) {
      router.push('/');
      return;
    }

    if (user && isAdmin(user)) {
      const cacheKey = `dashboard-${period}`;
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

      if (dataCache[cacheKey] && (now - dataCache[cacheKey].timestamp) < CACHE_DURATION) {
        setDashboardData(dataCache[cacheKey].data);
        setLoading(false);
      } else if (!dashboardData) {
        loadDashboardData();
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin(user) && dashboardData) {
      loadDashboardData();
    }
  }, [period]);

  const loadDashboardData = async () => {
    const cacheKey = `dashboard-${period}`;
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    if (dataCache[cacheKey] && (now - dataCache[cacheKey].timestamp) < CACHE_DURATION) {
      setDashboardData(dataCache[cacheKey].data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?period=${period}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load dashboard data');
      }

      setDataCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: result.data,
          timestamp: now
        }
      }));

      setDashboardData(result.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = () => {
    setDataCache({});
    loadDashboardData();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      toast.success(`Booking ${status} successfully`);
      refreshDashboardData();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading admin dashboard..." />
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview dashboardData={dashboardData} getStatusColor={getStatusColor} />;
      case 'bookings':
        return <Bookings recentBookings={dashboardData.recent.bookings} getStatusColor={getStatusColor} updateBookingStatus={updateBookingStatus} />;
      case 'services':
        return <ServiceManager />;
      case 'customers':
        return <CustomerManager />;
      case 'contacts':
        return <Contacts recentContacts={dashboardData.recent.contacts} />;
      case 'analytics':
        return <Analytics dashboardData={dashboardData} />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return <Overview dashboardData={dashboardData} getStatusColor={getStatusColor} />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        handleSignOut={handleSignOut} 
      />

      <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          period={period}
          setPeriod={setPeriod}
          refreshDashboardData={refreshDashboardData}
          loading={loading}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
