import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Mon Compte', icon: '🔐' },
  { title: 'Mon Profil', icon: '👤' },
  { title: 'Mes Objectifs', icon: '🎯' },
  { title: 'Mode de vie', icon: '⚡' },
  { title: 'Préférences', icon: '❤️' },
  { title: 'Mon Plan', icon: '🏆' },
];

const GOALS = [
  { value: 'perte_poids', emoji: '🔥', label: 'Perte de poids', desc: 'Brûler les graisses' },
  { value: 'prise_masse', emoji: '💪', label: 'Prise de masse', desc: 'Développer le muscle' },
  { value: 'tonifier',    emoji: '✨', label: 'Tonification',   desc: 'Sculpter la silhouette' },
  { value: 'force',       emoji: '🏋️', label: 'Force',          desc: 'Devenir plus fort(e)' },
  { value: 'endurance',   emoji: '🏃', label: 'Endurance',      desc: 'Améliorer le cardio' },
  { value: 'maintien',    emoji: '⚖️', label: 'Maintien',       desc: 'Rester en forme' },
];

const ACTIVITY = [
  { value: 'sedentaire',         label: 'Sédentaire',          desc: 'Bureau, peu de mouvement' },
  { value: 'peu_actif',          label: 'Peu actif(ve)',        desc: '1–2 activités / semaine' },
  { value: 'moderement_actif',   label: 'Modérément actif(ve)', desc: '3–4 activités / semaine' },
  { value: 'tres_actif',         label: 'Très actif(ve)',       desc: 'Sport intense chaque jour' },
];

const WORKOUT_TYPES = [
  { value: 'musculation',  emoji: '🏋️', label: 'Musculation' },
  { value: 'cardio',       emoji: '🏃', label: 'Cardio' },
  { value: 'hiit',         emoji: '⚡', label: 'HIIT' },
  { value: 'yoga',         emoji: '🧘', label: 'Yoga' },
  { value: 'natation',     emoji: '🏊', label: 'Natation' },
  { value: 'running',      emoji: '👟', label: 'Course' },
  { value: 'velo',         emoji: '🚴', label: 'Vélo' },
  { value: 'calisthenics', emoji: '🤸', label: 'Calisthenics' },
];

// ─── Plan computation ─────────────────────────────────────────────────────────

function buildSchedule(goal, sessions) {
  const D = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const REST  = { type: 'Repos',  color: '#334155' };
  const ACTIF = { type: 'Actif',  color: '#6d28d9' };

  let types;
  if (sessions <= 2) {
    types = D.map((_, i) => (i === 0 || i === 3) ? { type: 'Full Body', color: '#f97316' } : REST);
  } else if (sessions <= 3) {
    types = goal === 'perte_poids'
      ? [{ type: 'FB+HIIT', color: '#ef4444' }, REST, { type: 'Cardio', color: '#3b82f6' },
         REST, { type: 'HIIT',  color: '#ef4444' }, ACTIF, REST]
      : [{ type: 'FB-A', color: '#f97316' }, REST, ACTIF,
         { type: 'FB-B', color: '#f97316' }, REST, { type: 'FB-C', color: '#f97316' }, REST];
  } else if (sessions <= 4) {
    types = [
      { type: 'Haut', color: '#f97316' }, { type: 'Bas', color: '#10b981' }, REST,
      { type: 'Haut', color: '#f97316' }, { type: 'Bas', color: '#10b981' }, ACTIF, REST,
    ];
  } else {
    types = [
      { type: 'Push',   color: '#f97316' }, { type: 'Pull',   color: '#3b82f6' },
      { type: 'Jambes', color: '#10b981' }, { type: 'Push',   color: '#f97316' },
      { type: 'Pull',   color: '#3b82f6' },
      sessions >= 6 ? { type: 'Jambes', color: '#10b981' } : ACTIF,
      REST,
    ];
  }
  return D.map((day, i) => ({ day, ...types[i] }));
}

