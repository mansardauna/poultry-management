'use strict';
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

/**
 * Supported language codes.
 */
export type Language = 'en' | 'es' | 'ar' | 'de' | 'fr' | 'zh';

/**
 * Dictionary mapping for translations.
 */
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
  cctv: {
    title: string;
    subtitle: string;
    alerts: string;
  };
}

const translations: Record<Language, TranslationDict> = {
  en: {
    common: {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      filter: "Filter",
      active: "Active",
      printReport: "Print Report",
      saveChanges: "Save Changes",
      actions: "Actions",
      date: "Date",
      status: "Status",
      severity: "Severity",
      description: "Description",
      amount: "Amount",
      category: "Category",
      quantity: "Quantity",
      notes: "Notes",
      allTime: "All Time",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
      timeRange: "Time Range",
      language: "Language"
    },
    menu: {
      "Dashboard": "Dashboard",
      "Batches": "Flock Batches",
      "Housing": "Housing Setup",
      "Eggs": "Egg Collection",
      "Feed": "Feed Inventory",
      "Health": "Health & Meds",
      "Inventory": "Inventory & Tools",
      "Contacts": "Contacts List",
      "Finance": "Finance & Analytics",
      "Sales & Invoices": "Sales & Invoices",
      "Staff Management": "Staff & Tasks",
      "CCTV Monitoring": "CCTV Surveillance",
      "Settings": "System Settings",
      "Logout": "Log Out"
    },
    dashboard: {
      title: "Farm Overview",
      subtitle: "Here is what is happening on your farm today.",
      liveBirds: "Total Live Birds",
      eggsCollected: "Eggs Collected Today",
      totalRevenue: "Total Revenue",
      totalMortality: "Total Mortality",
      recentSales: "Recent Sales",
      lowStock: "Low Stock Alerts",
      activeFlock: "Total Active Flock",
      weeklyEggOutput: "Weekly Egg Output",
      monthlyEggOutput: "Monthly Egg Output",
      yearlyEggOutput: "Yearly Egg Output",
      eggOutput: "Egg Output",
      weeklyEggRevenue: "Weekly Egg Revenue",
      monthlyEggRevenue: "Monthly Egg Revenue",
      yearlyEggRevenue: "Yearly Egg Revenue",
      eggRevenue: "Egg Revenue",
      operationalProfit: "Operational Profit",
      flockMortalityRate: "flock mortality rate",
      eggProductionVolumeChart: "Egg Production Volume (Current Cycle)",
      weeklyComparativeAnalytics: "Weekly Comparative Analytics",
      breakEvenAnalysis: "Break-Even Analysis",
      alertLogsQueue: "System Alert Logs (Roster)",
      shiftChecklistQueue: "Shift Task Checklist Queue",
      managedBranchesFarms: "Managed Branches & Farms",
      salaryPayroll: "Salary & Payroll",
      processPayrollNow: "Process Payroll Now",
      pendingPayroll: "Pending Payroll Due",
      staffDuePay: "Staff Due for Pay",
      payrollUpToDate: "All staff payments are up to date.",
      allCaughtUpAlerts: "All caught up! No unread alerts.",
      noActiveTasks: "No active shift tasks left! Roster is cleared.",
      costRecoveryProgress: "Cost Recovery Progress",
      incurredCost: "Incurred Cost",
      projectedFlockValue: "Projected Flock Value",
      lastWeekYield: "Last Week Yield",
      currentWeekYield: "Current Week Yield",
      absoluteNetGrowth: "Absolute Net Growth",
      totalExpenses: "Total Expenses",
      currentInventoryAudit: "Current Inventory Audit",
      observed: "Observed",
      eggsCollectedLegend: "Eggs Collected",
      mortalityLossesLegend: "Mortality Losses"
    },
    chickens: {
      title: "Flock Inventory",
      subtitle: "Manage your flocks, track mortality, and monitor health.",
      activeBatches: "Active Batches",
      addBatch: "Add Batch",
      breed: "Breed",
      quantity: "Quantity",
      purchaseDate: "Purchase Date",
      ageWeeks: "Age (Weeks)",
      mortality: "Mortality",
      vaccination: "Vaccination",
      section: "Farm Pen Section",
      type: "Type",
      unitPrice: "Unit Purchase Price",
      projectedPrice: "Projected Selling Price"
    },
    eggs: {
      title: "Egg Management",
      subtitle: "Log daily egg production and monitor quality.",
      goodEggs: "Total Good Eggs",
      crackedEggs: "Total Cracked Eggs",
      spoiltEggs: "Total Spoilt Eggs",
      collectionHistory: "Collection History",
      logCollection: "Log Collection",
      totalCollected: "Total Collected",
      brokenEggs: "Total Broken Eggs",
      collectionLogs: "Collection Logs",
      cushionAudits: "Nesting Box Cushion Audits",
      maturationLogs: "Newly Laying Birds Maturation Logs",
      auditCushioning: "Audit Cushioning",
      logMaturation: "Log Maturation"
    },
    feed: {
      title: "Feed Inventory",
      subtitle: "Manage feed stock, suppliers, and daily consumption.",
      totalStock: "Total Feed Stock",
      currentInventory: "Current Inventory",
      consumptionLogs: "Recent Consumption Logs",
      logUsage: "Log Usage",
      receiveStock: "Receive Stock"
    },
    sales: {
      title: "Sales & Invoices",
      subtitle: "Track all farm sales and generate invoices.",
      totalRevenue: "Total Revenue",
      salesHistory: "Sales History",
      newSale: "New Sale"
    },
    finance: {
      title: "Finance & Analytics",
      subtitle: "Monitor revenue, expenses, and profitability.",
      totalRevenue: "Total Revenue",
      totalExpenses: "Total Expenses",
      netProfit: "Net Profit",
      expenseLedger: "Expense Ledger",
      logExpense: "Log Expense"
    },
    staff: {
      title: "Staff Management",
      subtitle: "Manage farm personnel, attendance, and roles.",
      totalStaff: "Total Staff",
      staffRoster: "Staff Roster",
      addStaff: "Add Staff"
    },
    cctv: {
      title: "CCTV Surveillance",
      subtitle: "Live monitoring of your farm sections.",
      alerts: "Recent Alerts"
    }
  },
  es: {
    common: {
      add: "Añadir",
      edit: "Editar",
      delete: "Eliminar",
      save: "Guardar",
      cancel: "Cancelar",
      search: "Buscar",
      filter: "Filtrar",
      active: "Activo",
      printReport: "Imprimir Informe",
      saveChanges: "Guardar Cambios",
      actions: "Acciones",
      date: "Fecha",
      status: "Estado",
      severity: "Gravedad",
      description: "Descripción",
      amount: "Monto",
      category: "Categoría",
      quantity: "Cantidad",
      notes: "Notas",
      allTime: "Todo el tiempo",
      weekly: "Semanal",
      monthly: "Mensual",
      yearly: "Anual",
      timeRange: "Intervalo",
      language: "Idioma"
    },
    menu: {
      "Dashboard": "Panel de Control",
      "Batches": "Lotes de Aves",
      "Housing": "Galpones y Alojamiento",
      "Eggs": "Producción de Huevos",
      "Feed": "Inventario de Alimento",
      "Health": "Salud y Medicinas",
      "Inventory": "Inventario y Herramientas",
      "Contacts": "Lista de Contactos",
      "Finance": "Finanzas y Análisis",
      "Sales & Invoices": "Ventas y Facturas",
      "Staff Management": "Personal y Tareas",
      "CCTV Monitoring": "Videovigilancia",
      "Settings": "Configuraciones",
      "Logout": "Cerrar Sesión"
    },
    dashboard: {
      title: "Resumen de la Granja",
      subtitle: "Esto es lo que está sucediendo hoy en su granja.",
      liveBirds: "Aves Vivas Totales",
      eggsCollected: "Huevos Recolectados Hoy",
      totalRevenue: "Ingresos Totales",
      totalMortality: "Mortalidad Total",
      recentSales: "Ventas Recientes",
      lowStock: "Alertas de Stock Bajo",
      activeFlock: "Aves Activas Totales",
      weeklyEggOutput: "Producción Semanal",
      monthlyEggOutput: "Producción Mensual",
      yearlyEggOutput: "Producción Anual",
      eggOutput: "Producción de Huevos",
      weeklyEggRevenue: "Ingresos Semanales",
      monthlyEggRevenue: "Ingresos Mensuales",
      yearlyEggRevenue: "Ingresos Anuales",
      eggRevenue: "Ingresos por Huevos",
      operationalProfit: "Ganancia Operativa",
      flockMortalityRate: "tasa de mortalidad esta semana",
      eggProductionVolumeChart: "Volumen de Producción (Ciclo Actual)",
      weeklyComparativeAnalytics: "Análisis Comparativo Semanal",
      breakEvenAnalysis: "Análisis de Punto de Equilibrio",
      alertLogsQueue: "Registro de Alertas del Sistema",
      shiftChecklistQueue: "Tareas Pendientes del Turno",
      managedBranchesFarms: "Sedes y Granjas Gestionadas",
      salaryPayroll: "Salarios y Nómina",
      processPayrollNow: "Procesar Nómina Ahora",
      pendingPayroll: "Nómina Pendiente",
      staffDuePay: "Personal Pendiente de Pago",
      payrollUpToDate: "Todos los pagos al personal están al día.",
      allCaughtUpAlerts: "¡Todo al día! No hay alertas pendientes.",
      noActiveTasks: "¡No quedan tareas de turno activas! Limpio.",
      costRecoveryProgress: "Progreso de Recuperación de Costos",
      incurredCost: "Costo Incurrido",
      projectedFlockValue: "Valor Proyectado del Lote",
      lastWeekYield: "Rendimiento Semana Anterior",
      currentWeekYield: "Rendimiento Semana Actual",
      absoluteNetGrowth: "Crecimiento Neto Absoluto",
      totalExpenses: "Gastos Totales",
      currentInventoryAudit: "Auditoría de Inventario Actual",
      observed: "Observado",
      eggsCollectedLegend: "Huevos Recogidos",
      mortalityLossesLegend: "Bajas por Mortalidad"
    },
    chickens: {
      title: "Inventario de Aves",
      subtitle: "Gestione sus lotes, controle la mortalidad y supervise la salud.",
      activeBatches: "Lotes Activos",
      addBatch: "Añadir Lote",
      breed: "Raza",
      quantity: "Cantidad",
      purchaseDate: "Fecha de Compra",
      ageWeeks: "Edad (Semanas)",
      mortality: "Mortalidad",
      vaccination: "Vacunación",
      section: "Sección del Galpón",
      type: "Tipo",
      unitPrice: "Precio Unitario de Compra",
      projectedPrice: "Precio Proyectado de Venta"
    },
    eggs: {
      title: "Gestión de Huevos",
      subtitle: "Registre la recolección diaria de huevos y controle la calidad.",
      goodEggs: "Huevos Buenos",
      crackedEggs: "Huevos Rotos",
      spoiltEggs: "Huevos Dañados",
      collectionHistory: "Historial de Recolección",
      logCollection: "Registrar Colecta",
      totalCollected: "Total Recolectado",
      brokenEggs: "Total Huevos Rotos",
      collectionLogs: "Registros de Colecta",
      cushionAudits: "Auditorías de Nidos",
      maturationLogs: "Maduración de Aves Jóvenes",
      auditCushioning: "Auditar Acolchado",
      logMaturation: "Registrar Maduración"
    },
    feed: {
      title: "Inventario de Alimentos",
      subtitle: "Gestione el stock de alimentos, proveedores y consumo diario.",
      totalStock: "Stock Total de Alimento",
      currentInventory: "Inventario Actual",
      consumptionLogs: "Registros de Consumo Reciente",
      logUsage: "Registrar Consumo",
      receiveStock: "Recibir Suministro"
    },
    sales: {
      title: "Ventas y Facturas",
      subtitle: "Haga un seguimiento de las ventas y genere facturas.",
      totalRevenue: "Ingresos Totales",
      salesHistory: "Historial de Ventas",
      newSale: "Nueva Venta"
    },
    finance: {
      title: "Finanzas y Análisis",
      subtitle: "Supervise ingresos, gastos y rentabilidad.",
      totalRevenue: "Ingresos Totales",
      totalExpenses: "Gastos Totales",
      netProfit: "Ganancia Neta",
      expenseLedger: "Libro de Gastos",
      logExpense: "Registrar Gasto"
    },
    staff: {
      title: "Gestión de Personal",
      subtitle: "Gestione empleados, asistencia y roles.",
      totalStaff: "Personal Total",
      staffRoster: "Lista de Personal",
      addStaff: "Añadir Personal"
    },
    cctv: {
      title: "Vigilancia por CCTV",
      subtitle: "Monitoreo en vivo de las secciones de su granja.",
      alerts: "Alertas Recientes"
    }
  },
  ar: {
    common: {
      add: "إضافة",
      edit: "تعديل",
      delete: "حذف",
      save: "حفظ",
      cancel: "إلغاء",
      search: "بحث",
      filter: "تصفية",
      active: "نشط",
      printReport: "طباعة التقرير",
      saveChanges: "حفظ التغييرات",
      actions: "إجراءات",
      date: "التاريخ",
      status: "الحالة",
      severity: "الخطورة",
      description: "الوصف",
      amount: "المبلغ",
      category: "الفئة",
      quantity: "الكمية",
      notes: "ملاحظات",
      allTime: "كل الوقت",
      weekly: "أسبوعي",
      monthly: "شهري",
      yearly: "سنوي",
      timeRange: "النطاق الزمني",
      language: "اللغة"
    },
    menu: {
      "Dashboard": "لوحة التحكم",
      "Batches": "دفعات الطيور",
      "Housing": "عنابر الدواجن",
      "Eggs": "إنتاج البيض",
      "Feed": "مخزون الأعلاف",
      "Health": "الصحة والأدوية",
      "Inventory": "المخازن والأدوات",
      "Contacts": "قائمة الاتصال",
      "Finance": "المالية والتحليلات",
      "Sales & Invoices": "المبيعات والفواتير",
      "Staff Management": "الموظفين والمهام",
      "CCTV Monitoring": "المراقبة بالكاميرات",
      "Settings": "إعدادات النظام",
      "Logout": "تسجيل الخروج"
    },
    dashboard: {
      title: "نظرة عامة على المزرعة",
      subtitle: "إليك ما يحدث في مزرعتك اليوم.",
      liveBirds: "إجمالي الطيور الحية",
      eggsCollected: "البيض المجمع اليوم",
      totalRevenue: "إجمالي الإيرادات",
      totalMortality: "إجمالي النفوق",
      recentSales: "المبيعات الأخيرة",
      lowStock: "تنبيهات انخفاض المخزون",
      activeFlock: "إجمالي القطيع النشط",
      weeklyEggOutput: "إنتاج البيض الأسبوعي",
      monthlyEggOutput: "إنتاج البيض الشهري",
      yearlyEggOutput: "إنتاج البيض السنوي",
      eggOutput: "إنتاج البيض",
      weeklyEggRevenue: "إيرادات البيض الأسبوعية",
      monthlyEggRevenue: "إيرادات البيض الشهرية",
      yearlyEggRevenue: "إيرادات البيض السنوية",
      eggRevenue: "إيرادات البيض",
      operationalProfit: "الأرباح التشغيلية",
      flockMortalityRate: "معدل النفوق هذا الأسبوع",
      eggProductionVolumeChart: "حجم إنتاج البيض (الدورة الحالية)",
      weeklyComparativeAnalytics: "التحليلات المقارنة الأسبوعية",
      breakEvenAnalysis: "تحليل نقطة التعادل",
      alertLogsQueue: "سجل تنبيهات النظام",
      shiftChecklistQueue: "قائمة مهام الوردية",
      managedBranchesFarms: "الفروع والمزارع المدارة",
      salaryPayroll: "الرواتب والأجور",
      processPayrollNow: "معالجة الرواتب الآن",
      pendingPayroll: "الرواتب المعلقة المستحقة",
      staffDuePay: "الموظفين المستحقين للدفع",
      payrollUpToDate: "جميع رواتب الموظفين محدثة.",
      allCaughtUpAlerts: "كل شيء على ما يرام! لا توجد تنبيهات غير مقروءة.",
      noActiveTasks: "لا توجد مهام وردية نشطة متبقية!",
      costRecoveryProgress: "تقدم استرداد التكاليف",
      incurredCost: "التكاليف المتكبدة",
      projectedFlockValue: "القيمة المتوقعة للقطيع",
      lastWeekYield: "إنتاج الأسبوع الماضي",
      currentWeekYield: "إنتاج الأسبوع الحالي",
      absoluteNetGrowth: "النمو الصافي المطلق",
      totalExpenses: "إجمالي المصروفات",
      currentInventoryAudit: "مراجعة المخزون الحالي",
      observed: "الملاحظ",
      eggsCollectedLegend: "البيض المجمع",
      mortalityLossesLegend: "خسائر النفوق"
    },
    chickens: {
      title: "مخزون الطيور",
      subtitle: "إدارة القطعان، وتتبع النفوق، ومراقبة الحالة الصحية.",
      activeBatches: "الدفعات النشطة",
      addBatch: "إضافة دفعة",
      breed: "السلالة",
      quantity: "الكمية",
      purchaseDate: "تاريخ الشراء",
      ageWeeks: "العمر (بالأسابيع)",
      mortality: "النفوق",
      vaccination: "التحصين",
      section: "قسم العنبر",
      type: "النوع",
      unitPrice: "سعر شراء الوحدة",
      projectedPrice: "سعر البيع المتوقع"
    },
    eggs: {
      title: "إدارة البيض",
      subtitle: "تسجيل إنتاج البيض اليومي ومراقبة الجودة.",
      goodEggs: "البيض السليم",
      crackedEggs: "البيض المشروخ",
      spoiltEggs: "البيض التالف",
      collectionHistory: "سجل التجميع",
      logCollection: "تسجيل التجميع",
      totalCollected: "إجمالي المجمع",
      brokenEggs: "إجمالي البيض المكسور",
      collectionLogs: "سجلات التجميع",
      cushionAudits: "تدقيق بطانة صناديق العش",
      maturationLogs: "سجلات نضوج الطيور البياضة الحديثة",
      auditCushioning: "تدقيق البطانة",
      logMaturation: "تسجيل النضوج"
    },
    feed: {
      title: "مخزون الأعلاف",
      subtitle: "إدارة مخزون الأعلاف، والموردين، والاستهلاك اليومي.",
      totalStock: "إجمالي مخزون العلف",
      currentInventory: "المخزون الحالي",
      consumptionLogs: "سجلات الاستهلاك الأخيرة",
      logUsage: "تسجيل الاستهلاك",
      receiveStock: "استلام المخزون"
    },
    sales: {
      title: "المبيعات والفواتير",
      subtitle: "تتبع جميع مبيعات المزرعة وإنشاء الفواتير.",
      totalRevenue: "إجمالي الإيرادات",
      salesHistory: "سجل المبيعات",
      newSale: "بيع جديد"
    },
    finance: {
      title: "المالية والتحليلات",
      subtitle: "مراقبة الإيرادات والمصروفات والربحية.",
      totalRevenue: "إجمالي الإيرادات",
      totalExpenses: "إجمالي المصروفات",
      netProfit: "صافي الأرباح",
      expenseLedger: "دفتر المصروفات",
      logExpense: "تسجيل مصروف"
    },
    staff: {
      title: "إدارة الموظفين",
      subtitle: "إدارة أفراد المزرعة والحضور والأدوار.",
      totalStaff: "إجمالي الموظفين",
      staffRoster: "جدول الموظفين",
      addStaff: "إضافة موظف"
    },
    cctv: {
      title: "المراقبة التلفزيونية",
      subtitle: "المراقبة الحية لأقسام مزرعتك.",
      alerts: "التنبيهات الأخيرة"
    }
  },
  de: {
    common: {
      add: "Hinzufügen",
      edit: "Bearbeiten",
      delete: "Löschen",
      save: "Speichern",
      cancel: "Abbrechen",
      search: "Suchen",
      filter: "Filtern",
      active: "Aktiv",
      printReport: "Bericht Drucken",
      saveChanges: "Änderungen Speichern",
      actions: "Aktionen",
      date: "Datum",
      status: "Status",
      severity: "Schweregrad",
      description: "Beschreibung",
      amount: "Betrag",
      category: "Kategorie",
      quantity: "Menge",
      notes: "Notizen",
      allTime: "Gesamte Zeit",
      weekly: "Wöchentlich",
      monthly: "Monatlich",
      yearly: "Jährlich",
      timeRange: "Zeitraum",
      language: "Sprache"
    },
    menu: {
      "Dashboard": "Dashboard",
      "Batches": "Geflügelgruppen",
      "Housing": "Stallungen",
      "Eggs": "Eierproduktion",
      "Feed": "Futtermittel",
      "Health": "Gesundheit & Medizin",
      "Inventory": "Inventar & Werkzeuge",
      "Contacts": "Kontaktliste",
      "Finance": "Finanzen & Analysen",
      "Sales & Invoices": "Verkäufe & Rechnungen",
      "Staff Management": "Personal & Aufgaben",
      "CCTV Monitoring": "Kameraüberwachung",
      "Settings": "Einstellungen",
      "Logout": "Abmelden"
    },
    dashboard: {
      title: "Betriebsübersicht",
      subtitle: "Das passiert heute auf Ihrem Hof.",
      liveBirds: "Lebende Vögel Gesamt",
      eggsCollected: "Heute gesammelte Eier",
      totalRevenue: "Gesamtumsatz",
      totalMortality: "Sterblichkeit Gesamt",
      recentSales: "Letzte Verkäufe",
      lowStock: "Warnung Niedriger Bestand",
      activeFlock: "Aktiver Bestand Gesamt",
      weeklyEggOutput: "Wöchentliche Eierproduktion",
      monthlyEggOutput: "Monatliche Eierproduktion",
      yearlyEggOutput: "Jährliche Eierproduktion",
      eggOutput: "Eierproduktion",
      weeklyEggRevenue: "Wöchentlicher Eierumsatz",
      monthlyEggRevenue: "Monatlicher Eierumsatz",
      yearlyEggRevenue: "Jährlicher Eierumsatz",
      eggRevenue: "Eierumsatz",
      operationalProfit: "Betriebsgewinn",
      flockMortalityRate: "Sterblichkeitsrate diese Woche",
      eggProductionVolumeChart: "Eierproduktionsvolumen (Aktueller Zyklus)",
      weeklyComparativeAnalytics: "Wöchentliche Vergleichsanalysen",
      breakEvenAnalysis: "Gewinnschwellen-Analyse",
      alertLogsQueue: "System-Warnungsprotokolle",
      shiftChecklistQueue: "Schicht-Checkliste",
      managedBranchesFarms: "Verwaltete Betriebe & Filialen",
      salaryPayroll: "Gehaltsabrechnung",
      processPayrollNow: "Gehälter jetzt abrechnen",
      pendingPayroll: "Ausstehende Gehaltszahlungen",
      staffDuePay: "Personal fällig zur Zahlung",
      payrollUpToDate: "Alle Personalzahlungen sind auf dem neuesten Stand.",
      allCaughtUpAlerts: "Alles erledigt! Keine ungelesenen Warnungen.",
      noActiveTasks: "Keine aktiven Schichtaufgaben übrig! Erledigt.",
      costRecoveryProgress: "Kostenrückzahlungsfortschritt",
      incurredCost: "Entstandene Kosten",
      projectedFlockValue: "Projizierter Bestandswert",
      lastWeekYield: "Ertrag letzte Woche",
      currentWeekYield: "Ertrag aktuelle Woche",
      absoluteNetGrowth: "Absolutes Nettowachstum",
      totalExpenses: "Gesamtausgaben",
      currentInventoryAudit: "Aktuelle Bestandsprüfung",
      observed: "Beobachtet",
      eggsCollectedLegend: "Gesammelte Eier",
      mortalityLossesLegend: "Verluste (Sterblichkeit)"
    },
    chickens: {
      title: "Bestandsinventar",
      subtitle: "Verwalten Sie Ihre Bestände, verfolgen Sie die Sterblichkeit und überwachen Sie die Gesundheit.",
      activeBatches: "Aktive Herden",
      addBatch: "Herde hinzufügen",
      breed: "Rasse",
      quantity: "Menge",
      purchaseDate: "Kaufdatum",
      ageWeeks: "Alter (Wochen)",
      mortality: "Verluste",
      vaccination: "Impfstatus",
      section: "Stallbereich",
      type: "Typ",
      unitPrice: "Kaufpreis pro Stück",
      projectedPrice: "Projizierter Verkaufspreis"
    },
    eggs: {
      title: "Eier-Management",
      subtitle: "Erfassen Sie die tägliche Eierproduktion und überwachen Sie die Qualität.",
      goodEggs: "Gute Eier",
      crackedEggs: "Rissige Eier",
      spoiltEggs: "Verdorbene Eier",
      collectionHistory: "Sammlungshistorie",
      logCollection: "Sammlung eintragen",
      totalCollected: "Gesammelt Gesamt",
      brokenEggs: "Gebrochene Eier Gesamt",
      collectionLogs: "Sammlungsprotokolle",
      cushionAudits: "Nistkasten-Polsterprüfung",
      maturationLogs: "Reifeprotokolle junger Hennen",
      auditCushioning: "Polsterung prüfen",
      logMaturation: "Reifung eintragen"
    },
    feed: {
      title: "Futtermittelbestand",
      subtitle: "Verwalten Sie Futtervorräte, Lieferanten und den täglichen Verbrauch.",
      totalStock: "Gesamter Futtervorrat",
      currentInventory: "Aktueller Bestand",
      consumptionLogs: "Letzte Verbrauchsprotokolle",
      logUsage: "Verbrauch erfassen",
      receiveStock: "Bestand einbuchen"
    },
    sales: {
      title: "Verkäufe & Rechnungen",
      subtitle: "Verfolgen Sie alle Verkäufe und erstellen Sie Rechnungen.",
      totalRevenue: "Gesamtumsatz",
      salesHistory: "Verkaufshistorie",
      newSale: "Neuer Verkauf"
    },
    finance: {
      title: "Finanzen & Analysen",
      subtitle: "Überwachen Sie Einnahmen, Ausgaben und Rentabilität.",
      totalRevenue: "Gesamtumsatz",
      totalExpenses: "Gesamtausgaben",
      netProfit: "Nettogewinn",
      expenseLedger: "Ausgabenbuch",
      logExpense: "Ausgabe erfassen"
    },
    staff: {
      title: "Personalverwaltung",
      subtitle: "Verwalten Sie Mitarbeiter, Anwesenheit und Rollen.",
      totalStaff: "Mitarbeiter Gesamt",
      staffRoster: "Dienstplan",
      addStaff: "Mitarbeiter hinzufügen"
    },
    cctv: {
      title: "CCTV Überwachung",
      subtitle: "Live-Überwachung Ihrer Stallbereiche.",
      alerts: "Letzte Warnungen"
    }
  },
  fr: {
    common: {
      add: "Ajouter",
      edit: "Modifier",
      delete: "Supprimer",
      save: "Enregistrer",
      cancel: "Annuler",
      search: "Rechercher",
      filter: "Filtrer",
      active: "Actif",
      printReport: "Imprimer le Rapport",
      saveChanges: "Enregistrer les Modifications",
      actions: "Actions",
      date: "Date",
      status: "Statut",
      severity: "Gravité",
      description: "Description",
      amount: "Montant",
      category: "Catégorie",
      quantity: "Quantité",
      notes: "Notes",
      allTime: "Tout le temps",
      weekly: "Hebdomadaire",
      monthly: "Mensuel",
      yearly: "Annuel",
      timeRange: "Période",
      language: "Langue"
    },
    menu: {
      "Dashboard": "Tableau de Bord",
      "Batches": "Lots de Volailles",
      "Housing": "Bâtiments & Cages",
      "Eggs": "Gestion des Œufs",
      "Feed": "Stock d'Aliments",
      "Health": "Santé & Médicaments",
      "Inventory": "Inventaire & Outils",
      "Contacts": "Liste de Contacts",
      "Finance": "Finances & Analyses",
      "Sales & Invoices": "Ventes & Factures",
      "Staff Management": "Personnel & Tâches",
      "CCTV Monitoring": "Surveillance Vidéo",
      "Settings": "Paramètres",
      "Logout": "Se Déconnecter"
    },
    dashboard: {
      title: "Vue d'ensemble de la Ferme",
      subtitle: "Voici ce qui se passe sur votre ferme aujourd'hui.",
      liveBirds: "Total Volailles Vivantes",
      eggsCollected: "Œufs Collectés Aujourd'hui",
      totalRevenue: "Revenu Total",
      totalMortality: "Mortalité Totale",
      recentSales: "Ventes Récentes",
      lowStock: "Alertes Stock Bas",
      activeFlock: "Total Volailles Actives",
      weeklyEggOutput: "Production Hebdomadaire",
      monthlyEggOutput: "Production Mensuelle",
      yearlyEggOutput: "Production Annuelle",
      eggOutput: "Production d'Œufs",
      weeklyEggRevenue: "Revenus Œufs Hebdomadaires",
      monthlyEggRevenue: "Revenus Œufs Mensuels",
      yearlyEggRevenue: "Revenus Œufs Annuels",
      eggRevenue: "Revenu des Œufs",
      operationalProfit: "Bénéfice Opérationnel",
      flockMortalityRate: "taux de mortalité cette semaine",
      eggProductionVolumeChart: "Volume de Production d'Œufs (Cycle Actuel)",
      weeklyComparativeAnalytics: "Analyses Comparatives Hebdomadaires",
      breakEvenAnalysis: "Analyse du Seuil de Rentabilité",
      alertLogsQueue: "Journal des Alertes Système",
      shiftChecklistQueue: "Liste de Tâches de l'Équipe",
      managedBranchesFarms: "Succursales & Fermes Gérées",
      salaryPayroll: "Salaires & Paie",
      processPayrollNow: "Traiter la Paie Maintenant",
      pendingPayroll: "Paie en Attente",
      staffDuePay: "Personnel en Attente de Paiement",
      payrollUpToDate: "Tous les paiements du personnel sont à jour.",
      allCaughtUpAlerts: "Tout est à jour ! Aucune alerte non lue.",
      noActiveTasks: "Aucune tâche active restante ! Liste vide.",
      costRecoveryProgress: "Progression de la Récupération des Coûts",
      incurredCost: "Coût Engagé",
      projectedFlockValue: "Valeur Projetée du Lot",
      lastWeekYield: "Rendement Semaine Dernière",
      currentWeekYield: "Rendement Semaine Actuelle",
      absoluteNetGrowth: "Croissance Nette Absolue",
      totalExpenses: "Dépenses Totales",
      currentInventoryAudit: "Audit d'Inventaire Actuel",
      observed: "Observé",
      eggsCollectedLegend: "Œufs Collectés",
      mortalityLossesLegend: "Pertes par Mortalité"
    },
    chickens: {
      title: "Inventaire des Volailles",
      subtitle: "Gérez vos lots, suivez la mortalité et surveillez la santé.",
      activeBatches: "Lots Actifs",
      addBatch: "Ajouter un Lot",
      breed: "Race",
      quantity: "Quantité",
      purchaseDate: "Date d'Achat",
      ageWeeks: "Âge (Semaines)",
      mortality: "Mortalité",
      vaccination: "Statut Vaccinal",
      section: "Section du Bâtiment",
      type: "Type",
      unitPrice: "Prix d'Achat Unitaire",
      projectedPrice: "Prix de Vente Projeté"
    },
    eggs: {
      title: "Gestion des Œufs",
      subtitle: "Enregistrez la production quotidienne d'œufs et surveillez la qualité.",
      goodEggs: "Bons Œufs",
      crackedEggs: "Œufs Fêlés",
      spoiltEggs: "Œufs Gâtés",
      collectionHistory: "Historique de Collecte",
      logCollection: "Enregistrer la Collecte",
      totalCollected: "Total Collecté",
      brokenEggs: "Total Œufs Cassés",
      collectionLogs: "Journaux de Collecte",
      cushionAudits: "Audits des Nids",
      maturationLogs: "Suivi de Maturité des Jeunes Poules",
      auditCushioning: "Auditer Rembourrage",
      logMaturation: "Enregistrer Maturité"
    },
    feed: {
      title: "Gestion des Aliments",
      subtitle: "Gérez les stocks d'aliments, les fournisseurs et la consommation quotidienne.",
      totalStock: "Stock Total d'Aliments",
      currentInventory: "Inventaire Actuel",
      consumptionLogs: "Consommations Récentes",
      logUsage: "Enregistrer Utilisation",
      receiveStock: "Recevoir du Stock"
    },
    sales: {
      title: "Ventes & Factures",
      subtitle: "Suivez les ventes de la ferme et générez des factures.",
      totalRevenue: "Revenu Total",
      salesHistory: "Historique des Ventes",
      newSale: "Nouvelle Vente"
    },
    finance: {
      title: "Finances & Analyses",
      subtitle: "Surveillez les revenus, les dépenses et la rentabilité.",
      totalRevenue: "Revenu Total",
      totalExpenses: "Dépenses Totales",
      netProfit: "Bénéfice Net",
      expenseLedger: "Livre des Dépenses",
      logExpense: "Enregistrer une Dépense"
    },
    staff: {
      title: "Gestion du Personnel",
      subtitle: "Gérez les employés, l'présence et les rôles.",
      totalStaff: "Personnel Total",
      staffRoster: "Liste du Personnel",
      addStaff: "Ajouter un Employé"
    },
    cctv: {
      title: "Vidéosurveillance",
      subtitle: "Surveillance en direct des sections de votre ferme.",
      alerts: "Alertes Récentes"
    }
  },
  zh: {
    common: {
      add: "添加",
      edit: "编辑",
      delete: "删除",
      save: "保存",
      cancel: "取消",
      search: "搜索",
      filter: "筛选",
      active: "启用",
      printReport: "打印报告",
      saveChanges: "保存修改",
      actions: "操作",
      date: "日期",
      status: "状态",
      severity: "严重级别",
      description: "描述",
      amount: "金额",
      category: "类别",
      quantity: "数量",
      notes: "备注",
      allTime: "所有时间",
      weekly: "每周",
      monthly: "每月",
      yearly: "每年",
      timeRange: "时间范围",
      language: "语言"
    },
    menu: {
      "Dashboard": "仪表盘",
      "Batches": "禽群批次",
      "Housing": "鸡舍管理",
      "Eggs": "鸡蛋管理",
      "Feed": "饲料库存",
      "Health": "健康与医疗",
      "Inventory": "库存与工具",
      "Contacts": "联系人列表",
      "Finance": "财务与分析",
      "Sales & Invoices": "销售与发票",
      "Staff Management": "员工与任务",
      "CCTV Monitoring": "视频监控",
      "Settings": "系统设置",
      "Logout": "退出登录"
    },
    dashboard: {
      title: "农场概览",
      subtitle: "以下是您农场今天的实时状况。",
      liveBirds: "存栏禽只总数",
      eggsCollected: "今日收蛋数",
      totalRevenue: "总收入",
      totalMortality: "总死亡数",
      recentSales: "最近销售",
      lowStock: "低库存警报",
      activeFlock: "存栏禽只总数",
      weeklyEggOutput: "每周产蛋量",
      monthlyEggOutput: "每月产蛋量",
      yearlyEggOutput: "每年产蛋量",
      eggOutput: "产蛋量",
      weeklyEggRevenue: "每周鸡蛋收入",
      monthlyEggRevenue: "每月鸡蛋收入",
      yearlyEggRevenue: "每年鸡蛋收入",
      eggRevenue: "鸡蛋收入",
      operationalProfit: "运营利润",
      flockMortalityRate: "本周死亡率",
      eggProductionVolumeChart: "产蛋量可视化 (当前周期)",
      weeklyComparativeAnalytics: "每周对比分析",
      breakEvenAnalysis: "盈亏平衡分析",
      alertLogsQueue: "系统警报日志列表",
      shiftChecklistQueue: "班次任务清单",
      managedBranchesFarms: "托管分部与农场",
      salaryPayroll: "工资与薪酬",
      processPayrollNow: "立即发放工资",
      pendingPayroll: "待发工资总额",
      staffDuePay: "应付工资员工数",
      payrollUpToDate: "所有员工工资已结清。",
      allCaughtUpAlerts: "无未读警报。",
      noActiveTasks: "所有班次任务已完成！",
      costRecoveryProgress: "成本回收进度",
      incurredCost: "已发生成本",
      projectedFlockValue: "禽群估算市值",
      lastWeekYield: "上周产量",
      currentWeekYield: "本周产量",
      absoluteNetGrowth: "净增长绝对值",
      totalExpenses: "总支出",
      currentInventoryAudit: "当前库存盘点",
      observed: "实测值",
      eggsCollectedLegend: "收集鸡蛋数",
      mortalityLossesLegend: "死亡损失数"
    },
    chickens: {
      title: "禽群库存",
      subtitle: "管理您的禽群，跟踪死亡率并监控健康状况。",
      activeBatches: "活跃批次",
      addBatch: "添加批次",
      breed: "品种",
      quantity: "数量",
      purchaseDate: "购买日期",
      ageWeeks: "周龄",
      mortality: "死亡数",
      vaccination: "接种状态",
      section: "鸡舍分区",
      type: "类型",
      unitPrice: "买入单价",
      projectedPrice: "预计售价"
    },
    eggs: {
      title: "鸡蛋管理",
      subtitle: "记录每日收蛋量并监控品质。",
      goodEggs: "合格蛋数",
      crackedEggs: "破损蛋数",
      spoiltEggs: "变质蛋数",
      collectionHistory: "收蛋历史",
      logCollection: "记录收蛋",
      totalCollected: "收蛋总数",
      brokenEggs: "破损蛋总数",
      collectionLogs: "收蛋日志",
      cushionAudits: "产蛋箱垫料检查",
      maturationLogs: "新开产禽只发育日志",
      auditCushioning: "检查垫料",
      logMaturation: "记录发育"
    },
    feed: {
      title: "饲料库存",
      subtitle: "管理饲料库存、供应商以及每日消耗量。",
      totalStock: "饲料总库存",
      currentInventory: "当前库存",
      consumptionLogs: "最近消耗日志",
      logUsage: "记录消耗",
      receiveStock: "饲料入库"
    },
    sales: {
      title: "销售与发票",
      subtitle: "跟踪所有农场销售情况并生成发票。",
      totalRevenue: "总收入",
      salesHistory: "销售历史",
      newSale: "新销售"
    },
    finance: {
      title: "财务与分析",
      subtitle: "监控收入、支出和盈利能力。",
      totalRevenue: "总收入",
      totalExpenses: "总支出",
      netProfit: "净利润",
      expenseLedger: "支出明细账",
      logExpense: "记录支出"
    },
    staff: {
      title: "员工管理",
      subtitle: "管理农场人员、出勤及角色分配。",
      totalStaff: "员工总数",
      staffRoster: "员工花名册",
      addStaff: "添加员工"
    },
    cctv: {
      title: "视频监控",
      subtitle: "实时监控您农场的各个区域。",
      alerts: "最近警报"
    }
  }
};

/**
 * Context type for language settings.
 */
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  texts: TranslationDict;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Provider for language settings.
 *
 * @param props - Component properties.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = Cookies.get('pfms_lang') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    } else {
      Cookies.set('pfms_lang', 'en', { path: '/' });
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      Cookies.set('pfms_lang', lang, { path: '/' });
    }
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
  }, [language, dir]);

  const texts = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, texts, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access the current language context.
 *
 * @returns The language context.
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
