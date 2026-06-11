'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  ClipboardCheck,
  AlertTriangle,
  BarChart2,
  ArrowUp,
  Video,
  CheckCircle,
  Activity,
  Coins,
  CheckSquare,
  Settings,
  Bell,
  MapPin
} from 'lucide-react';
import { AiLogModal } from "@/components/ui/AiLogModal";
import { DatabaseSchema, StaffTask, AlertLog } from "@/data/types";
import { useWorkspace } from "../WorkspaceContext";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Button as MuiButton 
} from '@mui/material';

interface DashboardClientProps {
  initialData: DatabaseSchema;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<DatabaseSchema>(initialData);
  const { activeWorkspace, workspaces } = useWorkspace();
  const [openSettings, setOpenSettings] = useState(false);
  
  // Settings Form State
  const [feedThresholdKg, setFeedThresholdKg] = useState(String(initialData.alertSettings?.feedThresholdKg || 50));
  const [eggDropPercentage, setEggDropPercentage] = useState(String(initialData.alertSettings?.eggDropPercentage || 15));
  const [notifySms, setNotifySms] = useState(initialData.alertSettings?.notifySms || false);
  const [notifyEmail, setNotifyEmail] = useState(initialData.alertSettings?.notifyEmail || false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(initialData.alertSettings?.notifyWhatsapp || false);

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
  }, []);

  const totalChickens = data.batches.reduce((sum, batch) => sum + batch.quantity - batch.mortalityCount, 0);
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayFormatted = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Weekly Egg Metrics
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = [];
  let currentWeekYield = 0;
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const eggsThatDay = data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
    const mortalityThatDay = (data.mortalityLogs || []).filter(m => m.date === dateStr).reduce((sum, m) => sum + m.count, 0);
    chartData.push({
      name: days[d.getDay()],
      Eggs: eggsThatDay,
      Mortality: mortalityThatDay,
      Label: 'Observed'
    });
    currentWeekYield += eggsThatDay;
  }
  
  let lastWeekYield = 0;
  for (let i = 13; i >= 7; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    lastWeekYield += data.eggs.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.goodEggs, 0);
  }

  const netGrowth = currentWeekYield - lastWeekYield;
  const netGrowthPercent = lastWeekYield > 0 
    ? ((netGrowth / lastWeekYield) * 100).toFixed(1) 
    : (currentWeekYield > 0 ? '100.0' : '0.0');

  // Break-Even Calculation
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const costOfBirds = data.batches.reduce((sum, b) => sum + (b.quantity * (b.unitPurchasePrice || 0)), 0);
  const totalIncurredCost = totalExpenses + costOfBirds;
  
  const projectedRevenue = data.batches.reduce((sum, b) => {
    const surviving = b.quantity - b.mortalityCount;
    return sum + (surviving * (b.projectedSellingPrice || 0));
  }, 0);

  const breakEvenPercent = totalIncurredCost > 0 ? ((totalIncurredCost / Math.max(projectedRevenue, 1)) * 100).toFixed(1) : '0';

  // Finances
  const totalRevenue = data.sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const openingFund = 16800;
  const netBalance = (openingFund + totalRevenue) - totalExpenses;
  const netProfit = totalRevenue - totalExpenses;
  const returnEfficiency = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : '0';

  // Week-over-week revenue comparison
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today); fourteenDaysAgo.setDate(today.getDate() - 14);
  const currentWeekRevenue = data.sales
    .filter(s => new Date(s.date) >= sevenDaysAgo)
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const lastWeekRevenue = data.sales
    .filter(s => new Date(s.date) >= fourteenDaysAgo && new Date(s.date) < sevenDaysAgo)
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const revenueGrowth = currentWeekRevenue - lastWeekRevenue;
  const revenueGrowthPct = lastWeekRevenue > 0
    ? ((revenueGrowth / lastWeekRevenue) * 100).toFixed(1)
    : (currentWeekRevenue > 0 ? '100.0' : '0.0');

  // Week-over-week profit comparison
  const currentWeekExpenses = data.expenses
    .filter(e => new Date(e.date) >= sevenDaysAgo)
    .reduce((sum, e) => sum + e.amount, 0);
  const lastWeekExpenses = data.expenses
    .filter(e => new Date(e.date) >= fourteenDaysAgo && new Date(e.date) < sevenDaysAgo)
    .reduce((sum, e) => sum + e.amount, 0);
  const currentWeekProfit = currentWeekRevenue - currentWeekExpenses;
  const lastWeekProfit = lastWeekRevenue - lastWeekExpenses;
  const profitGrowth = currentWeekProfit - lastWeekProfit;
  const profitGrowthPct = Math.abs(lastWeekProfit) > 0
    ? ((profitGrowth / Math.abs(lastWeekProfit)) * 100).toFixed(1)
    : (currentWeekProfit > 0 ? '100.0' : '0.0');

  // Flock change: current vs 7 days ago mortality delta
  const recentMortality = (data.mortalityLogs || [])
    .filter(m => new Date(m.date) >= sevenDaysAgo)
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

  const activeTasks = data.tasks.filter(t => t.status === 'Pending');
  const alertLogs = data.alertLogs || [];

  return (
    <div className="space-y-6">
      {/* Welcome & Farm Profile Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl text-slate-900  tracking-tight">
            {activeWorkspace?.name || 'Dashboard Overview'}
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
            <AiLogModal onSuccess={refreshData} />
           
            <button 
              onClick={() => window.print()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm  tracking-wider uppercase transition-colors"
            >
              Print Report
            </button>
          </div>
        </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Active Flock</p>
                <p className="text-3xl text-slate-900 mt-2">{totalChickens} Birds</p>
              </div>
              <div className="text-blue-500">
                <Activity size={32} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={`flex items-center font-semibold px-2 py-0.5 ${recentMortality === 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                {recentMortality === 0 ? '0.0%' : `−${flockPct}%`}
              </span>
              <span className="text-slate-400 ml-2">mortality rate this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Weekly Egg Output</p>
                <p className="text-3xl text-slate-900 mt-2">{currentWeekYield} Eggs</p>
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
              <span className="text-slate-400 ml-2">vs {lastWeekYield} eggs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Weekly Egg Revenue</p>
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
              <span className="text-slate-400 ml-2">vs ₦{lastWeekRevenue.toLocaleString()} last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Operational Profit</p>
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
              <span className="text-slate-400 ml-2">vs last week's profit</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Egg Production Chart & Weekly Comparative Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
              Egg Production Volume Visualization (Current Weekly Cycle)
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
                  <Bar dataKey="Eggs" fill="#4f46e5" name="Eggs Collected" />
                  <Bar dataKey="Mortality" fill="#ef4444" name="Mortality Losses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col space-y-6">
          {/* Weekly Comparative Analytics Card */}
          <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
              Weekly Comparative Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Last Week Yield</span>
              <span className="text-sm text-slate-900">{lastWeekYield} Eggs</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Current Week Yield</span>
              <span className="text-sm text-indigo-650">{currentWeekYield} Eggs</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Absolute Net Growth</span>
              <span className={`text-sm ${netGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netGrowth >= 0 ? '+' : ''}{netGrowth} Eggs ({netGrowth >= 0 ? '+' : ''}{netGrowthPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Total Expenses</span>
              <span className="text-sm text-red-600">₦{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs  text-slate-800 uppercase">Current Inventory Audit</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Feed Stock stands at <strong>{totalFeedKg} kg</strong> as of {todayFormatted}. 
                Total Birds tracked: <strong>{totalChickens}</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Break-Even Widget */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider">
              Break-Even Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Incurred Cost (Purchases, Feed, Meds)</span>
                <span className= "text-slate-900">₦{totalIncurredCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Projected Flock Value</span>
                <span className= "text-indigo-650">₦{projectedRevenue.toLocaleString()}</span>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className=" text-slate-700">Cost Recovery Progress</span>
                  <span className=" text-indigo-600">{breakEvenPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${Number(breakEvenPercent) >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min(Number(breakEvenPercent), 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  * Break-even calculation compares current total expenses with the estimated market value of surviving birds.
                </p>
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
                <Bell size={18} className="text-red-500 animate-swing" /> Dynamic Automated System Alert Logs (Roster)
              </span>
              {(isFeedCritical || hasCctvFailures) && (
                <span className="rounded-full bg-red-500 px-2 py-1 text-[10px]  uppercase text-white">
                  Notification
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto font-mono text-xs">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Alert Incident Msg</th>
                    <th className="px-4 py-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertLogs.map((log) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Manager Checklist Queue */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <CheckSquare size={20} className="text-indigo-650" /> Shift Task Checklist Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-xs text-slate-500 mb-4">
              Real-time active staff tasks. Check off tasks once verified:
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto font-mono text-[11px]">
              {activeTasks.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 text-center text-slate-400 italic">
                  No active shift tasks left! Roster is cleared.
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
              <MapPin size={20} className="text-indigo-650" /> Managed Branches & Farms
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
                      Active
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
                <Coins size={20} className={isPayday ? "text-amber-600" : "text-indigo-650"} /> Salary & Payroll
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
                <span className="text-sm font-medium text-slate-500">Staff Due for Pay</span>
                <span className={`text-sm ${isPayday ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
                  {staffNeedingPay.length} / {data.staff.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">Pending Payroll Due</span>
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
                    All staff payments are up to date.
                  </div>
                )}
              </div>
              
              {isPayday && (
                <div className="mt-4 pt-2">
                  <Link href="/staff" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-2 rounded text-xs uppercase font-bold transition-colors">
                    Process Payroll Now
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
