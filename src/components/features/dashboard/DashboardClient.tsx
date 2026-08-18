'use strict';
'use client';

import { useState, useEffect } from 'react';
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
  Lock
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
  const { texts, language } = useLanguage();
  const { timeRange, filterByTimeRange } = useTimeFilter();

  const [tier, setTier] = useState('free');
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setTier(match[1]);
  }, []);

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
  const todayFormatted = today.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Period setup
  let periodDays = 7;
  if (timeRange === 'weekly') periodDays = 7;
  else if (timeRange === 'monthly') periodDays = 30;
  else if (timeRange === 'yearly') periodDays = 365;

  const cutoffCurrent = new Date(today);
  if (timeRange !== 'all') cutoffCurrent.setDate(today.getDate() - periodDays);
  
  const cutoffPrevious = new Date(today);
  if (timeRange !== 'all') cutoffPrevious.setDate(today.getDate() - periodDays * 2);

  const totalChickens = data.batches.reduce((sum, batch) => sum + batch.quantity - batch.mortalityCount, 0);

  // Dynamic Egg Metrics
  const chartData = [];
  let currentYield = 0;
  let previousYield = 0;

  if (timeRange === 'weekly' || timeRange === 'all') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const eggsThatDay = data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
      const badEggsThatDay = data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.brokenEggs || 0) + (e.spoiltEggs || 0), 0);
      const revenueThatDay = data.sales.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.totalAmount, 0);
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
      previousYield += data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
    }
  } else if (timeRange === 'monthly') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const eggsThatDay = data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
      const badEggsThatDay = data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.brokenEggs || 0) + (e.spoiltEggs || 0), 0);
      const revenueThatDay = data.sales.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.totalAmount, 0);
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
      previousYield += data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
    }
  } else if (timeRange === 'yearly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const eggsInMonth = data.eggs.filter(e => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month;
      }).reduce((sum, e) => sum + e.goodEggs, 0);

      const badEggsInMonth = data.eggs.filter(e => {
         const ed = new Date(e.date);
         return ed.getFullYear() === year && ed.getMonth() === month;
      }).reduce((sum, e) => sum + (e.brokenEggs || 0) + (e.spoiltEggs || 0), 0);

      const revenueInMonth = data.sales.filter(s => {
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
      previousYield += data.eggs.filter(e => {
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
  const filteredExpensesForKPIs = timeRange === 'all' ? data.expenses : data.expenses.filter(e => new Date(e.date) >= cutoffCurrent);
  const filteredSalesForKPIs = timeRange === 'all' ? data.sales : data.sales.filter(s => new Date(s.date) >= cutoffCurrent);
  const filteredBatchesForKPIs = timeRange === 'all' ? data.batches : data.batches.filter(b => new Date(b.purchaseDate) >= cutoffCurrent);

  const totalExpenses = filteredExpensesForKPIs.reduce((sum, e) => sum + e.amount, 0);
  const costOfBirds = filteredBatchesForKPIs.reduce((sum, b) => sum + (b.quantity * (b.unitPurchasePrice || 0)), 0);
  const totalIncurredCost = totalExpenses + costOfBirds;
  
  const projectedRevenue = filteredBatchesForKPIs.reduce((sum, b) => {
    const surviving = b.quantity - b.mortalityCount;
    return sum + (surviving * (b.projectedSellingPrice || 0));
  }, 0);

  const breakEvenPercent = totalIncurredCost > 0 ? ((totalIncurredCost / Math.max(projectedRevenue, 1)) * 100).toFixed(1) : '0';

  // Finances
  const totalRevenue = filteredSalesForKPIs.reduce((sum, s) => sum + s.totalAmount, 0);
  const openingFund = 16800;
  const netBalance = (openingFund + totalRevenue) - totalExpenses;
  const netProfit = totalRevenue - totalExpenses;
  const returnEfficiency = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : '0';

  // Period-over-period growth comparison
  let previousRevenue = 0;
  let previousExpenses = 0;
  if (timeRange !== 'all') {
    previousRevenue = data.sales
      .filter(s => new Date(s.date) >= cutoffPrevious && new Date(s.date) < cutoffCurrent)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    previousExpenses = data.expenses
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

  const recentMortality = (data.mortalityLogs || [])
    .filter(m => timeRange === 'all' ? true : new Date(m.date) >= cutoffCurrent)
    .reduce((sum, m) => sum + m.count, 0);
  const flockPct = totalChickens > 0
    ? ((recentMortality / totalChickens) * 100).toFixed(1)
    : '0.0';

  // Alerts logic
  const totalFeedKg = data.feeds.reduce((sum, f) => sum + f.quantityKg, 0);
  const feedThreshold = data.alertSettings?.feedThresholdKg || 50;
  const isFeedCritical = totalFeedKg < feedThreshold;
  
  const hasCctvFailures = (data.cctvLogs || []).some(log => log.status === 'Offline' || log.status === 'Error');

  // Salary Indicator Logic
  const staffNeedingPay = data.staff.filter(s => s.attendanceDays >= 28);
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

  const activeTasks = filterByTimeRange(data.tasks || []).filter(t => t.status === 'Pending');

  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';
  const isPro = isEnterprise || normTier === 'pro';
  const isFree = !isPro;

  // Generate GitHub-Style 365-Day Sales Contribution Grid Data
  const salesHeatmapDays = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const salesThatDay = data.sales.filter(s => s.date === dateStr);
    const totalAmount = salesThatDay.reduce((sum, s) => sum + s.totalAmount, 0);
    const count = salesThatDay.length;

    let intensity = 0;
    if (totalAmount > 50000) intensity = 4;
    else if (totalAmount > 25000) intensity = 3;
    else if (totalAmount > 10000) intensity = 2;
    else if (totalAmount > 0 || count > 0) intensity = 1;

    salesHeatmapDays.push({
      date: dateStr,
      count,
      totalAmount,
      intensity
    });
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Farm Profile Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl text-slate-900  tracking-tight">
            {activeWorkspace?.name || texts.dashboard.title}
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-indigo-500" /> {activeWorkspace?.name || 'Main Location'}
            </span>
            <span className="text-slate-300">|</span>
            <span>{todayFormatted}</span>
          </p>
        </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm  tracking-wider uppercase transition-colors"
            >
              {texts.common.printReport}
            </button>
          </div>
        </div>

      {/* Farm Setup Onboarding Progress Widget */}
      <OnboardingWidget
        workspacesCount={workspaces.length}
        batchesCount={data.batches.length}
        staffCount={data.staff.length}
        onOpenStep={(stepNum) => setOnboardingStep(stepNum)}
        userRole={userRole}
      />

      {onboardingStep !== null && (
        <OnboardingWizard
          initialStep={onboardingStep}
          onClose={() => {
            setOnboardingStep(null);
            refreshData();
          }}
        />
      )}

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{texts.dashboard.activeFlock}</p>
                <p className="text-3xl text-slate-900 mt-2">{totalChickens}</p>
              </div>
              <div className="text-blue-500">
                <Activity size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={`flex items-center font-semibold px-2 py-0.5 ${recentMortality === 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                {recentMortality === 0 ? '0.0%' : `−${flockPct}%`}
              </span>
              <span className="text-slate-400 ml-2">{texts.dashboard.flockMortalityRate} ({texts.common[timeRange === 'all' ? 'allTime' : timeRange as 'weekly' | 'monthly' | 'yearly']})</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {timeRange === 'weekly' ? texts.dashboard.weeklyEggOutput : timeRange === 'monthly' ? texts.dashboard.monthlyEggOutput : timeRange === 'yearly' ? texts.dashboard.yearlyEggOutput : texts.dashboard.eggOutput}
                </p>
                <p className="text-3xl text-slate-900 mt-2">{currentYield}</p>
              </div>
              <div className="text-amber-600">
                <Activity size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={`flex items-center px-2 py-0.5 ${netGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                {netGrowth >= 0 ? <ArrowUp size={12} className="mr-1" /> : null} 
                {netGrowth >= 0 ? '+' : ''}{netGrowthPercent}%
              </span>
              <span className="text-slate-400 ml-2">vs {previousYield} ({texts.common[timeRange === 'weekly' || timeRange === 'all' ? 'weekly' : timeRange === 'monthly' ? 'monthly' : 'yearly']})</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {timeRange === 'weekly' ? texts.dashboard.weeklyEggRevenue : timeRange === 'monthly' ? texts.dashboard.monthlyEggRevenue : timeRange === 'yearly' ? texts.dashboard.yearlyEggRevenue : texts.dashboard.eggRevenue}
                </p>
                <p className="text-3xl text-slate-900 mt-2">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-indigo-600">
                <BarChart2 size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={`flex items-center px-2 py-0.5 ${revenueGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                {revenueGrowth >= 0 ? <ArrowUp size={12} className="mr-1" /> : null}
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowthPct}%
              </span>
              <span className="text-slate-400 ml-2">vs ₦{previousRevenue.toLocaleString()} ({texts.common[timeRange === 'weekly' || timeRange === 'all' ? 'weekly' : timeRange === 'monthly' ? 'monthly' : 'yearly']})</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{texts.dashboard.operationalProfit}</p>
                <p className="text-3xl text-emerald-600 mt-2">₦{netProfit.toLocaleString()}</p>
              </div>
              <div className="text-emerald-600">
                <Activity size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={` flex items-center px-2 py-0.5 ${profitGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                {profitGrowth >= 0 ? <ArrowUp size={12} className="mr-1" /> : null}
                {profitGrowth >= 0 ? '+' : ''}{profitGrowthPct}%
              </span>
              <span className="text-slate-400 ml-2">vs previous period profit</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Egg Production Chart & Weekly Comparative Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {isFree ? (
            <Card className="border-2 border-indigo-200 bg-slate-900 text-white p-8 text-center rounded-2xl shadow-xl">
              <div className="w-16 h-16 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/40 animate-pulse">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Production Analytics & Financial Charts Locked</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
                Free accounts have basic flock tracking. Upgrade to Commercial Pro or Enterprise Plus to unlock daily egg production bar charts, financial revenue line charts, and AI voice auto-loggers.
              </p>
              <button 
                onClick={() => router.push('/dashboard/settings?tab=subscription')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-6 py-3.5 rounded-xl shadow-lg cursor-pointer transition-all inline-flex items-center gap-2"
              >
                <Sparkles size={16} /> Upgrade to Commercial Pro (₦15,000/mo)
              </button>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
                    {texts.dashboard.eggProductionVolumeChart}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0px', border: '1px solid #cbd5e1' }}
                          labelClassName=" text-slate-800 text-xs uppercase"
                        />
                        <Legend />
                        <Bar dataKey="Eggs" stackId="a" fill="#4f46e5" name="Good Eggs Collected" />
                        <Bar dataKey="CrackedSpoilt" stackId="a" fill="#ef4444" name="Cracked / Spoilt" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
                    Sales & Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0px', border: '1px solid #cbd5e1' }}
                          labelClassName=" text-slate-800 text-xs uppercase"
                          formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, "Revenue"]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Sales Revenue (₦)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* GitHub-Style 365-Day Sales Contribution Activity Heatmap Grid (ENTERPRISE EXCLUSIVE) */}
          {isEnterprise ? (
            <Card className="border border-slate-200 bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800 bg-slate-950 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 font-mono">
                  <Sparkles size={16} /> 365-Day Enterprise Sales Contribution Heatmap Grid
                </CardTitle>
                <span className="text-[10px] text-slate-400 font-mono">365 DAYS RECORDED</span>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="overflow-x-auto pb-2 scrollbar-custom">
                  <div className="inline-grid grid-rows-7 grid-flow-col gap-1 min-w-[700px]">
                    {salesHeatmapDays.map((day, idx) => (
                      <div
                        key={idx}
                        title={`${day.date}: ${day.count} sales (₦${day.totalAmount.toLocaleString()})`}
                        className={`w-3 h-3 rounded-sm transition-all cursor-pointer hover:scale-125 ${
                          day.intensity === 4 ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' :
                          day.intensity === 3 ? 'bg-emerald-500' :
                          day.intensity === 2 ? 'bg-emerald-700' :
                          day.intensity === 1 ? 'bg-emerald-900/60' : 'bg-slate-800/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-3">
                  <span>GitHub Sales Intensity Grid</span>
                  <div className="flex items-center gap-1.5">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800/60" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900/60" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    <span>More</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-purple-950/40 border border-purple-500/30 p-6 rounded-2xl text-center space-y-3 shadow-lg">
              <span className="bg-purple-600 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow">ENTERPRISE EXCLUSIVE</span>
              <h4 className="text-sm font-extrabold text-white">GitHub-Style 365-Day Sales Activity Heatmap Grid</h4>
              <p className="text-xs text-purple-200 max-w-md mx-auto">Upgrade to Enterprise Plus to unlock 365-day sales contribution activity heatmaps and multi-farm calendars.</p>
              <button onClick={() => router.push('/dashboard/settings?tab=subscription')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow">
                ⚡ Upgrade to Enterprise Plus
              </button>
            </div>
          )}

          {/* Multi-Farm Production & Vet Calendar (ENTERPRISE EXCLUSIVE) */}
          {isEnterprise && (
            <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" /> Multi-Farm Production & Vet Inspection Calendar
                </CardTitle>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded font-mono">
                  {todayFormatted}
                </span>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-emerald-700 block">VACCINATION & HEALTH</span>
                    <p className="text-slate-900 font-bold">
                      {data.batches[0] ? `${data.batches[0].breed} (${data.batches[0].type || 'Layers'})` : 'Flock Health Routine'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {data.batches[0] ? `Age: ${data.batches[0].ageInWeeks || 18} Weeks` : 'Status: Active'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-indigo-700 block">FEED STOCK LEVEL</span>
                    <p className="text-slate-900 font-bold">
                      {data.feeds[0] ? `${data.feeds[0].quantityKg}kg ${data.feeds[0].type}` : 'Feed Inventory Normal'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {totalFeedKg < 50 ? '⚠️ Low Stock Alert' : 'Stock Status: Optimal'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-purple-700 block">VET & DIAGNOSTICS</span>
                    <p className="text-slate-900 font-bold">
                      {data.alertLogs[0] ? data.alertLogs[0].message : 'Scheduled Farm Audit'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {data.alertLogs[0] ? `Date: ${data.alertLogs[0].date}` : 'Audit Status: Certified'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase text-amber-800 block">SALES DISPATCH LOG</span>
                    <p className="text-slate-900 font-bold">
                      {data.sales[0] ? `${data.sales[0].customerName} (₦${data.sales[0].totalAmount.toLocaleString()})` : 'Recent Wholesale Dispatch'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {data.sales[0] ? `Date: ${data.sales[0].date}` : 'Dispatch Status: Dispatched'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          {/* Weekly Comparative Analytics Card */}
          <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
              {texts.dashboard.weeklyComparativeAnalytics}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">{texts.dashboard.lastWeekYield}</span>
              <span className="text-sm text-slate-900">{previousYield}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">{texts.dashboard.currentWeekYield}</span>
              <span className="text-sm text-indigo-650">{currentYield}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">{texts.dashboard.absoluteNetGrowth}</span>
              <span className={`text-sm ${netGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netGrowth >= 0 ? '+' : ''}{netGrowth} ({netGrowth >= 0 ? '+' : ''}{netGrowthPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">{texts.dashboard.totalExpenses}</span>
              <span className="text-sm text-red-600">₦{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Feed Conversion Ratio</span>
              <span className="text-sm text-amber-600 font-bold">{currentYield > 0 ? (totalFeedKg / (currentYield / 30)).toFixed(2) : '0.00'} kg/crate</span>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs  text-slate-800 uppercase">{texts.dashboard.currentInventoryAudit}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Feed Stock stands at <strong>{totalFeedKg} kg</strong>. 
                Total Birds tracked: <strong>{totalChickens}</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Break-Even Widget */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
              {texts.dashboard.breakEvenAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">{texts.dashboard.incurredCost}</span>
                <span className= "text-slate-900">₦{totalIncurredCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">{texts.dashboard.projectedFlockValue}</span>
                <span className= "text-indigo-650">₦{projectedRevenue.toLocaleString()}</span>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className=" text-slate-700">{texts.dashboard.costRecoveryProgress}</span>
                  <span className=" text-indigo-600">{breakEvenPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${Number(breakEvenPercent) >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min(Number(breakEvenPercent), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Dynamic Alerts Logs Queue & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Alerts System Log Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <span className="flex items-center gap-2">
                <Bell size={18} className="text-red-500 animate-swing" /> {texts.dashboard.alertLogsQueue}
              </span>
              {(isFeedCritical || hasCctvFailures) && (
                <span className="rounded-full bg-red-500 px-2 py-1 text-[10px]  uppercase text-white">
                  Notification
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TableControls searchTerm={alertLogsLogic.searchTerm} setSearchTerm={alertLogsLogic.setSearchTerm} placeholder="Search alerts..." />
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto font-mono text-xs">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={texts.common.date} sortKey="date" currentSort={alertLogsLogic.sortConfig} onSort={alertLogsLogic.handleSort} />
                    <TableSortHeader label="Alert Incident Msg" sortKey="message" currentSort={alertLogsLogic.sortConfig} onSort={alertLogsLogic.handleSort} />
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
                          <span className={`px-2 py-0.5 text-[9px]  uppercase ${
                            log.severity === 'Critical' ? 'bg-red-100 text-red-800 animate-pulse' :
                            log.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>{log.severity}</span>
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

        {/* Manager Checklist Queue */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <CheckSquare size={20} className="text-indigo-650" /> {texts.dashboard.shiftChecklistQueue}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-xs text-slate-500 mb-4">
              Real-time active staff tasks. Check off tasks once verified:
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto font-mono text-[11px]">
              {activeTasks.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 text-center text-slate-400 italic">
                  {texts.dashboard.noActiveTasks}
                </div>
              ) : (
                activeTasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => handleCompleteTask(task.id)}
                    className="p-3 border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-colors flex items-start gap-3"
                  >
                    <CheckCircle size="20" className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-emerald-600" />
                    <div>
                      <p className="text-xs  text-slate-800">{task.taskName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned to: {task.assignedTo} | {task.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Branches / Farms */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <MapPin size={20} className="text-indigo-650" /> {texts.dashboard.managedBranchesFarms}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-xs text-slate-500 mb-4">
              Overview of all farms configured in the system. Use the sidebar dropdown to switch.
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto font-mono text-[11px]">
              {workspaces.map((ws) => (
                <div 
                  key={ws.id}
                  className="p-3 border border-slate-200 bg-slate-50 hover:bg-indigo-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span className=" text-slate-800">{ws.name}</span>
                  </div>
                  {activeWorkspace?.id === ws.id && (
                    <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full  uppercase">
                      {texts.common.active}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Salary Indicator Dashboard */}
        <Card className={isPayday ? "border-amber-300 shadow-md shadow-amber-100" : ""}>
          <CardHeader className={`border-b ${isPayday ? 'bg-amber-50 border-amber-100' : 'border-slate-100'}`}>
            <CardTitle className={`text-sm uppercase tracking-wider flex items-center justify-between ${isPayday ? 'text-amber-700' : 'text-slate-700'}`}>
              <span className="flex items-center gap-2">
                <Coins size={20} className={isPayday ? "text-amber-600" : "text-indigo-650"} /> {texts.dashboard.salaryPayroll}
              </span>
              {isPayday && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse uppercase">
                  Action Required
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-xs text-slate-500 mb-4">
              Monitor staff attendance days and upcoming payroll requirements.
            </p>
            <div className="space-y-4 font-mono">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">{texts.dashboard.staffDuePay}</span>
                <span className={`text-sm ${isPayday ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
                  {staffNeedingPay.length} / {data.staff.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">{texts.dashboard.pendingPayroll}</span>
                <span className="text-sm text-amber-600 font-bold">₦{totalPendingPayroll.toLocaleString()}</span>
              </div>
              
              <div className="mt-4 max-h-[150px] overflow-y-auto space-y-2 text-[11px]">
                {staffNeedingPay.length > 0 ? (
                  staffNeedingPay.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-100">
                      <span>{s.name} ({s.role})</span>
                      <span className="text-red-600 font-bold">{s.attendanceDays} days</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 border border-dashed border-slate-200 text-center text-slate-400 italic">
                    {texts.dashboard.payrollUpToDate}
                  </div>
                )}
              </div>
              
              {isPayday && (
                <div className="mt-4 pt-2">
                  <Link href="/staff" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-2 rounded text-xs uppercase font-bold transition-colors">
                    {texts.dashboard.processPayrollNow}
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
