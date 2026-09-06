import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.token);
      toast.success('Bienvenue !');
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Vérifiez votre email avant de vous connecter');
        navigate(`/verify-email?email=${encodeURIComponent(errData.email)}`);
      } else {
        toast.error(errData?.message || t('error'));
      }
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
          <p className="text-dark-500 mt-2">{t('tagline')}</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6">{t('login')}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">{t('email')}</label>
              <input {...register('email', { required: true })} type="email" className="input" placeholder="vous@exemple.fr" />
            </div>
            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input {...register('password', { required: true })} type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? t('loading') : t('login')}
            </button>
          </form>
          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-xs text-dark-500 hover:text-primary-400 transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
          <p className="text-center text-dark-500 text-sm mt-4">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300">{t('register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
