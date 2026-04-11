/**
 * Alan-style icons — rounded, soft, matching brand identity
 *
 * Owner: Dev 3
 */

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function PhoneIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MicIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="19" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="23" x2="16" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function HeartPulseIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12h4l3-9 4 18 3-9h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PillIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10.5 1.5l-8 8a4.95 4.95 0 007 7l8-8a4.95 4.95 0 00-7-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="6" y1="10" x2="14" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function WatchIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="2"/>
      <polyline points="12,9 12,12 14,14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 2h6l1 5H8L9 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22h6l1-5H8l1 5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function WalletIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="14" rx="3" stroke={color} strokeWidth="2"/>
      <path d="M2 10h20" stroke={color} strokeWidth="2"/>
      <circle cx="17" cy="15" r="1.5" fill={color}/>
    </svg>
  );
}

export function ClipboardIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M9 3V1h6v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="10" x2="15" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="14" x2="13" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function AlertTriangleIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.5" fill={color} stroke={color} strokeWidth="1"/>
    </svg>
  );
}

export function CalendarIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

export function CheckCircleIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <polyline points="8,12 11,15 16,9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function FlagIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function MessageIcon({ className = "", size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
