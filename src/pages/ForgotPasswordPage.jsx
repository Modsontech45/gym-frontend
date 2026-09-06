import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dumbbell, KeyRound, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success('Code envoyé ! Vérifiez votre boîte mail.');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-2xl mb-4">
            <Dumbbell size={32} className="text-primary-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Yunfit</h1>
        </div>

        <div className="card">
          <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={26} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-center">Mot de passe oublié</h2>
          <p className="text-dark-500 text-sm text-center mb-6">
            Entrez votre email et nous vous enverrons un code de réinitialisation.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Adresse email</label>
              <input
                {...register('email', { required: true, pattern: /\S+@\S+\.\S+/ })}
                type="email"
                className="input"
                placeholder="vous@exemple.fr"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">Email invalide</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Envoi…</span>
              ) : 'Envoyer le code'}
            </button>
          </form>

          <p className="text-center text-dark-500 text-sm mt-4">
            <Link to="/login" className="text-primary-400 hover:text-primary-300">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
