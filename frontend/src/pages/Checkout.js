import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cartAPI, ordersAPI, productsAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      
      if (!cartRes.data?.items || cartRes.data.items.length === 0) {
        navigate('/cart');
      }
    } catch (error) {
      toast.error('Failed to load checkout');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return { subtotal: 0, gst: 0, cardSurcharge: 0, total: 0 };
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const gst = user.isGstRegistered ? subtotal * 0.18 : 0;
    const cardSurcharge = paymentMethod === 'card' ? subtotal * 0.02 : 0;
    const total = subtotal + gst + cardSurcharge;
    return { subtotal, gst, cardSurcharge, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await ordersAPI.create({
        items: cart.items,
        paymentMethod,
        deliveryAddress,
        orderType: 'normal',
        transactionId: transactionId || null
      });
      toast.success('Order placed successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="font-manrope text-slate-600">Loading checkout...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-chivo font-bold text-4xl text-slate-900 uppercase tracking-tight mb-8" data-testid="checkout-title">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="font-chivo font-bold text-2xl text-slate-900 uppercase mb-6">Delivery Address</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                    required
                    className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                    data-testid="street-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      required
                      className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                      data-testid="city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                      required
                      className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                      data-testid="state-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                    required
                    className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                    data-testid="pincode-input"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6">
              <h2 className="font-chivo font-bold text-2xl text-slate-900 uppercase mb-6">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} data-testid="payment-method-selector">
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-slate-900 transition-colors" data-testid="payment-cod">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">Cash on Delivery (COD)</div>
                    <div className="font-manrope text-sm text-slate-600">Pay when you receive the order</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-slate-900 transition-colors" data-testid="payment-upi">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">UPI</div>
                    <div className="font-manrope text-sm text-slate-600">Pay using UPI apps</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-slate-900 transition-colors" data-testid="payment-netbanking">
                  <RadioGroupItem value="netbanking" id="netbanking" />
                  <Label htmlFor="netbanking" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">Net Banking</div>
                    <div className="font-manrope text-sm text-slate-600">Pay using your bank account</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-2 border-slate-200 p-4 rounded-sm hover:border-slate-900 transition-colors" data-testid="payment-rtgs">
                  <RadioGroupItem value="rtgs" id="rtgs" />
                  <Label htmlFor="rtgs" className="flex-1 cursor-pointer">
                    <div className="font-chivo font-bold text-slate-900 uppercase">RTGS/Bank Transfer</div>
                    <div className="font-manrope text-sm text-slate-600">Account: 1234567890, IFSC: ABCD0001234</div>
                  </Label>
                </div>
              </RadioGroup>
              <p className="font-manrope text-sm text-slate-600 mt-4 p-4 bg-slate-50 border-l-4 border-orange-500">
                Final invoice will be generated after order confirmation
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-slate-900 p-6 sticky top-24" data-testid="order-summary">
              <h2 className="font-chivo font-bold text-2xl text-slate-900 uppercase mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  {cart?.items?.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.productId} className="flex justify-between font-manrope text-sm">
                        <span className="text-slate-600">{product.brand} x {item.quantity}</span>
                        <span className="text-slate-900 font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t-2 border-slate-200 pt-4">
                  <div className="flex justify-between font-chivo text-xl">
                    <span className="font-bold text-slate-900">Total:</span>
                    <span className="font-bold text-slate-900">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-sm py-6 font-bold uppercase text-lg"
                data-testid="place-order-btn"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;