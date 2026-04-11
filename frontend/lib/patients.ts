/**
 * Patient profiles for the frontend selector.
 * These mirror the agent/patients.json but only contain display data.
 */

export interface PatientMedication {
  name: string;
  dosage: string;
  frequency: string;
  remaining_days: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  plan: string;
  eventType: string;
  eventDescription: string;
  eventDate: string;
  emoji: string;
  color: string;
  // Info sheet for demo (judge plays patient)
  provider?: string;
  followupRequired?: string;
  followupBooked?: boolean;
  medications?: PatientMedication[];
  communicationStyle?: string;
  location?: string;
  nearbyDoctors?: { name: string; specialty: string; distance: string; sector: string; available: boolean }[];
}

export const PATIENTS: PatientProfile[] = [
  {
    id: "sophie_martin",
    name: "Sophie Martin",
    age: 42,
    plan: "Alan Blue",
    eventType: "Post-surgery",
    eventDescription: "Right knee arthroscopy",
    eventDate: "March 26, 2026",
    emoji: "🦵",
    color: "blue",
    provider: "Clinique du Sport Paris",
    followupRequired: "Surgeon follow-up before April 25",
    followupBooked: false,
    communicationStyle: "Needs reassurance",
    location: "Paris 15e",
    medications: [
      { name: "Ketoprofen 100mg", dosage: "1 tablet morning & evening", frequency: "twice daily", remaining_days: 0 },
      { name: "Lovenox 4000 IU", dosage: "1 injection/day", frequency: "once daily", remaining_days: 7 },
    ],
    nearbyDoctors: [
      { name: "Dr. Marie Lavigne", specialty: "Généraliste", distance: "73m", sector: "Secteur 1", available: true },
      { name: "Dr. Arnaud Cocaul", specialty: "Généraliste", distance: "73m", sector: "Secteur 1", available: true },
      { name: "Dr. Philippe Renard", specialty: "Chirurgien orthopédiste", distance: "450m", sector: "Secteur 2", available: true },
      { name: "Cabinet Mouvement", specialty: "Kinésithérapeute", distance: "320m", sector: "Conventionné", available: true },
    ],
  },
  {
    id: "marc_dubois",
    name: "Marc Dubois",
    age: 58,
    plan: "Alan Green",
    eventType: "Chronic condition",
    eventDescription: "Type 2 diabetes follow-up",
    eventDate: "April 2, 2026",
    emoji: "💉",
    color: "green",
    provider: "Dr. Laurent Moreau, Endocrinologist",
    followupRequired: "Blood test (HbA1c) before May 15",
    followupBooked: true,
    communicationStyle: "Direct, factual",
    medications: [
      { name: "Metformin 1000mg", dosage: "1 tablet morning & evening", frequency: "twice daily", remaining_days: 45 },
      { name: "Jardiance 10mg", dosage: "1 tablet morning", frequency: "once daily", remaining_days: 45 },
      { name: "Atorvastatin 20mg", dosage: "1 tablet at bedtime", frequency: "once daily", remaining_days: 30 },
    ],
  },
  {
    id: "lea_chen",
    name: "Lea Chen",
    age: 31,
    plan: "Alan Blue",
    eventType: "Pregnancy",
    eventDescription: "Second trimester check-up (22 weeks)",
    eventDate: "April 5, 2026",
    emoji: "🤰",
    color: "blue",
    provider: "Dr. Marie Lefevre, OB-GYN",
    followupRequired: "Morphology ultrasound before April 20, glucose test before April 30",
    followupBooked: false,
    communicationStyle: "Informed, proactive",
    medications: [
      { name: "Prenatal Vitamins (Gynefam Plus)", dosage: "1 capsule daily", frequency: "once daily", remaining_days: 60 },
      { name: "Iron (Tardyferon 80mg)", dosage: "1 tablet daily, empty stomach", frequency: "once daily", remaining_days: 30 },
    ],
  },
];
