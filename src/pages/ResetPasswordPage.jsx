import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dumbbell, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputsRef.current[5]?.focus();
    }
    e.preventDefault();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const codeStr = code.join('');
    if (codeStr.length < 6) return toast.error('Entrez le code à 6 chiffres');
    if (newPassword.length < 6) return toast.error('Mot de passe : 6 caractères minimum');

    setLoading(true);
    try {
      await authApi.resetPassword({ email, code: codeStr, newPassword });
      toast.success('Mot de passe réinitialisé !');
      navigate('/login');
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
            <ShieldCheck size={26} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-center">Nouveau mot de passe</h2>
          <p className="text-dark-500 text-sm text-center mb-1">Code envoyé à :</p>
          <p className="text-primary-400 font-semibold text-sm text-center mb-6">{email}</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label mb-3 block">Code de réinitialisation</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputsRef.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-dark-800 focus:outline-none transition-colors ${
                      digit ? 'border-primary-500 text-white' : 'border-dark-600 text-white focus:border-primary-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="6 caractères minimum"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Réinitialisation…</span>
              ) : 'Réinitialiser le mot de passe'}
            </button>
          </form>

          <p className="text-center text-dark-500 text-sm mt-4">
            <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300">← Renvoyer un code</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
