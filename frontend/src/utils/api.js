import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const productsAPI = {
  getAll: () => axios.get(`${API}/products`),
  create: (data) => axios.post(`${API}/products`, data, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/products/${id}`, data, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/products/${id}`, { headers: getAuthHeader() }),
};

export const cartAPI = {
  get: () => axios.get(`${API}/cart`, { headers: getAuthHeader() }),
  add: (item) => axios.post(`${API}/cart`, item, { headers: getAuthHeader() }),
  remove: (productId) => axios.delete(`${API}/cart/${productId}`, { headers: getAuthHeader() }),
  clear: () => axios.delete(`${API}/cart`, { headers: getAuthHeader() }),
};

export const ordersAPI = {
  create: (data) => axios.post(`${API}/orders`, data, { headers: getAuthHeader() }),
  getAll: () => axios.get(`${API}/orders`, { headers: getAuthHeader() }),
  updateStatus: (id, status) => axios.put(`${API}/orders/${id}`, { status }, { headers: getAuthHeader() }),
};

export const requestOrdersAPI = {
  create: (data) => axios.post(`${API}/request-orders`, data, { headers: getAuthHeader() }),
  getAll: () => axios.get(`${API}/request-orders`, { headers: getAuthHeader() }),
  updateStatus: (id, status) => axios.put(`${API}/request-orders/${id}`, { status }, { headers: getAuthHeader() }),
};

export const adminAPI = {
  getUsers: () => axios.get(`${API}/admin/users`, { headers: getAuthHeader() }),
  updateUserRole: (id, role) => axios.put(`${API}/admin/users/${id}`, { role }, { headers: getAuthHeader() }),
};