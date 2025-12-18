
import React, { useState, useMemo, useEffect } from 'react';
import { Shift, Branch, User, ShiftSchedule } from '../types';
import { Clock, CalendarDays } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// Sub-components
import { ShiftAttendance } from './shift/ShiftAttendance';
import { ShiftRoster } from './shift/ShiftRoster';
import { ZReportModal, ZReportData } from './shift/ZReportModal';
import { ScheduleModal } from './shift/ScheduleModal';

interface ShiftManagementProps {
  shifts: Shift[];
  branches: Branch[];
  users: User[];
  currentUser: User | null;
  onStartShift: (branchId: string, startCash: number, notes?: string, posId?: string) => void;
  onEndShift: (shiftId: string, endCash: number, notes?: string) => void;
}

export const ShiftManagement: React.FC<ShiftManagementProps> = ({
  shifts, branches, users, currentUser, onStartShift, onEndShift
}) => {
  const { 
    shiftSchedules, 
    addShiftSchedule, 
    updateShiftSchedule,
    deleteShiftSchedule, 
    settings, 
    posMachines, 
    sales, 
    addCashTransaction,
    formatPrice
  } = useGlobal();

  const [activeTab, setActiveTab] = useState<'attendance' | 'planning'>('attendance');
  
  // Roster State
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Modals State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<ZReportData | null>(null);

  // Derived State
  const activeShift = shifts.find(s => s.userId === currentUser?.id && s.status === 'Open');
  const todaySchedule = useMemo(() => {
    if (!currentUser) return undefined;
    const todayStr = new Date().toISOString().split('T')[0];
    return shiftSchedules.find(s => s.userId === currentUser.id && s.date === todayStr);
  }, [shiftSchedules, currentUser]);

  const historyShifts = useMemo(() => {
    let filtered = shifts;
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Manager') {
      filtered = filtered.filter(s => s.userId === currentUser?.id);
    }
    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [shifts, currentUser]);

  const canPlanShifts = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
  const selectedBranchId = currentUser?.branchId || settings.currentBranchId || branches[0]?.id || '';

  // Auto-clone logic for calendar (simplified version of original hook)
  useEffect(() => {
    if (activeTab !== 'planning') return;
    const currentYear = calendarDate.getFullYear();
    const currentMonth = calendarDate.getMonth();
    
    // Check if empty
    const hasCurrent = shiftSchedules.some(s => {
       const d = new Date(s.date);
       return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    if (!hasCurrent) {
       // Check prev month
       const prevDate = new Date(currentYear, currentMonth - 1, 1);
       const prevSchedules = shiftSchedules.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear();
       });

       if (prevSchedules.length > 0) {
          console.log("Auto-populating roster...");
          prevSchedules.forEach((oldSch, idx) => {
             const oldDate = new Date(oldSch.date);
             const targetDate = new Date(currentYear, currentMonth, oldDate.getDate());
             // Basic copy
             if (targetDate.getMonth() === currentMonth) {
                addShiftSchedule({
                   ...oldSch,
                   id: `auto-${Date.now()}-${idx}`,
                   date: targetDate.toISOString().split('T')[0],
                   isSwap: false
                });
             }
          });
       }
    }
  }, [activeTab, calendarDate, shiftSchedules, addShiftSchedule]);

  // Handlers
  const handleOpenAddSchedule = () => {
    setEditingScheduleId(null);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (schedule: ShiftSchedule) => {
    setEditingScheduleId(schedule.id);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (formData: any, isRecurring: boolean, recurringDays: number[]) => {
    if (editingScheduleId) {
       // Update Single
       const original = shiftSchedules.find(s => s.id === editingScheduleId);
       const isSwap = original && original.userId !== formData.userId;
       const originalUserId = (isSwap && !original?.originalUserId) ? original?.userId : original?.originalUserId;

       updateShiftSchedule({
          id: editingScheduleId,
          date: original ? original.date : planningDate,
          userId: formData.userId,
          branchId: formData.branchId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          note: formData.note,
          isSwap: isSwap || original?.isSwap,
          originalUserId: originalUserId
       });
    } else {
       // Add New
       if (isRecurring) {
          const year = calendarDate.getFullYear();
          const month = calendarDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          let count = 0;
          
          for (let i = 1; i <= daysInMonth; i++) {
             const d = new Date(year, month, i);
             if (recurringDays.includes(d.getDay())) {
                addShiftSchedule({
                   id: `sch-${Date.now()}-${count++}`,
                   date: d.toISOString().split('T')[0],
                   userId: formData.userId,
                   branchId: formData.branchId,
                   startTime: formData.startTime,
                   endTime: formData.endTime,
                   note: formData.note
                });
             }
          }
       } else {
          addShiftSchedule({
             id: `sch-${Date.now()}`,
             date: planningDate,
             userId: formData.userId,
             branchId: formData.branchId,
             startTime: formData.startTime,
             endTime: formData.endTime,
             note: formData.note
          });
       }
    }
    setIsScheduleModalOpen(false);
  };

  const handleRevertSwap = (id: string) => {
     const s = shiftSchedules.find(x => x.id === id);
     if (s && s.originalUserId) {
        if(confirm("Revert to original user?")) {
           updateShiftSchedule({ ...s, userId: s.originalUserId, originalUserId: undefined, isSwap: false });
           setIsScheduleModalOpen(false);
        }
     }
  };

  const generateZReport = (shift: Shift) => {
    // Re-implement report logic using global sales/data
    const start = new Date(shift.startTime);
    const end = shift.endTime ? new Date(shift.endTime) : new Date();
    
    const shiftSales = sales.filter(s => {
      const sDate = new Date(s.date);
      return sDate >= start && sDate <= end && s.status !== 'voided';
    });

    const salesByMethod: Record<string, number> = {};
    let totalSales = 0;
    let cashReceived = 0;
    let cashChange = 0;

    shiftSales.forEach(s => {
      const method = s.paymentMethod;
      salesByMethod[method] = (salesByMethod[method] || 0) + s.total;
      totalSales += s.total;
      if (method === 'cash') {
         cashReceived += (s.amountReceived || s.total);
         cashChange += (s.change || 0);
      }
    });

    const txns = shift.cashTransactions || [];
    const cashIn = txns.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
    const cashOut = txns.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
    const netCashSales = cashReceived - cashChange;
    const expectedCash = shift.startCash + netCashSales + cashIn - cashOut;
    const actualEndCash = shift.endCash || 0; 

    setViewingReport({
      shiftId: shift.id,
      user: users.find(u => u.id === shift.userId)?.name || 'Unknown',
      branch: branches.find(b => b.id === shift.branchId)?.name || 'Unknown',
      posMachine: shift.posId ? (posMachines.find(p => p.id === shift.posId)?.machineNumber || shift.posId) : 'N/A',
      start: start.toLocaleString(),
      end: shift.status === 'Open' ? 'Running...' : end.toLocaleString(),
      startCash: shift.startCash,
      endCash: actualEndCash,
      totalSales,
      salesByMethod,
      cashReceived,
      cashChange,
      expectedCash,
      discrepancy: actualEndCash - expectedCash,
      transactionCount: shiftSales.length,
      cashIn,
      cashOut,
      notes: shift.notes
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shift Management</h2>
          <p className="text-slate-500">Track working hours and manage staff schedules.</p>
        </div>
        
        {/* Style A: Pill Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
           <button
             onClick={() => setActiveTab('attendance')}
             className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'attendance' 
                 ? 'bg-white text-slate-900 shadow-sm' 
                 : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <Clock className="w-4 h-4 mr-2" />
             Time Clock
           </button>
           {canPlanShifts && (
             <button
               onClick={() => setActiveTab('planning')}
               className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                 activeTab === 'planning' 
                   ? 'bg-white text-slate-900 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <CalendarDays className="w-4 h-4 mr-2" />
               Roster
             </button>
           )}
        </div>
      </div>

      {activeTab === 'attendance' && (
        <ShiftAttendance 
          shifts={shifts}
          branches={branches}
          posMachines={posMachines}
          users={users}
          currentUser={currentUser}
          settings={settings}
          activeShift={activeShift}
          todaySchedule={todaySchedule}
          historyShifts={historyShifts}
          onStartShift={onStartShift}
          onEndShift={onEndShift}
          onAddCashTransaction={addCashTransaction}
          onGenerateReport={generateZReport}
        />
      )}

      {activeTab === 'planning' && (
        <ShiftRoster 
          shiftSchedules={shiftSchedules}
          shifts={shifts}
          users={users}
          branches={branches}
          canPlanShifts={canPlanShifts}
          onAddSchedule={handleOpenAddSchedule}
          onEditSchedule={handleOpenEditSchedule}
          onDeleteSchedule={deleteShiftSchedule}
          planningDate={planningDate}
          setPlanningDate={setPlanningDate}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
        />
      )}

      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        branches={branches}
        users={users}
        editingScheduleId={editingScheduleId}
        shiftSchedules={shiftSchedules}
        planningDate={planningDate}
        selectedBranchId={selectedBranchId}
        calendarDate={calendarDate}
        onSave={handleSaveSchedule}
        onRevertSwap={handleRevertSwap}
      />

      <ZReportModal 
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
