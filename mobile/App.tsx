// ─── Coastal AI Owner App — Day 2 Premium UI ─────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:            '#080E1A',
  surface:       '#0E1929',
  surface2:      '#152235',
  border:        'rgba(255,255,255,0.07)',
  borderMid:     'rgba(255,255,255,0.13)',
  teal:          '#0CD9C2',
  tealGrad:      ['#0CD9C2', '#1B8BFF'] as [string, string],
  tealDim:       'rgba(12,217,194,0.11)',
  orange:        '#FF6A3C',
  orangeDim:     'rgba(255,106,60,0.12)',
  green:         '#20D777',
  greenDim:      'rgba(32,215,119,0.13)',
  purple:        '#A78BFA',
  text:          '#E6EDFF',
  textSub:       '#637491',
  textDim:       '#2E3F58',
  white:         '#FFFFFF',
};

const { width: W } = Dimensions.get('window');
const STORAGE_KEY = 'coastal-ai-session-v2';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen = 'loading' | 'welcome' | 'setup' | 'questions' | 'review' | 'success' | 'app';
type Tab    = 'home' | 'calls' | 'calendar' | 'chat' | 'settings';

type OnboardingAnswers = {
  vertical: string;
  business_hours: string;
  appointment_mode: string;
  fallback_action: string;
  primary_call_reason: string;
};

type Business = {
  id: string;
  name: string;
  vertical: string;
  phone_number: string;
  onboarding_config: Partial<OnboardingAnswers>;
  plan: string;
};

type Stats = { total_calls: number; escalated: number; appointments_booked: number };

type Appointment = {
  id: string;
  patient_name: string;
  phone: string;
  appointment_datetime: string;
  notes?: string | null;
};

type AgentInstruction = {
  id: string;
  instruction: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
};

type Call = {
  id: string;
  caller_number: string;
  duration_sec?: number | null;
  intent?: string | null;
  escalated: boolean;
  timestamp: string;
  summary?: string | null;
};

type Session = { apiBaseUrl: string; business: Business };

// ─── Onboarding questions ───────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'vertical' as const,
    q: 'What type of business are you?',
    options: [
      { label: 'Dental / Medical Clinic',         value: 'clinic' },
      { label: 'General Clinic / Health Centre',  value: 'clinic' },
      { label: 'Business Helpline / Call Centre', value: 'call_center' },
      { label: 'Other',                           value: 'restaurant' },
    ],
  },
  {
    key: 'business_hours' as const,
    q: 'What are your working hours?',
    options: [
      { label: '9 am – 6 pm  (Mon–Sat)', value: '9am-6pm' },
      { label: '8 am – 8 pm  (Mon–Sat)', value: '8am-8pm' },
      { label: '10 am – 5 pm (Mon–Fri)', value: '10am-5pm' },
      { label: '24 / 7',                 value: '24/7' },
    ],
  },
  {
    key: 'appointment_mode' as const,
    q: 'Do you work with appointments?',
    options: [
      { label: 'Yes — appointments only',        value: 'appointments_only' },
      { label: 'No — walk-ins only',             value: 'walk_in_only' },
      { label: 'Both — appointments + walk-ins', value: 'hybrid' },
    ],
  },
  {
    key: 'fallback_action' as const,
    q: "What should the AI do when it can't answer?",
    options: [
      { label: 'Call them back later',            value: 'callback' },
      { label: 'Connect to my number directly',   value: 'direct_transfer' },
      { label: 'Send me a WhatsApp alert',        value: 'whatsapp_alert' },
      { label: 'Ask them to call back in hours',  value: 'business_hours_only' },
    ],
  },
  {
    key: 'primary_call_reason' as const,
    q: "Most common reason people call you?",
    options: [
      { label: 'Booking or rescheduling',  value: 'booking' },
      { label: 'Services and prices',      value: 'services' },
      { label: 'Complaints / follow-ups',  value: 'complaints' },
      { label: 'General information',      value: 'general_info' },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    + ' · '
    + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function fmtIntent(s?: string | null) {
  return s ? s.replace(/_/g, ' ') : 'unknown';
}
function defaultName(answers: OnboardingAnswers, input: string) {
  if (input.trim()) return input.trim();
  return answers.vertical === 'call_center' ? 'Coastal AI Call Desk' : 'Coastal AI Clinic';
}

// ─── FadeSlide wrapper ─────────────────────────────────────────────────────────
function FadeSlide({ children, style, delay = 0 }: {
  children: React.ReactNode;
  style?: any;
  delay?: number;
}) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Pulsing LIVE dot ──────────────────────────────────────────────────────────
function PulseDot() {
  const ring    = useRef(new Animated.Value(1)).current;
  const ringOpa = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(ring,    { toValue: 2.8, duration: 1300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpa, { toValue: 0,   duration: 1300, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 14, height: 14, borderRadius: 7,
        backgroundColor: C.green, transform: [{ scale: ring }], opacity: ringOpa,
      }} />
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.green }} />
    </View>
  );
}

