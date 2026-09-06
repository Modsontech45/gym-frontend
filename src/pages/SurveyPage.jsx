import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Check, ChevronLeft, ChevronRight, Dumbbell,
  Target, Zap, Heart, Trophy,
  Flame, Star, Activity, Scale,
  GraduationCap, Headphones,
  Home, Package, Building2,
  Sunrise, Sun, Moon,
  Utensils, Leaf, Wheat,
  Waves, Bike, Lightbulb,
} from 'lucide-react';

// ─── Constants (module-level for stability) ───────────────────────────────────

const GOALS = [
  { value: 'perte_poids', Icon: Flame,    label: 'Perte de poids',  desc: 'Brûler les graisses' },
  { value: 'prise_masse', Icon: Dumbbell, label: 'Prise de masse',  desc: 'Développer le muscle' },
  { value: 'tonifier',    Icon: Star,     label: 'Tonification',    desc: 'Sculpter la silhouette' },
  { value: 'force',       Icon: Zap,      label: 'Force',           desc: 'Devenir plus fort(e)' },
  { value: 'endurance',   Icon: Activity, label: 'Endurance',       desc: 'Améliorer le cardio' },
  { value: 'maintien',    Icon: Scale,    label: 'Maintien',        desc: 'Rester en forme' },
];

const ACTIVITY = [
  { value: 'sedentaire',       label: 'Sédentaire',           desc: 'Bureau, peu de mouvement' },
  { value: 'peu_actif',        label: 'Peu actif(ve)',         desc: '1–2 activités / semaine' },
  { value: 'moderement_actif', label: 'Modérément actif(ve)', desc: '3–4 activités / semaine' },
  { value: 'tres_actif',       label: 'Très actif(ve)',        desc: 'Sport intense chaque jour' },
];

const WORKOUT_TYPES = [
  { value: 'musculation',  Icon: Dumbbell,  label: 'Musculation' },
  { value: 'cardio',       Icon: Heart,     label: 'Cardio' },
  { value: 'hiit',         Icon: Zap,       label: 'HIIT' },
  { value: 'yoga',         Icon: Leaf,      label: 'Yoga' },
  { value: 'natation',     Icon: Waves,     label: 'Natation' },
  { value: 'running',      Icon: Activity,  label: 'Course' },
  { value: 'velo',         Icon: Bike,      label: 'Vélo' },
  { value: 'calisthenics', Icon: Star,      label: 'Calisthenics' },
];

const EQUIPMENT = [
  { value: 'aucun',   Icon: Home,      label: 'Aucun' },
  { value: 'basique', Icon: Package,   label: 'Basique' },
  { value: 'salle',   Icon: Building2, label: 'Salle complète' },
];

const TIMES = [
  { value: 'matin',      Icon: Sunrise, label: 'Matin',      hours: '6h–12h' },
  { value: 'apres_midi', Icon: Sun,     label: 'Après-midi', hours: '12h–17h' },
  { value: 'soir',       Icon: Moon,    label: 'Soir',       hours: '17h–22h' },
];

const DIETS = [
  { value: 'omnivore',    Icon: Utensils, label: 'Omnivore' },
  { value: 'vegetarien',  Icon: Leaf,     label: 'Végétarien' },
  { value: 'vegan',       Icon: Leaf,     label: 'Végétalien' },
  { value: 'keto',        Icon: Flame,    label: 'Kéto' },
  { value: 'sans_gluten', Icon: Wheat,    label: 'Sans gluten' },
  { value: 'autre',       Icon: Utensils, label: 'Autre' },
];

const STEPS = [
  { Icon: Target,  label: 'Mes Objectifs' },
  { Icon: Zap,     label: 'Mode de vie' },
  { Icon: Heart,   label: 'Préférences' },
  { Icon: Trophy,  label: 'Mon Plan' },
];

// ─── Module-level Opt (avoids remounting on parent re-render) ─────────────────

function Opt({ value, current, onClick, children, wide }) {
  return (
    <button type="button" onClick={() => onClick(value)}
      className={`p-3 rounded-xl border-2 text-left transition-all ${wide ? 'w-full' : ''} ${
        current === value
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-dark-700 bg-dark-800 hover:border-dark-500'
      }`}>
      {children}
    </button>
  );
}

// ─── Plan computation ─────────────────────────────────────────────────────────

