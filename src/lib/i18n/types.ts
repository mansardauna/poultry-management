'use strict';

/**
 * Supported language codes:
 * en: English (Global)
 * zh: Chinese (China - 中文)
 * id: Indonesian (Indonesia - Bahasa Indonesia)
 * hi: Hindi (India - हिन्दी)
 * sw: Swahili (East Africa - Kiswahili)
 */
export type Language = 'en' | 'zh' | 'id' | 'hi' | 'sw';

export interface TranslationDict {
  common: {
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    search: string;
    filter: string;
    active: string;
    inactive: string;
    printReport: string;
    saveChanges: string;
    actions: string;
    date: string;
    status: string;
    severity: string;
    description: string;
    amount: string;
    category: string;
    quantity: string;
    notes: string;
    allTime: string;
    weekly: string;
    monthly: string;
    yearly: string;
    timeRange: string;
    language: string;
    rowsPerPage: string;
    showing: string;
    to: string;
    of: string;
    results: string;
    page: string;
    confirm: string;
    close: string;
    view: string;
    loading: string;
    refresh: string;
    export: string;
    import: string;
    clear: string;
  };
  menu: Record<string, string>;
  dashboard: {
    title: string;
    subtitle: string;
    liveBirds: string;
    eggsCollected: string;
    totalRevenue: string;
    totalMortality: string;
    recentSales: string;
    lowStock: string;
    activeFlock: string;
    weeklyEggOutput: string;
    monthlyEggOutput: string;
    yearlyEggOutput: string;
    eggOutput: string;
    weeklyEggRevenue: string;
    monthlyEggRevenue: string;
    yearlyEggRevenue: string;
    eggRevenue: string;
    operationalProfit: string;
    flockMortalityRate: string;
    eggProductionVolumeChart: string;
    weeklyComparativeAnalytics: string;
    breakEvenAnalysis: string;
    alertLogsQueue: string;
    shiftChecklistQueue: string;
    managedBranchesFarms: string;
    salaryPayroll: string;
    processPayrollNow: string;
    pendingPayroll: string;
    staffDuePay: string;
    payrollUpToDate: string;
    allCaughtUpAlerts: string;
    noActiveTasks: string;
    costRecoveryProgress: string;
    incurredCost: string;
    projectedFlockValue: string;
    lastWeekYield: string;
    currentWeekYield: string;
    absoluteNetGrowth: string;
    totalExpenses: string;
    currentInventoryAudit: string;
    observed: string;
    eggsCollectedLegend: string;
    mortalityLossesLegend: string;
  };
  chickens: {
    title: string;
    subtitle: string;
    activeBatches: string;
    addBatch: string;
    breed: string;
    quantity: string;
    purchaseDate: string;
    ageWeeks: string;
    mortality: string;
    vaccination: string;
    section: string;
    type: string;
    unitPrice: string;
    projectedPrice: string;
  };
  eggs: {
    title: string;
    subtitle: string;
    goodEggs: string;
    crackedEggs: string;
    spoiltEggs: string;
    collectionHistory: string;
    logCollection: string;
    totalCollected: string;
    brokenEggs: string;
    collectionLogs: string;
    cushionAudits: string;
    maturationLogs: string;
    auditCushioning: string;
    logMaturation: string;
  };
  feed: {
    title: string;
    subtitle: string;
    totalStock: string;
    currentInventory: string;
    consumptionLogs: string;
    logUsage: string;
    receiveStock: string;
  };
  sales: {
    title: string;
    subtitle: string;
    totalRevenue: string;
    salesHistory: string;
    newSale: string;
  };
  finance: {
    title: string;
    subtitle: string;
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    expenseLedger: string;
    logExpense: string;
  };
  staff: {
    title: string;
    subtitle: string;
    totalStaff: string;
    staffRoster: string;
    addStaff: string;
  };
  health: {
    title: string;
    subtitle: string;
    schedule: string;
    recordMeds: string;
  };
  housing: {
    title: string;
    subtitle: string;
    penFacilities: string;
    addPen: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    toolsEquipment: string;
    addItem: string;
  };
  contacts: {
    title: string;
    subtitle: string;
    directory: string;
    addContact: string;
  };
  cctv: {
    title: string;
    subtitle: string;
    alerts: string;
  };
  settings: {
    title: string;
    subtitle: string;
    save: string;
  };
}

export interface SupportedLanguageInfo {
  id: Language;
  name: string;
  nativeName: string;
  code: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguageInfo[] = [
  { id: 'en', name: 'English', nativeName: 'English', code: 'EN', region: 'Global' },
  { id: 'zh', name: 'Chinese', nativeName: '中文', code: 'ZH', region: 'China' },
  { id: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', code: 'ID', region: 'Indonesia' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', code: 'HI', region: 'India' },
  { id: 'sw', name: 'Swahili', nativeName: 'Kiswahili', code: 'SW', region: 'East Africa' }
];
