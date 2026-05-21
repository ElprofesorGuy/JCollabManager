import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const schema = z.object({
  newPassword: z.string().min(6, { message: 'Le mot de passe doit avoir au moins 6 caractères' }),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) {
      setServerError("Le lien de réinitialisation est invalide ou expiré.");
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) return;
    
    try {
      setServerError('');
      // Envoyer le token en paramètre de requête et le newPassword dans le body comme attendu par le backend
      await api.post(`/auth/reset-password?token=${token}`, {
        token: token,
        newPassword: data.newPassword
      });
      
      setSuccess(true);
      
      // Le backend nous connecte avec un token temporaire de 3 minutes (setJwtCookie), ce qui est problématique
      // Nous déconnectons explicitement l'utilisateur côté client (et backend si possible) 
      // pour forcer une vraie reconnexion sécurisée.
      try {
        await api.post('/auth/logout');
        logout();
      } catch(e) {
        // Ignorer l'erreur de déconnexion
      }
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setServerError("Une erreur est survenue. Le lien est peut-être expiré (valide 3 min).");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 pt-8 pb-6 bg-primary-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Nouveau mot de passe</h2>
        <p className="text-primary-100 text-sm">Veuillez choisir un nouveau mot de passe.</p>
      </div>
      
      <div className="p-8">
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        
        {success ? (
          <div className="text-center py-4">
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-medium">Mot de passe modifié avec succès !</p>
              <p className="text-sm">Vous allez être redirigé vers la page de connexion...</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors"
            >
              Aller à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-medium mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('newPassword')}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                  placeholder="••••••••"
                  disabled={!token}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-slate-700 text-sm font-medium mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                  placeholder="••••••••"
                  disabled={!token}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Modification...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
