import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, CheckCircle, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';

const profileSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide").optional(),
  currentPassword: z.string().min(1, "Mot de passe actuel requis pour modifier").optional().or(z.literal('')),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères").optional().or(z.literal(''))
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Le mot de passe actuel est requis pour définir un nouveau mot de passe",
  path: ["currentPassword"]
});

const Profile = () => {
  const { user, login } = useAuthStore();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: ""
    }
  });

  const onSubmit = async (data) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      
      const payload = {
        username: data.username,
        currentPassword: data.currentPassword || null,
        newPassword: data.newPassword || null
      };

      // Ensure endpoint exists in backend
      const response = await api.put(`/v1/user/${user.id}/profile`, payload);
      
      setSuccessMsg("Profil mis à jour avec succès.");
      
      // Update local storage / store if needed. Just refreshing the page or fetching user data might be needed.
      // Reset password fields
      reset({ ...data, currentPassword: "", newPassword: "" });
      
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Erreur lors de la mise à jour du profil.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-12">
      <header className="mb-8 text-center">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full mb-4">
          <User className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Mon Profil</h1>
        <p className="text-slate-400 mt-1.5 text-sm">Gérez vos informations personnelles et paramètres de sécurité.</p>
      </header>

      <div className="glass-card overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  {...register("username")}
                  className={`pl-10 block w-full rounded-xl bg-[#121824] border focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${errors.username ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  disabled
                  {...register("email")}
                  className="pl-10 block w-full rounded-xl border border-[#1f293d] bg-[#121824]/40 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 italic">L'adresse email ne peut pas être modifiée.</p>
            </div>

            <hr className="border-[#1f293d]/60 my-8" />
            <h3 className="text-lg font-bold text-white mb-4">Changer le mot de passe</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mot de passe actuel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  {...register("currentPassword")}
                  placeholder="Laissez vide pour conserver"
                  className={`pl-10 block w-full rounded-xl bg-[#121824] border focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.currentPassword ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
              </div>
              {errors.currentPassword && <p className="mt-1 text-xs text-rose-400">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  {...register("newPassword")}
                  placeholder="Nouveau mot de passe"
                  className={`pl-10 block w-full rounded-xl bg-[#121824] border focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.newPassword ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-rose-400">{errors.newPassword.message}</p>}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1f293d]/50 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 hover:bg-primary-500 border border-primary-500/40 text-sm font-semibold rounded-xl text-white shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Enregistrement...
                </>
              ) : (
                "Sauvegarder les modifications"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
