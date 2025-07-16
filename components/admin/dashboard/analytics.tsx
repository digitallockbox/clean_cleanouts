'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  BarChart3,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';

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
}

interface AnalyticsProps {
  dashboardData: DashboardData;
}

export const Analytics: React.FC<AnalyticsProps> = ({ dashboardData }) => {
  const { stats, charts } = dashboardData;

  const conversionRate = stats.totalBookings > 0 ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1) : '0.0';
  const avgRevenue = stats.totalBookings > 0 ? (stats.totalRevenue / stats.totalBookings).toFixed(0) : '0';
  const completionRate = stats.totalBookings > 0 ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1) : '0.0';
  
  const totalServiceBookings = charts.servicePerformance.reduce((sum, service) => sum + (service.bookings || 0), 0);
  const servicesWithPopularity = charts.servicePerformance.map(service => ({
    ...service,
    popularity: totalServiceBookings > 0 ? ((service.bookings || 0) / totalServiceBookings * 100).toFixed(1) : '0.0'
  }));

  const recentRevenue = charts.dailyRevenue.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
  const previousRevenue = charts.dailyRevenue.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
  const growthRate = previousRevenue > 0 ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stats.completedBookings} of {stats.totalBookings} bookings
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-3xl font-bold text-gray-900">${avgRevenue}</p>
                <p className="text-sm text-blue-600 mt-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Per booking average
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm text-yellow-600 mt-1 flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Available for booking
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Daily Revenue Trend</CardTitle>
            <CardDescription>Revenue performance over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {charts.dailyRevenue.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {format(new Date(day.date), 'MMM d')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${day.revenue}</p>
                    <p className="text-xs text-gray-500">{day.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Service Performance</CardTitle>
            <CardDescription>Service popularity based on actual bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servicesWithPopularity.slice(0, 5).map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PieChart className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.bookings || 0} total bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{service.popularity}%</p>
                    <p className="text-xs text-gray-500">of all bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Insights */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Business Insights</CardTitle>
          <CardDescription>Key performance indicators from your actual data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Users</h3>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500">{stats.newUsers} new this period</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Revenue Growth</h3>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{parseFloat(growthRate) > 0 ? '+' : ''}{growthRate}%</p>
              <p className="text-sm text-gray-500">week over week</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Contact Inquiries</h3>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.totalContacts}</p>
              <p className="text-sm text-gray-500">{stats.newContacts} new inquiries</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Pending Revenue</h3>
              <p className="text-2xl font-bold text-amber-600 mt-1">${stats.pendingRevenue || 0}</p>
              <p className="text-sm text-gray-500">{stats.pendingBookings} pending bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Status Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Booking Status Analysis</CardTitle>
          <CardDescription>Detailed breakdown of booking statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {charts.statusDistribution.map((status, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                  status.status === 'completed' ? 'bg-green-100' :
                  status.status === 'confirmed' ? 'bg-blue-100' :
                  status.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {status.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {status.status === 'confirmed' && <Calendar className="h-5 w-5 text-blue-600" />}
                  {status.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                  {status.status === 'cancelled' && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
                <h3 className="font-semibold text-gray-900 capitalize">{status.status}</h3>
                <p className="text-xl font-bold text-gray-900 mt-1">{status.count}</p>
                <p className="text-sm text-gray-500">{(status.percentage || 0).toFixed(1)}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
