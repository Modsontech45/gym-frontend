import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Camera, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const fileRef = useRef();
  const { register, handleSubmit } = useForm({ defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone, bio: user?.bio, fitnessGoal: user?.fitnessGoal, experienceLevel: user?.experienceLevel, language: user?.language } });
  const { register: registerPwd, handleSubmit: handlePwdSubmit, reset: resetPwd } = useForm();

  const updateProfile = useMutation({
    mutationFn: (data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => v && fd.append(k, v));
      return authApi.updateProfile(fd);
    },
    onSuccess: (res) => { updateUser(res.data); toast.success('Profil mis à jour !'); },
    onError: () => toast.error(t('error')),
  });

  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => { resetPwd(); toast.success('Mot de passe modifié !'); },
    onError: (err) => toast.error(err.response?.data?.message || t('error')),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fd = new FormData();
      fd.append('avatar', file);
      authApi.updateProfile(fd).then(res => { updateUser(res.data); toast.success('Avatar mis à jour !'); });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0 animate-fade-in">
      <h1 className="text-2xl font-bold">{t('profile')}</h1>

      <div className="card text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-3xl overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
          </div>
          <button onClick={() => fileRef.current.click()} className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-2">
            <Camera size={14} className="text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
        <p className="text-dark-500 capitalize">{user?.role} · {user?.email}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('profile')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'profile' ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-500'}`}>
          <User size={16} className="inline mr-2" /> Profil
        </button>
        <button onClick={() => setTab('password')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'password' ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-500'}`}>
          <Lock size={16} className="inline mr-2" /> Mot de passe
        </button>
      </div>

      {tab === 'profile' && (
        <div className="card">
          <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('first_name')}</label>
                <input {...register('firstName')} className="input" />
              </div>
              <div>
                <label className="label">{t('last_name')}</label>
                <input {...register('lastName')} className="input" />
              </div>
            </div>
            <div>
              <label className="label">{t('phone')}</label>
              <input {...register('phone')} type="tel" className="input" />
            </div>
            <div>
              <label className="label">{t('bio')}</label>
              <textarea {...register('bio')} className="input resize-none" rows={3} />
            </div>
            <div>
              <label className="label">{t('fitness_goal')}</label>
              <input {...register('fitnessGoal')} className="input" placeholder="Ex: Prise de masse, perte de poids..." />
            </div>
            <div>
              <label className="label">{t('experience')}</label>
              <select {...register('experienceLevel')} className="input">
                <option value="debutant">{t('beginner')}</option>
                <option value="intermediaire">{t('intermediate')}</option>
                <option value="avance">{t('advanced')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('language')}</label>
              <select {...register('language')} className="input">
                <option value="fr">{t('french')}</option>
                <option value="en">{t('english')}</option>
              </select>
            </div>
            <button type="submit" disabled={updateProfile.isPending} className="btn-primary w-full">{t('save')}</button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card">
          <form onSubmit={handlePwdSubmit(d => changePassword.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Mot de passe actuel</label>
              <div className="relative">
                <input {...registerPwd('currentPassword', { required: true })} type={showCurrent ? 'text' : 'password'} className="input pr-10" />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input {...registerPwd('newPassword', { required: true, minLength: 6 })} type={showNew ? 'text' : 'password'} className="input pr-10" />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={changePassword.isPending} className="btn-primary w-full">Modifier le mot de passe</button>
          </form>
        </div>
      )}
    </div>
  );
}
