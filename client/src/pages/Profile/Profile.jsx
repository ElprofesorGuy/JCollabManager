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
    <div className="max-w-2xl mx-auto animate-fade-in">
      <header className="mb-8 text-center">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-primary-100 text-primary-600 rounded-full mb-4">
          <User className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Mon Profil</h1>
        <p className="text-slate-500 mt-2">Gérez vos informations personnelles et paramètres de sécurité.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  {...register("username")}
                  className={`pl-10 block w-full rounded-lg border ${errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'} sm:text-sm py-2.5`}
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  disabled
                  {...register("email")}
                  className="pl-10 block w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-500 sm:text-sm py-2.5 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">L'adresse email ne peut pas être modifiée.</p>
            </div>

            <hr className="border-slate-100 my-6" />
            <h3 className="text-lg font-bold text-slate-800 mb-4">Changer le mot de passe</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  {...register("currentPassword")}
                  placeholder="Laissez vide pour conserver"
                  className={`pl-10 block w-full rounded-lg border ${errors.currentPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'} sm:text-sm py-2.5`}
                />
              </div>
              {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  {...register("newPassword")}
                  placeholder="Nouveau mot de passe"
                  className={`pl-10 block w-full rounded-lg border ${errors.newPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'} sm:text-sm py-2.5`}
                />
              </div>
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
