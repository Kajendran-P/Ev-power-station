import API from './api';

// ===== Services =====
export const getServices = (params) => API.get('/services', { params });
export const getService = (id) => API.get(`/services/${id}`);
export const createService = (data) => API.post('/services', data);
export const updateServiceItem = (id, data) => API.put(`/services/${id}`, data);
export const deleteServiceItem = (id) => API.delete(`/services/${id}`);

// ===== Service Requests =====
export const createServiceRequest = (formData) => API.post('/service-requests', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMyServiceRequests = () => API.get('/service-requests/my');
export const getAllServiceRequests = (params) => API.get('/service-requests', { params });
export const updateServiceRequest = (id, data) => API.put(`/service-requests/${id}`, data);
export const assignTechnician = (id, data) => API.put(`/service-requests/${id}/assign`, data);
export const rateServiceRequest = (id, data) => API.put(`/service-requests/${id}/rate`, data);
export const getTechServiceRequests = () => API.get('/service-requests/technician');

// ===== Spare Parts =====
export const getSpareParts = (params) => API.get('/spare-parts', { params });
export const getSparePartsAdmin = () => API.get('/spare-parts/admin/all');
export const createSparePart = (formData) => API.post('/spare-parts', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateSparePart = (id, formData) => API.put(`/spare-parts/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteSparePart = (id) => API.delete(`/spare-parts/${id}`);

// ===== Orders =====
export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/my');
export const getAllOrders = () => API.get('/orders');
export const updateOrder = (id, data) => API.put(`/orders/${id}`, data);

// ===== Payments =====
export const createPaymentOrder = (data) => API.post('/payments/create-order', data);
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const getMyPayments = () => API.get('/payments/my');
export const getAllPayments = () => API.get('/payments');

// ===== Invoices =====
export const generateInvoice = (data) => API.post('/invoices/generate', data);
export const getMyInvoices = () => API.get('/invoices/my');
export const downloadInvoice = (id) => API.get(`/invoices/${id}/download`, { responseType: 'blob' });
export const getAllInvoices = () => API.get('/invoices');

// ===== Contact Messages =====
export const sendContactMessage = (data) => API.post('/contact', data);
export const getContactMessages = () => API.get('/contact');
export const updateContactMessage = (id, data) => API.put(`/contact/${id}`, data);
