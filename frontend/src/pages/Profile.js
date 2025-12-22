import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, requestOrdersAPI } from '../utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [requestOrders, setRequestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
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
      const [ordersRes, requestOrdersRes] = await Promise.all([
        ordersAPI.getAll(),
        requestOrdersAPI.getAll()
      ]);
      setOrders(ordersRes.data);
      setRequestOrders(requestOrdersRes.data);
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
    return <div className="min-h-screen flex items-center justify-center"><p className="font-manrope text-slate-600">Loading profile...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 p-6 mb-8" data-testid="profile-info">
          <h1 className="font-chivo font-bold text-3xl text-slate-900 uppercase tracking-tight mb-4">Profile</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-manrope text-sm text-slate-600">Name</p>
              <p className="font-manrope text-lg text-slate-900 font-medium">{user.name}</p>
            </div>
            <div>
              <p className="font-manrope text-sm text-slate-600">Email</p>
              <p className="font-manrope text-lg text-slate-900 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="font-manrope text-sm text-slate-600">Phone</p>
              <p className="font-manrope text-lg text-slate-900 font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="font-manrope text-sm text-slate-600">Role</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="w-full" data-testid="profile-tabs">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200">
            <TabsTrigger value="orders" className="font-chivo font-bold uppercase" data-testid="orders-tab">Orders</TabsTrigger>
            <TabsTrigger value="requests" className="font-chivo font-bold uppercase" data-testid="requests-tab">Request Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200" data-testid="no-orders">
                <p className="font-manrope text-slate-600 text-lg">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border border-slate-200 p-6" data-testid={`order-${order.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-chivo font-bold text-lg text-slate-900 uppercase">Order #{order.id.slice(0, 8)}</p>
                        <p className="font-manrope text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <p className="font-manrope text-slate-600 mb-2">Items: {order.items.length}</p>
                      <p className="font-manrope text-slate-600 mb-2">Payment: {order.paymentMethod.toUpperCase()}</p>
                      <p className="font-chivo font-bold text-xl text-slate-900">Total: ₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            {requestOrders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200" data-testid="no-requests">
                <p className="font-manrope text-slate-600 text-lg">No request orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requestOrders.map((request) => (
                  <div key={request.id} className="bg-white border border-slate-200 p-6" data-testid={`request-${request.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-chivo font-bold text-lg text-slate-900 uppercase">Request #{request.id.slice(0, 8)}</p>
                        <p className="font-manrope text-sm text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <p className="font-manrope text-slate-600">Brand: <span className="font-medium text-slate-900">{request.brand}</span></p>
                      <p className="font-manrope text-slate-600">Quantity: <span className="font-medium text-slate-900">{request.quantity} bags</span></p>
                      <p className="font-manrope text-slate-600">Location: <span className="font-medium text-slate-900">{request.deliveryLocation}</span></p>
                      <p className="font-manrope text-slate-600">Preferred Date: <span className="font-medium text-slate-900">{request.preferredDate}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;