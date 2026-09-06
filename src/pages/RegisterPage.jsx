import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  const [d, setD] = useState({
    email: '', password: '', confirmPassword: '', phone: '',
    firstName: '', lastName: '', gender: 'homme',
    dateOfBirth: '', height: '', weight: '', location: '',
  });

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    if (!d.email || !d.password || !d.confirmPassword)
      return toast.error('Remplissez tous les champs obligatoires'), false;
    if (!/\S+@\S+\.\S+/.test(d.email))
      return toast.error('Email invalide'), false;
    if (d.password.length < 6)
      return toast.error('Mot de passe : 6 caractères minimum'), false;
    if (d.password !== d.confirmPassword)
      return toast.error('Les mots de passe ne correspondent pas'), false;
    return true;
  };

  const validateStep2 = () => {
    if (!d.firstName || !d.lastName || !d.dateOfBirth || !d.height || !d.weight)
      return toast.error('Remplissez tous les champs obligatoires'), false;
    if (d.height < 100 || d.height > 250)
      return toast.error('Taille invalide (100–250 cm)'), false;
    if (d.weight < 30 || d.weight > 300)
      return toast.error('Poids invalide (30–300 kg)'), false;
    return true;
  };

  const submit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await authApi.register({
        firstName: d.firstName, lastName: d.lastName,
        email: d.email, password: d.password, phone: d.phone,
        gender: d.gender, dateOfBirth: d.dateOfBirth,
        height: parseInt(d.height), weight: parseFloat(d.weight),
        location: d.location,
      });
      setAuth(res.data.user, res.data.token);
      toast.success('Compte créé ! Répondez à quelques questions pour personnaliser votre plan.');
      navigate('/survey');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [{ label: 'Mon Compte', icon: '🔐' }, { label: 'Mon Profil', icon: '👤' }];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/20 rounded-2xl mb-2">
            <Dumbbell size={24} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Yunfit</h1>
          <p className="text-dark-500 text-xs mt-0.5">Créez votre compte gratuitement</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((s, i) => {
            const n = i + 1;
            return (
              <div key={n} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                  n < step  ? 'bg-primary-500 text-white'
                  : n === step ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500'
                  : 'bg-dark-800 text-dark-600'
                }`}>
                  {n < step ? <Check size={11} /> : n}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${n < step ? 'bg-primary-500' : 'bg-dark-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">{STEPS[step - 1].icon}</span>
            <h2 className="text-base font-bold text-white">{STEPS[step - 1].label}</h2>
            <span className="ml-auto text-xs text-dark-600">{step}/2</span>
          </div>

          {/* ── Step 1: Account ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Email *</label>
                <input value={d.email} onChange={e => set('email', e.target.value)}
                  type="email" className="input" placeholder="vous@exemple.com" />
              </div>
              <div>
                <label className="label">Mot de passe *</label>
                <div className="relative">
                  <input value={d.password} onChange={e => set('password', e.target.value)}
                    type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="6 caractères minimum" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmer le mot de passe *</label>
                <div className="relative">
                  <input value={d.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                    type={showCfm ? 'text' : 'password'} className="input pr-10" />
                  <button type="button" onClick={() => setShowCfm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                    {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Téléphone (optionnel)</label>
                <input value={d.phone} onChange={e => set('phone', e.target.value)}
                  type="tel" className="input" placeholder="+225 07 00 00 00 00" />
              </div>
              <button type="button" onClick={() => validateStep1() && setStep(2)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: Profile ──────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom *</label>
                  <input value={d.firstName} onChange={e => set('firstName', e.target.value)}
                    className="input" placeholder="Marie" />
                </div>
                <div>
                  <label className="label">Nom *</label>
                  <input value={d.lastName} onChange={e => set('lastName', e.target.value)}
                    className="input" placeholder="Koné" />
                </div>
              </div>

              <div>
                <label className="label">Genre</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['homme','♂️','Homme'],['femme','♀️','Femme'],['autre','⚧️','Autre']].map(([v,e,l]) => (
                    <button key={v} type="button" onClick={() => set('gender', v)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        d.gender === v ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-500'
                      }`}>
                      <div className="text-xl">{e}</div>
                      <div className="text-xs text-dark-400 mt-0.5">{l}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Date de naissance *</label>
                <input value={d.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                  type="date" className="input" max={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Taille * (cm)</label>
                  <input value={d.height} onChange={e => set('height', e.target.value)}
                    type="number" className="input" placeholder="175" min="100" max="250" />
                </div>
                <div>
                  <label className="label">Poids * (kg)</label>
                  <input value={d.weight} onChange={e => set('weight', e.target.value)}
                    type="number" className="input" placeholder="70" min="30" max="300" step="0.1" />
                </div>
              </div>

              <div>
                <label className="label">Ville / Localisation</label>
                <input value={d.location} onChange={e => set('location', e.target.value)}
                  className="input" placeholder="Abidjan, Côte d'Ivoire" />
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm">
                  <ChevronLeft size={15} /> Retour
                </button>
                <button type="button" onClick={submit} disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm">
                  {loading ? 'Création…' : 'Créer mon compte'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-dark-500 text-xs mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