function computePlan(d) {
  const h = parseFloat(d.height) / 100;
  const w = parseFloat(d.weight);
  const bmi = w / (h * h);

  let bodyType, bodyLabel, bodyDesc, bodyTip;
  if (bmi < 20) {
    bodyType = 'ectomorphe'; bodyLabel = 'Ectomorphe';
    bodyDesc = 'Métabolisme rapide, silhouette fine — vous avez tendance à avoir du mal à prendre du poids.';
    bodyTip  = 'Charges lourdes et composés (squat, soulevé) + surplus calorique de 400 kcal/j.';
  } else if (bmi < 27) {
    bodyType = 'mesomorphe'; bodyLabel = 'Mésomorphe';
    bodyDesc = "Silhouette naturellement athlétique — votre corps répond bien à tout type d'entraînement.";
    bodyTip  = 'Vous êtes polyvalent(e). Variez force et cardio selon vos objectifs.';
  } else {
    bodyType = 'endomorphe'; bodyLabel = 'Endomorphe';
    bodyDesc = 'Ossature large, bonne récupération — vous prenez de la masse facilement.';
    bodyTip  = 'Alternez musculation et HIIT. Surveillez vos glucides et pratiquez le cardio régulièrement.';
  }

  let bmiCategory, bmiColor;
  if      (bmi < 18.5) { bmiCategory = 'Insuffisance pondérale'; bmiColor = '#60a5fa'; }
  else if (bmi < 25)   { bmiCategory = 'Poids normal';           bmiColor = '#34d399'; }
  else if (bmi < 30)   { bmiCategory = 'Surpoids';               bmiColor = '#fbbf24'; }
  else                  { bmiCategory = 'Obésité';                bmiColor = '#f87171'; }

  const sessions = parseInt(d.workoutsPerWeek) || 3;

  const programs = {
    perte_poids: { name: 'Fat Burner',        desc: 'Circuit training + HIIT pour maximiser la dépense calorique' },
    prise_masse: { name: 'Mass Builder',       desc: 'Musculation progressive axée sur les exercices composés' },
    tonifier:    { name: 'Body Toning',        desc: 'Résistance légère + cardio modéré pour sculpter la silhouette' },
    force:       { name: 'Strength Power',     desc: 'Charges lourdes, faibles répétitions — style powerlifting' },
    endurance:   { name: 'Cardio Boost',       desc: 'Cardio progressif + renforcement fonctionnel' },
    maintien:    { name: 'Wellness Balance',   desc: 'Programme équilibré santé, bien-être et forme générale' },
  };

  const nutrition = {
    perte_poids: 'Déficit de 300–500 kcal/j. Protéines à 2 g/kg. Limitez sucres rapides et alcool.',
    prise_masse: 'Surplus de 300–500 kcal/j. Protéines à 2 g/kg. Glucides complexes avant/après séance.',
    tonifier:    'Maintenez votre apport calorique. 1.8 g de protéines/kg. 2 L d\'eau minimum par jour.',
    force:       '2–2.5 g de protéines/kg. Glucides abondants pour l\'énergie. Créatine recommandée.',
    endurance:   'Glucides comme carburant principal. 1.5 g de protéines/kg. Électrolytes pendant l\'effort.',
    maintien:    'Mangez selon votre TDEE. Alimentation variée et colorée. 5 fruits/légumes par jour.',
  };

  const expLevel = d.activityLevel === 'tres_actif'       ? 'avance'
                 : d.activityLevel === 'moderement_actif' ? 'intermediaire' : 'debutant';

  return {
    bmi: bmi.toFixed(1), bmiCategory, bmiColor,
    bodyType, bodyLabel, bodyDesc, bodyTip,
    program: programs[d.primaryGoal] || programs.maintien,
    schedule: buildSchedule(d.primaryGoal, sessions),
    nutritionTip: nutrition[d.primaryGoal] || nutrition.maintien,
    experienceLevel: expLevel,
  };
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function CardOpt({ value, current, onClick, children, wide }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`p-3 rounded-xl border-2 text-left transition-all ${wide ? 'w-full' : ''} ${
        active ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-500'
      }`}
    >
      {children}
    </button>
  );
}

