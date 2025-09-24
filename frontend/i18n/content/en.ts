import { LandingCopy } from "./types";

export const enCopy: LandingCopy = {
  heroTitle: "Catch Korean listings. Enter global futures in seconds.",
  heroSubtitle:
    "Coin-Sangjang listens to Upbit and Bithumb announcements in real time and triggers automated entries on Binance, Bybit, OKX, Gate.io, and Bitget.",
  ctaLabel: "Start in Testnet Mode",
  banner: {
    title: "Promotion Banner",
    subtitle: "Reserve this zone for partner advertisements or product updates.",
    cta: "Manage Banners",
  },
  featuresTitle: "Platform Highlights",
  features: [
    {
      id: 1,
      title: "Real-time listing ingest",
      description:
        "Persistent WebSocket collectors for Upbit and Bithumb normalize listing alerts and push them to the trading pipeline instantly.",
    },
    {
      id: 2,
      title: "Global futures coverage",
      description:
        "Auto-discover symbols on Binance, Bybit, OKX, Gate.io, and Bitget, then place entries the moment Korean listings go live.",
    },
    {
      id: 3,
      title: "Exchange API management",
      description:
        "Store mainnet and testnet API keys securely, switch modes per exchange, and enforce per-account risk limits.",
    },
    {
      id: 4,
      title: "USDT-based sizing & leverage",
      description:
        "Configure USDT allocation, leverage, and automatic TP/SL ratios directly from the dashboard UI.",
    },
    {
      id: 5,
      title: "Admin approval workflow",
      description:
        "Users register with exchange UIDs, request admin approval, and unlock trading only after explicit confirmation.",
    },
    {
      id: 6,
      title: "Five-language experience",
      description:
        "Serve localized landing pages, guides, and dashboards for 5 locales with separate content files per language.",
    },
  ],
  usageGuideTitle: "Usage Guide & Intro",
  usageGuide: {
    intro:
      "Korean exchange listings often lead to rapid price movements on global derivatives markets within minutes.",
    rationale:
      "Coin-Sangjang automates monitoring and entry so you can react faster while still enforcing risk rules.",
    steps: [
      "Create an account and submit your exchange UID for admin approval.",
      "Connect API keys for supported exchanges (testnet first) and choose default leverage.",
      "Set target take-profit and stop-loss percentages, plus USDT allocation per signal.",
      "Enable auto-trading. When a listing alert arrives, the orchestrator validates symbol availability and opens the configured position.",
    ],
  },
  tradeForm: {
    sectionTitle: "Trading Preferences",
    leverageLabel: "Leverage",
    leverageHelper: "Applies per exchange. Respect exchange-specific caps.",
    sizeLabel: "USDT Per Trade",
    sizeHelper: "Amount committed when a new listing signal fires.",
    tpLabel: "Take-Profit %",
    slLabel: "Stop-Loss %",
    exchangeSelector: "Target Exchanges",
    testnetToggle: "Use Testnet",
    autoTradeToggle: "Auto-enter on listing",
    submitLabel: "Save Preferences",
    savedMessage: "Preferences saved successfully.",
    errorMessage: "Could not save preferences. Please try again.",
  },
  admin: {
    requestTitle: "Request Admin Approval",
    requestDescription:
      "Provide your UID and exchange selection so the administrator can whitelist you before live trading.",
    uidLabel: "Your UID",
    exchangeLabel: "Exchange",
    note: "Only approved users can access the dashboard and auto-trading features.",
    submit: "Submit Request",
    pendingNotice: "Waiting for admin confirmation...",
    successNotice: "Your request has been submitted.",
    errorNotice: "Failed to submit request. Please retry.",
  },
  realtimeTitle: "Realtime Listing Feed",
  realtimeStatusIdle: "Waiting for connection...",
  realtimeStatusConnected: "Streaming announcements",
  apiKeysTitle: "API Key Management",
  apiKeysHelper:
    "Store encrypted API keys for both mainnet and testnet. Keys live in Secret Manager; rotate them regularly.",
  realtimeAvailability: {
    coverageTitle: "Global derivatives coverage",
    availableLabel: "Listed",
    unavailableLabel: "Not listed",
    unknownLabel: "Awaiting exchange diagnostics",
    updatedLabel: "Checked",
  },
  apiKeysForm: {
    keyIdLabel: "API Key ID",
    secretLabel: "API Secret",
    passphraseLabel: "Passphrase (if required)",
    networkLabel: "Network",
    mainnetOption: "Mainnet",
    testnetOption: "Testnet",
    manageLabel: "Reset Form",
    verifyLabel: "Verify & Fetch Balances",
    verifyingLabel: "Verifying…",
    statusConnected: "Connected",
    statusDisconnected: "Not connected",
    lastCheckedLabel: "Last checked",
    balancesTitle: "Balances by account type",
    futuresLabel: "Futures",
    spotLabel: "Spot",
    marginLabel: "Margin",
    emptyBalances: "No balances returned by the exchange.",
    connectionError: "Failed to verify the provided credentials.",
    totalLabel: "Total",
    availableLabel: "Available",
  },
  collectors: {
    title: "Listing collectors",
    description:
      "Monitor Korean exchange announcement feeds and make sure the orchestrator receives every listing signal.",
    upbitLabel: "Upbit notices",
    bithumbLabel: "Bithumb notices",
    orchestratorLabel: "Trade orchestrator",
    lastSeenLabel: "Last seen",
    noSignalsLabel: "No recent announcements",
    idleLabel: "Idle",
    activeLabel: "Receiving",
    recentSymbolsLabel: "Latest detected symbols",
  },
  executionPreview: {
    title: "Exchange readiness checker",
    description:
      "Check whether supported exchanges expose the requested symbol on spot or futures before the automation enters trades.",
    placeholder: "e.g. APT or APTUSDT",
    buttonLabel: "Check availability",
    testnetLabel: "Testnet",
    mainnetLabel: "Mainnet",
    modeToggle: "Prefer testnet",
    loadingLabel: "Querying exchanges…",
    readyLabel: "Ready",
    notReadyLabel: "Unavailable",
    errorLabel: "Failed to load diagnostics.",
    updatedLabel: "Checked",
    suggestionsLabel: "Recently detected symbols",
  },
};
