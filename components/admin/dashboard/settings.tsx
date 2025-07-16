'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export const SettingsComponent: React.FC = () => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure system-wide settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Settings</h3>
          <p className="text-gray-600 mb-6">
            Advanced settings panel coming soon
          </p>
          <Button disabled>
            <Settings className="mr-2 h-4 w-4" />
            Coming Soon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
