import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI, adminAPI, ordersAPI, requestOrdersAPI } from '../utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requestOrders, setRequestOrders] = useState([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    brand: '',
    grade: 'OPC',
    basePrice: 300,
    image: 'https://images.unsplash.com/photo-1593812742588-92d10d2f2e1c?w=400&q=80',
    minQuantity: 100,
    stock: 1000
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      toast.error('Access denied');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, usersRes, ordersRes, requestOrdersRes] = await Promise.all([
        productsAPI.getAll(),
        adminAPI.getUsers(),
        ordersAPI.getAll(),
        requestOrdersAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
      setRequestOrders(requestOrdersRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productForm);
        toast.success('Product updated!');
      } else {
        await productsAPI.create(productForm);
        toast.success('Product created!');
      }
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ brand: '', grade: 'OPC', basePrice: 300, image: 'https://images.unsplash.com/photo-1593812742588-92d10d2f2e1c?w=400&q=80', minQuantity: 100, stock: 1000 });
      fetchData();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      brand: product.brand,
      grade: product.grade,
      basePrice: product.basePrice,
      image: product.image,
      minQuantity: product.minQuantity,
      stock: product.stock
    });
    setIsProductDialogOpen(true);
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('User role updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success('Order status updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await requestOrdersAPI.updateStatus(requestId, newStatus);
      toast.success('Request status updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update request status');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="font-manrope text-slate-600">Loading admin panel...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-chivo font-bold text-4xl text-slate-900 uppercase tracking-tight mb-8" data-testid="admin-title">Admin Panel</h1>

        <Tabs defaultValue="products" className="w-full" data-testid="admin-tabs">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
            <TabsTrigger value="products" className="font-chivo font-bold uppercase text-xs" data-testid="products-tab">Products</TabsTrigger>
            <TabsTrigger value="users" className="font-chivo font-bold uppercase text-xs" data-testid="users-tab">Users</TabsTrigger>
            <TabsTrigger value="orders" className="font-chivo font-bold uppercase text-xs" data-testid="orders-tab">Orders</TabsTrigger>
            <TabsTrigger value="requests" className="font-chivo font-bold uppercase text-xs" data-testid="requests-tab">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="mb-4">
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 text-white hover:bg-orange-600 rounded-sm font-bold uppercase" data-testid="add-product-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="product-dialog">
                  <DialogHeader>
                    <DialogTitle className="font-chivo font-bold text-2xl uppercase">
                      {editingProduct ? 'Edit Product' : 'Add Product'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <Label>Brand Name</Label>
                      <Input
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        required
                        className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                        data-testid="product-brand-input"
                      />
                    </div>
                    <div>
                      <Label>Grade</Label>
                      <Select value={productForm.grade} onValueChange={(value) => setProductForm({ ...productForm, grade: value })}>
                        <SelectTrigger className="h-12 rounded-sm border-2 border-slate-200 mt-2" data-testid="product-grade-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPC">OPC</SelectItem>
                          <SelectItem value="PPC">PPC</SelectItem>
                          <SelectItem value="PSC">PSC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base Price (Dealer Price)</Label>
                      <Input
                        type="number"
                        value={productForm.basePrice}
                        onChange={(e) => setProductForm({ ...productForm, basePrice: parseFloat(e.target.value) })}
                        required
                        className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                        data-testid="product-price-input"
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={productForm.image}
                        onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        required
                        className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                        data-testid="product-image-input"
                      />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                        required
                        className="h-12 rounded-sm border-2 border-slate-200 focus:border-slate-900 focus:ring-0 bg-white mt-2"
                        data-testid="product-stock-input"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-sm font-bold uppercase" data-testid="product-submit-btn">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full" data-testid="products-table">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Brand</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Grade</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Base Price</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Stock</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-slate-200" data-testid={`product-row-${product.id}`}>
                      <td className="p-2 font-manrope">{product.brand}</td>
                      <td className="p-2 font-manrope">{product.grade}</td>
                      <td className="p-2 font-manrope">₹{product.basePrice}</td>
                      <td className="p-2 font-manrope">{product.stock}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} data-testid={`edit-product-${product.id}`}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} data-testid={`delete-product-${product.id}`}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Name</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Email</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Phone</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Role</th>
                    <th className="p-2 text-left font-chivo uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-200" data-testid={`user-row-${u.id}`}>
                      <td className="p-2 font-manrope">{u.name}</td>
                      <td className="p-2 font-manrope">{u.email}</td>
                      <td className="p-2 font-manrope">{u.phone}</td>
                      <td className="p-2 font-manrope">{u.role}</td>
                      <td className="p-2">
                        <Select value={u.role} onValueChange={(value) => handleUpdateUserRole(u.id, value)}>
                          <SelectTrigger className="h-8 w-32" data-testid={`user-role-select-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dealer">Dealer</SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 p-4" data-testid={`order-row-${order.id}`}>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Order ID</p>
                      <p className="font-manrope text-sm">{order.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Date</p>
                      <p className="font-manrope text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Total</p>
                      <p className="font-manrope text-sm">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Status</p>
                      <Select value={order.status} onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}>
                        <SelectTrigger className="h-8" data-testid={`order-status-select-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <div className="space-y-4">
              {requestOrders.map((request) => (
                <div key={request.id} className="bg-white border border-slate-200 p-4" data-testid={`request-row-${request.id}`}>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Brand</p>
                      <p className="font-manrope text-sm">{request.brand}</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Quantity</p>
                      <p className="font-manrope text-sm">{request.quantity} bags</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Location</p>
                      <p className="font-manrope text-sm">{request.deliveryLocation}</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Date</p>
                      <p className="font-manrope text-sm">{request.preferredDate}</p>
                    </div>
                    <div>
                      <p className="font-chivo font-bold text-xs uppercase text-slate-600">Status</p>
                      <Select value={request.status} onValueChange={(value) => handleUpdateRequestStatus(request.id, value)}>
                        <SelectTrigger className="h-8" data-testid={`request-status-select-${request.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;