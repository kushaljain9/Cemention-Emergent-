import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'dealer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'retailer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-slate-900 text-white border-slate-900';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2" data-testid="nav-logo">
            <Package className="h-8 w-8 text-slate-900" />
            <span className="font-chivo font-bold text-2xl text-slate-900 uppercase tracking-tight">Cemention</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/products" data-testid="nav-products">
                  <Button variant="ghost" className="font-manrope font-medium">
                    Products
                  </Button>
                </Link>
                <Link to="/cart" data-testid="nav-cart">
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/profile" data-testid="nav-profile">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="font-manrope">{user.name}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" data-testid="nav-admin">
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-sm font-bold uppercase">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="logout-btn">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login">
                  <Button variant="outline" className="border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-sm font-bold uppercase">
                    Login
                  </Button>
                </Link>
                <Link to="/register" data-testid="nav-register">
                  <Button className="bg-orange-500 text-white hover:bg-orange-600 rounded-sm font-bold uppercase shadow-lg shadow-orange-500/20">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;