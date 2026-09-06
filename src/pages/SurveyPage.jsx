import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import {
  ChevronLeft, ChevronRight, Check, Dumbbell,
  Flame, Star, Activity, Scale, Zap, Target,
  GraduationCap, Headphones,
  Home, Package, Building2,
  Sunrise, Sun, Moon,
  Utensils, Leaf, Wheat,
  Waves, Bike, Heart,
  Lightbulb, Trophy,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const GOALS = [
  { value: 'perte_poids', Icon: Flame,    label: 'Perte de poids',   desc: 'Brûler les graisses' },
  { value: 'prise_masse', Icon: Dumbbell, label: 'Prise de masse',   desc: 'Développer le muscle' },
  { value: 'tonifier',    Icon: Star,     label: 'Tonification',     desc: 'Sculpter la silhouette' },
  { value: 'force',       Icon: Zap,      label: 'Force',            desc: 'Devenir plus fort·e' },
  { value: 'endurance',   Icon: Activity, label: 'Endurance',        desc: 'Améliorer le cardio' },
  { value: 'maintien',    Icon: Scale,    label: 'Maintien',         desc: 'Rester en forme' },
];

const COACH_PREF = [
  { value: 'coach',    Icon: GraduationCap, label: 'Avec un coach',  desc: 'Suivi personnalisé par un professionnel' },
  { value: 'autonome', Icon: Headphones,    label: 'En autonomie',   desc: 'Je préfère m\'entraîner seul·e' },
];

const ACTIVITY = [
  { value: 'sedentaire',       label: 'Sédentaire',            desc: 'Bureau, peu de mouvement' },
  { value: 'peu_actif',        label: 'Peu actif·ve',          desc: '1–2 activités / semaine' },
  { value: 'moderement_actif', label: 'Modérément actif·ve',   desc: '3–4 activités / semaine' },
  { value: 'tres_actif',       label: 'Très actif·ve',         desc: 'Sport intense chaque jour' },
];

const SESSIONS = ['1','2','3','4','5','6','7'];

const DURATIONS = [
  { value: '30', label: '30 min',  desc: 'Séance express' },
  { value: '45', label: '45 min',  desc: 'Efficace et ciblé' },
  { value: '60', label: '1 heure', desc: 'Séance complète' },
  { value: '90', label: '1h30+',   desc: 'Entraînement intensif' },
];

const EQUIPMENT = [
  { value: 'aucun',   Icon: Home,      label: 'Aucun équipement',  desc: 'Poids du corps uniquement' },
  { value: 'basique', Icon: Package,   label: 'Équipement basique',desc: 'Haltères, bandes, tapis' },
  { value: 'salle',   Icon: Building2, label: 'Salle complète',    desc: 'Accès à une salle de sport' },
];

const WORKOUT_TYPES = [
  { value: 'musculation',  Icon: Dumbbell, label: 'Musculation' },
  { value: 'cardio',       Icon: Heart,    label: 'Cardio' },
  { value: 'hiit',         Icon: Zap,      label: 'HIIT' },
  { value: 'yoga',         Icon: Leaf,     label: 'Yoga' },
  { value: 'natation',     Icon: Waves,    label: 'Natation' },
  { value: 'running',      Icon: Activity, label: 'Course' },
  { value: 'velo',         Icon: Bike,     label: 'Vélo' },
  { value: 'calisthenics', Icon: Star,     label: 'Calisthenics' },
];

const TIMES = [
  { value: 'matin',      Icon: Sunrise, label: 'Matin',      desc: '6h – 12h' },
  { value: 'apres_midi', Icon: Sun,     label: 'Après-midi', desc: '12h – 17h' },
  { value: 'soir',       Icon: Moon,    label: 'Soir',       desc: '17h – 22h' },
];

const DIETS = [
  { value: 'omnivore',    Icon: Utensils, label: 'Omnivore' },
  { value: 'vegetarien',  Icon: Leaf,     label: 'Végétarien' },
  { value: 'vegan',       Icon: Leaf,     label: 'Végétalien' },
  { value: 'keto',        Icon: Flame,    label: 'Kéto' },
  { value: 'sans_gluten', Icon: Wheat,    label: 'Sans gluten' },
  { value: 'autre',       Icon: Utensils, label: 'Autre' },
];

// ─── Plan computation ────────────────────────────────────────────────────────

function buildSchedule(goal, sessions) {
  const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const REST  = { type: 'Repos',  color: '#334155' };
  const ACTIF = { type: 'Actif',  color: '#6d28d9' };
  let types;
  const n = parseInt(sessions) || 3;
  if (n <= 2) {
    types = DAYS.map((_, i) => (i === 0 || i === 3) ? { type: 'Full Body', color: '#f97316' } : REST);
  } else if (n <= 3) {
    types = goal === 'perte_poids'
      ? [{ type: 'FB+HIIT', color: '#ef4444' }, REST, { type: 'Cardio', color: '#3b82f6' }, REST, { type: 'HIIT', color: '#ef4444' }, ACTIF, REST]
      : [{ type: 'FB-A', color: '#f97316' }, REST, ACTIF, { type: 'FB-B', color: '#f97316' }, REST, { type: 'FB-C', color: '#f97316' }, REST];
  } else if (n <= 4) {
    types = [{ type: 'Haut', color: '#f97316' }, { type: 'Bas', color: '#10b981' }, REST, { type: 'Haut', color: '#f97316' }, { type: 'Bas', color: '#10b981' }, ACTIF, REST];
  } else {
    types = [
      { type: 'Push', color: '#f97316' }, { type: 'Pull', color: '#3b82f6' }, { type: 'Jambes', color: '#10b981' },
      { type: 'Push', color: '#f97316' }, { type: 'Pull', color: '#3b82f6' },
      n >= 6 ? { type: 'Jambes', color: '#10b981' } : ACTIF, REST,
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
    bodyTip  = 'Polyvalent·e. Alternez force et cardio selon vos objectifs du moment.';
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
    tonifier:    "Maintenez votre apport calorique. 1.8 g de protéines/kg. 2 L d'eau minimum par jour.",
    force:       "2–2.5 g de protéines/kg. Glucides abondants pour l'énergie. Créatine recommandée.",
    endurance:   "Glucides comme carburant principal. 1.5 g de protéines/kg. Électrolytes pendant l'effort.",
    maintien:    '5 fruits & légumes/jour. Alimentation variée. Mangez selon votre dépense réelle.',
  };
  const expLevel = d.activityLevel === 'tres_actif' ? 'avance'
    : d.activityLevel === 'moderement_actif' ? 'intermediaire' : 'debutant';

  return {
    bmi: bmi.toFixed(1), bmiCategory, bmiColor,
    bodyType, bodyLabel, bodyDesc, bodyTip,
    program: programs[d.primaryGoal] || programs.maintien,
    schedule: buildSchedule(d.primaryGoal, d.workoutsPerWeek),
    nutritionTip: nutrition[d.primaryGoal] || nutrition.maintien,
    experienceLevel: expLevel,
  };
}

// ─── Question definitions ─────────────────────────────────────────────────────

const TOTAL_Q = 10;

// ─── Animated slide wrapper ───────────────────────────────────────────────────

function Slide({ children, qKey }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, [qKey]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}>
      {children}
    </div>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────

function Opt({ selected, onClick, children, wide = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative text-left rounded-2xl border-2 p-4 transition-all duration-150 active:scale-[0.98]',
        wide ? 'w-full' : '',
        selected
          ? 'border-primary-500 bg-primary-500/15 text-white'
          : 'border-dark-700 bg-dark-800/60 text-dark-300 hover:border-dark-500 hover:text-white',
      ].join(' ')}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
          <Check size={11} className="text-white" />
        </span>
      )}
      {children}
    </button>
  );
}

