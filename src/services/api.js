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
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/password', data),
  saveSurvey: (data) => api.post('/auth/survey', data),
};

// Users
export const usersApi = {
  getStats: () => api.get('/users/stats'),
  getPublicProfile: (id) => api.get(`/users/profile/${id}`),
  getClients: () => api.get('/users/clients'),
  getClient: (id) => api.get(`/users/clients/${id}`),
  createClient: (data) => api.post('/users/clients', data),
  updateClient: (id, data) => api.put(`/users/clients/${id}`, data),
  getCoaches: () => api.get('/users/coaches'),
  createCoach: (data) => api.post('/users/coaches', data),
};

// Subscriptions
export const subsApi = {
  getMy: () => api.get('/subscriptions/my'),
  getAll: () => api.get('/subscriptions'),
  getClientSubs: (clientId) => api.get(`/subscriptions/client/${clientId}`),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  credit: (id, amount) => api.post(`/subscriptions/${id}/credit`, { amount }),
};

// Plans (catalog)
export const plansApi = {
  getAll: () => api.get('/plans'),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

// Promotions
export const promotionsApi = {
  getAll: () => api.get('/promotions'),
  getActive: () => api.get('/promotions/active'),
  validate: (code) => api.get(`/promotions/validate/${code}`),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  toggle: (id) => api.put(`/promotions/${id}/toggle`),
  delete: (id) => api.delete(`/promotions/${id}`),
};

// Posts
export const postsApi = {
  getFeed: (params) => api.get('/posts/feed', { params }),
  create: (data) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
};

// Workouts
export const workoutsApi = {
  getMy: () => api.get('/workouts/my'),
  getClientPrograms: (clientId) => api.get(`/workouts/client/${clientId}`),
  getProgramDetail: (id) => api.get(`/workouts/programs/${id}`),
  createProgram: (data) => api.post('/workouts/programs', data),
  updateProgram: (id, data) => api.put(`/workouts/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/workouts/programs/${id}`),
  addSession: (data) => api.post('/workouts/sessions', data),
  updateSession: (id, data) => api.put(`/workouts/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/workouts/sessions/${id}`),
  addExercise: (data) => api.post('/workouts/exercises', data),
  updateExercise: (id, data) => api.put(`/workouts/exercises/${id}`, data),
  deleteExercise: (id) => api.delete(`/workouts/exercises/${id}`),
  logSession: (data) => api.post('/workouts/log', data),
  startSession: (sessionId) => api.post('/workouts/log/start', { sessionId }),
  getActiveSession: () => api.get('/workouts/log/active'),
  completeSession: (id, data) => api.put(`/workouts/log/${id}/complete`, data),
  cancelSession: (id) => api.delete(`/workouts/log/${id}`),
  getLogs: () => api.get('/workouts/logs'),
  getClientLogs: (clientId) => api.get(`/workouts/logs/${clientId}`),
  getStats: () => api.get('/workouts/stats'),
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

// Check-ins (weekly client questionnaire)
export const checkInsApi = {
  getMy: () => api.get('/check-ins/my'),
  getLatest: () => api.get('/check-ins/latest'),
  getClient: (clientId) => api.get(`/check-ins/client/${clientId}`),
  submit: (data) => api.post('/check-ins', data),
  addFeedback: (id, feedback) => api.put(`/check-ins/${id}/feedback`, { feedback }),
};

// Coach notes (private notes on clients)
export const coachNotesApi = {
  getClient: (clientId) => api.get(`/coach-notes/client/${clientId}`),
  create: (data) => api.post('/coach-notes', data),
  update: (id, data) => api.put(`/coach-notes/${id}`, data),
  delete: (id) => api.delete(`/coach-notes/${id}`),
};

// Progress Photos
export const photosApi = {
  getMy: () => api.get('/progress-photos/my'),
  getClient: (clientId) => api.get(`/progress-photos/client/${clientId}`),
  upload: (formData) => api.post('/progress-photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/progress-photos/${id}`),
};

// Appointments (scheduling)
export const appointmentsApi = {
  getMy: (params) => api.get('/appointments', { params }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// Gym & membership
export const gymApi = {
  getGym: () => api.get('/gym'),
  updateGym: (data) => api.put('/gym', data),
  getPackages: () => api.get('/gym/packages'),
  createPackage: (data) => api.post('/gym/packages', data),
  updatePackage: (id, data) => api.put(`/gym/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/gym/packages/${id}`),
  requestMembership: (data) => api.post('/gym/membership/request', data),
  getMyMembership: () => api.get('/gym/membership/me'),
  getPendingRequests: () => api.get('/gym/membership/pending'),
  getAllMembers: (params) => api.get('/gym/membership/all', { params }),
  reviewMembership: (id, data) => api.put(`/gym/membership/${id}/review`, data),
};

// Gym program catalog
export const gymProgramsApi = {
  list: (params) => api.get('/gym-programs', { params }),
  listAll: () => api.get('/gym-programs/all'),
  get: (id) => api.get(`/gym-programs/${id}`),
  create: (data) => api.post('/gym-programs', data),
  update: (id, data) => api.put(`/gym-programs/${id}`, data),
  delete: (id) => api.delete(`/gym-programs/${id}`),
  enroll: (id) => api.post(`/gym-programs/${id}/enroll`),
};

// Social: follow & search
export const socialApi = {
  follow: (targetId) => api.post(`/follow/${targetId}`),
  unfollow: (targetId) => api.delete(`/follow/${targetId}`),
  getFollowers: (userId) => userId ? api.get(`/follow/followers/${userId}`) : api.get('/follow/followers'),
  getFollowing: (userId) => userId ? api.get(`/follow/following/${userId}`) : api.get('/follow/following'),
  searchMembers: (q) => api.get('/follow/search', { params: { q } }),
  getSuggestions: () => api.get('/follow/suggestions'),
};