function Sec({ children }) {
  return <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-2">{children}</h3>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [plan, setPlan] = useState(null);

  const [d, setD] = useState({
    // Step 1
    email: '', password: '', confirmPassword: '', phone: '',
    // Step 2
    firstName: '', lastName: '', gender: 'homme', dateOfBirth: '', height: '', weight: '', location: '',
    // Step 3
    primaryGoal: 'perte_poids', targetWeight: '', timeline: '3_mois',
    // Step 4
    activityLevel: 'peu_actif', workoutsPerWeek: '3', sessionDuration: '60', equipment: 'salle',
    injuries: '',
    // Step 5
    workoutTypes: [], preferredTime: 'matin', dietType: 'omnivore',
  });

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const toggleWT = (v) => setD(p => ({
    ...p,
    workoutTypes: p.workoutTypes.includes(v) ? p.workoutTypes.filter(t => t !== v) : [...p.workoutTypes, v],
  }));

  const validate = () => {
    if (step === 1) {
      if (!d.email || !d.password || !d.confirmPassword)
        return toast.error('Remplissez tous les champs obligatoires'), false;
      if (!/\S+@\S+\.\S+/.test(d.email))
        return toast.error('Email invalide'), false;
      if (d.password.length < 6)
        return toast.error('Mot de passe : 6 caractères minimum'), false;
      if (d.password !== d.confirmPassword)
        return toast.error('Les mots de passe ne correspondent pas'), false;
    }
    if (step === 2) {
      if (!d.firstName || !d.lastName || !d.dateOfBirth || !d.height || !d.weight)
        return toast.error('Remplissez tous les champs obligatoires'), false;
      if (d.height < 100 || d.height > 250)
        return toast.error('Taille invalide (100–250 cm)'), false;
      if (d.weight < 30 || d.weight > 300)
        return toast.error('Poids invalide (30–300 kg)'), false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 5) setPlan(computePlan(d));
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await authApi.register({
        firstName: d.firstName, lastName: d.lastName,
        email: d.email, password: d.password, phone: d.phone,
        gender: d.gender, dateOfBirth: d.dateOfBirth,
        height: parseInt(d.height), weight: parseFloat(d.weight), location: d.location,
        fitnessGoal: d.primaryGoal,
        experienceLevel: plan?.experienceLevel || 'debutant',
        bodyType: plan?.bodyType,
      });
      setAuth(res.data.user, res.data.token);
      toast.success('Compte créé avec succès ! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  // ── Step renders ────────────────────────────────────────────────────────────

  const Step1 = () => (
    <div className="space-y-4">
      <div>
        <label className="label">Email *</label>
        <input value={d.email} onChange={e => set('email', e.target.value)}
          type="email" className="input" placeholder="vous@exemple.com" autoComplete="email" />
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
    </div>
  );

  const Step2 = () => (
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
        <Sec>Genre</Sec>
        <div className="grid grid-cols-3 gap-2">
          {[['homme', '♂️', 'Homme'], ['femme', '♀️', 'Femme'], ['autre', '⚧️', 'Autre']].map(([v, e, l]) => (
            <CardOpt key={v} value={v} current={d.gender} onClick={v => set('gender', v)}>
              <div className="text-center"><div className="text-xl">{e}</div><div className="text-xs text-dark-400 mt-0.5">{l}</div></div>
            </CardOpt>
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
    </div>
  );

  const Step3 = () => (
    <div className="space-y-5">
      <div>
        <Sec>Objectif principal</Sec>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(g => (
            <CardOpt key={g.value} value={g.value} current={d.primaryGoal} onClick={v => set('primaryGoal', v)}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{g.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{g.label}</div>
                  <div className="text-xs text-dark-400">{g.desc}</div>
                </div>
              </div>
            </CardOpt>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Poids cible (kg, optionnel)</label>
          <input value={d.targetWeight} onChange={e => set('targetWeight', e.target.value)}
            type="number" className="input" placeholder="65" />
        </div>
        <div>
          <label className="label">Délai souhaité</label>
          <select value={d.timeline} onChange={e => set('timeline', e.target.value)} className="input">
            <option value="1_mois">1 mois</option>
            <option value="3_mois">3 mois</option>
            <option value="6_mois">6 mois</option>
            <option value="1_an">1 an</option>
            <option value="sans_pression">Sans pression</option>
          </select>
        </div>
      </div>
    </div>
  );

  const Step4 = () => (
    <div className="space-y-5">
      <div>
        <Sec>Niveau d'activité actuel</Sec>
        <div className="space-y-2">
          {ACTIVITY.map(a => (
            <CardOpt key={a.value} value={a.value} current={d.activityLevel} onClick={v => set('activityLevel', v)} wide>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{a.label}</div>
                  <div className="text-xs text-dark-400">{a.desc}</div>
                </div>
                {d.activityLevel === a.value && <Check size={15} className="text-primary-500 shrink-0" />}
              </div>
            </CardOpt>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Séances / semaine</label>
          <select value={d.workoutsPerWeek} onChange={e => set('workoutsPerWeek', e.target.value)} className="input">
            {['1','2','3','4','5','6','7'].map(n => (
              <option key={n} value={n}>{n} séance{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Durée de séance</label>
          <select value={d.sessionDuration} onChange={e => set('sessionDuration', e.target.value)} className="input">
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 heure</option>
            <option value="90">1h30+</option>
          </select>
        </div>
      </div>
      <div>
        <Sec>Équipement disponible</Sec>
        <div className="grid grid-cols-3 gap-2">
          {[['aucun','🏠','Aucun'], ['basique','🪑','Basique'], ['salle','🏋️','Salle complète']].map(([v,e,l]) => (
            <CardOpt key={v} value={v} current={d.equipment} onClick={v => set('equipment', v)}>
              <div className="text-center"><div className="text-xl">{e}</div><div className="text-xs text-dark-400 mt-0.5">{l}</div></div>
            </CardOpt>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Limitations physiques (optionnel)</label>
        <textarea value={d.injuries} onChange={e => set('injuries', e.target.value)}
          className="input h-20 resize-none" placeholder="Ex : douleurs au genou, problèmes de dos…" />
      </div>
    </div>
  );

  const Step5 = () => (
    <div className="space-y-5">
      <div>
        <Sec>Types d'entraînement favoris</Sec>
        <div className="grid grid-cols-4 gap-2">
          {WORKOUT_TYPES.map(wt => (
            <button
              key={wt.value}
              type="button"
              onClick={() => toggleWT(wt.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                d.workoutTypes.includes(wt.value)
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 bg-dark-800 hover:border-dark-500'
              }`}
            >
              <div className="text-2xl">{wt.emoji}</div>
              <div className="text-xs text-dark-400 mt-0.5">{wt.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Sec>Heure préférée d'entraînement</Sec>
        <div className="grid grid-cols-3 gap-2">
          {[['matin','🌅','Matin','6h–12h'], ['apres_midi','☀️','Après-midi','12h–17h'], ['soir','🌙','Soir','17h–22h']].map(([v,e,l,h]) => (
            <CardOpt key={v} value={v} current={d.preferredTime} onClick={v => set('preferredTime', v)}>
              <div className="text-center">
                <div className="text-xl">{e}</div>
                <div className="text-xs font-semibold text-white mt-0.5">{l}</div>
                <div className="text-xs text-dark-400">{h}</div>
              </div>
            </CardOpt>
          ))}
        </div>
      </div>
      <div>
        <Sec>Régime alimentaire</Sec>
        <div className="grid grid-cols-2 gap-2">
          {[['omnivore','🍖','Omnivore'], ['vegetarien','🥗','Végétarien'], ['vegan','🌱','Végétalien'],
            ['keto','🥩','Kéto'], ['sans_gluten','🌾','Sans gluten'], ['autre','🍽️','Autre']].map(([v,e,l]) => (
            <CardOpt key={v} value={v} current={d.dietType} onClick={v => set('dietType', v)}>
              <div className="flex items-center gap-2"><span className="text-xl">{e}</span><span className="text-sm text-white">{l}</span></div>
            </CardOpt>
          ))}
        </div>
      </div>
    </div>
  );

  const Step6 = () => {
    if (!plan) return null;
    const bmiVal = parseFloat(plan.bmi);
    const bmiPct = Math.min(100, Math.max(0, ((bmiVal - 10) / 40) * 100));

    return (
      <div className="space-y-3">
        <p className="text-dark-400 text-sm text-center mb-1">Basé sur vos réponses, voici votre profil fitness personnalisé</p>

        {/* IMC */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">IMC</span>
            <span className="text-2xl font-black" style={{ color: plan.bmiColor }}>{plan.bmi}</span>
          </div>
          <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden mb-1">
            <div className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${bmiPct}%`, background: 'linear-gradient(to right, #60a5fa 0%, #34d399 30%, #fbbf24 65%, #f87171 100%)' }} />
          </div>
          <div className="text-center mt-1">
            <span className="text-xs font-bold" style={{ color: plan.bmiColor }}>{plan.bmiCategory}</span>
          </div>
        </div>

        {/* Body type */}
        <div className="bg-dark-800 border border-primary-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">💪</div>
            <div className="min-w-0">
              <div className="text-xs text-dark-400 uppercase tracking-wider">Type de corps</div>
              <div className="font-bold text-white text-base mt-0.5">{plan.bodyLabel}</div>
              <p className="text-xs text-dark-400 mt-1 leading-relaxed">{plan.bodyDesc}</p>
              <p className="text-xs text-primary-400 mt-2">💡 {plan.bodyTip}</p>
            </div>
          </div>
        </div>

        {/* Program */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">🏆</div>
            <div>
              <div className="text-xs text-dark-400 uppercase tracking-wider">Programme recommandé</div>
              <div className="font-bold text-white text-base mt-0.5">{plan.program.name}</div>
              <p className="text-xs text-dark-400 mt-1">{plan.program.desc}</p>
            </div>
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <div className="text-xs text-dark-400 uppercase tracking-wider mb-3">Planning semaine type</div>
          <div className="grid grid-cols-7 gap-1">
            {plan.schedule.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-dark-500 mb-1">{s.day}</div>
                <div className="rounded-lg py-2 px-0.5" style={{ background: s.color + '22', border: `1px solid ${s.color}55` }}>
                  <div className="text-xs font-semibold leading-tight" style={{ color: s.color }}>{s.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        <div className="rounded-2xl p-4" style={{ background: '#052e1622', border: '1px solid #10b98130' }}>
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">🥗</div>
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Conseil nutrition</div>
              <p className="text-xs text-dark-300 leading-relaxed">{plan.nutritionTip}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const steps = [Step1, Step2, Step3, Step4, Step5, Step6];
  const Current = steps[step - 1];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-start p-4 pt-6 pb-10">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/20 rounded-2xl mb-2">
            <Dumbbell size={24} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-extrabold text-white">GymPro</h1>
          <p className="text-dark-500 text-xs mt-0.5">Créez votre compte et découvrez votre plan</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0.5 mb-5">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-all ${
                  done   ? 'bg-primary-500 text-white'
                  : active ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500'
                  : 'bg-dark-800 text-dark-600'
                }`}>
                  {done ? <Check size={11} /> : n}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-0.5 ${n < step ? 'bg-primary-500' : 'bg-dark-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">{STEPS[step - 1].icon}</span>
            <h2 className="text-base font-bold text-white">{STEPS[step - 1].title}</h2>
            <span className="ml-auto text-xs text-dark-600">{step}/{STEPS.length}</span>
          </div>

          <Current />

          {/* Navigation */}
          <div className={`flex gap-3 mt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm">
                <ChevronLeft size={15} /> Retour
              </button>
            )}
            {step < STEPS.length ? (
              <button type="button" onClick={next}
                className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm">
                Continuer <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-sm flex-1">
                {loading ? 'Création en cours…' : '🚀 Créer mon compte'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-dark-500 text-xs mt-4">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
