import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dumbbell, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setAuth } = useAuthStore();
  const email = params.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputsRef.current[i + 1]?.focus();
    if (next.every(d => d) && !loading) submitCode(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setCode(next);
      inputsRef.current[5]?.focus();
      submitCode(pasted);
    }
    e.preventDefault();
  };

  const submitCode = async (codeStr) => {
    setLoading(true);
    try {
      const res = await authApi.verifyEmail({ email, code: codeStr });
      setAuth(res.data.user, res.data.token);
      toast.success('Email vérifié !');
      navigate('/survey');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code invalide');
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.resendVerification({ email });
      toast.success('Nouveau code envoyé !');
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setResending(false);
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

        <div className="card text-center">
          <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={26} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Vérifiez votre email</h2>
          <p className="text-dark-500 text-sm mb-1">Nous avons envoyé un code à 6 chiffres à :</p>
          <p className="text-primary-400 font-semibold text-sm mb-6">{email}</p>

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
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

          {loading && (
            <div className="flex items-center justify-center gap-2 text-primary-400 mb-4">
              <Loader2 size={16} className="animate-spin" /> Vérification…
            </div>
          )}

          <button
            onClick={() => submitCode(code.join(''))}
            disabled={loading || code.some(d => !d)}
            className="btn-primary w-full py-3 mb-4 disabled:opacity-40"
          >
            {loading ? 'Vérification…' : 'Confirmer le code'}
          </button>

          <button
            onClick={resend}
            disabled={cooldown > 0 || resending}
            className="flex items-center gap-2 mx-auto text-sm text-dark-500 hover:text-primary-400 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
          </button>

          <p className="text-center text-dark-600 text-xs mt-6">
            <Link to="/login" className="hover:text-dark-400">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
