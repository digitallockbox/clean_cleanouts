'use client';

import React from 'react';
import Link from 'next/link';
import { useWebsiteSettings } from '@/contexts/website-settings-extended';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Heart, Star, Shield, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useWebsiteSettings();

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  // Get services and links from settings
  const services = [
    settings.footer_service_1,
    settings.footer_service_2,
    settings.footer_service_3,
    settings.footer_service_4,
    settings.footer_service_5,
    settings.footer_service_6,
  ];

  const quickLinks = [
    { href: settings.footer_link_1_url, label: settings.footer_link_1_label },
    { href: settings.footer_link_2_url, label: settings.footer_link_2_label },
    { href: settings.footer_link_3_url, label: settings.footer_link_3_label },
    { href: settings.footer_link_4_url, label: settings.footer_link_4_label },
    { href: settings.footer_link_5_url, label: settings.footer_link_5_label },
  ];

  const trustBadges = [
    { icon: Shield, text: settings.footer_trust_badge_1 },
    { icon: Star, text: settings.footer_trust_badge_2 },
    { icon: Clock, text: settings.footer_trust_badge_3 },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <img
                  src={settings.brand_logo_url}
                  alt={settings.brand_company_name}
                  className="h-12 w-12 rounded-xl object-cover shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
              <div>
                <span className="text-2xl font-black text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {settings.brand_company_name}
                </span>
                <p className="text-sm text-gray-400 font-medium">Professional Service Excellence</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              {settings.brand_tagline}{settings.footer_company_tagline_suffix}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{settings.contact_phone}</p>
                  <p className="text-sm text-gray-400">Call us anytime</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{settings.contact_email}</p>
                  <p className="text-sm text-gray-400">Email support</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{settings.contact_address}</p>
                  <p className="text-sm text-gray-400">Service area</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {settings.footer_services_title}
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    href="/services"
                    className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3 group-hover:shadow-glow transition-all duration-300"></div>
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-gradient bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {settings.footer_links_title}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mr-3 group-hover:shadow-glow transition-all duration-300"></div>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">{settings.footer_social_title}</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center hover:from-blue-500 hover:to-purple-600 transition-all duration-300 hover:shadow-glow group"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-8 border-t border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <badge.icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-gray-200">{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              {settings.footer_copyright_prefix} {settings.brand_company_name}{settings.footer_copyright_suffix}
            </p>
            <p className="text-sm text-gray-500 flex items-center justify-center">
              {settings.footer_made_with_love.replace('❤️', '')} <Heart className="h-4 w-4 mx-1 text-red-500" /> {settings.footer_made_with_love.split('❤️')[1] || 'for our amazing customers'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};