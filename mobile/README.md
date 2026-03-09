# Mobile App — Samarpith

React Native + Expo app for business owners. 4 screens: Onboarding, Dashboard, Call Log, Settings.

## Setup

```bash
cd mobile
npx create-expo-app@latest . --template blank-typescript
npm install @supabase/supabase-js expo-notifications
# Copy .env.example → .env
```

## 4 Screens to Build

### 1. Onboarding / Questionnaire
- 5 multiple-choice questions (see `docs/onboarding_questions.md`)
- Completion → POST `/api/businesses/signup` → get phone number
- Show: "Your AI receptionist number is +91 80 4500 1001"
- Target: under 3 minutes from install to done

### 2. Dashboard
- Your virtual number (prominent)
- Today's call stats: calls answered, appointments booked, escalations
- Recent calls list (last 5) with intent tags
- "Go live / Pause" toggle

### 3. Call Log
- Full list of calls with: timestamp, caller number, duration, intent badge
- Tap call → see transcript + summary
- Badge: escalated calls highlighted in orange

### 4. Settings
- Business name + hours
- Doctor/service list (edit)
- Escalation contact number
- Notification preferences

## Key Integration Points

```
Onboarding complete → POST /api/businesses/signup
Dashboard → GET /api/calls/{business_id}/stats
Call Log → GET /api/calls/{business_id}
Call detail → GET /api/calls/detail/{call_id}
Escalation push → Expo Notifications (expo-notifications)
```

## Push Notifications (Escalation Alerts)

When a caller says "speak to a human":
1. Agent triggers escalation
2. Backend sends Expo push notification
3. Owner's phone buzzes: "Caller on line. Tap to listen."

Setup: `expo-notifications` + Expo push token stored in Supabase `businesses` table.

## Demo Flow (March 28)

1. Open app → "Get Started"
2. 5 questions → select Clinic → name "Bright Smile Dental Clinic" → submit
3. Screen shows: "Your number is +91 80 4500 1001. You're live."
4. Call that number (demo) → booking happens
5. Dashboard refreshes → appointment shows
