import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SurveyPage from './pages/SurveyPage';
import DashboardPage from './pages/DashboardPage';
import FeedPage from './pages/FeedPage';
import ClientsPage from './pages/admin/ClientsPage';
import ClientDetailPage from './pages/admin/ClientDetailPage';
import SubscriptionsPage from './pages/admin/SubscriptionsPage';
import WorkoutsPage from './pages/WorkoutsPage';
import MessagesPage from './pages/MessagesPage';
import FollowUpsPage from './pages/FollowUpsPage';
import ProfilePage from './pages/ProfilePage';
import MeasurementsPage from './pages/MeasurementsPage';
import Layout from './components/common/Layout';

const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/survey" element={<PrivateRoute><SurveyPage /></PrivateRoute>} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:userId" element={<MessagesPage />} />
        <Route path="/followups" element={<FollowUpsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/clients" element={<PrivateRoute roles={['admin', 'coach']}><ClientsPage /></PrivateRoute>} />
        <Route path="/clients/:id" element={<PrivateRoute roles={['admin', 'coach']}><ClientDetailPage /></PrivateRoute>} />
        <Route path="/subscriptions" element={<PrivateRoute roles={['admin', 'coach']}><SubscriptionsPage /></PrivateRoute>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
