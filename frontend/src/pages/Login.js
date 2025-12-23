import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/products');
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      const errorMessage = Array.isArray(errorDetail) 
        ? errorDetail.map(err => err.msg).join(', ')
        : (typeof errorDetail === 'string' ? errorDetail : 'Login failed');
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
              WELCOME BACK TO CEMENTION
            </h2>
            <p className="font-manrope text-xl text-slate-200 leading-relaxed">
              Login to access role-based pricing and place bulk cement orders.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h1 className="font-chivo font-bold text-3xl text-slate-900 uppercase tracking-tight mb-2" data-testid="login-title">
            Login
          </h1>
          <p className="font-manrope text-slate-600 mb-8">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="font-manrope font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="font-manrope font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-sm px-8 py-6 font-bold uppercase tracking-wider transition-all active:scale-95"
              data-testid="login-submit-btn"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="font-manrope text-slate-600 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-500 font-medium hover:underline" data-testid="login-register-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;