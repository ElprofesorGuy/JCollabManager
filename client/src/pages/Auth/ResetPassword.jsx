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
    <div className="max-w-md mx-auto mt-16 glass-card overflow-hidden">
      <div className="px-8 pt-8 pb-6 bg-[#121824]/40 border-b border-[#1f293d] text-center">
        <h2 className="text-2xl font-extrabold text-white tracking-wide">Nouveau mot de passe</h2>
        <p className="text-slate-400 text-sm mt-1">Veuillez choisir un nouveau mot de passe.</p>
      </div>
      
      <div className="p-8">
        {serverError && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}
        
        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <p className="font-semibold text-white">Mot de passe modifié avec succès !</p>
              <p className="text-xs text-slate-400">Vous allez être redirigé vers la page de connexion...</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-4 rounded-xl border border-primary-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all text-sm"
            >
              Aller à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('newPassword')}
                  className={`w-full pl-11 pr-10 py-2.5 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 transition-all ${errors.newPassword ? 'border-rose-500' : 'border-[#1f293d]'}`}
                  placeholder="••••••••"
                  disabled={!token}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-rose-400">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  className={`w-full pl-11 pr-10 py-2.5 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 transition-all ${errors.confirmPassword ? 'border-rose-500' : 'border-[#1f293d]'}`}
                  placeholder="••••••••"
                  disabled={!token}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-4 rounded-xl border border-primary-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-75 disabled:cursor-not-allowed text-sm mt-2"
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
