'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ButtonLoading } from '@/components/ui/loading-spinner';
import { useWebsiteSettings } from '@/contexts/website-settings';
import { contactSchema } from '@/lib/validations/booking';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  Calculator,
  Sparkles,
  Users,
  Award,
  Zap,
  HeadphonesIcon
} from 'lucide-react';

export default function Contact() {
  const { settings } = useWebsiteSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      toast.success('Message sent successfully!');
      setIsSubmitted(true);
      form.reset();

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone}`,
    },
    {
      icon: Mail,
      title: 'Email',
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    {
      icon: MapPin,
      title: 'Address',
      value: settings.address,
      href: `https://maps.google.com/?q=${encodeURIComponent(settings.address)}`,
    },
    {
      icon: Clock,
      title: 'Business Hours',
      value: 'Mon-Fri: 8AM-6PM\nSat: 9AM-4PM\nSun: Closed',
      href: null,
    },
  ];

  const quickActions = [
    {
      icon: Calculator,
      title: 'Get a Quote',
      description: 'Request a custom quote for your project',
      action: () => {
        form.setValue('subject', 'Quote Request');
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      icon: MessageSquare,
      title: 'Ask a Question',
      description: 'Have questions about our services?',
      action: () => {
        form.setValue('subject', 'General Inquiry');
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <HeadphonesIcon className="w-4 h-4 mr-2" />
              24/7 Customer Support
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Ready to transform your space? Our expert team is here to help with quotes, questions,
              and scheduling your perfect service solution.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gradient">Get in Touch</CardTitle>
                <CardDescription className="text-base">
                  Reach out to us through any of these channels for immediate assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="group">
                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:shadow-lg transition-all duration-300">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${settings.primaryColor}20, ${settings.primaryColor}40)`
                        }}
                      >
                        <info.icon
                          className="h-6 w-6 group-hover:scale-110 transition-transform duration-300"
                          style={{ color: settings.primaryColor }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{info.title}</h3>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="text-gray-600 hover:text-blue-600 transition-colors whitespace-pre-line font-medium"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-gray-600 whitespace-pre-line font-medium">{info.value}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gradient">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{action.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card id="contact-form" className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gradient">Send us a Message</CardTitle>
                <CardDescription className="text-base">
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h3>
                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                      Thank you for contacting us. Our team will get back to you within 24 hours with a personalized response.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      className="btn-gradient shadow-lg"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Full Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John Doe"
                                  className="input-glow h-12 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Email Address *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="john@example.com"
                                  type="email"
                                  className="input-glow h-12 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="(555) 123-4567"
                                  className="input-glow h-12 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Subject *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="How can we help you?"
                                  className="input-glow h-12 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Message *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your project, questions, or how we can help..."
                                rows={6}
                                className="input-glow text-base resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-gray-600 font-medium">
                          * Required fields
                        </p>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-gradient shadow-lg text-lg px-8 py-3"
                        >
                          <ButtonLoading
                            isLoading={isSubmitting}
                            loadingText="Sending..."
                          >
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </ButtonLoading>
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm card-hover">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Call for Immediate Service</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Need urgent service? Call us directly for same-day availability and emergency support.
                </p>
                <Button className="btn-gradient shadow-lg group" asChild>
                  <a href={`tel:${settings.contactPhone}`}>
                    <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Call {settings.contactPhone}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm card-hover">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Free Estimates</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Get a free, no-obligation estimate for your project with detailed pricing breakdown.
                </p>
                <Button
                  className="btn-gradient shadow-lg group"
                  onClick={() => {
                    form.setValue('subject', 'Free Estimate Request');
                    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Award className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Request Estimate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm card-hover">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">24/7 Support</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Questions? We're here to help around the clock with expert guidance and support.
                </p>
                <Button className="btn-gradient shadow-lg group" asChild>
                  <a href={`mailto:${settings.contactEmail}`}>
                    <Users className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Email Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}