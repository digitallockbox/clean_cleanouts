'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebsiteSettings } from '@/contexts/website-settings-extended';
import { Truck, Clock, Shield, Star, Phone, CheckCircle, ArrowRight, Sparkles, Award, Users } from 'lucide-react';

export default function Home() {
  const { settings, loading: settingsLoading } = useWebsiteSettings();

  const services = [
    {
      icon: Truck,
      title: 'Junk Removal',
      description: 'Professional removal of unwanted items from your home or office',
      price: 'Starting at $99',
    },
    {
      icon: Clock,
      title: 'Labor Moving',
      description: 'Experienced movers to help with your relocation needs',
      price: 'Starting at $120/hr',
    },
    {
      icon: Shield,
      title: 'Estate Cleanouts',
      description: 'Comprehensive cleanout services for estates and properties',
      price: 'Starting at $150',
    },
  ];

  // Get features from settings
  const features = [
    settings.home_why_choose_feature_1,
    settings.home_why_choose_feature_2,
    settings.home_why_choose_feature_3,
    settings.home_why_choose_feature_4,
    settings.home_why_choose_feature_5,
    settings.home_why_choose_feature_6,
  ];

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background with parallax effect */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage: `var(--gradient-primary), url(${settings.hero_background_image})`
          }}
        />
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className={`text-center text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6 glass">
              <Sparkles className="w-4 h-4 mr-2" />
              #1 Rated Cleanout Service
            </div>
            
            {settingsLoading ? (
              <>
                <div className="h-16 md:h-20 w-3/4 mx-auto bg-white/20 animate-pulse rounded-lg mb-6" />
                <div className="h-8 w-2/3 mx-auto bg-white/20 animate-pulse rounded-lg mb-10" />
              </>
            ) : (
              <>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                  <span className="block">{settings.hero_title.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="block text-gradient bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    {settings.hero_title.split(' ').slice(2).join(' ')}
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl mb-10 max-w-4xl mx-auto leading-relaxed text-blue-50">
                  {settings.hero_subtitle}
                </p>
              </>
            )}
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="text-lg px-10 py-4 btn-gradient shadow-glow-lg group transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="/booking">
                  {settings.hero_cta_text || 'Book Now'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-4 glass border-white/30 text-black hover:bg-white/20 backdrop-blur-sm group"
                asChild
              >
                <Link href="/contact">
                  <Phone className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  {settings.hero_secondary_cta_text || 'Get Free Quote'}
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">{settings.home_hero_trust_1_number}</div>
                <div className="text-sm text-blue-200">{settings.home_hero_trust_1_label}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{settings.home_hero_trust_2_number}</div>
                <div className="text-sm text-blue-200">{settings.home_hero_trust_2_label}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{settings.home_hero_trust_3_number}</div>
                <div className="text-sm text-blue-200">{settings.home_hero_trust_3_label}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Premium Services
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {settings.services_title || 'Our'} <span className="text-gradient">{settings.services_subtitle || 'Expert Services'}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {settings.services_description || 'Professional cleanout and moving services tailored to your needs with unmatched quality and reliability'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="card-hover border-0 shadow-lg bg-white/80 backdrop-blur-sm group relative overflow-hidden">
                {/* Card background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="text-center relative z-10">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300 transform group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${settings.theme_primary_color}20, ${settings.theme_primary_color}40)`
                      }}
                    >
                      <service.icon
                        className="h-10 w-10 group-hover:scale-110 transition-transform duration-300"
                        style={{ color: settings.theme_primary_color }}
                      />
                    </div>
                    {/* Floating badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="text-center relative z-10">
                  <div className="mb-6">
                    <p className="text-3xl font-black mb-2 text-gradient">
                      {service.price}
                    </p>
                    <p className="text-sm text-gray-500">Professional service included</p>
                  </div>
                  
                  <Button
                    className="w-full btn-gradient group/btn shadow-lg"
                    asChild
                  >
                    <Link href="/booking">
                      Book Service
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4 mr-2" />
              {settings.home_why_choose_badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {settings.home_why_choose_title} <span className="text-gradient-warm">{settings.home_why_choose_title_highlight}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {settings.home_why_choose_description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="flex items-start space-x-4 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {feature}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Professional service guaranteed with every project we undertake.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Stats section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-gradient mb-2">{settings.home_stat_1_number}</div>
              <div className="text-gray-600 font-medium">{settings.home_stat_1_label}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gradient mb-2">{settings.home_stat_2_number}</div>
              <div className="text-gray-600 font-medium">{settings.home_stat_2_label}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gradient mb-2">{settings.home_stat_3_number}</div>
              <div className="text-gray-600 font-medium">{settings.home_stat_3_label}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gradient mb-2">{settings.home_stat_4_number}</div>
              <div className="text-gray-600 font-medium">{settings.home_stat_4_label}</div>
            </div>
          </div>
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
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-2xl float" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium mb-6 glass">
            <Users className="w-5 h-5 mr-2" />
            {settings.home_cta_badge}
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            {settings.cta_title || 'Ready to Get'} <span className="text-yellow-300">{settings.cta_title ? settings.cta_title.split(' ').slice(-1)[0] : 'Started?'}</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            {settings.cta_description || 'Book your service today and experience the difference professional cleanout services can make.'}
            <span className="block mt-2 text-yellow-300 font-semibold">{settings.home_cta_guarantee}</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="text-lg px-12 py-4 bg-white text-gray-900 hover:bg-gray-100 shadow-glow-lg group transform hover:scale-105 transition-all duration-300 font-semibold"
              asChild
            >
              <Link href="/booking">
                <Sparkles className="mr-2 h-5 w-5" />
                {settings.home_cta_primary_button}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-12 py-4 border-white/30 text-black hover:bg-white/20 backdrop-blur-sm glass group font-semibold"
              asChild
            >
              <Link href={`tel:${settings.contact_phone}`}>
                <Phone className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                {settings.home_cta_secondary_button} {settings.contact_phone}
              </Link>
            </Button>
          </div>
          
          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-80">
            <div className="flex items-center text-white/80">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">{settings.home_cta_trust_1}</span>
            </div>
            <div className="flex items-center text-white/80">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">{settings.home_cta_trust_2}</span>
            </div>
            <div className="flex items-center text-white/80">
              <Award className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">{settings.home_cta_trust_3}</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}