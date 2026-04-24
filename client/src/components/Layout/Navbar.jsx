import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { LogOut, User, Layers } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      // Even if API fails, clear local state
      logout();
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
              <div className="flex items-center gap-2 text-sm font-medium border-l border-primary-500 pl-4">
                <User className="w-4 h-4 text-primary-200" />
                <Link to="/profile" className="hover:text-primary-200 transition-colors">
                  <span>{user?.username || 'Utilisateur'}</span>
                </Link>
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
