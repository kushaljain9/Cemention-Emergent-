import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cartAPI, productsAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, getRolePrice } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [cartRes, productsRes] = await Promise.all([
        cartAPI.get(),
        productsAPI.getAll()
      ]);
      setCart(cartRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const getProductDetails = (productId) => {
    return products.find(p => p.id === productId);
  };

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 100) {
      toast.error('Minimum order quantity is 100 bags');
      return;
    }

    try {
      const product = getProductDetails(item.productId);
      const price = getRolePrice(product.basePrice);
      await cartAPI.add({
        productId: item.productId,
        quantity: newQuantity,
        price: price,
        brand: product.brand,
        grade: product.grade
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await cartAPI.remove(productId);
      toast.success('Item removed from cart');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="font-manrope text-slate-600">Loading cart...</p></div>;
  }

  const cartItems = cart?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-chivo font-bold text-4xl text-slate-900 uppercase tracking-tight mb-8" data-testid="cart-title">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-sm" data-testid="empty-cart">
            <p className="font-manrope text-slate-600 text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/products')} className="bg-orange-500 text-white hover:bg-orange-600 rounded-sm font-bold uppercase">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = getProductDetails(item.productId);
                if (!product) return null;

                return (
                  <div key={item.productId} className="bg-white border border-slate-200 p-6 flex gap-4" data-testid={`cart-item-${item.productId}`}>
                    <img src={product.image} alt={product.brand} className="w-24 h-24 object-cover" />
                    <div className="flex-1">
                      <h3 className="font-chivo font-bold text-xl text-slate-900 uppercase">{product.brand}</h3>
                      <p className="font-manrope text-slate-600">Grade: {product.grade}</p>
                      <p className="font-chivo font-bold text-lg text-slate-900 mt-2">₹{item.price.toFixed(2)} per bag</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.productId)}
                        data-testid={`remove-item-${item.productId}`}
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item, item.quantity - 10)}
                          className="h-8 w-8"
                          data-testid={`decrease-qty-${item.productId}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="100"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item, parseInt(e.target.value) || 100)}
                          className="w-20 h-8 text-center"
                          data-testid={`quantity-input-${item.productId}`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item, item.quantity + 10)}
                          className="h-8 w-8"
                          data-testid={`increase-qty-${item.productId}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-manrope text-sm text-slate-600">Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-slate-900 p-6 sticky top-24" data-testid="cart-summary">
                <h2 className="font-chivo font-bold text-2xl text-slate-900 uppercase mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between font-manrope">
                    <span className="text-slate-600">Items:</span>
                    <span className="text-slate-900 font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} bags</span>
                  </div>
                  <div className="border-t-2 border-slate-200 pt-4">
                    <div className="flex justify-between font-chivo text-xl">
                      <span className="font-bold text-slate-900">Total:</span>
                      <span className="font-bold text-slate-900">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-sm py-6 font-bold uppercase text-lg"
                  data-testid="proceed-checkout-btn"
                >
                  Proceed to Checkout
                </Button>
                <p className="font-manrope text-xs text-slate-500 text-center mt-4">Final invoice will be generated after order confirmation</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;