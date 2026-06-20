import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  username: z.string().min(3, { message: 'Username doit avoir au moins 3 caractères' }),
  password: z.string().min(6, { message: 'Mot de passe doit avoir au moins 6 caractères' }),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const response = await api.post('/auth/login', data);
      
      // HttpOnly cookie is set by the backend automatically via response headers
      // We only store user details in Zustand
      login(response.data.user);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        setServerError('Identifiants erronés. Veuillez réessayer.');
      } else {
        setServerError('Une erreur est survenue lors de la connexion.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 glass-card overflow-hidden">
      <div className="px-8 pt-8 pb-6 bg-[#121824]/40 border-b border-[#1f293d] text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-wide">Bienvenue</h2>
        <p className="text-slate-400 mt-1.5 text-sm">Connectez-vous pour continuer</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
        {serverError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nom d'utilisateur</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              {...register('username')}
              className={`w-full pl-11 pr-3.5 py-2.5 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 transition-all ${errors.username ? 'border-rose-500' : 'border-[#1f293d]'}`}
              placeholder="votre_username"
            />
          </div>
          {errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mot de passe</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className={`w-full pl-11 pr-10 py-2.5 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 transition-all ${errors.password ? 'border-rose-500' : 'border-[#1f293d]'}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-between items-start mt-1.5">
            <div className="flex-1">
              {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
            </div>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 font-semibold whitespace-nowrap ml-2 transition-colors">Mot de passe oublié ?</Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-4 rounded-xl border border-primary-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-75 disabled:cursor-not-allowed text-sm mt-2"
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
            S'inscrire
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
