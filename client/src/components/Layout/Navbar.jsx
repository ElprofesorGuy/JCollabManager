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
    <nav className="bg-[#121824]/65 backdrop-blur-lg border-b border-[#1f293d] sticky top-0 z-50 text-slate-100 shadow-lg">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400 hover:opacity-95 transition-opacity">
          <Layers className="w-6 h-6 text-primary-400" />
          <span>JCollabManager</span>
        </Link>
        
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-6 mr-4 text-sm font-semibold text-slate-300">
                <Link to="/dashboard" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all">Tableau de bord</Link>
                <Link to="/projects" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all">Projets</Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/users" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all">Utilisateurs</Link>
                )}
              </div>
              
              <div className="flex items-center gap-4 border-l border-[#1f293d] pl-4 relative">
                {/* Notification Bell */}
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border border-slate-900 transform translate-x-0.5 -translate-y-0.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <NotificationDropdown 
                  isOpen={isNotifOpen} 
                  onClose={() => setIsNotifOpen(false)} 
                />

                {/* User Profile */}
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <User className="w-4 h-4 text-primary-400" />
                  <Link to="/profile" className="hover:text-white transition-colors">
                    <span>{user?.username || 'Utilisateur'}</span>
                  </Link>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-[#1f293d] hover:border-red-500/35 hover:text-red-400 transition-all text-sm font-semibold ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
                Connexion
              </Link>
              <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-500 transition-colors border border-primary-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
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
