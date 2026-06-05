import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import api from '../../api/axiosConfig';
import { LogOut, User, Layers, Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { 
    unreadCount, 
    fetchNotifications, 
    connectWebSocket, 
    disconnectWebSocket 
  } = useNotificationStore();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    
    return () => {
      // Optional: disconnect on unmount
      // disconnectWebSocket(); 
    };
  }, [isAuthenticated, fetchNotifications, connectWebSocket, disconnectWebSocket]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      disconnectWebSocket();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      // Even if API fails, clear local state
      logout();
      disconnectWebSocket();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-primary-600 text-white shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Layers className="w-6 h-6 text-primary-200" />
          <span>CollabTool</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-6 mr-4 text-sm font-medium">
                <Link to="/dashboard" className="hover:text-primary-200 transition-colors">Tableau de bord</Link>
                <Link to="/projects" className="hover:text-primary-200 transition-colors">Projets</Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/users" className="hover:text-primary-200 transition-colors">Utilisateurs</Link>
                )}
              </div>
              
              <div className="flex items-center gap-4 border-l border-primary-500 pl-4 relative">
                {/* Notification Bell */}
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-1 text-primary-100 hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-primary-600 transform translate-x-1 -translate-y-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <NotificationDropdown 
                  isOpen={isNotifOpen} 
                  onClose={() => setIsNotifOpen(false)} 
                />

                {/* User Profile */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-primary-200" />
                  <Link to="/profile" className="hover:text-primary-200 transition-colors">
                    <span>{user?.username || 'Utilisateur'}</span>
                  </Link>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary-700 hover:bg-primary-800 transition-colors text-sm ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 hover:text-primary-200 transition-colors text-sm font-medium">
                Connexion
              </Link>
              <Link to="/register" className="px-4 py-2 bg-white text-primary-600 rounded font-medium text-sm hover:bg-slate-100 transition-colors">
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