function buildSchedule(goal, sessions) {
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const REST  = { type: 'Repos',  color: '#334155' };
  const ACTIF = { type: 'Actif',  color: '#6d28d9' };

  let types;
  if (sessions <= 2) {
    types = DAYS.map((_, i) => (i === 0 || i === 3) ? { type: 'Full Body', color: '#f97316' } : REST);
  } else if (sessions <= 3) {
    types = goal === 'perte_poids'
      ? [{ type: 'FB+HIIT', color: '#ef4444' }, REST, { type: 'Cardio', color: '#3b82f6' },
         REST, { type: 'HIIT', color: '#ef4444' }, ACTIF, REST]
      : [{ type: 'FB-A', color: '#f97316' }, REST, ACTIF,
         { type: 'FB-B', color: '#f97316' }, REST, { type: 'FB-C', color: '#f97316' }, REST];
  } else if (sessions <= 4) {
    types = [
      { type: 'Haut', color: '#f97316' }, { type: 'Bas',  color: '#10b981' }, REST,
      { type: 'Haut', color: '#f97316' }, { type: 'Bas',  color: '#10b981' }, ACTIF, REST,
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
  return DAYS.map((day, i) => ({ day, ...types[i] }));
}

function computePlan(height, weight, d) {
  const h = (parseFloat(height) || 170) / 100;
  const w = parseFloat(weight) || 70;
  const bmi = w / (h * h);

  let bodyType, bodyLabel, bodyDesc, bodyTip;
  if (bmi < 20) {
    bodyType = 'ectomorphe'; bodyLabel = 'Ectomorphe';
    bodyDesc = 'Métabolisme rapide, silhouette fine — tendance à avoir du mal à prendre du poids.';
    bodyTip  = 'Charges lourdes et composés (squat, soulevé) + surplus calorique de 400 kcal/j.';
  } else if (bmi < 27) {
    bodyType = 'mesomorphe'; bodyLabel = 'Mésomorphe';
    bodyDesc = "Silhouette naturellement athlétique — votre corps répond bien à tout entraînement.";
    bodyTip  = 'Polyvalent(e). Alternez force et cardio selon vos objectifs du moment.';
  } else {
    bodyType = 'endomorphe'; bodyLabel = 'Endomorphe';
    bodyDesc = 'Ossature large, bonne récupération — vous prenez de la masse facilement.';
    bodyTip  = 'Associez musculation + HIIT. Surveillez vos glucides pour gérer votre poids.';
  }

  let bmiCategory, bmiColor;
  if      (bmi < 18.5) { bmiCategory = 'Insuffisance pondérale'; bmiColor = '#60a5fa'; }
  else if (bmi < 25)   { bmiCategory = 'Poids normal';           bmiColor = '#34d399'; }
  else if (bmi < 30)   { bmiCategory = 'Surpoids';               bmiColor = '#fbbf24'; }
  else                  { bmiCategory = 'Obésité';                bmiColor = '#f87171'; }

  const sessions = parseInt(d.workoutsPerWeek) || 3;

  const programs = {
    perte_poids: { name: 'Fat Burner',      desc: 'Circuit training + HIIT pour maximiser la dépense calorique' },
    prise_masse: { name: 'Mass Builder',     desc: 'Musculation progressive axée sur les exercices composés' },
    tonifier:    { name: 'Body Toning',      desc: 'Résistance légère + cardio modéré pour sculpter la silhouette' },
    force:       { name: 'Strength Power',   desc: 'Charges lourdes, faibles répétitions — style powerlifting' },
    endurance:   { name: 'Cardio Boost',     desc: 'Cardio progressif + renforcement fonctionnel' },
    maintien:    { name: 'Wellness Balance', desc: 'Programme équilibré santé, bien-être et forme générale' },
  };

  const nutrition = {
    perte_poids: 'Déficit de 300–500 kcal/j. Protéines à 2 g/kg. Réduisez sucres rapides et alcool.',
    prise_masse: 'Surplus de 300–500 kcal/j. Protéines à 2 g/kg. Glucides complexes avant/après séance.',
    tonifier:    "Maintenez votre apport calorique. 1.8 g de protéines/kg. 2 L d'eau par jour minimum.",
    force:       "2–2.5 g de protéines/kg. Glucides abondants pour l'énergie. Créatine recommandée.",
    endurance:   "Glucides comme carburant principal. 1.5 g de protéines/kg. Électrolytes pendant l'effort.",
    maintien:    '5 fruits & légumes/jour. Alimentation variée. Mangez selon votre dépense réelle.',
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState(null);

  const [d, setD] = useState({
    primaryGoal: 'perte_poids',
    coachPreference: 'autonome',
    targetWeight: '',
    timeline: '3_mois',
    activityLevel: 'peu_actif',
    workoutsPerWeek: '3',
    sessionDuration: '60',
    equipment: 'salle',
    injuries: '',
    workoutTypes: [],
    preferredTime: 'matin',
    dietType: 'omnivore',
  });

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const toggleWT = (v) => setD(p => ({
    ...p,
    workoutTypes: p.workoutTypes.includes(v)
      ? p.workoutTypes.filter(t => t !== v)
      : [...p.workoutTypes, v],
  }));

  const goNext = () => {
    if (step === 3) setPlan(computePlan(user?.height, user?.weight, d));
    setStep(s => s + 1);
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      await authApi.saveSurvey({
        fitnessGoal: d.primaryGoal,
        coachPreference: d.coachPreference,
        bodyType: plan?.bodyType,
        experienceLevel: plan?.experienceLevel || 'debutant',
      });
      toast.success('Profil fitness complété ! Bienvenue');
    } catch {
      // non-blocking
    } finally {
      setSubmitting(false);
      navigate('/dashboard');
    }
  };

  const bmiPct = plan ? Math.min(100, Math.max(0, ((parseFloat(plan.bmi) - 10) / 40) * 100)) : 0;
  const StepIcon = STEPS[step - 1].Icon;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-start p-4 pt-8 pb-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-500/20 rounded-xl mb-2">
            <Dumbbell size={20} className="text-primary-500" />
          </div>
          <h1 className="text-lg font-extrabold text-white">Votre Plan Fitness</h1>
          <p className="text-dark-500 text-xs mt-0.5">
            Bonjour {user?.firstName} — répondez à {STEPS.length} questions pour personnaliser votre expérience
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0.5 mb-5">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const SIcon = s.Icon;
            return (
              <div key={n} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                  n < step    ? 'bg-primary-500 text-white'
                  : n === step ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500'
                  : 'bg-dark-800 text-dark-600'
                }`}>
                  {n < step ? <Check size={11} /> : <SIcon size={11} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-0.5 ${n < step ? 'bg-primary-500' : 'bg-dark-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <StepIcon size={16} className="text-primary-400" />
            <h2 className="text-base font-bold text-white">{STEPS[step - 1].label}</h2>
            <span className="ml-auto text-xs text-dark-600">{step}/{STEPS.length}</span>
          </div>

          {/* ── Step 1: Goals ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Objectif principal</p>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map(g => {
                    const GIcon = g.Icon;
                    return (
                      <Opt key={g.value} value={g.value} current={d.primaryGoal} onClick={v => set('primaryGoal', v)}>
                        <div className="flex items-center gap-2">
                          <GIcon size={18} className="text-primary-400 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-white">{g.label}</div>
                            <div className="text-xs text-dark-400">{g.desc}</div>
                          </div>
                        </div>
                      </Opt>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Comment souhaitez-vous progresser ?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Opt value="coach" current={d.coachPreference} onClick={v => set('coachPreference', v)}>
                    <div className="flex items-start gap-2">
                      <GraduationCap size={18} className="text-primary-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">Avec un coach</div>
                        <div className="text-xs text-dark-400">Suivi personnalisé par un pro</div>
                      </div>
                    </div>
                  </Opt>
                  <Opt value="autonome" current={d.coachPreference} onClick={v => set('coachPreference', v)}>
                    <div className="flex items-start gap-2">
                      <Headphones size={18} className="text-primary-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">En autonomie</div>
                        <div className="text-xs text-dark-400">Je m'entraîne seul(e)</div>
                      </div>
                    </div>
                  </Opt>
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
          )}

          {/* ── Step 2: Lifestyle ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Niveau d'activité actuel</p>
                <div className="space-y-2">
                  {ACTIVITY.map(a => (
                    <Opt key={a.value} value={a.value} current={d.activityLevel} onClick={v => set('activityLevel', v)} wide>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{a.label}</div>
                          <div className="text-xs text-dark-400">{a.desc}</div>
                        </div>
                        {d.activityLevel === a.value && <Check size={15} className="text-primary-500 shrink-0" />}
                      </div>
                    </Opt>
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
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Équipement disponible</p>
                <div className="grid grid-cols-3 gap-2">
                  {EQUIPMENT.map(({ value, Icon: EIcon, label }) => (
                    <Opt key={value} value={value} current={d.equipment} onClick={v => set('equipment', v)}>
                      <div className="text-center">
                        <EIcon size={20} className="mx-auto text-primary-400 mb-1" />
                        <div className="text-xs text-dark-400">{label}</div>
                      </div>
                    </Opt>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Limitations physiques (optionnel)</label>
                <textarea value={d.injuries} onChange={e => set('injuries', e.target.value)}
                  className="input h-20 resize-none" placeholder="Ex : douleurs au genou, problèmes de dos…" />
              </div>
            </div>
          )}

          {/* ── Step 3: Preferences ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Types d'entraînement favoris</p>
                <div className="grid grid-cols-4 gap-2">
                  {WORKOUT_TYPES.map(({ value, Icon: WIcon, label }) => (
                    <button key={value} type="button" onClick={() => toggleWT(value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        d.workoutTypes.includes(value)
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 bg-dark-800 hover:border-dark-500'
                      }`}>
                      <WIcon size={18} className="mx-auto text-primary-400 mb-1" />
                      <div className="text-xs text-dark-400">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Heure préférée d'entraînement</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIMES.map(({ value, Icon: TIcon, label, hours }) => (
                    <Opt key={value} value={value} current={d.preferredTime} onClick={v => set('preferredTime', v)}>
                      <div className="text-center">
                        <TIcon size={18} className="mx-auto text-primary-400 mb-1" />
                        <div className="text-xs font-semibold text-white">{label}</div>
                        <div className="text-xs text-dark-400">{hours}</div>
                      </div>
                    </Opt>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Régime alimentaire</p>
                <div className="grid grid-cols-2 gap-2">
                  {DIETS.map(({ value, Icon: DIcon, label }) => (
                    <Opt key={value} value={value} current={d.dietType} onClick={v => set('dietType', v)}>
                      <div className="flex items-center gap-2">
                        <DIcon size={16} className="text-primary-400 shrink-0" />
                        <span className="text-sm text-white">{label}</span>
                      </div>
                    </Opt>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Result ────────────────────────────────────────── */}
          {step === 4 && plan && (
            <div className="space-y-3">
              <p className="text-xs text-dark-400 text-center mb-1">Votre profil fitness personnalisé</p>

              {/* IMC */}
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">IMC</span>
                  <span className="text-2xl font-black" style={{ color: plan.bmiColor }}>{plan.bmi}</span>
                </div>
                <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden mb-1">
                  <div className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${bmiPct}%`, background: 'linear-gradient(to right,#60a5fa 0%,#34d399 30%,#fbbf24 65%,#f87171 100%)' }} />
                </div>
                <p className="text-center text-xs font-bold mt-1" style={{ color: plan.bmiColor }}>{plan.bmiCategory}</p>
              </div>

              {/* Body type */}
              <div className="bg-dark-800 border border-primary-500/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Dumbbell size={22} className="text-primary-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-dark-400 uppercase tracking-wider">Type de corps</div>
                    <div className="font-bold text-white text-base mt-0.5">{plan.bodyLabel}</div>
                    <p className="text-xs text-dark-400 mt-1 leading-relaxed">{plan.bodyDesc}</p>
                    <div className="flex items-start gap-1.5 mt-2">
                      <Lightbulb size={12} className="text-primary-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-primary-400 leading-relaxed">{plan.bodyTip}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program */}
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Trophy size={22} className="text-yellow-400 shrink-0 mt-0.5" />
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
                      <div className="rounded-lg py-2 px-0.5"
                        style={{ background: s.color + '22', border: `1px solid ${s.color}55` }}>
                        <div className="text-xs font-semibold leading-tight" style={{ color: s.color }}>{s.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach preference */}
              {d.coachPreference === 'coach' ? (
                <div className="rounded-2xl p-4" style={{ background: '#f9731610', border: '1px solid #f9731640' }}>
                  <div className="flex items-start gap-3">
                    <GraduationCap size={20} className="text-primary-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">Suivi par un coach</div>
                      <p className="text-xs text-dark-300 leading-relaxed">
                        Votre demande sera transmise à notre équipe. Un coach vous contactera rapidement.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-4" style={{ background: '#6d28d910', border: '1px solid #6d28d940' }}>
                  <div className="flex items-start gap-3">
                    <Headphones size={20} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Mode autonome</div>
                      <p className="text-xs text-dark-300 leading-relaxed">
                        Vous pouvez demander un suivi coach à tout moment depuis votre profil.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition */}
              <div className="rounded-2xl p-4" style={{ background: '#052e1622', border: '1px solid #10b98130' }}>
                <div className="flex items-start gap-3">
                  <Leaf size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Conseil nutrition</div>
                    <p className="text-xs text-dark-300 leading-relaxed">{plan.nutritionTip}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────────────── */}
          <div className={`flex gap-3 mt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && step < 4 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm">
                <ChevronLeft size={15} /> Retour
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={goNext}
                className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm">
                Continuer <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {submitting ? 'Enregistrement…' : 'Commencer mon aventure'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-dark-500 text-xs mt-4">
          Vous pouvez compléter ce questionnaire plus tard depuis votre profil.{' '}
          <button onClick={() => navigate('/dashboard')} className="text-primary-400 hover:text-primary-300">
            Passer pour l'instant
          </button>
        </p>
      </div>
    </div>
  );
}