// ─── Option button with spring press animation ─────────────────────────────────
function OptionBtn({ label, onSelect }: { label: string; onSelect: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  function press() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, bounciness: 10, speed: 14, useNativeDriver: true }),
    ]).start(() => onSelect());
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.85} onPress={press} style={styles.optionBtn}>
        <Text style={styles.optionBtnText}>{label}</Text>
        <View style={styles.optionArrowWrap}>
          <Ionicons name="chevron-forward" size={16} color={C.teal} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Metric card with staggered entrance ──────────────────────────────────────
function MetricCard({ label, value, color, icon, delay }: {
  label: string; value: string | number; color: string; icon: any; delay: number;
}) {
  const translateY = useRef(new Animated.Value(28)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.metricCard, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Call card ─────────────────────────────────────────────────────────────────
function CallCard({ call, index }: { call: Call; index: number }) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);
  const esc = call.escalated;
  return (
    <Animated.View style={[styles.callCard, esc && styles.callCardEsc, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.callRowTop}>
        <View style={styles.callLeft}>
          <View style={[styles.callIconWrap, { backgroundColor: esc ? C.orangeDim : C.tealDim }]}>
            <Ionicons name="call" size={14} color={esc ? C.orange : C.teal} />
          </View>
          <Text style={styles.callNumber}>{call.caller_number || '+91 ··· ····'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: esc ? C.orangeDim : C.tealDim }]}>
          <Text style={[styles.badgeText, { color: esc ? C.orange : C.teal }]}>
            {esc ? 'Escalated' : fmtIntent(call.intent)}
          </Text>
        </View>
      </View>
      <Text style={styles.callMeta}>
        {fmtDate(call.timestamp)}{call.duration_sec ? `  ·  ${call.duration_sec}s` : ''}
      </Text>
      {call.summary ? <Text style={styles.callSummary}>{call.summary}</Text> : null}
    </Animated.View>
  );
}

