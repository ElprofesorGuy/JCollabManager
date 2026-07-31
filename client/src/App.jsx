import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';

import ProjectList from './pages/Projects/ProjectList';
import ProjectDetail from './pages/Projects/ProjectDetail';
import UserManagement from './pages/Users/UserManagement';
import Profile from './pages/Profile/Profile';
import TasksDetailPage from './pages/Tasks/TasksDetailPage';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/useAuthStore';
import api from './api/axiosConfig';
import { useEffect, useState } from 'react';


function App() {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  // Rehydrate session from JWT cookie on first load
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await api.get('/v1/user/me');
        setUser(res.data);
      } catch {
        // Cookie absent or expired → clear store
        logout();
      } finally {
        setInitializing(false);
      }
    };
    verifySession();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e17] via-[#0f172a] to-[#020617]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0e17] via-[#0f172a] to-[#020617] text-slate-100">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <ProjectList />
                  </ProtectedRoute>
                } />
                
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/tasks/:category" element={
                  <ProtectedRoute>
                    <TasksDetailPage />
                  </ProtectedRoute>
                } />
                
                {/* Fallback route */}
                <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

