import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI, cartAPI, requestOrdersAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ShoppingCart, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOrderData, setRequestOrderData] = useState({
    brand: '',
    quantity: 100,
    deliveryLocation: '',
    phone: '',
    preferredDate: ''
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { user, getRolePrice } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const price = getRolePrice(product.basePrice);
      await cartAPI.add({
        productId: product.id,
        quantity: 100,
        price: price,
        brand: product.brand,
        grade: product.grade
      });
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const openRequestDialog = (product) => {
    setSelectedProduct(product);
    setRequestOrderData({ ...requestOrderData, brand: `${product.brand} ${product.grade}` });
    setIsRequestDialogOpen(true);
  };

  const handleRequestOrder = async (e) => {
    e.preventDefault();
    if (requestOrderData.quantity < 100) {
      toast.error('Minimum order quantity is 100 bags');
      return;
    }

    try {
      await requestOrdersAPI.create(requestOrderData);
      toast.success('Order request submitted! Our team will contact you shortly.');
      setIsRequestDialogOpen(false);
      setRequestOrderData({ brand: '', quantity: 100, deliveryLocation: '', phone: '', preferredDate: '' });
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'dealer': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'retailer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="font-manrope text-slate-600">Loading products...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-chivo font-bold text-4xl text-slate-900 uppercase tracking-tight" data-testid="products-title">Our Products</h1>
            <p className="font-manrope text-slate-600 mt-2">
              Your role: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </p>
          </div>
          <a href="tel:+911234567890" data-testid="call-order-btn">
            <Button className="bg-orange-500 text-white hover:bg-orange-600 rounded-sm font-bold uppercase flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call to Order
            </Button>
          </a>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-manrope text-slate-600 text-lg">No products available. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const price = getRolePrice(product.basePrice);
              return (
                <div key={product.id} className="group relative bg-white border border-slate-200 hover:border-orange-500 transition-colors duration-300 p-4" data-testid={`product-card-${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.brand}
                    className="w-full h-48 object-cover mb-4"
                  />
                  <h3 className="font-chivo font-bold text-xl text-slate-900 uppercase mb-2">{product.brand}</h3>
                  <p className="font-manrope text-slate-600 mb-2">Grade: {product.grade}</p>
                  <div className="mb-4">
                    <p className="font-chivo font-bold text-2xl text-slate-900">₹{price.toFixed(2)}</p>
                    <p className="font-manrope text-sm text-slate-600">per bag</p>
                    <p className="font-manrope text-sm text-red-600 font-medium mt-2">Minimum order quantity: {product.minQuantity} bags</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-sm font-bold uppercase"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Dialog open={isRequestDialogOpen && selectedProduct?.id === product.id} onOpenChange={(open) => {
                      setIsRequestDialogOpen(open);
                      if (!open) setSelectedProduct(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => openRequestDialog(product)}
                          variant="outline"
                          className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-sm font-bold uppercase"
                          data-testid={`request-order-${product.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Request Order
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="request-order-dialog">
                        <DialogHeader>
                          <DialogTitle className="font-chivo font-bold text-2xl uppercase">Request Bulk Order</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRequestOrder} className="space-y-4">
                          <div>
                            <Label>Cement Brand</Label>
                            <Input
                              value={requestOrderData.brand}
                              onChange={(e) => setRequestOrderData({ ...requestOrderData, brand: e.target.value })}
                              required
                              className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                              data-testid="request-brand-input"
                            />
                          </div>
                          <div>
                            <Label>Quantity (bags)</Label>
                            <Input
                              type="number"
                              min="100"
                              value={requestOrderData.quantity}
                              onChange={(e) => setRequestOrderData({ ...requestOrderData, quantity: parseInt(e.target.value) })}
                              required
                              className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                              data-testid="request-quantity-input"
                            />
                          </div>
                          <div>
                            <Label>Delivery Location</Label>
                            <Input
                              value={requestOrderData.deliveryLocation}
                              onChange={(e) => setRequestOrderData({ ...requestOrderData, deliveryLocation: e.target.value })}
                              required
                              className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                              data-testid="request-location-input"
                            />
                          </div>
                          <div>
                            <Label>Phone Number</Label>
                            <Input
                              type="tel"
                              value={requestOrderData.phone}
                              onChange={(e) => setRequestOrderData({ ...requestOrderData, phone: e.target.value })}
                              required
                              className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                              data-testid="request-phone-input"
                            />
                          </div>
                          <div>
                            <Label>Preferred Delivery Date</Label>
                            <Input
                              type="date"
                              value={requestOrderData.preferredDate}
                              onChange={(e) => setRequestOrderData({ ...requestOrderData, preferredDate: e.target.value })}
                              required
                              className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                              data-testid="request-date-input"
                            />
                          </div>
                          <Button type="submit" className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-sm font-bold uppercase" data-testid="request-submit-btn">
                            Submit Request
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;