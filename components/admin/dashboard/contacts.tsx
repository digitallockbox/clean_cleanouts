'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  MessageSquare,
  Eye,
  Mail,
  Phone
} from 'lucide-react';

interface ContactsProps {
  recentContacts: any[];
}

export const Contacts: React.FC<ContactsProps> = ({ recentContacts }) => {
  const [selectedContact, setSelectedContact] = useState<any>(null);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Contact Submissions</CardTitle>
        <CardDescription>Recent customer inquiries and contact form submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentContacts.map((contact) => (
            <div key={contact.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {contact.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={contact.status === 'new' ? 'default' : 'secondary'}>
                    {contact.status}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedContact(contact)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          <span>Contact Details</span>
                        </DialogTitle>
                        <DialogDescription>
                          Full details of the customer inquiry
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedContact && (
                        <div className="space-y-6">
                          {/* Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Name</label>
                              <p className="text-gray-900 font-semibold">{selectedContact.name}</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Email</label>
                              <p className="text-gray-900 flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                {selectedContact.email}
                              </p>
                            </div>
                            {selectedContact.phone && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <p className="text-gray-900 flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                  {selectedContact.phone}
                                </p>
                              </div>
                            )}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Submitted</label>
                              <p className="text-gray-900">
                                {format(new Date(selectedContact.submitted_at), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>

                          {/* Subject */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Subject</label>
                            <p className="text-gray-900 font-semibold">{selectedContact.subject}</p>
                          </div>

                          {/* Message */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Message</label>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                                {selectedContact.message}
                              </p>
                            </div>
                          </div>

                          {/* Service Interest */}
                          {selectedContact.service_interest && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Service Interest</label>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {selectedContact.service_interest}
                              </Badge>
                            </div>
                          )}

                          {/* Status */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <Badge variant={selectedContact.status === 'new' ? 'default' : 'secondary'}>
                              {selectedContact.status}
                            </Badge>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3 pt-4 border-t">
                            <Button
                              onClick={() => window.open(`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`)}
                              className="flex-1"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Reply via Email
                            </Button>
                            {selectedContact.phone && (
                              <Button
                                variant="outline"
                                onClick={() => window.open(`tel:${selectedContact.phone}`)}
                                className="flex-1"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <p className="font-medium text-sm mb-2 text-gray-900">{contact.subject}</p>
              <p className="text-sm text-gray-500 line-clamp-2">
                {contact.message?.substring(0, 100)}...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {format(new Date(contact.submitted_at), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
