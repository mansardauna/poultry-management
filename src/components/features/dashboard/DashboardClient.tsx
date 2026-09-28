'use strict';
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  AlertTriangle,
  BarChart2,
  ArrowUp,
  CheckCircle,
  Activity,
  Coins,
  CheckSquare,
  Bell,
  MapPin,
  Calendar,
  Sparkles,
  Lock,
  Printer
} from 'lucide-react';
import { DatabaseSchema, StaffTask, AlertLog } from "@/data/types";
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { useWorkspace } from "../WorkspaceContext";
import { useLanguage } from "../LanguageContext";
import { useTimeFilter } from "../TimeFilterContext";
import { OnboardingWidget } from "./OnboardingWidget";
import { OnboardingWizard } from "../onboarding/OnboardingWizard";
import { FeatureTour } from "@/components/features/FeatureTour";
import { StatCard } from "@/components/ui/StatCard";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';

/**
 * Props for the DashboardClient component.
 */
interface DashboardClientProps {
  initialData: DatabaseSchema;
  userRole?: string;
}

/**
 * Client component for the main dashboard view.
 * @param {DashboardClientProps} props - The component props.
 */
export function DashboardClient({ initialData, userRole = 'Admin' }: DashboardClientProps) {
  const [data, setData] = useState<DatabaseSchema>(initialData);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const { activeWorkspace, workspaces } = useWorkspace();
  const { texts, language, formatDate, formatNumber, formatCurrency, t } = useLanguage();
  const { timeRange, filterByTimeRange } = useTimeFilter();

  const [tier, setTier] = useState('free');
  const router = useRouter();
  const hasCheckedOnboardingRef = useRef(false);

  useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setTier(match[1]);

    if (hasCheckedOnboardingRef.current) return;
    hasCheckedOnboardingRef.current = true;

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isOnboarding = searchParams.get('onboarding') === 'true';
      const hasDismissed = localStorage.getItem('pfms_onboarded_dismissed') === 'true';

      if (userRole === 'Admin' && (!hasDismissed || isOnboarding)) {
        setOnboardingStep(1);
      }
    }
  }, [userRole]);

  const alertLogsLogic = useTableLogic({
    data: filterByTimeRange(data.alertLogs || []),
    searchFields: ['message', 'severity', 'date'],
    initialPageSize: 20
  });
  
  const refreshData = async () => {
    try {
      const res = await fetch('/api/all');
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayFormatted = formatDate(today);

  // Period setup
  let periodDays = 7;
  if (timeRange === 'weekly') periodDays = 7;
  else if (timeRange === 'monthly') periodDays = 30;
  else if (timeRange === 'yearly') periodDays = 365;

  const cutoffCurrent = new Date(today);
  if (timeRange !== 'all') cutoffCurrent.setDate(today.getDate() - periodDays);
  
  const cutoffPrevious = new Date(today);
  if (timeRange !== 'all') cutoffPrevious.setDate(today.getDate() - periodDays * 2);

  // Normalized collections guaranteeing clean numeric values throughout calculations
  const normalizedBatches = (data.batches || []).map((b) => ({
    ...b,
    quantity: Number(b.quantity) || 0,
    mortalityCount: Number(b.mortalityCount) || 0,
    unitPurchasePrice: Number(b.unitPurchasePrice) || 0,
    projectedSellingPrice: Number(b.projectedSellingPrice) || 0,
  }));

  const normalizedEggs = (data.eggs || []).map((e) => ({
    ...e,
    goodEggs: Number(e.goodEggs) || 0,
    brokenEggs: Number(e.brokenEggs) || 0,
    spoiltEggs: Number(e.spoiltEggs) || 0,
  }));

  const normalizedSales = (data.sales || []).map((s) => ({
    ...s,
    quantity: Number(s.quantity) || 0,
    totalAmount: Number(s.totalAmount) || 0,
  }));

  const normalizedExpenses = (data.expenses || []).map((e) => ({
    ...e,
    amount: Number(e.amount) || 0,
  }));

  const normalizedFeeds = (data.feeds || []).map((f) => ({
    ...f,
    quantityKg: Number(f.quantityKg) || 0,
  }));

  const normalizedStaff = (data.staff || []).map((s) => ({
    ...s,
    salary: Number(s.salary) || 0,
    attendanceDays: Number(s.attendanceDays) || 0,
  }));

  const normalizedMortality = (data.mortalityLogs || []).map((m) => ({
    ...m,
    count: Number(m.count) || 0,
  }));

  const totalChickens = normalizedBatches.reduce((sum, batch) => sum + batch.quantity - batch.mortalityCount, 0);

  // Dynamic Egg Metrics
  const chartData = [];
  let currentYield = 0;
  let previousYield = 0;

  if (timeRange === 'weekly' || timeRange === 'all') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const eggsThatDay = normalizedEggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
      const badEggsThatDay = normalizedEggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.brokenEggs + e.spoiltEggs, 0);
      const revenueThatDay = normalizedSales.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.totalAmount, 0);
      chartData.push({
        name: d.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, { weekday: 'short' }),
        Eggs: eggsThatDay,
        CrackedSpoilt: badEggsThatDay,
        Revenue: revenueThatDay,
        Label: texts.dashboard.observed
      });
      currentYield += eggsThatDay;
    }
    
    for (let i = 13; i >= 7; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      previousYield += normalizedEggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
    }
  } else if (timeRange === 'monthly') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const eggsThatDay = normalizedEggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
      const badEggsThatDay = normalizedEggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.brokenEggs + e.spoiltEggs, 0);
      const revenueThatDay = normalizedSales.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.totalAmount, 0);
      chartData.push({
        name: d.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, { day: 'numeric', month: 'short' }),
        Eggs: eggsThatDay,
        CrackedSpoilt: badEggsThatDay,
        Revenue: revenueThatDay,
        Label: texts.dashboard.observed
      });
      currentYield += eggsThatDay;
    }
    
    for (let i = 59; i >= 30; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      previousYield += normalizedEggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
    }
  } else if (timeRange === 'yearly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const eggsInMonth = normalizedEggs.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month;
      }).reduce((sum, e) => sum + e.goodEggs, 0);

      const badEggsInMonth = normalizedEggs.filter(e => {
         const ed = new Date(e.date);
         return ed.getFullYear() === year && ed.getMonth() === month;
      }).reduce((sum, e) => sum + e.brokenEggs + e.spoiltEggs, 0);

      const revenueInMonth = normalizedSales.filter(s => {
         const sd = new Date(s.date);
         return sd.getFullYear() === year && sd.getMonth() === month;
      }).reduce((sum, s) => sum + s.totalAmount, 0);

      chartData.push({
        name: d.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, { month: 'short' }),
        Eggs: eggsInMonth,
        CrackedSpoilt: badEggsInMonth,
        Revenue: revenueInMonth,
        Label: texts.dashboard.observed
      });
      currentYield += eggsInMonth;
    }

    for (let i = 23; i >= 12; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      previousYield += normalizedEggs.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month;
      }).reduce((sum, e) => sum + e.goodEggs, 0);
    }
  }

  const netGrowth = currentYield - previousYield;
  const netGrowthPercent = previousYield > 0 
    ? ((netGrowth / previousYield) * 100).toFixed(1) 
    : (currentYield > 0 ? '100.0' : '0.0');

  // Break-Even Calculation (using filtered subsets)
  const filteredExpensesForKPIs = timeRange === 'all' ? normalizedExpenses : normalizedExpenses.filter(e => new Date(e.date) >= cutoffCurrent);
  const filteredSalesForKPIs = timeRange === 'all' ? normalizedSales : normalizedSales.filter(s => new Date(s.date) >= cutoffCurrent);
  const filteredBatchesForKPIs = timeRange === 'all' ? normalizedBatches : normalizedBatches.filter(b => new Date(b.purchaseDate) >= cutoffCurrent);

  const totalExpenses = filteredExpensesForKPIs.reduce((sum, e) => sum + e.amount, 0);
  const costOfBirds = filteredBatchesForKPIs.reduce((sum, b) => sum + (b.quantity * (b.unitPurchasePrice || 0)), 0);
  const totalIncurredCost = totalExpenses + costOfBirds;
  
  const projectedRevenue = filteredBatchesForKPIs.reduce((sum, b) => {
    const surviving = b.quantity - b.mortalityCount;
    return sum + (surviving * (b.projectedSellingPrice || 0));
  }, 0);

  const breakEvenPercent = totalIncurredCost > 0 ? ((totalIncurredCost / Math.max(projectedRevenue, 1)) * 100).toFixed(1) : '0';

  // Finances - 100% derived from actual recorded database records
  const totalRevenue = filteredSalesForKPIs.reduce((sum, s) => sum + s.totalAmount, 0);
  const netBalance = totalRevenue - totalExpenses;
  const netProfit = totalRevenue - totalExpenses;
  const returnEfficiency = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : '0';
  const totalFeedStockKg = (normalizedFeeds || []).reduce((sum, f) => sum + (f.quantityKg || 0), 0);
  const activeTasks = filterByTimeRange(data.tasks || []).filter(t => t.status === 'Pending');
  const pendingTasksCount = activeTasks.length;

  // Period-over-period growth comparison
  let previousRevenue = 0;
  let previousExpenses = 0;
  if (timeRange !== 'all') {
    previousRevenue = normalizedSales
      .filter(s => new Date(s.date) >= cutoffPrevious && new Date(s.date) < cutoffCurrent)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    previousExpenses = normalizedExpenses
      .filter(e => new Date(e.date) >= cutoffPrevious && new Date(e.date) < cutoffCurrent)
      .reduce((sum, e) => sum + e.amount, 0);
  }
  const revenueGrowth = totalRevenue - previousRevenue;
  const revenueGrowthPct = previousRevenue > 0
    ? ((revenueGrowth / previousRevenue) * 100).toFixed(1)
    : (totalRevenue > 0 ? '100.0' : '0.0');

  const currentProfit = netProfit;
  const previousProfit = previousRevenue - previousExpenses;
  const profitGrowth = currentProfit - previousProfit;
  const profitGrowthPct = Math.abs(previousProfit) > 0
    ? ((profitGrowth / Math.abs(previousProfit)) * 100).toFixed(1)
    : (currentProfit > 0 ? '100.0' : '0.0');

  const recentMortality = (normalizedMortality || [])
    .filter(m => timeRange === 'all' ? true : new Date(m.date) >= cutoffCurrent)
    .reduce((sum, m) => sum + m.count, 0);
  const flockPct = totalChickens > 0
    ? ((recentMortality / totalChickens) * 100).toFixed(1)
    : '0.0';

  // Alerts logic
  const totalFeedKg = normalizedFeeds.reduce((sum, f) => sum + f.quantityKg, 0);
  const feedThreshold = data.alertSettings?.feedThresholdKg || 50;
  const isFeedCritical = totalFeedKg < feedThreshold;
  
  const hasCctvFailures = (data.cctvLogs || []).some(log => log.status === 'Offline' || log.status === 'Error');

  // Salary Indicator Logic
  const staffNeedingPay = normalizedStaff.filter(s => s.attendanceDays >= 28);
  const totalPendingPayroll = staffNeedingPay.reduce((sum, s) => sum + s.salary, 0);
  const isPayday = staffNeedingPay.length > 0;

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeTask',
          taskId
        })
      });

      if (res.ok) {
        refreshData();
        toast.success('Task marked as completed!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';
  const isPro = isEnterprise || normTier === 'pro';
  const isFree = !isPro;

  return (
    <div className="space-y-6">
      {/* Welcome & Farm Profile Banner */}
      <div className="flex flex-row justify-between items-center gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
            {activeWorkspace?.name || texts.dashboard.title}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1 flex items-center gap-2 truncate">
            <span className="flex items-center gap-1 truncate">
              <MapPin size={14} className="text-indigo-500 shrink-0" />
              <span className="truncate">{activeWorkspace?.name || 'Main Location'}</span>
            </span>
            <span className="text-slate-300 shrink-0">|</span>
            <span className="shrink-0 text-[11px] sm:text-xs text-slate-400">{todayFormatted}</span>
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button 
            data-tour="print-report-btn"
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
          >
            <Printer size={15} className="shrink-0" />
            <span className="hidden sm:inline">{texts.common.printReport}</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>

      {/* Farm Setup Onboarding Progress Widget - Admin only */}
      {userRole === 'Admin' && (
        <OnboardingWidget
          workspacesCount={workspaces.length}
          batchesCount={normalizedBatches.length}
          staffCount={normalizedStaff.length}
          onOpenStep={(stepNum) => setOnboardingStep(stepNum)}
          userRole={userRole}
        />
      )}

      {onboardingStep !== null && (
        <OnboardingWizard
          initialStep={onboardingStep}
          onClose={() => {
            setOnboardingStep(null);
            if (typeof window !== 'undefined') {
              localStorage.setItem('pfms_onboarded_dismissed', 'true');
              const url = new URL(window.location.href);
              if (url.searchParams.has('onboarding')) {
                url.searchParams.delete('onboarding');
                window.history.replaceState({}, '', url.toString());
              }
            }
            refreshData();
          }}
        />
      )}

      <FeatureTour />

      {/* Core Telemetry Metrics Grid - Role-Based Display */}
      <div data-tour="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <StatCard
          title={texts.dashboard.activeFlock}
          value={formatNumber(totalChickens)}
          subtext={`${recentMortality === 0 ? '0.0%' : `−${flockPct}%`} ${texts.dashboard.flockMortalityRate}`}
          color="blue"
        />

        <StatCard
          title={timeRange === 'weekly' ? texts.dashboard.weeklyEggOutput : timeRange === 'monthly' ? texts.dashboard.monthlyEggOutput : timeRange === 'yearly' ? texts.dashboard.yearlyEggOutput : texts.dashboard.eggOutput}
          value={`${formatNumber(currentYield)} ${t("Egg(s)", "Egg(s)")}`}
          subtext={`${netGrowth >= 0 ? '+' : ''}${netGrowthPercent}% vs prev period`}
          color="amber"
        />

        {userRole === 'Staff' ? (
          <>
            <StatCard
              title={t("Feed Stock on Hand")}
              value={`${formatNumber(totalFeedStockKg)} kg`}
              subtext={t("Available inventory in storage")}
              color="emerald"
            />
            <StatCard
              title={t("Tasks Completed")}
              value={`${formatNumber(pendingTasksCount)} Pending`}
              subtext={`${formatNumber(data.tasks.length - pendingTasksCount)} completed today`}
              color="indigo"
            />
          </>
        ) : (
          <>
            <StatCard
              title={timeRange === 'weekly' ? texts.dashboard.weeklyEggRevenue : timeRange === 'monthly' ? texts.dashboard.monthlyEggRevenue : timeRange === 'yearly' ? texts.dashboard.yearlyEggRevenue : texts.dashboard.eggRevenue}
              value={formatCurrency(totalRevenue)}
              subtext={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowthPct}% revenue trend`}
              color="indigo"
            />
            <StatCard
              title={texts.dashboard.operationalProfit}
              value={formatCurrency(netProfit)}
              subtext={`${profitGrowth >= 0 ? '+' : ''}${profitGrowthPct}% net margin`}
              color="emerald"
            />
          </>
        )}
      </div>

      {/* Production Analytics & Multi-Farm Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Charts */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {texts.dashboard.eggProductionVolumeChart} & {t("Sales Trend")}
            </CardTitle>
            {isPro && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded font-mono">
                {t("Live Data")}
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            {isFree ? (
              <div className="p-8 text-center rounded-2xl border border-slate-200 bg-white h-full flex flex-col justify-center items-center space-y-4">
                <div className="space-y-2 max-w-md">
                  <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-3 py-1 rounded-full border border-amber-200">
                    Pro & Enterprise Feature
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 pt-1">{t("Production Analytics & Financial Charts Locked")}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {userRole === 'Staff'
                      ? 'Free accounts have basic flock tracking. Advanced production charts require a Commercial Pro plan. Please contact your farm administrator to request an upgrade.'
                      : 'Free accounts have basic flock tracking. Upgrade to Commercial Pro or Enterprise Plus to unlock daily egg production bar charts and revenue line charts.'}
                  </p>
                </div>
                {userRole !== 'Staff' && (
                  <button 
                    onClick={() => router.push('/dashboard/settings?tab=subscription')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow cursor-pointer transition-all inline-flex items-center gap-2"
                  >
                    <Sparkles size={16} /> {t("Upgrade to Commercial Pro")}
                  </button>
                )}
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      labelClassName="text-slate-800 text-xs font-bold"
                    />
                    <Legend />
                    <Bar dataKey="Eggs" stackId="a" fill="#4f46e5" name={t("Good Eggs Collected")} />
                    <Bar dataKey="CrackedSpoilt" stackId="a" fill="#ef4444" name={t("Cracked / Spoilt")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multi-Farm Production & Vet Inspection Calendar */}
        <Card className="flex flex-col justify-between border border-slate-200 bg-white rounded-2xl shadow-sm">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" /> {t("Multi-Farm Production & Schedule")}
            </CardTitle>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded font-mono">
              {todayFormatted}
            </span>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 block">{t("Vaccination & Health")}</span>
                <p className="text-slate-900 font-bold text-sm">
                  {data.batches[0] ? `${data.batches[0].breed} (${data.batches[0].type || 'Layers'})` : 'Flock Health Routine'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {data.batches[0] ? `Age: ${data.batches[0].ageInWeeks || 18} Weeks` : 'Status: Active'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 block">{t("Feed Stock Level")}</span>
                <p className="text-slate-900 font-bold text-sm">
                  {data.feeds[0] ? `${data.feeds[0].quantityKg}kg ${data.feeds[0].type}` : 'Feed Inventory Normal'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {totalFeedKg < 50 ? '⚠️ Low Stock Alert' : 'Stock Status: Optimal'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                <span className="text-[10px] font-bold text-purple-700 block">{t("Vet & Diagnostics")}</span>
                <p className="text-slate-900 font-bold text-sm">
                  {data.alertLogs[0] ? data.alertLogs[0].message : 'Scheduled Farm Audit'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {data.alertLogs[0] ? `Date: ${data.alertLogs[0].date}` : 'Audit Status: Certified'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 block">{t("Sales Dispatch Log")}</span>
                <p className="text-slate-900 font-bold text-sm">
                  {data.sales[0] ? `${data.sales[0].customerName} (${formatCurrency(data.sales[0].totalAmount)})` : 'Recent Wholesale Dispatch'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {data.sales[0] ? `Date: ${data.sales[0].date}` : 'Dispatch Status: Dispatched'}
                </p>
              </div>
            </div>

            {!isEnterprise && (
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-purple-900 font-semibold">{t("Unlock multi-farm branch calendar & cross-transfers")}</span>
                <button
                  onClick={() => router.push('/dashboard/settings?tab=subscription')}
                  className="bg-purple-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-purple-700"
                >
                  {t("Enterprise Tier")}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Comparative Analytics Card */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {texts.dashboard.weeklyComparativeAnalytics}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">{texts.dashboard.lastWeekYield}</span>
              <span className="text-xs font-bold text-slate-900">{formatNumber(previousYield)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">{texts.dashboard.currentWeekYield}</span>
              <span className="text-xs font-bold text-indigo-650">{formatNumber(currentYield)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">{texts.dashboard.absoluteNetGrowth}</span>
              <span className={`text-xs font-bold ${netGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netGrowth >= 0 ? '+' : ''}{formatNumber(netGrowth)} ({netGrowth >= 0 ? '+' : ''}{netGrowthPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">{texts.dashboard.totalExpenses}</span>
              <span className="text-xs font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">{t("Feed Conversion Ratio")}</span>
              <span className="text-xs text-amber-600 font-bold">{currentYield > 0 ? (totalFeedKg / (currentYield / 30)).toFixed(2) : '0.00'} kg/crate</span>
            </div>
          </CardContent>
        </Card>

        {/* Break-Even Widget */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {texts.dashboard.breakEvenAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">{texts.dashboard.incurredCost}</span>
              <span className="text-slate-900 font-bold">{formatCurrency(totalIncurredCost)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">{texts.dashboard.projectedFlockValue}</span>
              <span className="text-indigo-650 font-bold">{formatCurrency(projectedRevenue)}</span>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-semibold">{texts.dashboard.costRecoveryProgress}</span>
                <span className="text-indigo-600 font-bold">{breakEvenPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${Number(breakEvenPercent) >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                  style={{ width: `${Math.min(Number(breakEvenPercent), 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <p className="text-[10px] font-bold text-slate-800">{texts.dashboard.currentInventoryAudit}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {t("Feed Stock")}: <strong>{formatNumber(totalFeedKg)} kg</strong> | {t("Total Birds")}: <strong>{formatNumber(totalChickens)}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Managed Branches / Farms */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-650" /> {texts.dashboard.managedBranchesFarms} ({formatNumber(workspaces.length)})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto text-xs font-mono">
              {workspaces.map((ws) => (
                <div 
                  key={ws.id}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                    activeWorkspace?.id === ws.id ? 'border-indigo-500 bg-indigo-50/60 font-bold' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={activeWorkspace?.id === ws.id ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-slate-800 truncate max-w-[140px]">{ws.name}</span>
                  </div>
                  {activeWorkspace?.id === ws.id ? (
                    <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded font-sans uppercase font-bold">
                      {texts.common.active}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-sans">{ws.type || 'Branch'}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Alerts Logs Queue & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Alerts System Log Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="flex items-center gap-2">
                <Bell size={18} className="text-red-500 animate-swing" /> {texts.dashboard.alertLogsQueue}
              </span>
              {(isFeedCritical || hasCctvFailures) && (
                <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] uppercase text-white">
                  {t("Notification")}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TableControls searchTerm={alertLogsLogic.searchTerm} setSearchTerm={alertLogsLogic.setSearchTerm} placeholder={t("Search alerts...")} />
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto font-mono text-xs">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={texts.common.date} sortKey="date" currentSort={alertLogsLogic.sortConfig} onSort={alertLogsLogic.handleSort} />
                    <TableSortHeader label={t("Alert Incident Msg")} sortKey="message" currentSort={alertLogsLogic.sortConfig} onSort={alertLogsLogic.handleSort} />
                    <TableSortHeader label={texts.common.severity} sortKey="severity" currentSort={alertLogsLogic.sortConfig} onSort={alertLogsLogic.handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertLogsLogic.data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">
                        {texts.dashboard.allCaughtUpAlerts}
                      </td>
                    </tr>
                  ) : (
                    alertLogsLogic.data.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{log.date}</td>
                        <td className="px-4 py-3 text-slate-800">{log.message}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[9px] uppercase ${
                            log.severity === 'Critical' ? 'bg-red-100 text-red-800 animate-pulse' :
                            log.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>{t(log.severity)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination 
              currentPage={alertLogsLogic.currentPage}
              totalPages={alertLogsLogic.totalPages}
              totalItems={alertLogsLogic.totalItems}
              pageSize={alertLogsLogic.pageSize}
              onPageChange={alertLogsLogic.setCurrentPage}
              onPageSizeChange={alertLogsLogic.setPageSize}
            />
          </CardContent>
        </Card>

        {/* Right Column: Shift Checklist & Payroll Action Widget */}
        <div className="flex flex-col space-y-6">
          {/* Manager Checklist Queue */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CheckSquare size={18} className="text-indigo-650" /> {texts.dashboard.shiftChecklistQueue}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-xs text-slate-500 mb-3">
                {t("Active staff tasks. Check off tasks once verified:")}
              </p>
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto font-mono text-[11px]">
                {activeTasks.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-200 text-center text-slate-400 italic rounded-xl">
                    {texts.dashboard.noActiveTasks}
                  </div>
                ) : (
                  activeTasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => handleCompleteTask(task.id)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-colors flex items-start gap-2.5"
                    >
                      <CheckCircle size="18" className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{task.taskName}</p>
                        <p className="text-[10px] text-slate-400">Assigned: {task.assignedTo} | {task.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Salary Indicator Dashboard - Restricted to Admin and Manager */}
          {(userRole === 'Admin' || userRole === 'Manager') && (
            <Card className={isPayday ? "border-amber-300 shadow-md shadow-amber-100" : ""}>
              <CardHeader className={`border-b ${isPayday ? 'bg-amber-50 border-amber-100' : 'border-slate-100'}`}>
                <CardTitle className={`text-sm font-semibold flex items-center justify-between ${isPayday ? 'text-amber-700' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-2">
                    <Coins size={18} className={isPayday ? "text-amber-600" : "text-indigo-650"} /> {texts.dashboard.salaryPayroll}
                  </span>
                  {isPayday && (
                    <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse uppercase font-bold">
                      {t("Action Required")}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-500">{texts.dashboard.staffDuePay}</span>
                    <span className={`font-bold ${isPayday ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatNumber(staffNeedingPay.length)} / {formatNumber(data.staff.length)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-500">{texts.dashboard.pendingPayroll}</span>
                    <span className="text-amber-600 font-bold">{formatCurrency(totalPendingPayroll)}</span>
                  </div>

                  {isPayday && (
                    <div className="pt-2">
                      <Link href="/dashboard/staff" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs uppercase font-bold transition-colors shadow-sm">
                        {texts.dashboard.processPayrollNow}
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
