import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_role-price/artifacts/o67p0lnz_ChatGPT%20Image%20Dec%2020%2C%202025%2C%2012_27_22%20PM.png" 
                alt="Cemention Logo" 
                className="h-10 w-auto brightness-0 invert"
              />
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
                <span>+91 9823064024</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>cemention@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Jalgaon, Maharashtra</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-chivo font-bold text-lg uppercase mb-4">Follow Us</h3>
            <div className="space-y-2 font-manrope text-slate-300">
              <a href="https://www.instagram.com/cementioncom" target="_blank" rel="noopener noreferrer" className="block hover:text-orange-500">
                Instagram: @cementioncom
              </a>
              <a href="https://www.linkedin.com/in/kushal-jain-b52008396" target="_blank" rel="noopener noreferrer" className="block hover:text-orange-500">
                LinkedIn: Kushal Jain
              </a>
            </div>
            <h3 className="font-chivo font-bold text-lg uppercase mb-4 mt-6">Business Hours</h3>
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