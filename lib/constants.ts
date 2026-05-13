import { 
  Activity, Users, Settings, Files, FlaskConical, 
  LayoutDashboard, UserCheck, Package, DownloadCloud, TestTube, Thermometer, LineChart, ShieldAlert
} from "lucide-react";

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur', 
  TECHNICIEN: 'Technicien',
  RECEPTIONNISTE: 'Réceptionniste', 
  MEDECIN: 'Médecin',
};

export const GENDER_LABELS: Record<string, string> = {
  M: 'Homme',
  F: 'Femme'
};

export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const STATUS_LABELS: Record<string, string> = {
  [ANALYSIS_STATUS.PENDING]: 'En attente',
  [ANALYSIS_STATUS.COMPLETED]: 'Terminé',
  [ANALYSIS_STATUS.CANCELLED]: 'Annulé'
};

export const STATUS_COLORS: Record<string, string> = {
  [ANALYSIS_STATUS.PENDING]: 'bg-orange-100 text-orange-700',
  [ANALYSIS_STATUS.COMPLETED]: 'bg-emerald-100 text-emerald-700',
  [ANALYSIS_STATUS.CANCELLED]: 'bg-red-100 text-red-700',
};

export const RESULT_TYPES = {
  NUMERIC: 'numeric',
  TEXT: 'text',
  LONG_TEXT: 'long_text',
  DROPDOWN: 'dropdown'
} as const;

export const RESULT_TYPE_LABELS: Record<string, string> = {
  [RESULT_TYPES.NUMERIC]: 'Numérique',
  [RESULT_TYPES.TEXT]: 'Texte court',
  [RESULT_TYPES.LONG_TEXT]: 'Texte long',
  [RESULT_TYPES.DROPDOWN]: 'Liste déroulante'
};

export const NAVIGATION_GROUPS = [
  {
    title: "Activité Principale",
    links: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Analyses', href: '/analyses', icon: TestTube },
      { name: 'Patients', href: '/dashboard/patients', icon: Users },
      { name: 'Documents', href: '/dashboard/documents', icon: Files },
    ]
  },
  {
    title: "Gestion Laboratoire",
    links: [
      { name: 'Contrôle Qualité', href: '/dashboard/qc', icon: Activity },
      { name: 'Événements Qualité', href: '/dashboard/quality', icon: ShieldAlert },
      { name: 'Températures', href: '/dashboard/temperature', icon: Thermometer },
      { name: 'Inventaire', href: '/dashboard/inventory', icon: Package },
      { name: 'Statistiques', href: '/dashboard/statistics', icon: LineChart },
      { name: 'Exports Excel', href: '/dashboard/exports', icon: DownloadCloud },
    ]
  },
  {
    title: "Administration",
    links: [
      { name: 'Configuration', href: '/tests', icon: FlaskConical },
      { name: 'Utilisateurs', href: '/dashboard/users', icon: UserCheck },
      { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
    ]
  },
  {
    title: "Assistance",
    links: [
      { name: 'Support & Aide', href: '/dashboard/support', icon: Activity },
    ]
  }
];
