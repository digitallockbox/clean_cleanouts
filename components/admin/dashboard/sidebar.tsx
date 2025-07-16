'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  Calendar,
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'services', label: 'Services', icon: Package },
  { id: 'contacts', label: 'Contacts', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  handleSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, user, handleSignOut }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="flex-1 mt-6 px-3 overflow-y-auto">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.user_metadata?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
