import React from 'react';
import { Package, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-8 w-8" />
              <span className="font-chivo font-bold text-2xl uppercase tracking-tight">Cemention</span>
            </div>
            <p className="font-manrope text-slate-300 leading-relaxed">
              Your trusted partner for bulk cement orders. Reliable, efficient, and built for construction excellence.
            </p>
          </div>
          <div>
            <h3 className="font-chivo font-bold text-lg uppercase mb-4">Contact Us</h3>
            <div className="space-y-2 font-manrope text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91 1234567890</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>sales@cemention.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-chivo font-bold text-lg uppercase mb-4">Business Hours</h3>
            <div className="space-y-2 font-manrope text-slate-300">
              <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-8 text-center font-manrope text-slate-400">
          <p>&copy; 2025 Cemention. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;