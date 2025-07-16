'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  Package,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalUsers: number;
    newUsers: number;
    activeServices: number;
    totalContacts: number;
  };
  charts: {
    dailyRevenue: Array<{ date: string; revenue: number; bookings: number }>;
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
    servicePerformance: Array<{ id: string; name: string; bookings: number; revenue: number }>;
  };
}

interface OverviewProps {
  dashboardData: DashboardData;
  getStatusColor: (status: string) => string;
}

export const Overview: React.FC<OverviewProps> = ({ dashboardData, getStatusColor }) => {
  const { stats, charts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.pendingBookings} pending</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue || 0}</p>
                <p className="text-sm text-gray-500 mt-1">${stats.pendingRevenue || 0} pending</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.newUsers} new this period</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeServices}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.totalContacts} new contacts</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {charts.dailyRevenue.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {format(new Date(day.date), 'MMM d')}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-900">${day.revenue}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {day.bookings} bookings
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Booking Status</CardTitle>
            <CardDescription>Distribution of booking statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {charts.statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getStatusColor(item.status)} capitalize`}>
                      {item.status}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">{item.count || 0}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {(item.percentage || 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Service Performance</CardTitle>
          <CardDescription>Top performing services by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {charts.servicePerformance.slice(0, 5).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{service.name || 'Unknown Service'}</h4>
                    <p className="text-sm text-gray-500">{service.bookings || 0} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${service.revenue || 0}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
