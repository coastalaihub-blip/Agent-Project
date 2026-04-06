/**
 * Onboarding Flow Components
 * - Question screen
 * - Review screen  
 * - Success screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../lib/api';

// Design tokens (from App.tsx colors)
const C = {
  bg: '#080E1A',
  surface: '#0E1929',
  surface2: '#152235',
  teal: '#0CD9C2',
  tealDim: 'rgba(12,217,194,0.11)',
  orange: '#FF6A3C',
  text: '#E6EDFF',
  textSub: '#637491',
  textDim: '#2E3F58',
  border: 'rgba(255,255,255,0.07)',
};

export interface OnboardingAnswers {
  vertical: string;
  business_hours: string;
  appointment_mode: string;
  fallback_action: string;
  primary_call_reason: string;
}

export const ONBOARDING_QUESTIONS = [
  {
    key: 'vertical' as const,
    question: 'What type of business are you?',
    options: [
      { label: 'Dental / Medical Clinic', value: 'clinic' },
      { label: 'General Clinic / Health Centre', value: 'clinic' },
      { label: 'Business Helpline / Call Centre', value: 'call_center' },
      { label: 'Other — type your business type', value: '__custom__' },
    ],
  },
  {
    key: 'business_hours' as const,
    question: 'What are your working hours?',
    options: [
      { label: '9 am – 6 pm (Mon–Sat)', value: '9am-6pm' },
      { label: '8 am – 8 pm (Mon–Sat)', value: '8am-8pm' },
      { label: '10 am – 5 pm (Mon–Fri)', value: '10am-5pm' },
      { label: '24 / 7', value: '24/7' },
      { label: 'Custom — type your hours', value: '__custom__' },
    ],
  },
  {
    key: 'appointment_mode' as const,
    question: 'Do you work with appointments?',
    options: [
      { label: 'Yes — appointments only', value: 'appointments_only' },
      { label: 'No — walk-ins only', value: 'walk_in_only' },
      { label: 'Both — appointments + walk-ins', value: 'hybrid' },
    ],
  },
  {
    key: 'fallback_action' as const,
    question: "What should the AI do when it can't answer?",
    options: [
      { label: 'Call them back later', value: 'callback' },
      { label: 'Connect to my number directly', value: 'direct_transfer' },
      { label: 'Send me a WhatsApp alert', value: 'whatsapp_alert' },
      { label: 'Ask them to call back in hours', value: 'business_hours_only' },
    ],
  },
  {
    key: 'primary_call_reason' as const,
    question: 'Most common reason people call you?',
    options: [
      { label: 'Booking or rescheduling', value: 'booking' },
      { label: 'Services and prices', value: 'services' },
      { label: 'Complaints / follow-ups', value: 'complaints' },
      { label: 'General information', value: 'general_info' },
    ],
  },
];

// ─── Question Component ─────────────────────────────────────
interface QuestionScreenProps {
  questionIndex: number;
  answers: Partial<OnboardingAnswers>;
  onAnswer: (key: string, value: string) => void;
  onCustomInput?: (value: string) => void;
  businessName: string;
  onBusinessNameChange: (value: string) => void;
}

export function QuestionScreen({
  questionIndex,
  answers,
  onAnswer,
  businessName,
  onBusinessNameChange,
}: QuestionScreenProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  if (questionIndex === -1) {
    // Business name entry
    return (
      <View style={styles.container}>
        <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingVertical: 40 }}
        >
          <Text style={styles.title}>Get started with Coastal AI</Text>
          <Text style={styles.subtitle}>
            Your AI receptionist takes calls 24/7. They answer FAQs, book appointments,
            and escalate to you when needed.
          </Text>

          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Bright Smile Dental Clinic"
            placeholderTextColor={C.textDim}
            value={businessName}
            onChangeText={onBusinessNameChange}
          />

          <Text style={styles.hint}>
            This name will be used in the AI's greeting: "Thank you for calling [name]. How can I help?"
          </Text>
        </ScrollView>
      </View>
    );
  }

  const q = ONBOARDING_QUESTIONS[questionIndex];
  const currentValue = answers[q.key as keyof OnboardingAnswers] as string | undefined;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingVertical: 40 }}
      >
        <Text style={styles.progressText}>
          Question {questionIndex + 1} of {ONBOARDING_QUESTIONS.length}
        </Text>
        <Text style={styles.title}>{q.question}</Text>

        {showCustomInput ? (
          <>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your answer..."
              placeholderTextColor={C.textDim}
              value={customValue}
              onChangeText={setCustomValue}
              onBlur={() => {
                if (customValue.trim()) {
                  onAnswer(q.key, customValue);
                  setShowCustomInput(false);
                }
              }}
              autoFocus
            />
          </>
        ) : (
          <View style={styles.optionsContainer}>
            {q.options.map((option, idx) => {
              const isCustom = option.value === '__custom__';
              const isSelected = currentValue === option.value;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    if (isCustom) {
                      setShowCustomInput(true);
                      setCustomValue('');
                    } else {
                      onAnswer(q.key, option.value);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Review Screen ──────────────────────────────────────────
interface ReviewScreenProps {
  businessName: string;
  answers: OnboardingAnswers;
}

export function ReviewScreen({ businessName, answers }: ReviewScreenProps) {
  const summaryItems = [
    { label: 'Business Type', value: answers.vertical },
    { label: 'Working Hours', value: answers.business_hours },
    { label: 'Appointments', value: answers.appointment_mode },
    { label: 'When AI Unsure', value: answers.fallback_action },
    { label: 'Main Call Type', value: answers.primary_call_reason },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingVertical: 40 }}
      >
        <Text style={styles.title}>Let's review your setup</Text>

        <View style={styles.reviewBox}>
          <Text style={styles.reviewLabel}>Business Name</Text>
          <Text style={styles.reviewValue}>{businessName}</Text>
        </View>

        {summaryItems.map((item, idx) => (
          <View key={idx} style={styles.reviewBox}>
            <Text style={styles.reviewLabel}>{item.label}</Text>
            <Text style={styles.reviewValue}>
              {item.value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}
            </Text>
          </View>
        ))}

        <Text style={styles.hint}>
          You can change these settings later in your dashboard.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Success Screen ──────────────────────────────────────────
interface SuccessScreenProps {
  phoneNumber: string;
  businessName: string;
}

export function SuccessScreen({ phoneNumber, businessName }: SuccessScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg, C.surface]} style={styles.background} />
      <View style={styles.successContent}>
        <View style={styles.checkCircle}>
          <Text style={styles.successCheckmark}>✓</Text>
        </View>

        <Text style={styles.successTitle}>You're live! 🎉</Text>

        <Text style={styles.successSubtitle}>
          Your AI receptionist is now taking calls 24/7
        </Text>

        <View style={styles.numberBox}>
          <Text style={styles.numberLabel}>Your dedicated number</Text>
          <Text style={styles.numberValue}>{phoneNumber}</Text>
          <Text style={styles.numberHint}>
            Share this with your patients — it's now your clinic's official line.
          </Text>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Next Steps:</Text>
          <Text style={[styles.tipsItem, { marginTop: 12 }]}>
            • Share your number on your website and social media
          </Text>
          <Text style={styles.tipsItem}>
            • Update your business cards
          </Text>
          <Text style={styles.tipsItem}>
            • The AI will learn from your first calls
          </Text>
          <Text style={styles.tipsItem}>
            • Check your dashboard for incoming calls & bookings
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: C.textSub,
    marginBottom: 32,
    lineHeight: 24,
  },
  progressText: {
    fontSize: 12,
    color: C.teal,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: C.text,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: C.textSub,
    marginTop: 24,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    gap: 12,
  },
  optionButtonSelected: {
    backgroundColor: C.tealDim,
    borderColor: C.teal,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  checkmark: {
    color: C.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: C.teal,
  },
  reviewBox: {
    backgroundColor: C.surface2,
    borderLeftWidth: 3,
    borderLeftColor: C.teal,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    borderRadius: 4,
  },
  reviewLabel: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: C.text,
    fontWeight: '500',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${C.teal}22`,
    borderWidth: 2,
    borderColor: C.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successCheckmark: {
    fontSize: 48,
    color: C.teal,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: C.textSub,
    marginBottom: 32,
  },
  numberBox: {
    backgroundColor: C.surface2,
    borderWidth: 2,
    borderColor: C.teal,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  numberLabel: {
    fontSize: 12,
    color: C.textSub,
    marginBottom: 8,
  },
  numberValue: {
    fontSize: 28,
    fontWeight: '700',
    color: C.teal,
    marginBottom: 8,
  },
  numberHint: {
    fontSize: 13,
    color: C.textDim,
    textAlign: 'center',
    marginTop: 8,
  },
  tipsContainer: {
    backgroundColor: C.surface2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  tipsItem: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 20,
  },
});
