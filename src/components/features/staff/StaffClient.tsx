'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, User, CheckSquare, Fingerprint, CheckCircle, Trash2 } from 'lucide-react';
import { TEXTS } from "@/lib/constants/texts";
import { Staff, StaffTask, PayrollLog } from "@/data/types";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button as MuiButton,
  Chip,
  OutlinedInput,
  Box
} from '@mui/material';
import { useWorkspace } from '../WorkspaceContext';

import { useRouter } from 'next/navigation';

/**
 * Props for the StaffClient component.
 */
interface StaffClientProps {
  initialStaff: Staff[];
  initialTasks: StaffTask[];
  role?: string;
  tier?: string;
}

/**
 * Client component for staff management.
 *
 * @param props - Component properties.
 */
export function StaffClient({ initialStaff, initialTasks, role = 'Staff', tier = 'free' }: StaffClientProps) {
  const router = useRouter();
  const canEdit = role === 'Admin';
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [tasks, setTasks] = useState<StaffTask[]>(initialTasks);
  const [payrollLogs, setPayrollLogs] = useState<PayrollLog[]>([]);

  const { workspaces, activeWorkspace } = useWorkspace();

  const handleOpen = () => {
    if (tier === 'free' && staff.length >= 2) {
      toast.error('Free plan is limited to 2 staff members. Upgrade to Commercial Pro for unlimited staff!');
      router.push('/dashboard/settings');
      return;
    }
    if (assignedBranches.length === 0 && workspaces.length > 0) {
      const defaultWsId = activeWorkspace?.id || workspaces[0]?.id;
      if (defaultWsId) setAssignedBranches([defaultWsId]);
    }
    setOpen(true);
  };

  const staffTable = useTableLogic({
    data: staff,
    searchFields: ['name', 'role', 'contact'],
    initialPageSize: 20
  });

  const payrollTable = useTableLogic({
    data: payrollLogs,
    searchFields: ['id', 'period', 'staffId'],
    initialPageSize: 20
  });
  
  // Modals state
  const [open, setOpen] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  
  // Add Staff Form
  const [name, setName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [salary, setSalary] = useState('');
  const [contact, setContact] = useState('');
  const [assignedBranches, setAssignedBranches] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Assign Task Form
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState(staff[0]?.name || 'Abdulrahman Monsur');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
        setTasks(data.tasks);
        setPayrollLogs(data.payrollLogs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, []);

  const handleClose = () => {
    setOpen(false);
    setName('');
    setStaffRole('');
    setSalary('');
    setContact('');
    setAssignedBranches([]);
    setUsername('');
    setPassword('');
  };

  const handleOpenTaskModal = () => {
    setAssignedTo(staff[0]?.name || 'Abdulrahman Monsur');
    setOpenTaskModal(true);
  };
  const handleCloseTaskModal = () => {
    setOpenTaskModal(false);
    setTaskName('');
  };

  const handleAddStaff = async () => {
    if (!name || !staffRole || !salary) return;

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role: staffRole,
          salary: Number(salary),
          contact,
          attendanceDays: 0,
          assignedBranches,
          username,
          password
        })
      });

      if (res.ok) {
        refreshData();
        handleClose();
        toast.success('Staff member added!');
      } else {
        toast.error('Failed to add staff');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAttendance = async (staffId: string) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'attendance',
          staffId
        })
      });

      if (res.ok) {
        refreshData();
        toast.success('Attendance logged for today!');
      } else {
        toast.error('Failed to log attendance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTask = async () => {
    if (!taskName || !assignedTo) return;

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignTask',
          taskName,
          assignedTo,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseTaskModal();
        toast.success('Task assigned successfully!');
      } else {
        toast.error('Failed to assign task');
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      } else {
        toast.error('Failed to complete task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Staff member removed.'); }
      else toast.error('Failed to remove staff');
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/staff?id=${id}&type=task`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Task deleted.'); }
      else toast.error('Failed to delete task');
    } catch (err) { console.error(err); }
  };

  const handleDeletePayrollLog = async (id: string) => {
    if (!confirm('Delete this payroll log?')) return;
    try {
      const res = await fetch(`/api/staff?id=${id}&type=payroll`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Payroll log deleted.'); }
      else toast.error('Failed to delete payroll log');
    } catch (err) { console.error(err); }
  };

  const totalStaff = staff.length;
  const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{TEXTS.staff.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{TEXTS.staff.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenTaskModal}
            className="bg-white border-2 border-indigo-200 text-indigo-750 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <CheckSquare size={18} /> Assign Task
          </button>
          <button 
            onClick={handleOpen}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> {TEXTS.staff.addStaff}
          </button>
        </div>
      </div>

      {/* Free Plan Staff Limit Warning Banner */}
      {tier === 'free' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border-2 border-amber-400 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Free Starter Plan Limit ({staff.length}/2 Staff Members Registered)</h4>
              <p className="text-xs text-slate-600">Upgrade to Commercial Pro to add unlimited farm workers, managers, and biometric tracking.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Upgrade to Commercial Pro (₦15,000/mo)
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TEXTS.staff.totalStaff}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{totalStaff}</p>
              </div>
              <div className="text-blue-500">
                <User size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff Tasks</p>
                <p className="text-3xl font-semibold text-indigo-600 mt-2">{pendingTasksCount}</p>
              </div>
              <div className="text-indigo-650">
                <CheckSquare size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster Sheet */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{TEXTS.staff.staffRoster}</CardTitle>
          </CardHeader>
          <CardContent>
            <TableControls searchTerm={staffTable.searchTerm} setSearchTerm={staffTable.setSearchTerm} placeholder="Search staff..." />
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label="Name" sortKey="name" currentSort={staffTable.sortConfig} onSort={staffTable.handleSort} />
                    <TableSortHeader label="Role" sortKey="role" currentSort={staffTable.sortConfig} onSort={staffTable.handleSort} />
                    <TableSortHeader label="Branches" sortKey="assignedBranches" currentSort={staffTable.sortConfig} onSort={staffTable.handleSort} />
                    <TableSortHeader label="Contact" sortKey="contact" currentSort={staffTable.sortConfig} onSort={staffTable.handleSort} />
                    <TableSortHeader label="Attendance" sortKey="attendanceDays" currentSort={staffTable.sortConfig} onSort={staffTable.handleSort} />
                    <TableSortHeader label="Monthly Salary" sortKey="salary" currentSort={staffTable.sortConfig} onSort={staffTable.handleSort} />
                    <th className="px-4 py-3 text-right">Attendance Action</th>
                    {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {staffTable.data.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{employee.name}</td>
                      <td className="px-4 py-3 text-slate-600">{employee.role}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {(employee.assignedBranches as string[] | undefined)?.length 
                          ? (employee.assignedBranches as string[]).map(id => workspaces.find(w => w.id === id)?.name || id).join(', ')
                          : 'All'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{employee.contact}</td>
                      <td className="px-4 py-3 text-center font-semibold text-indigo-650">{employee.attendanceDays} days</td>
                      <td className="px-4 py-3 font-semibold">₦{employee.salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                          <button 
                          onClick={() => handleMarkAttendance(employee.id)}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-semibold uppercase px-3 py-1.5 inline-flex items-center gap-1"
                        >
                          <Fingerprint size={12} /> Check-in Today
                        </button>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteStaff(employee.id)} className="p-1 hover:bg-red-100 rounded transition-colors" title="Remove">
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination 
              currentPage={staffTable.currentPage}
              totalPages={staffTable.totalPages}
              totalItems={staffTable.totalItems}
              pageSize={staffTable.pageSize}
              onPageChange={staffTable.setCurrentPage}
              onPageSizeChange={staffTable.setPageSize}
            />
          </CardContent>
        </Card>

        {/* Operational Tasks Roster */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
              Shift Task List (Active Assignments)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[350px] overflow-y-auto font-mono text-xs">
              {tasks.length === 0 ? (
                <p className="text-slate-400 italic">No tasks assigned yet.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={`p-3 border ${task.status === 'Completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800">{task.taskName}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 uppercase ${
                        task.status === 'Completed' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Assigned: {task.assignedTo}</span>
                      <span>{task.date}</span>
                    </div>
                    {task.status === 'Pending' && (
                        <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-semibold uppercase py-1 mt-1 text-center flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={12} /> Mark Completed
                      </button>
                    )}
                    {canEdit && (
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold uppercase py-1 mt-1 text-center flex items-center justify-center gap-1"
                      >
                        <Trash2 size={12} /> Delete Task
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row justify-between items-center">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
            Payroll & Disbursement History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TableControls searchTerm={payrollTable.searchTerm} setSearchTerm={payrollTable.setSearchTerm} placeholder="Search payroll logs..." />
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label="Log ID" sortKey="id" currentSort={payrollTable.sortConfig} onSort={payrollTable.handleSort} />
                  <TableSortHeader label="Date" sortKey="date" currentSort={payrollTable.sortConfig} onSort={payrollTable.handleSort} />
                  <TableSortHeader label="Staff Member" sortKey="staffId" currentSort={payrollTable.sortConfig} onSort={payrollTable.handleSort} />
                  <TableSortHeader label="Period" sortKey="period" currentSort={payrollTable.sortConfig} onSort={payrollTable.handleSort} />
                  <TableSortHeader label="Amount Paid" sortKey="amount" currentSort={payrollTable.sortConfig} onSort={payrollTable.handleSort} />
                  {canEdit && <th className="px-4 py-3 text-slate-500 uppercase text-right">Del</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payrollTable.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400 font-sans italic">
                      No payroll disbursements recorded yet. Use the Finance module to process payroll.
                    </td>
                  </tr>
                ) : (
                  payrollTable.data.map(log => {
                    const member = staff.find(s => s.id === log.staffId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{log.id}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{log.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{member ? `${member.name} (${member.role})` : log.staffId}</td>
                        <td className="px-4 py-3 text-slate-600">{log.period}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">₦{log.amount.toLocaleString()}</td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeletePayrollLog(log.id)} className="p-1 hover:bg-red-100 rounded" title="Delete">
                              <Trash2 size={13} className="text-red-500" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <TablePagination 
            currentPage={payrollTable.currentPage}
            totalPages={payrollTable.totalPages}
            totalItems={payrollTable.totalItems}
            pageSize={payrollTable.pageSize}
            onPageChange={payrollTable.setCurrentPage}
            onPageSizeChange={payrollTable.setPageSize}
          />
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase' }}>Add Staff Member</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Full Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="staff-role-select-label">Access Role</InputLabel>
            <Select
              labelId="staff-role-select-label"
              label="Access Role"
              value={staffRole || 'Staff'}
              onChange={(e) => setStaffRole(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Staff">Staff (Farm Attendant)</MenuItem>
              <MenuItem value="Manager">Manager (Farm Operations)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Monthly Salary (₦)"
            type="number"
            fullWidth
            variant="outlined"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Contact Number"
            fullWidth
            variant="outlined"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Staff Login Username"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
            helperText="Staff member will log in with this username"
          />
          <TextField
            label="Staff Login Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
            helperText="Set a password for their login"
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Assigned Branches</InputLabel>
            <Select
              multiple
              value={assignedBranches}
              onChange={(e) => setAssignedBranches(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Assigned Branches" sx={{ borderRadius: 2 }} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const ws = workspaces.find(w => w.id === value);
                    return <Chip key={value} label={ws?.name || value} size="small" />;
                  })}
                </Box>
              )}
            >
              {workspaces.map((ws) => (
                <MenuItem key={ws.id} value={ws.id}>
                  {ws.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleClose} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleAddStaff} 
            variant="contained" 
            disabled={!name || !staffRole || !salary || !username || !password}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Add Staff
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Assign Task Modal */}
      <Dialog open={openTaskModal} onClose={handleCloseTaskModal} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>Assign Shift Task</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Task Name / Instructions"
            fullWidth
            variant="outlined"
            placeholder="e.g. Inspect feed lines or replenish Nest Box 4 Cushioning"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Assign To</InputLabel>
            <Select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              label="Assign To"
              className="rounded-sm"
            >
              {staff.map(s => (
                <MenuItem key={s.id} value={s.name}>{s.name} ({s.role})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseTaskModal} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleAssignTask} 
            variant="contained" 
            disabled={!taskName || !assignedTo}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Assign Task
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