// ─── Tab bar button ────────────────────────────────────────────────────────────
function TabBtn({ icon, iconActive, label, active, onPress }: {
  icon: any; iconActive: any; label: string; active: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    onPress();
  }
  return (
    <TouchableOpacity onPress={handlePress} style={styles.tabBtn} activeOpacity={1}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        {/* Active indicator pill */}
        {active && (
          <View style={styles.tabActivePill} />
        )}
        <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
          <Ionicons name={active ? iconActive : icon} size={20} color={active ? C.teal : C.textDim} />
        </View>
        <Text style={[styles.tabLabel, { color: active ? C.teal : C.textDim, fontWeight: active ? '700' : '500' }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Back button ───────────────────────────────────────────────────────────────
function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn} activeOpacity={0.7}>
      <Ionicons name="chevron-back" size={18} color={C.textSub} />
      <Text style={styles.backBtnText}>Back</Text>
    </TouchableOpacity>
  );
}

// ─── CTA button ────────────────────────────────────────────────────────────────
function CtaBtn({ label, icon, onPress, disabled }: {
  label: string; icon?: any; onPress: () => void; disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  function press() {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, bounciness: 6, useNativeDriver: true }),
    ]).start(() => onPress());
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.9} onPress={press} style={{ borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={disabled ? ['#1C2842', '#1C2842'] : C.tealGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          {icon && <Ionicons name={icon} size={20} color="#fff" />}
          <Text style={styles.ctaText}>{label}</Text>
          {!icon && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Input block ───────────────────────────────────────────────────────────────
function InputBlock({ label, icon, value, onChange, placeholder, type }: {
  label: string; icon: any; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: 'url' | 'default';
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={17} color={C.textSub} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.inputInner}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          keyboardType={type === 'url' ? 'url' : 'default'}
          placeholderTextColor={C.textDim}
          placeholder={placeholder}
        />
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen]         = useState<Screen>('loading');
  const [tab, setTab]               = useState<Tab>('home');
  const [apiUrl, setApiUrl]         = useState('http://127.0.0.1:8000');
  const [draftUrl, setDraftUrl]     = useState('http://127.0.0.1:8000');
  const [bizName, setBizName]       = useState('');
  const [qIndex, setQIndex]         = useState(0);
  const [answers, setAnswers]       = useState<OnboardingAnswers>({
    vertical: '', business_hours: '', appointment_mode: '',
    fallback_action: '', primary_call_reason: '',
  });
  const [business, setBusiness]     = useState<Business | null>(null);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [calls, setCalls]           = useState<Call[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [instructions, setInstructions] = useState<AgentInstruction[]>([]);
  const [instrText, setInstrText]       = useState('');
  const [instrSending, setInstrSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Question slide animation
  const slideX    = useRef(new Animated.Value(0)).current;
  const qOpacity  = useRef(new Animated.Value(1)).current;

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(1 / QUESTIONS.length)).current;

  // ── Session restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw) as Session;
          setApiUrl(s.apiBaseUrl);
          setDraftUrl(s.apiBaseUrl);
          setBusiness(s.business);
          await loadData(s.business, s.apiBaseUrl);
          setScreen('app');
          return;
        }
      } catch { /* no session, go to welcome */ }
      setScreen('welcome');
    };
    void restore();
  }, []);

  // ── Data loading ─────────────────────────────────────────────────────────────
  async function loadData(b: Business, url: string) {
    const base = url.replace(/\/$/, '');
    const [sRes, cRes, aRes, iRes] = await Promise.all([
      fetch(`${base}/api/calls/${b.id}/stats`),
      fetch(`${base}/api/calls/${b.id}`),
      fetch(`${base}/api/appointments/${b.id}`),
      fetch(`${base}/api/agent/instructions/${b.id}`),
    ]);
    if (!sRes.ok || !cRes.ok) throw new Error('Failed to load dashboard data.');
    setStats(await sRes.json());
    setCalls(await cRes.json());
    if (aRes.ok) setAppointments(await aRes.json());
    if (iRes.ok) setInstructions(await iRes.json());
  }

  async function refresh() {
    if (!business || refreshing) return;
    setRefreshing(true);
    setError(null);
    try { await loadData(business, apiUrl); }
    catch (e) { setError((e as Error).message); }
    finally { setRefreshing(false); }
  }

  // ── Question slide transition ─────────────────────────────────────────────────
  function slideQuestion(direction: 'forward' | 'back', then: () => void) {
    const outVal  = direction === 'forward' ? -W * 0.7 : W * 0.7;
    const inVal   = direction === 'forward' ? W * 0.7 : -W * 0.7;
    Animated.parallel([
      Animated.timing(slideX,   { toValue: outVal, duration: 180, useNativeDriver: true }),
      Animated.timing(qOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      slideX.setValue(inVal);
      qOpacity.setValue(0);
      then();
      Animated.parallel([
        Animated.timing(slideX,   { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(qOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    });
  }

  function answerQuestion(value: string) {
    const q = QUESTIONS[qIndex];
    const nextAnswers = { ...answers, [q.key]: value };
    setAnswers(nextAnswers);
    const nextIndex = qIndex + 1;
    const nextProgress = Math.min(nextIndex + 1, QUESTIONS.length) / QUESTIONS.length;
    Animated.timing(progressAnim, {
      toValue: nextProgress, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();
    if (qIndex < QUESTIONS.length - 1) {
      slideQuestion('forward', () => setQIndex(nextIndex));
    } else {
      slideQuestion('forward', () => setScreen('review'));
    }
  }

  function goBackFromQuestion() {
    if (qIndex > 0) {
      const prevProgress = qIndex / QUESTIONS.length;
      Animated.timing(progressAnim, {
        toValue: prevProgress, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: false,
      }).start();
      slideQuestion('back', () => setQIndex(i => i - 1));
    } else {
      setScreen('setup');
    }
  }

  // ── Submit onboarding ─────────────────────────────────────────────────────────
  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/businesses/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: `owner-${Date.now()}`,
          name: defaultName(answers, bizName),
          vertical: answers.vertical || 'clinic',
          onboarding_config: answers,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json() as Business;
      setBusiness(created);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ apiBaseUrl: apiUrl, business: created } satisfies Session));
      await loadData(created, apiUrl);
      setScreen('success');
    } catch (e) { setError((e as Error).message); }
    finally { setSubmitting(false); }
  }

  async function resetApp() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setBusiness(null); setCalls([]); setStats(null); setQIndex(0);
    setAppointments([]); setInstructions([]); setInstrText('');
    setAnswers({ vertical: '', business_hours: '', appointment_mode: '', fallback_action: '', primary_call_reason: '' });
    setBizName(''); setError(null); setTab('home');
    progressAnim.setValue(1 / QUESTIONS.length);
    setScreen('welcome');
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREENS
  // ════════════════════════════════════════════════════════════════════

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <LinearGradient colors={['#060C18', '#080E1A']} style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <LinearGradient colors={C.tealGrad} style={styles.splashIcon}>
            <Ionicons name="headset" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.splashTitle}>coastal ai</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Welcome ──────────────────────────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <LinearGradient colors={['#060C18', '#080E1A', '#0B1628']} style={styles.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollFill} showsVerticalScrollIndicator={false}>
            <FadeSlide style={styles.welcomeInner}>

              <View style={styles.logoRow}>
                <LinearGradient colors={C.tealGrad} style={styles.logoCircle}>
                  <Ionicons name="headset" size={28} color="#fff" />
                </LinearGradient>
                <Text style={styles.logoText}>coastal ai</Text>
              </View>

              <Text style={styles.welcomeTitle}>Your AI{'\n'}receptionist,{'\n'}live in minutes.</Text>
              <Text style={styles.welcomeSub}>
                Handle every clinic call with your AI — bookings, FAQs, escalations — 24 / 7, sounding fully human.
              </Text>

              <View style={{ gap: 14, marginBottom: 48 }}>
                {['Voice-first, sounds human', 'Never misses a booking', 'Alerts you when to step in'].map((f, i) => (
                  <FadeSlide key={i} delay={120 + i * 100}>
                    <View style={styles.featureRow}>
                      <LinearGradient colors={C.tealGrad} style={styles.featureDotWrap}>
                        <View style={styles.featureDot} />
                      </LinearGradient>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  </FadeSlide>
                ))}
              </View>

              <FadeSlide delay={500}>
                <CtaBtn label="Get started" icon="flash-outline" onPress={() => setScreen('setup')} />
              </FadeSlide>

            </FadeSlide>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (screen === 'setup') {
    return (
      <LinearGradient colors={['#060C18', '#080E1A']} style={styles.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <FadeSlide>
              <BackBtn onPress={() => setScreen('welcome')} />
              <Text style={styles.screenTitle}>Set up your{'\n'}workspace</Text>
              <Text style={styles.screenSub}>
                On a physical phone, replace 127.0.0.1 with your laptop's LAN IP address so Expo Go can reach the backend.
              </Text>

              <InputBlock label="Backend URL" icon="server-outline" value={draftUrl}
                onChange={setDraftUrl} placeholder="http://192.168.1.10:8000" type="url" />

              <InputBlock label="Business name (optional)" icon="business-outline"
                value={bizName} onChange={setBizName} placeholder="Bright Smile Dental Clinic" />

              <View style={{ marginTop: 8 }}>
                <CtaBtn label="Start onboarding" onPress={() => {
                  setApiUrl(draftUrl.trim() || 'http://127.0.0.1:8000');
                  setQIndex(0);
                  progressAnim.setValue(1 / QUESTIONS.length);
                  setScreen('questions');
                }} />
              </View>
            </FadeSlide>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Questions ────────────────────────────────────────────────────────────────
  if (screen === 'questions') {
    const q = QUESTIONS[qIndex];
    return (
      <LinearGradient colors={['#060C18', '#080E1A']} style={styles.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.qWrapper}>
            {/* Header */}
            <View style={styles.qHeader}>
              <BackBtn onPress={goBackFromQuestion} />
              <Text style={styles.qCounter}>{qIndex + 1} / {QUESTIONS.length}</Text>
            </View>

            {/* Animated progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]} />
            </View>

            {/* Sliding question pane */}
            <Animated.View style={{ flex: 1, transform: [{ translateX: slideX }], opacity: qOpacity }}>
              <ScrollView contentContainerStyle={styles.qBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.qText}>{q.q}</Text>
                <View style={{ gap: 14 }}>
                  {q.options.map(opt => (
                    <OptionBtn key={opt.value + qIndex} label={opt.label} onSelect={() => answerQuestion(opt.value)} />
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Review ───────────────────────────────────────────────────────────────────
  if (screen === 'review') {
    return (
      <LinearGradient colors={['#060C18', '#080E1A']} style={styles.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.formScroll}>
            <FadeSlide>
              <BackBtn onPress={() => { setScreen('questions'); setQIndex(QUESTIONS.length - 1); }} />
              <Text style={styles.screenTitle}>Ready to{'\n'}activate</Text>
              <Text style={styles.screenSub}>Your AI receptionist will be live within seconds.</Text>

              <View style={styles.summaryCard}>
                {[
                  { label: 'Business', value: defaultName(answers, bizName) },
                  { label: 'Type', value: answers.vertical },
                  { label: 'Hours', value: answers.business_hours },
                  { label: 'Appointments', value: answers.appointment_mode },
                  { label: 'Fallback', value: answers.fallback_action },
                  { label: 'Primary reason', value: answers.primary_call_reason },
                ].map((row, i) => (
                  <View key={row.label} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue}>{row.value || '—'}</Text>
                  </View>
                ))}
              </View>

              {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

              <View style={{ marginTop: 8 }}>
                <CtaBtn
                  label={submitting ? 'Creating…' : 'Activate receptionist'}
                  icon={submitting ? undefined : 'flash'}
                  onPress={submit}
                  disabled={submitting}
                />
              </View>
            </FadeSlide>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (screen === 'success' && business) {
    return <SuccessScreen business={business} onDashboard={() => setScreen('app')} />;
  }

  // ── Main App ─────────────────────────────────────────────────────────────────
  if (screen === 'app' && business) {
    return (
      <LinearGradient colors={['#060C18', '#080E1A']} style={styles.screen}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.appBody}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[]}
          >
            {/* ─── App header ──────────────────────────────── */}
            <FadeSlide>
              <View style={styles.appHeader}>
                <View>
                  <Text style={styles.appBizName}>{business.name}</Text>
                  <View style={styles.liveRow}>
                    <PulseDot />
                    <Text style={styles.liveLabel}>AI receptionist live</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={refresh} style={styles.refreshBtn} activeOpacity={0.7}>
                  <Ionicons name="refresh" size={19} color={refreshing ? C.teal : C.textSub} />
                </TouchableOpacity>
              </View>

              {/* Virtual number hero card */}
              <LinearGradient
                colors={['rgba(12,217,194,0.10)', 'rgba(27,139,255,0.08)']}
                style={styles.numberHero}
              >
                <LinearGradient colors={C.tealGrad} style={styles.numberHeroAccent} />
                <Text style={styles.numberHeroLabel}>Your AI line</Text>
                <Text style={styles.numberHeroValue}>{business.phone_number}</Text>
                <Text style={styles.numberHeroSub}>Share this number with your patients</Text>
              </LinearGradient>
            </FadeSlide>

            {/* ─── Tab row ─────────────────────────────────── */}
            <View style={styles.tabRow}>
              <TabBtn icon="home-outline"     iconActive="home"         label="Home"     active={tab === 'home'}     onPress={() => setTab('home')} />
              <TabBtn icon="call-outline"     iconActive="call"         label="Calls"    active={tab === 'calls'}    onPress={() => setTab('calls')} />
              <TabBtn icon="calendar-outline" iconActive="calendar"     label="Calendar" active={tab === 'calendar'} onPress={() => setTab('calendar')} />
              <TabBtn icon="chatbubble-outline" iconActive="chatbubble" label="Agent"    active={tab === 'chat'}     onPress={() => setTab('chat')} />
              <TabBtn icon="settings-outline" iconActive="settings"     label="Settings" active={tab === 'settings'} onPress={() => setTab('settings')} />
            </View>

            {/* ─── Home tab ────────────────────────────────── */}
            {tab === 'home' && (
              <FadeSlide key="home">
                {/* Hero card */}
                <LinearGradient
                  colors={['#0E2435', '#0E1929', '#1a0e35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.homeHero}
                >
                  <LinearGradient colors={C.tealGrad} style={styles.homeHeroAccent} />
                  <View style={styles.homeHeroRow}>
                    <View style={styles.homeHeroLeft}>
                      <View style={styles.homeHeroStatusRow}>
                        <PulseDot />
                        <Text style={styles.homeHeroStatus}>Agent is Live</Text>
                      </View>
                      <Text style={styles.homeHeroBiz}>{business.name}</Text>
                      <Text style={styles.homeHeroSub}>AI Receptionist · 24/7</Text>
                    </View>
                    <View style={styles.homeHeroRight}>
                      <Text style={styles.homeHeroCount}>{stats?.total_calls ?? '—'}</Text>
                      <Text style={styles.homeHeroCountLabel}>calls today</Text>
                    </View>
                  </View>
                </LinearGradient>

                <View style={styles.metricsRow}>
                  <MetricCard icon="call"         label="Calls"        value={stats?.total_calls        ?? 0} color={C.teal}   delay={0} />
                  <MetricCard icon="calendar"     label="Appointments" value={stats?.appointments_booked ?? 0} color={C.green}  delay={80} />
                  <MetricCard icon="alert-circle" label="Escalations"  value={stats?.escalated          ?? 0} color={C.orange} delay={160} />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent calls</Text>
                  {calls.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="call-outline" size={40} color={C.textDim} />
                      <Text style={styles.emptyText}>No calls yet. Once Exotel routes traffic here, logs will appear.</Text>
                    </View>
                  ) : (
                    calls.slice(0, 5).map((c, i) => <CallCard key={c.id} call={c} index={i} />)
                  )}
                </View>
              </FadeSlide>
            )}

            {/* ─── Calls tab ───────────────────────────────── */}
            {tab === 'calls' && (
              <FadeSlide key="calls">
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Full call log</Text>
                  {calls.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="time-outline" size={40} color={C.textDim} />
                      <Text style={styles.emptyText}>Backend is live. Logs appear once calls flow through Exotel.</Text>
                    </View>
                  ) : (
                    calls.map((c, i) => <CallCard key={c.id} call={c} index={i} />)
                  )}
                </View>
              </FadeSlide>
            )}

            {/* ─── Calendar tab ────────────────────────────── */}
            {tab === 'calendar' && (
              <FadeSlide key="calendar">
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                  {appointments.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="calendar-outline" size={40} color={C.textDim} />
                      <Text style={styles.emptyText}>No appointments booked yet. They'll appear here once callers book through the AI.</Text>
                    </View>
                  ) : (
                    appointments.map((a, i) => {
                      const dt = new Date(a.appointment_datetime);
                      return (
                        <View key={a.id} style={[styles.callCard, i < appointments.length - 1 && { marginBottom: 12 }]}>
                          <View style={styles.callRowTop}>
                            <View style={styles.callLeft}>
                              <View style={[styles.callIconWrap, { backgroundColor: C.greenDim }]}>
                                <Ionicons name="calendar" size={14} color={C.green} />
                              </View>
                              <Text style={styles.callNumber}>{a.patient_name}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: C.greenDim }]}>
                              <Text style={[styles.badgeText, { color: C.green }]}>
                                {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.callMeta}>
                            {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {a.phone ? `  ·  ${a.phone}` : ''}
                          </Text>
                          {a.notes ? <Text style={styles.callSummary}>{a.notes}</Text> : null}
                        </View>
                      );
                    })
                  )}
                </View>
              </FadeSlide>
            )}

            {/* ─── Agent Chat tab ───────────────────────────── */}
            {tab === 'chat' && (
              <FadeSlide key="chat">
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Agent Instructions</Text>
                  <Text style={styles.emptyText}>Send runtime instructions to the AI — these are read at the start of each call.</Text>

                  {/* Instruction history */}
                  <View style={{ marginTop: 16, marginBottom: 16 }}>
                    {instructions.length === 0 && (
                      <Text style={[styles.emptyText, { textAlign: 'left', marginTop: 8 }]}>
                        No active instructions. Send one below.
                      </Text>
                    )}
                    {[...instructions].reverse().map(inst => (
                      <View key={inst.id} style={[
                        styles.instrBubble,
                        inst.created_by === 'owner' ? styles.instrBubbleOwner : styles.instrBubbleAgent,
                      ]}>
                        <Text style={styles.instrText}>{inst.instruction}</Text>
                        <Text style={styles.instrMeta}>
                          {inst.created_by} · {new Date(inst.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Input */}
                  <View style={styles.instrInputRow}>
                    <TextInput
                      style={styles.instrInput}
                      value={instrText}
                      onChangeText={setInstrText}
                      placeholder="E.g. Dr. Sharma on leave today…"
                      placeholderTextColor={C.textDim}
                      multiline
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={instrSending || !instrText.trim()}
                        onPress={async () => {
                          if (!instrText.trim() || instrSending || !business) return;
                          setInstrSending(true);
                          try {
                            const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/agent/instruct`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ business_id: business.id, instruction: instrText.trim() }),
                            });
                            if (!res.ok) throw new Error('Failed');
                            setInstrText('');
                            await loadData(business, apiUrl);
                          } catch { setError('Failed to send instruction'); }
                          finally { setInstrSending(false); }
                        }}
                        style={[styles.instrSendBtn, (!instrText.trim() || instrSending) && { opacity: 0.4 }]}
                      >
                        <Ionicons name="send" size={16} color={C.bg} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </FadeSlide>
            )}

            {/* ─── Settings tab ────────────────────────────── */}
            {tab === 'settings' && (
              <FadeSlide key="settings">
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Settings</Text>

                  <InputBlock label="Backend URL" icon="server-outline" value={draftUrl}
                    onChange={setDraftUrl} type="url" />

                  <View style={{ marginBottom: 20 }}>
                    <CtaBtn label="Save & reconnect" onPress={async () => {
                      setApiUrl(draftUrl.trim());
                      if (business) {
                        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ apiBaseUrl: draftUrl.trim(), business }));
                        await refresh();
                      }
                    }} />
                  </View>

                  <View style={styles.summaryCard}>
                    {[
                      { label: 'Business', value: business.name },
                      { label: 'Plan',     value: business.plan },
                      { label: 'Phone',    value: business.phone_number },
                      { label: 'Hours',    value: String(business.onboarding_config.business_hours ?? '—') },
                      { label: 'Fallback', value: String(business.onboarding_config.fallback_action ?? '—') },
                    ].map((row, i) => (
                      <View key={row.label} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
                        <Text style={styles.summaryLabel}>{row.label}</Text>
                        <Text style={styles.summaryValue}>{row.value}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity onPress={resetApp} style={styles.resetBtn} activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={17} color={C.orange} />
                    <Text style={styles.resetBtnText}>Reset onboarding</Text>
                  </TouchableOpacity>
                </View>
              </FadeSlide>
            )}

            {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function SuccessScreen({ business, onDashboard }: { business: Business; onDashboard: () => void }) {
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const phoneY       = useRef(new Animated.Value(32)).current;
  const phoneOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, bounciness: 16, speed: 6, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(titleOpacity, { toValue: 1, duration: 350, delay: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(phoneOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(phoneY,       { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#060C18', '#061A14']} style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContent}>

          <Animated.View style={[styles.successIconWrap, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
            <LinearGradient colors={['#0CD9C2', '#20D777']} style={styles.successIconGrad}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </LinearGradient>
            <Animated.View style={[styles.successRing, { transform: [{ scale: checkScale }], opacity: checkOpacity }]} />
          </Animated.View>

          <Animated.Text style={[styles.successHeadline, { opacity: titleOpacity }]}>You're live!</Animated.Text>
          <Animated.Text style={[styles.successSub, { opacity: titleOpacity }]}>
            Your AI receptionist is active. Share this number with your patients:
          </Animated.Text>

          <Animated.View style={[styles.phoneCard, { opacity: phoneOpacity, transform: [{ translateY: phoneY }] }]}>
            <LinearGradient colors={['rgba(12,217,194,0.08)', 'rgba(27,139,255,0.06)']} style={styles.phoneCardInner}>
              <Text style={styles.phoneCardLabel}>AI receptionist number</Text>
              <Text style={styles.phoneCardNumber}>{business.phone_number}</Text>
              <LinearGradient colors={C.tealGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.phoneCardBar} />
            </LinearGradient>
          </Animated.View>

          <Animated.View style={{ width: '100%', opacity: phoneOpacity }}>
            <CtaBtn label="Open dashboard" onPress={onDashboard} />
          </Animated.View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  screen:      { flex: 1 },
  safeArea:    { flex: 1 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  // splash
  splashIcon:  { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { color: C.text, fontSize: 26, fontWeight: '700', letterSpacing: 2.5 },

  // welcome
  scrollFill:     { flexGrow: 1 },
  welcomeInner:   { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 44 },
  logoCircle:     { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoText:       { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 1.8 },
  welcomeTitle:   { color: C.text, fontSize: 42, lineHeight: 50, fontWeight: '800', marginBottom: 18 },
  welcomeSub:     { color: C.textSub, fontSize: 16, lineHeight: 26, marginBottom: 40 },
  featureRow:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureDotWrap: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  featureText:    { color: C.text, fontSize: 16 },

  // form screens
  formScroll:  { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 },
  screenTitle: { color: C.text, fontSize: 36, fontWeight: '800', lineHeight: 44, marginBottom: 12 },
  screenSub:   { color: C.textSub, fontSize: 15, lineHeight: 23, marginBottom: 36 },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 28 },
  backBtnText: { color: C.textSub, fontSize: 15 },

  // input
  inputBlock:  { marginBottom: 20 },
  inputLabel:  { color: C.teal, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 10 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14 },
  inputInner:  { flex: 1, color: C.text, fontSize: 15 },

  // CTA
  cta:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, paddingVertical: 17, paddingHorizontal: 24 },
  ctaText:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  // questions
  qWrapper:     { flex: 1, paddingHorizontal: 24 },
  qHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 18 },
  qCounter:     { color: C.textSub, fontSize: 14, fontWeight: '700' },
  progressTrack:{ height: 3, backgroundColor: C.surface2, borderRadius: 2, marginBottom: 40, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: C.teal, borderRadius: 2 },
  qBody:        { paddingBottom: 56 },
  qText:        { color: C.text, fontSize: 30, fontWeight: '800', lineHeight: 40, marginBottom: 36 },
  optionBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: C.border },
  optionBtnText:{ flex: 1, color: C.text, fontSize: 15, fontWeight: '500', marginRight: 12 },
  optionArrowWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.tealDim, alignItems: 'center', justifyContent: 'center' },

  // summary
  summaryCard:      { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 24 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 18, paddingVertical: 14 },
  summaryRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  summaryLabel:     { color: C.textSub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryValue:     { color: C.text, fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 16 },

  // errors
  errorMsg: { color: C.orange, fontSize: 14, lineHeight: 20, marginBottom: 12 },

  // success
  successContent:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successIconWrap:   { marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
  successIconGrad:   { width: 100, height: 100, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  successRing:       { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: C.teal + '33' },
  successHeadline:   { color: C.text, fontSize: 44, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  successSub:        { color: C.textSub, fontSize: 16, lineHeight: 25, textAlign: 'center', marginBottom: 36 },
  phoneCard:         { width: '100%', marginBottom: 28 },
  phoneCardInner:    { borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.borderMid, overflow: 'hidden' },
  phoneCardLabel:    { color: C.textSub, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 },
  phoneCardNumber:   { color: C.teal, fontSize: 34, fontWeight: '800', letterSpacing: 2.5, marginBottom: 14 },
  phoneCardBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  // app shell
  appBody:   { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 12 },
  appBizName:{ color: C.text, fontSize: 22, fontWeight: '800' },
  liveRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  liveLabel: { color: C.green, fontSize: 13, fontWeight: '700' },
  refreshBtn:{ padding: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border },

  numberHero:       { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 22, borderWidth: 1, borderColor: C.borderMid, overflow: 'hidden' },
  numberHeroAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  numberHeroLabel:  { color: C.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 10 },
  numberHeroValue:  { color: C.teal, fontSize: 30, fontWeight: '800', letterSpacing: 2.5, marginBottom: 8 },
  numberHeroSub:    { color: C.textDim, fontSize: 13 },

  tabRow:         { flexDirection: 'row', gap: 6, marginBottom: 24, backgroundColor: C.surface, borderRadius: 22, padding: 6, borderWidth: 1, borderColor: C.border },
  tabBtn:         { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabIconWrap:    { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: C.tealDim },
  tabActivePill:  { position: 'absolute', top: -6, left: '50%', marginLeft: -10, width: 20, height: 3, borderRadius: 2, backgroundColor: C.teal },
  tabLabel:       { fontSize: 10, marginTop: 2 },

  homeHero:            { borderRadius: 22, padding: 20, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(12,217,194,0.18)', overflow: 'hidden' },
  homeHeroAccent:      { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  homeHeroRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeHeroLeft:        { flex: 1 },
  homeHeroStatusRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  homeHeroStatus:      { color: '#20D777', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  homeHeroBiz:         { color: '#E6EDFF', fontSize: 18, fontWeight: '800', marginBottom: 3 },
  homeHeroSub:         { color: '#637491', fontSize: 12 },
  homeHeroRight:       { alignItems: 'flex-end' },
  homeHeroCount:       { color: '#0CD9C2', fontSize: 36, fontWeight: '800', lineHeight: 40 },
  homeHeroCountLabel:  { color: '#637491', fontSize: 11, marginTop: 2 },

  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: C.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  metricIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  metricValue:{ fontSize: 28, fontWeight: '800', marginBottom: 3, letterSpacing: -0.5 },
  metricLabel:{ color: C.textSub, fontSize: 11, lineHeight: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  section:      { marginBottom: 24 },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 18 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  emptyText:  { color: C.textSub, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 280 },

  callCard:     { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  callCardEsc:  { borderColor: C.orange + '44' },
  callRowTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  callLeft:     { flexDirection: 'row', alignItems: 'center' },
  callIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  callNumber:   { color: C.text, fontSize: 15, fontWeight: '600' },
  callMeta:     { color: C.textSub, fontSize: 12, marginBottom: 6 },
  callSummary:  { color: C.textSub, fontSize: 13, lineHeight: 20 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText:    { fontSize: 11, fontWeight: '700' },

  resetBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: C.orange + '44', marginTop: 8 },
  resetBtnText: { color: C.orange, fontSize: 15, fontWeight: '600' },

  // agent chat
  instrBubble:      { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10, maxWidth: '90%' },
  instrBubbleOwner: { backgroundColor: C.tealDim, alignSelf: 'flex-end', borderWidth: 1, borderColor: 'rgba(12,217,194,0.2)' },
  instrBubbleAgent: { backgroundColor: C.surface2, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border },
  instrText:        { color: C.text, fontSize: 14, lineHeight: 21 },
  instrMeta:        { color: C.textSub, fontSize: 10, marginTop: 5, opacity: 0.7 },
  instrInputRow:    { backgroundColor: C.surface2, borderRadius: 18, borderWidth: 1, borderColor: C.borderMid, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  instrInput:       { color: C.text, fontSize: 14, lineHeight: 21, maxHeight: 110, marginBottom: 8 },
  instrSendBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
});