// ─── SurveyPage ───────────────────────────────────────────────────────────────

export default function SurveyPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [q, setQ] = useState(1);           // current question 1–10, then 11 = result
  const [animKey, setAnimKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState(null);

  const [d, setD] = useState({
    primaryGoal: '',
    coachPreference: '',
    activityLevel: '',
    workoutsPerWeek: '3',
    sessionDuration: '60',
    equipment: '',
    workoutTypes: [],
    preferredTime: '',
    dietType: '',
    injuries: '',
  });

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const toggleWT = (v) => setD(p => ({
    ...p,
    workoutTypes: p.workoutTypes.includes(v) ? p.workoutTypes.filter(t => t !== v) : [...p.workoutTypes, v],
  }));

  const advance = (nextQ) => {
    setAnimKey(k => k + 1);
    if (nextQ === TOTAL_Q + 1) {
      // compute plan before showing result
      setPlan(computePlan(user?.height, user?.weight, d));
    }
    setQ(nextQ);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => { setAnimKey(k => k + 1); setQ(q => Math.max(1, q - 1)); };

  // Auto-advance for single-select: call after setting value
  const pick = (k, v, nextQ) => {
    set(k, v);
    setTimeout(() => advance(nextQ), 320);
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      const res = await authApi.saveSurvey({
        fitnessGoal: d.primaryGoal,
        coachPreference: d.coachPreference,
        bodyType: plan?.bodyType,
        experienceLevel: plan?.experienceLevel || 'debutant',
        activityLevel: d.activityLevel,
        workoutsPerWeek: parseInt(d.workoutsPerWeek),
        sessionDuration: parseInt(d.sessionDuration),
        equipment: d.equipment,
        workoutTypes: d.workoutTypes,
        preferredTime: d.preferredTime,
        dietType: d.dietType,
        injuries: d.injuries,
      });
      updateUser(res.data);
    } catch {
      updateUser({ ...user, surveyCompleted: true, aiPlan: null });
    } finally {
      setSubmitting(false);
      navigate('/dashboard');
    }
  };

  const bmiPct = plan ? Math.min(100, Math.max(0, ((parseFloat(plan.bmi) - 10) / 40) * 100)) : 0;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm px-6 py-4 flex items-center gap-4 border-b border-dark-800">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Dumbbell size={14} className="text-primary-500" />
          </div>
          <span className="font-extrabold text-primary-500 text-sm">Yunfit</span>
        </div>

        {q <= TOTAL_Q && (
          <>
            <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${((q - 1) / TOTAL_Q) * 100}%` }} />
            </div>
            <span className="text-xs text-dark-500 shrink-0">{q} / {TOTAL_Q}</span>
          </>
        )}
        {q > TOTAL_Q && (
          <span className="text-xs text-primary-400 ml-auto font-semibold">Votre plan est prêt !</span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-5 pt-10 pb-20 max-w-lg mx-auto w-full">

        {/* ── Q1: Objectif ─────────────────────────────────────────── */}
        {q === 1 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Objectif principal</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Quel est ton objectif<br />fitness ?
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full">
              {GOALS.map(({ value, Icon, label, desc }) => (
                <Opt key={value} selected={d.primaryGoal === value} onClick={() => pick('primaryGoal', value, 2)}>
                  <Icon size={22} className="text-primary-400 mb-2" />
                  <p className="font-semibold text-sm text-white">{label}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q2: Coach ou autonome ────────────────────────────────── */}
        {q === 2 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Accompagnement</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Comment veux-tu<br />progresser ?
            </h2>
            <div className="space-y-3 w-full">
              {COACH_PREF.map(({ value, Icon, label, desc }) => (
                <Opt key={value} selected={d.coachPreference === value} onClick={() => pick('coachPreference', value, 3)} wide>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                      <Icon size={22} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-base text-white">{label}</p>
                      <p className="text-sm text-dark-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q3: Niveau d'activité ────────────────────────────────── */}
        {q === 3 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Mode de vie</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Quel est ton niveau<br />d'activité actuel ?
            </h2>
            <div className="space-y-3 w-full">
              {ACTIVITY.map(({ value, label, desc }) => (
                <Opt key={value} selected={d.activityLevel === value} onClick={() => pick('activityLevel', value, 4)} wide>
                  <p className="font-semibold text-sm text-white">{label}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q4: Séances / semaine ────────────────────────────────── */}
        {q === 4 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Fréquence</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Combien de séances<br />par semaine ?
            </h2>
            <div className="grid grid-cols-7 gap-2 w-full">
              {SESSIONS.map(n => (
                <button key={n} type="button"
                  onClick={() => pick('workoutsPerWeek', n, 5)}
                  className={[
                    'aspect-square rounded-2xl flex flex-col items-center justify-center border-2 font-bold text-lg transition-all active:scale-95',
                    d.workoutsPerWeek === n
                      ? 'border-primary-500 bg-primary-500/15 text-primary-400'
                      : 'border-dark-700 bg-dark-800 text-dark-400 hover:border-dark-500 hover:text-white',
                  ].join(' ')}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-dark-500 mt-4">
              Sélectionné : <span className="text-primary-400 font-semibold">{d.workoutsPerWeek} séance{parseInt(d.workoutsPerWeek) > 1 ? 's' : ''}</span>
            </p>
            <button type="button" onClick={() => advance(5)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-6">
              Continuer <ChevronRight size={16} />
            </button>
          </Slide>
        )}

        {/* ── Q5: Durée séance ─────────────────────────────────────── */}
        {q === 5 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Durée</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Combien de temps<br />par séance ?
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full">
              {DURATIONS.map(({ value, label, desc }) => (
                <Opt key={value} selected={d.sessionDuration === value} onClick={() => pick('sessionDuration', value, 6)}>
                  <p className="font-bold text-lg text-white">{label}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q6: Équipement ───────────────────────────────────────── */}
        {q === 6 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Équipement</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Quel équipement<br />as-tu à disposition ?
            </h2>
            <div className="space-y-3 w-full">
              {EQUIPMENT.map(({ value, Icon, label, desc }) => (
                <Opt key={value} selected={d.equipment === value} onClick={() => pick('equipment', value, 7)} wide>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{label}</p>
                      <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q7: Types d'entraînement (multi) ─────────────────────── */}
        {q === 7 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Préférences</p>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Quels entraînements<br />t'attirent ?
            </h2>
            <p className="text-sm text-dark-400 text-center mb-6">Sélectionne-en plusieurs</p>
            <div className="grid grid-cols-4 gap-2 w-full">
              {WORKOUT_TYPES.map(({ value, Icon, label }) => {
                const sel = d.workoutTypes.includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleWT(value)}
                    className={[
                      'p-3 rounded-xl border-2 text-center transition-all active:scale-95',
                      sel ? 'border-primary-500 bg-primary-500/15' : 'border-dark-700 bg-dark-800 hover:border-dark-500',
                    ].join(' ')}>
                    <Icon size={20} className={sel ? 'text-primary-400 mx-auto mb-1' : 'text-dark-500 mx-auto mb-1'} />
                    <p className={`text-xs ${sel ? 'text-primary-300' : 'text-dark-400'}`}>{label}</p>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => advance(8)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-6">
              Continuer <ChevronRight size={16} />
            </button>
          </Slide>
        )}

        {/* ── Q8: Heure préférée ───────────────────────────────────── */}
        {q === 8 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Horaire</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Quand préfères-tu<br />t'entraîner ?
            </h2>
            <div className="space-y-3 w-full">
              {TIMES.map(({ value, Icon, label, desc }) => (
                <Opt key={value} selected={d.preferredTime === value} onClick={() => pick('preferredTime', value, 9)} wide>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{label}</p>
                      <p className="text-xs text-dark-400">{desc}</p>
                    </div>
                  </div>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q9: Régime alimentaire ───────────────────────────────── */}
        {q === 9 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Nutrition</p>
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Quel est ton régime<br />alimentaire ?
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full">
              {DIETS.map(({ value, Icon, label }) => (
                <Opt key={value} selected={d.dietType === value} onClick={() => pick('dietType', value, 10)}>
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-primary-400 shrink-0" />
                    <span className="font-semibold text-sm text-white">{label}</span>
                  </div>
                </Opt>
              ))}
            </div>
          </Slide>
        )}

        {/* ── Q10: Limitations (optional) ─────────────────────────── */}
        {q === 10 && (
          <Slide qKey={animKey}>
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3 text-center">Santé</p>
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              As-tu des limitations<br />physiques ?
            </h2>
            <p className="text-sm text-dark-400 text-center mb-6">Blessures, douleurs chroniques, contre-indications médicales…</p>
            <textarea
              value={d.injuries}
              onChange={e => set('injuries', e.target.value)}
              className="input w-full h-32 resize-none text-sm"
              placeholder="Ex : douleurs au genou gauche, hernie discale, épaule fragile…"
            />
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => advance(11)}
                className="btn-secondary flex-1 text-sm py-3">
                Passer
              </button>
              <button type="button" onClick={() => advance(11)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          </Slide>
        )}

        {/* ── Result screen ─────────────────────────────────────────── */}
        {q === 11 && plan && (
          <Slide qKey={animKey}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy size={30} className="text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ton plan est prêt, {user?.firstName} !</h2>
              <p className="text-sm text-dark-400">Basé sur tes réponses, voici ton profil fitness personnalisé.</p>
            </div>

            <div className="space-y-4 w-full">
              {/* IMC */}
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Indice de masse corporelle</span>
                  <span className="text-2xl font-black" style={{ color: plan.bmiColor }}>{plan.bmi}</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${bmiPct}%`, background: 'linear-gradient(to right,#60a5fa 0%,#34d399 30%,#fbbf24 65%,#f87171 100%)' }} />
                </div>
                <p className="text-right text-xs font-bold mt-1" style={{ color: plan.bmiColor }}>{plan.bmiCategory}</p>
              </div>

              {/* Type de corps */}
              <div className="card border border-primary-500/20">
                <div className="flex items-start gap-3">
                  <Dumbbell size={20} className="text-primary-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider">Type de corps</p>
                    <p className="font-bold text-white text-base mt-0.5">{plan.bodyLabel}</p>
                    <p className="text-xs text-dark-400 mt-1 leading-relaxed">{plan.bodyDesc}</p>
                    <div className="flex items-start gap-1.5 mt-2">
                      <Lightbulb size={12} className="text-primary-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-primary-400 leading-relaxed">{plan.bodyTip}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programme */}
              <div className="card">
                <div className="flex items-start gap-3">
                  <Trophy size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider">Programme recommandé</p>
                    <p className="font-bold text-white text-base mt-0.5">{plan.program.name}</p>
                    <p className="text-xs text-dark-400 mt-1">{plan.program.desc}</p>
                  </div>
                </div>
              </div>

              {/* Planning */}
              <div className="card">
                <p className="text-xs text-dark-400 uppercase tracking-wider mb-3">Planning semaine type</p>
                <div className="grid grid-cols-7 gap-1">
                  {plan.schedule.map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[10px] text-dark-500 mb-1">{s.day}</div>
                      <div className="rounded-lg py-2 px-0.5" style={{ background: s.color + '22', border: `1px solid ${s.color}55` }}>
                        <div className="text-[10px] font-semibold leading-tight" style={{ color: s.color }}>{s.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition */}
              <div className="card border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <Leaf size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Conseil nutrition</p>
                    <p className="text-sm text-dark-300 leading-relaxed">{plan.nutritionTip}</p>
                  </div>
                </div>
              </div>

              {/* Coach note */}
              {d.coachPreference === 'coach' && (
                <div className="card border border-primary-500/20 bg-primary-500/5">
                  <div className="flex items-start gap-3">
                    <GraduationCap size={18} className="text-primary-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-1">Suivi par un coach</p>
                      <p className="text-xs text-dark-300 leading-relaxed">Ta demande a été enregistrée. Un coach te contactera bientôt.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={finish} disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 mt-8 text-base font-bold">
              {submitting ? 'Finalisation…' : 'Commencer mon aventure'}
            </button>
          </Slide>
        )}

        {/* Back button */}
        {q > 1 && q <= TOTAL_Q && (
          <button type="button" onClick={back}
            className="mt-8 flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-300 transition-colors mx-auto">
            <ChevronLeft size={15} /> Question précédente
          </button>
        )}
      </div>
    </div>
  );
}
