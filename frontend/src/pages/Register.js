import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.phone, formData.role);
      toast.success('Registration successful!');
      navigate('/products');
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      const errorMessage = Array.isArray(errorDetail) 
        ? errorDetail.map(err => err.msg).join(', ')
        : (typeof errorDetail === 'string' ? errorDetail : 'Registration failed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div 
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1610018924075-558aa6b0d7a9?w=800&q=80)' }}
      >
        <div className="h-full bg-slate-900/70 flex items-center justify-center p-12">
          <div className="max-w-md">
            <h2 className="font-chivo font-bold text-4xl text-white uppercase tracking-tight mb-6">
              JOIN CEMENTION TODAY
            </h2>
            <p className="font-manrope text-xl text-slate-200 leading-relaxed">
              Select your role and get access to special pricing for bulk cement orders.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h1 className="font-chivo font-bold text-3xl text-slate-900 uppercase tracking-tight mb-2" data-testid="register-title">
            Create Account
          </h1>
          <p className="font-manrope text-slate-600 mb-8">Register to start ordering bulk cement</p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
            <div>
              <Label htmlFor="name" className="font-manrope font-medium">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                data-testid="register-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-manrope font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                data-testid="register-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="font-manrope font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                data-testid="register-password-input"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="font-manrope font-medium">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                data-testid="register-phone-input"
              />
            </div>

            <div>
              <Label className="font-manrope font-medium mb-4 block">Select Your Role</Label>
              <RadioGroup value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} data-testid="role-selector">
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-purple-500 transition-colors" data-testid="role-dealer">
                  <RadioGroupItem value="dealer" id="dealer" />
                  <Label htmlFor="dealer" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">Dealer</div>
                    <div className="font-manrope text-sm text-slate-600">Wholesale bulk cement dealer</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-blue-500 transition-colors" data-testid="role-retailer">
                  <RadioGroupItem value="retailer" id="retailer" />
                  <Label htmlFor="retailer" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">Retailer</div>
                    <div className="font-manrope text-sm text-slate-600">Retail cement distributor</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-green-500 transition-colors" data-testid="role-customer">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">Customer</div>
                    <div className="font-manrope text-sm text-slate-600">Builder, Contractor, Engineer, Others</div>
                  </Label>
                </div>
              </RadioGroup>
              <p className="font-manrope text-xs text-slate-500 mt-2">Note: Role cannot be changed without admin approval</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-sm px-8 py-6 font-bold uppercase tracking-wider transition-all active:scale-95"
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="font-manrope text-slate-600 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-medium hover:underline" data-testid="register-login-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;