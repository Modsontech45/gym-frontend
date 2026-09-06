import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/password', data),
};

// Users
export const usersApi = {
  getStats: () => api.get('/users/stats'),
  getClients: () => api.get('/users/clients'),
  getClient: (id) => api.get(`/users/clients/${id}`),
  createClient: (data) => api.post('/users/clients', data),
  updateClient: (id, data) => api.put(`/users/clients/${id}`, data),
};

// Subscriptions
export const subsApi = {
  getMy: () => api.get('/subscriptions/my'),
  getClientSubs: (clientId) => api.get(`/subscriptions/client/${clientId}`),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  credit: (id, amount) => api.post(`/subscriptions/${id}/credit`, { amount }),
};

// Posts
export const postsApi = {
  getFeed: (params) => api.get('/posts/feed', { params }),
  create: (data) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),
};

// Workouts
export const workoutsApi = {
  getMy: () => api.get('/workouts/my'),
  getClientPrograms: (clientId) => api.get(`/workouts/client/${clientId}`),
  createProgram: (data) => api.post('/workouts/programs', data),
  addSession: (data) => api.post('/workouts/sessions', data),
  addExercise: (data) => api.post('/workouts/exercises', data),
  logSession: (data) => api.post('/workouts/log', data),
  getLogs: () => api.get('/workouts/logs'),
};

// Messages
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (otherId) => api.get(`/messages/${otherId}`),
  send: (receiverId, content) => api.post('/messages', { receiverId, content }),
};

// Follow-ups
export const followUpsApi = {
  getAll: (params) => api.get('/followups', { params }),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  delete: (id) => api.delete(`/followups/${id}`),
};

// Measurements
export const measurementsApi = {
  getMy: () => api.get('/measurements/my'),
  getClient: (userId) => api.get(`/measurements/client/${userId}`),
  add: (data) => api.post('/measurements', data),
  update: (id, data) => api.put(`/measurements/${id}`, data),
  delete: (id) => api.delete(`/measurements/${id}`),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};
