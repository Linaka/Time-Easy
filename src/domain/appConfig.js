export const STORAGE_PREFIX = "timetrackr.v12";
export const ACTIVITY_LIMIT = 80;
export const DEFAULT_CURRENCY = "GBP";
export const DEFAULT_TEAM_CAPACITY_HOURS = 37.5;
export const OVERVIEW_SECTION = "Overview";
export const WORKSPACE_THEME_IDS = {
  STUDIO: "studio",
  SOFT_STUDIO: "soft-studio",
  KAWAII_POP: "kawaii-pop"
};

export const WORKSPACE_THEMES = [
  {
    id: WORKSPACE_THEME_IDS.STUDIO,
    label: "Studio",
    description: "Crisp monochrome, high contrast."
  },
  {
    id: WORKSPACE_THEME_IDS.SOFT_STUDIO,
    label: "Soft Studio",
    description: "Warm neutrals with teal and sage accents."
  },
  {
    id: WORKSPACE_THEME_IDS.KAWAII_POP,
    label: "Kawaii Pop",
    description: "Bright candy energy with clear status colours."
  }
];

export const WORKSPACE_FEATURE_FLAGS = [
  {
    id: "expenses",
    section: "Expenses",
    label: "Expenses",
    description: "Expense claims and reimbursement workflows."
  },
  {
    id: "timeOff",
    section: "Time Off",
    label: "Time Off",
    description: "Leave requests, balances, and time away approvals."
  },
  {
    id: "kiosks",
    section: "Kiosks",
    label: "Kiosks",
    description: "Shared-device clock in and clock out."
  }
];

export const DEFAULT_WORKSPACE_FEATURES = Object.freeze(
  Object.fromEntries(WORKSPACE_FEATURE_FLAGS.map((feature) => [feature.id, true]))
);

export const DEFAULT_REPORT_FILTERS = {
  projectId: "All",
  client: "All",
  projectTag: "All",
  memberId: "All",
  approvalStatus: "All",
  billable: "All",
  dateFrom: "",
  dateTo: ""
};

export const DEFAULT_WORKSPACE_SETTINGS = {
  requireApprovals: true,
  defaultBillable: false,
  compactTables: false,
  defaultCurrency: DEFAULT_CURRENCY,
  features: { ...DEFAULT_WORKSPACE_FEATURES },
  themeId: WORKSPACE_THEME_IDS.STUDIO,
  onboardingStatus: "pending"
};

export function normalizeWorkspaceFeatures(features) {
  return {
    ...DEFAULT_WORKSPACE_FEATURES,
    ...(features && typeof features === "object" && !Array.isArray(features) ? features : {})
  };
}

export function normalizeWorkspaceSettings(settings) {
  const nextSettings = {
    ...DEFAULT_WORKSPACE_SETTINGS,
    ...(settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {})
  };

  return {
    ...nextSettings,
    features: normalizeWorkspaceFeatures(nextSettings.features)
  };
}

export function workspaceFeatureForSection(section) {
  return WORKSPACE_FEATURE_FLAGS.find((feature) => feature.section === section) || null;
}

export function isWorkspaceFeatureEnabled(settings, featureId) {
  return normalizeWorkspaceFeatures(settings?.features)[featureId] !== false;
}

export const DEFAULT_EMPLOYMENT_GRADES = [
  {
    id: "grade-1",
    label: "Grade 1",
    title: "Associate",
    hourlyRate: 55,
    description: "Entry-level delivery work with close review."
  },
  {
    id: "grade-2",
    label: "Grade 2",
    title: "Specialist",
    hourlyRate: 85,
    description: "Independent contributor on scoped client work."
  },
  {
    id: "grade-3",
    label: "Grade 3",
    title: "Senior",
    hourlyRate: 120,
    description: "Senior ownership of complex project outcomes."
  },
  {
    id: "grade-4",
    label: "Grade 4",
    title: "Lead",
    hourlyRate: 160,
    description: "Lead, strategy, and high-accountability work."
  }
];

export const PROJECT_COLORS = {
  blue: {
    label: "Blue",
    dot: "bg-sky-500",
    text: "text-sky-700",
    soft: "bg-sky-50",
    border: "border-sky-200"
  },
  purple: {
    label: "Purple",
    dot: "bg-violet-600",
    text: "text-violet-700",
    soft: "bg-violet-50",
    border: "border-violet-200"
  },
  orange: {
    label: "Orange",
    dot: "bg-orange-500",
    text: "text-orange-700",
    soft: "bg-orange-50",
    border: "border-orange-200"
  },
  green: {
    label: "Green",
    dot: "bg-emerald-600",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    border: "border-emerald-200"
  },
  rose: {
    label: "Rose",
    dot: "bg-rose-600",
    text: "text-rose-700",
    soft: "bg-rose-50",
    border: "border-rose-200"
  },
  slate: {
    label: "Grey",
    dot: "bg-slate-500",
    text: "text-slate-700",
    soft: "bg-slate-50",
    border: "border-slate-200"
  }
};
