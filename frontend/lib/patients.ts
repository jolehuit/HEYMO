/**
 * Patient profiles for the frontend selector.
 * These mirror the agent/patients.json but only contain display data.
 */

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
    color: "from-blue-600 to-blue-800",
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
    color: "from-green-600 to-green-800",
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
    color: "from-purple-600 to-purple-800",
  },
];
