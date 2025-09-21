export interface FeatureItem {
  id: number;
  title: string;
  description: string;
}

export interface UsageGuide {
  intro: string;
  rationale: string;
  steps: string[];
}

export interface TradeFormCopy {
  sectionTitle: string;
  leverageLabel: string;
  leverageHelper: string;
  sizeLabel: string;
  sizeHelper: string;
  tpLabel: string;
  slLabel: string;
  exchangeSelector: string;
  testnetToggle: string;
  autoTradeToggle: string;
  submitLabel: string;
}

export interface AdminCopy {
  requestTitle: string;
  requestDescription: string;
  uidLabel: string;
  exchangeLabel: string;
  note: string;
  submit: string;
  pendingNotice: string;
}

export interface BannerCopy {
  title: string;
  subtitle: string;
  cta: string;
}

export interface RealtimeAvailabilityCopy {
  coverageTitle: string;
  availableLabel: string;
  unavailableLabel: string;
  unknownLabel: string;
  updatedLabel: string;
}

export interface ApiKeysFormCopy {
  keyIdLabel: string;
  secretLabel: string;
  passphraseLabel: string;
  networkLabel: string;
  mainnetOption: string;
  testnetOption: string;
  manageLabel: string;
  verifyLabel: string;
  verifyingLabel: string;
  statusConnected: string;
  statusDisconnected: string;
  lastCheckedLabel: string;
  balancesTitle: string;
  futuresLabel: string;
  spotLabel: string;
  marginLabel: string;
  emptyBalances: string;
  connectionError: string;
  totalLabel: string;
  availableLabel: string;
}

export interface LandingCopy {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  banner: BannerCopy;
  featuresTitle: string;
  features: FeatureItem[];
  usageGuideTitle: string;
  usageGuide: UsageGuide;
  tradeForm: TradeFormCopy;
  admin: AdminCopy;
  realtimeTitle: string;
  realtimeStatusIdle: string;
  realtimeStatusConnected: string;
  apiKeysTitle: string;
  apiKeysHelper: string;
  realtimeAvailability?: RealtimeAvailabilityCopy;
  apiKeysForm?: ApiKeysFormCopy;
}
