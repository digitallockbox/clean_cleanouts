'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Menu,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  period: string;
  setPeriod: (period: string) => void;
  refreshDashboardData: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, activeTab, period, setPeriod, refreshDashboardData, loading }) => {
  return (
    <header className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' : activeTab}
            </h1>
            <p className="text-sm text-gray-600">
              {activeTab === 'overview' && 'Welcome to your admin dashboard'}
              {activeTab === 'bookings' && 'Manage customer bookings'}
              {activeTab === 'services' && 'Manage your services'}
              {activeTab === 'contacts' && 'Customer inquiries'}
              {activeTab === 'analytics' && 'Business analytics'}
              {activeTab === 'settings' && 'System configuration'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboardData}
            disabled={loading}
            title="Refresh Dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
