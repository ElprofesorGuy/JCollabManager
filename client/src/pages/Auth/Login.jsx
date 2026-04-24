import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  username: z.string().min(3, { message: 'Username doit avoir au moins 3 caractères' }),
  password: z.string().min(6, { message: 'Mot de passe doit avoir au moins 6 caractères' }),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState('');
  
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
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 pt-8 pb-6 bg-primary-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-2">Bienvenue</h2>
        <p className="text-primary-100">Connectez-vous pour continuer</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-8">
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-slate-700 text-sm font-medium mb-1">Nom d'utilisateur</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              {...register('username')}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
              placeholder="votre_username"
            />
          </div>
          {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-slate-700 text-sm font-medium mb-1">Mot de passe</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              {...register('password')}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:text-primary-800">
            S'inscrire
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
