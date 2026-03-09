# Onboarding Questionnaire — 5 Questions, Multiple Choice Only

Target: Under 3 minutes. Zero typing required.

---

## Q1: What type of business are you?

- [ ] Dental / Medical Clinic
- [ ] General Clinic / Health Centre
- [ ] Business Helpline / Call Center
- [ ] Other (text field — only option requiring input)

---

## Q2: What are your working hours?

- [ ] 9am – 6pm (Mon–Sat)
- [ ] 8am – 8pm (Mon–Sat)
- [ ] 10am – 5pm (Mon–Fri)
- [ ] 24/7
- [ ] Custom (opens simple time picker)

---

## Q3: Do you work with appointments?

- [ ] Yes — patients/customers book appointments
- [ ] No — walk-in only
- [ ] Both — appointments + walk-ins

---

## Q4: What should the AI do when it can't answer?

- [ ] Say "I'll have our team call you back"
- [ ] Connect caller to my number directly
- [ ] Send me a WhatsApp message with the query
- [ ] Just say "Please call back during business hours"

---

## Q5: What's the most common reason people call you?

- [ ] Booking or rescheduling appointments
- [ ] Asking about services and prices
- [ ] Complaints and follow-ups
- [ ] General information

---

## After submission → show:

> "Your AI receptionist is now live!
> Your number: **+91 80 4500 1001**
> Share this with your patients — it's now your clinic's official line."

---

## What gets stored in `onboarding_config` JSONB:

```json
{
  "vertical": "clinic",
  "business_hours": "9am-6pm",
  "appointment_mode": "appointments_only",
  "fallback_action": "callback",
  "primary_call_reason": "booking"
}
```
