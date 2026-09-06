import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch } = useForm();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) return toast.error('Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      const res = await authApi.register(data);
      setAuth(res.data.user, res.data.token);
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('error'));
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
          <h1 className="text-3xl font-extrabold text-white">GymPro</h1>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6">{t('register')}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('first_name')}</label>
                <input {...register('firstName', { required: true })} className="input" placeholder="Marie" />
              </div>
              <div>
                <label className="label">{t('last_name')}</label>
                <input {...register('lastName', { required: true })} className="input" placeholder="Martin" />
              </div>
            </div>
            <div>
              <label className="label">{t('email')}</label>
              <input {...register('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="label">{t('phone')}</label>
              <input {...register('phone')} type="tel" className="input" />
            </div>
            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input {...register('password', { required: true, minLength: 6 })} type={showPwd ? 'text' : 'password'} className="input pr-10" />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">{t('confirm_password')}</label>
              <div className="relative">
                <input {...register('confirmPassword', { required: true })} type={showConfirm ? 'text' : 'password'} className="input pr-10" />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? t('loading') : t('register')}
            </button>
          </form>
          <p className="text-center text-dark-500 text-sm mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
