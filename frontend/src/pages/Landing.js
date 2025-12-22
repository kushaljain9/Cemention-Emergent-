import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Package, Shield, Truck, Users, Phone } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/products');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      <section 
        className="relative h-[600px] bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1694522362256-6c907336af43?w=1920&q=80)' }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-slate-900/70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="font-chivo font-bold text-5xl lg:text-6xl text-white uppercase tracking-tight mb-6">
              BULK CEMENT ORDERS SIMPLIFIED
            </h1>
            <p className="font-manrope text-xl text-slate-200 leading-relaxed mb-8">
              Role-based pricing for Dealers, Retailers, and Customers. Minimum order 100 bags. Fast delivery guaranteed.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/register')}
                className="bg-orange-500 text-white hover:bg-orange-600 rounded-sm px-8 py-6 text-lg font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20"
                data-testid="hero-register-btn"
              >
                Get Started
              </Button>
              <a href="tel:+911234567890" data-testid="hero-call-btn">
                <Button 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-slate-900 rounded-sm px-8 py-6 text-lg font-bold uppercase"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-chivo font-bold text-4xl text-slate-900 uppercase tracking-tight mb-12 text-center">
            WHY CHOOSE CEMENTION?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-8 border-l-4 border-orange-500" data-testid="feature-pricing">
              <Users className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-chivo font-bold text-xl text-slate-900 uppercase mb-3">Role-Based Pricing</h3>
              <p className="font-manrope text-slate-600 leading-relaxed">
                Special rates for Dealers, Retailers, and Customers. Better pricing for bulk orders.
              </p>
            </div>
            <div className="bg-slate-50 p-8 border-l-4 border-orange-500" data-testid="feature-bulk">
              <Package className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-chivo font-bold text-xl text-slate-900 uppercase mb-3">Bulk Orders</h3>
              <p className="font-manrope text-slate-600 leading-relaxed">
                Minimum 100 bags per order. Request custom quantities for large projects.
              </p>
            </div>
            <div className="bg-slate-50 p-8 border-l-4 border-orange-500" data-testid="feature-delivery">
              <Truck className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-chivo font-bold text-xl text-slate-900 uppercase mb-3">Fast Delivery</h3>
              <p className="font-manrope text-slate-600 leading-relaxed">
                Reliable delivery to your construction site. Track orders in real-time.
              </p>
            </div>
            <div className="bg-slate-50 p-8 border-l-4 border-orange-500" data-testid="feature-trust">
              <Shield className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-chivo font-bold text-xl text-slate-900 uppercase mb-3">Trusted Quality</h3>
              <p className="font-manrope text-slate-600 leading-relaxed">
                Premium brands OPC, PPC, PSC grade cement. Quality guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-chivo font-bold text-4xl text-slate-900 uppercase tracking-tight mb-6">
            READY TO ORDER?
          </h2>
          <p className="font-manrope text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of dealers, retailers, and construction businesses who trust Cemention for their bulk cement needs.
          </p>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-sm px-8 py-6 text-lg font-bold uppercase tracking-wider"
            data-testid="cta-register-btn"
          >
            Create Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;