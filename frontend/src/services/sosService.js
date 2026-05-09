import API from './api';
export const createSos = (data) => API.post('/sos', data);
export const getActiveSos = () => API.get('/sos/active');
export const getMySos = () => API.get('/sos/my');
export const getAllSos = (params) => API.get('/sos', { params });
export const getSosById = (id) => API.get(`/sos/${id}`);
export const updateSos = (id, data) => API.put(`/sos/${id}`, data);
export const autoAssignSos = (id) => API.put(`/sos/${id}/assign`);
export const deleteSos = (id) => API.delete(`/sos/${id}`);
