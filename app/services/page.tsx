'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebsiteSettings } from '@/contexts/website-settings';
import { useServices } from '@/hooks/use-services';
import { Truck, Clock, Shield, Star, CheckCircle, ArrowRight, Sparkles, Award, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Services() {
  const { settings } = useWebsiteSettings();
  const { services, loading } = useServices({ 
    includeInactive: false, // Only show active services
    autoFetch: true 
  });

  const features = [
    { icon: CheckCircle, text: 'Licensed & Insured' },
    { icon: Clock, text: 'Same Day Service' },
    { icon: Shield, text: 'Eco-Friendly Disposal' },
    { icon: Star, text: '100% Satisfaction Guarantee' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <div className="absolute inset-0 rounded-full bg-blue-100/20 animate-pulse"></div>
            </div>
            <p className="text-lg font-medium text-gray-600">Loading our amazing services...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              Professional Service Excellence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Our <span className="text-gradient">Expert Services</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              Professional cleanout and removal services tailored to your specific needs.
              From residential junk removal to commercial cleanouts, we deliver excellence every time.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <div className="flex flex-col items-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${settings.theme_primary_color}20, ${settings.theme_primary_color}40)`
                      }}
                    >
                      <feature.icon
                        className="h-8 w-8 group-hover:scale-110 transition-transform duration-300"
                        style={{ color: settings.theme_primary_color }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-800 text-center leading-tight">{feature.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Choose Your Service
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Premium <span className="text-gradient-warm">Service Options</span>
            </h2>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={service.id} className="card-hover border-0 shadow-xl bg-white/90 backdrop-blur-sm group relative overflow-hidden">
                  {/* Card background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative overflow-hidden rounded-t-xl">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Floating badges */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg">
                        Starting at ${service.base_price}
                      </Badge>
                    </div>
                    
                    <div className="absolute top-4 left-4">
                      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-gray-600">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative z-10">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600 mb-1">Base Price</div>
                          <div className="text-xl font-bold text-gradient">${service.base_price}</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600 mb-1">Per Hour</div>
                          <div className="text-xl font-bold text-gradient">${service.price_per_hour}</div>
                        </div>
                      </div>
                      
                      <Button
                        className="w-full btn-gradient group/btn shadow-lg text-lg py-3"
                        asChild
                      >
                        <Link href="/booking">
                          <Sparkles className="mr-2 h-5 w-5" />
                          Book This Service
                          <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Services Available</h3>
                <p className="text-gray-600 mb-8">
                  We're currently updating our service offerings. Please check back soon or contact us for custom solutions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/contact">
                      <Users className="mr-2 h-4 w-4" />
                      Contact Us
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 animated-gradient"></div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl float"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium mb-6 glass">
            <Users className="w-5 h-5 mr-2" />
            Custom Solutions Available
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Need a <span className="text-yellow-300">Custom Solution?</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Don't see exactly what you need? Our expert team can create a custom solution tailored to your specific requirements.
            <span className="block mt-2 text-yellow-300 font-semibold">Free consultation • Flexible pricing • Guaranteed satisfaction</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="text-lg px-12 py-4 bg-white text-gray-900 hover:bg-gray-100 shadow-glow-lg group transform hover:scale-105 transition-all duration-300 font-semibold"
              asChild
            >
              <Link href="/contact">
                <Award className="mr-2 h-5 w-5" />
                Get Custom Quote
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-12 py-4 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm glass group font-semibold"
              asChild
            >
              <Link href="/booking">
                <Sparkles className="mr-2 h-5 w-5" />
                Book Standard Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}