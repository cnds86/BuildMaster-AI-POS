import React, { useState, useMemo, useEffect } from 'react';
import { Shift, Branch, User, ShiftSchedule } from '../types';
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  User as UserIcon, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle, 
  StopCircle, 
  History,
  CalendarDays,
  Plus,
  Trash2,
  List,
  X,
  Monitor
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

interface ShiftManagementProps {
  shifts: Shift[];
  branches: Branch[];
  users: User[];
  currentUser: User | null;
  onStartShift: (branchId: string, startCash: number, notes?: string) => void;
  onEndShift: (shiftId: string, endCash: number, notes?: string) => void;
}

export const ShiftManagement: React.FC<ShiftManagementProps> = ({
  shifts, branches, users, currentUser, onStartShift, onEndShift
}) => {
  const { shiftSchedules, addShiftSchedule, deleteShiftSchedule, settings, posMachines } = useGlobal();
  const [activeTab, setActiveTab] = useState<'attendance' | 'planning'>('attendance');

  // --- Attendance State ---
  const [startCash, setStartCash] = useState<string>('0');
  const [endCash, setEndCash] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(currentUser?.branchId || '');
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Auto-detect branch based on User or Device Settings
  useEffect(() => {
    if (currentUser?.branchId) {
      setSelectedBranchId(currentUser.branchId);
    } else if (settings.currentBranchId) {
      setSelectedBranchId(settings.currentBranchId);
    } else if (branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [currentUser, settings, branches]);

  // --- Planning State ---
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<Partial<ShiftSchedule>>({
    userId: '',
    branchId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    note: ''
  });

  // Find active shift for current user
  const activeShift = shifts.find(s => s.userId === currentUser?.id && s.status === 'Open');

  // Filter history (My shifts or all if admin/manager)
  const historyShifts = useMemo(() => {
    let filtered = shifts;
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Manager') {
      filtered = filtered.filter(s => s.userId === currentUser?.id);
    }
    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [shifts, currentUser]);

  // Filter schedules based on planning date
  const filteredSchedules = useMemo(() => {
    return shiftSchedules.filter(s => s.date === planningDate);
  }, [shiftSchedules, planningDate]);

  // Permissions
  const canPlanShifts = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  // --- Handlers ---

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
        alert("Please select a branch.");
        return;
    }
    onStartShift(selectedBranchId, parseFloat(startCash) || 0, notes);
    setStartCash('0');
    setNotes('');
  };

  const handleEnd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    onEndShift(activeShift.id, parseFloat(endCash) || 0, notes);
    setEndCash('0');
    setNotes('');
    setConfirmEnd(false);
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.userId || !scheduleForm.branchId || !scheduleForm.date) return;

    addShiftSchedule({
      ...scheduleForm,
      id: `sch-${Date.now()}`
    } as ShiftSchedule);
    setIsScheduleModalOpen(false);
  };

  // Resolve display names
  const currentBranchName = branches.find(b => b.id === selectedBranchId)?.name || 'Unknown Branch';
  const currentPosName = posMachines.find(p => p.id === settings.currentPosId)?.machineNumber || 'Unknown POS';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Shift Management</h2>
          <p className="text-slate-500">Track working hours and manage staff schedules.</p>
        </div>
        
        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button
             onClick={() => setActiveTab('attendance')}
             className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
               activeTab === 'attendance' 
                 ? 'bg-white text-slate-800 shadow-sm' 
                 : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <Clock className="w-4 h-4 mr-2" />
             Time Clock
           </button>
           {canPlanShifts && (
             <button
               onClick={() => setActiveTab('planning')}
               className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                 activeTab === 'planning' 
                   ? 'bg-white text-slate-800 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <CalendarDays className="w-4 h-4 mr-2" />
               Roster / Planning
             </button>
           )}
        </div>
      </div>

      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Active Shift Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center">
                   <Clock className="w-5 h-5 mr-2 text-slate-500" />
                   Current Status
                </h3>
                {activeShift ? (
                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      On Duty
                   </span>
                ) : (
                   <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wide">
                      Off Duty
                   </span>
                )}
             </div>
             
             <div className="p-6">
                {activeShift ? (
                   !confirmEnd ? (
                      <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-sm text-slate-500 mb-1">Started At</p>
                               <p className="text-xl font-bold text-slate-800">
                                  {new Date(activeShift.startTime).toLocaleTimeString()}
                               </p>
                               <p className="text-xs text-slate-400">
                                  {new Date(activeShift.startTime).toLocaleDateString()}
                               </p>
                            </div>
                            <div>
                               <p className="text-sm text-slate-500 mb-1">Opening Cash</p>
                               <p className="text-xl font-bold text-green-600">
                                  ${activeShift.startCash.toFixed(2)}
                               </p>
                            </div>
                         </div>
                         
                         <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
                            <MapPin className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                            <div>
                               <p className="font-medium text-blue-900">
                                  {branches.find(b => b.id === activeShift.branchId)?.name || 'Unknown Branch'}
                               </p>
                               <p className="text-xs text-blue-700">Currently Active Location</p>
                            </div>
                         </div>

                         <button 
                            onClick={() => setConfirmEnd(true)}
                            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center"
                         >
                            <StopCircle className="w-6 h-6 mr-2" />
                            End Shift (Clock Out)
                         </button>
                      </div>
                   ) : (
                      <form onSubmit={handleEnd} className="space-y-4 animate-fade-in">
                         <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                            <h4 className="font-bold text-slate-700 mb-2">Closing Register</h4>
                            <p className="text-xs text-slate-500">Please count the cash drawer and enter the total amount.</p>
                         </div>
                         
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Closing Cash Amount</label>
                            <div className="relative">
                               <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                               <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  required
                                  value={endCash}
                                  onChange={(e) => setEndCash(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-bold"
                               />
                            </div>
                         </div>

                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Shift Notes</label>
                            <textarea 
                               value={notes}
                               onChange={(e) => setNotes(e.target.value)}
                               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 h-24 resize-none"
                               placeholder="Any discrepancies or comments..."
                            />
                         </div>

                         <div className="flex space-x-3 pt-2">
                            <button 
                               type="button"
                               onClick={() => setConfirmEnd(false)}
                               className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                            >
                               Cancel
                            </button>
                            <button 
                               type="submit"
                               className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md"
                            >
                               Confirm Clock Out
                            </button>
                         </div>
                      </form>
                   )
                ) : (
                   <form onSubmit={handleStart} className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Location / Branch</label>
                         <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                               type="text" 
                               disabled
                               value={currentBranchName}
                               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                            />
                         </div>
                         <div className="mt-2 flex items-center text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                            <Monitor className="w-3.5 h-3.5 mr-2 text-blue-500" />
                            <span>
                               Configured Device: <span className="font-semibold text-slate-700">{currentPosName}</span>
                            </span>
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Opening Cash Amount</label>
                         <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                               type="number" 
                               step="0.01" 
                               min="0"
                               required
                               value={startCash}
                               onChange={(e) => setStartCash(e.target.value)}
                               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 font-bold"
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                         <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 h-20 resize-none"
                            placeholder="e.g. Register 2"
                         />
                      </div>

                      <button 
                         type="submit"
                         className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center"
                      >
                         <PlayCircle className="w-6 h-6 mr-2" />
                         Start Shift (Clock In)
                      </button>
                   </form>
                )}
             </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[500px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 flex items-center">
                   <History className="w-5 h-5 mr-2 text-slate-500" />
                   Recent Shift History
                </h3>
             </div>
             <div className="overflow-y-auto flex-1 p-0">
                {historyShifts.length === 0 ? (
                   <div className="p-8 text-center text-slate-400">No shift history found.</div>
                ) : (
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold sticky top-0">
                         <tr>
                            <th className="px-4 py-3">Date / User</th>
                            <th className="px-4 py-3">Duration</th>
                            <th className="px-4 py-3 text-right">Cash Out</th>
                            <th className="px-4 py-3 text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {historyShifts.map(shift => {
                            const start = new Date(shift.startTime);
                            const end = shift.endTime ? new Date(shift.endTime) : null;
                            const duration = end ? 
                               Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10 + ' hrs' : 
                               'Running';
                            
                            const user = users.find(u => u.id === shift.userId);
                            const branch = branches.find(b => b.id === shift.branchId);

                            return (
                               <tr key={shift.id} className="hover:bg-slate-50 transition-colors text-sm">
                                  <td className="px-4 py-3">
                                     <div className="font-medium text-slate-800">{start.toLocaleDateString()}</div>
                                     <div className="text-xs text-slate-500">{user?.name || 'Unknown'}</div>
                                     <div className="text-[10px] text-slate-400">{branch?.name}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                     {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                     {end ? end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                                     <div className="text-xs text-slate-400 mt-0.5">{duration}</div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono">
                                     {shift.endCash !== undefined ? `$${shift.endCash.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                     {shift.status === 'Open' ? (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">OPEN</span>
                                     ) : (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">CLOSED</span>
                                     )}
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'planning' && canPlanShifts && (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-full">
           {/* Controls */}
           <div className="lg:w-1/3 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-4">Manage Schedule</h3>
                 
                 <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                    <input 
                       type="date"
                       value={planningDate}
                       onChange={(e) => setPlanningDate(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                 </div>

                 <button 
                    onClick={() => {
                       setScheduleForm({
                          userId: '',
                          branchId: branches[0]?.id || '',
                          date: planningDate,
                          startTime: '09:00',
                          endTime: '18:00',
                          note: ''
                       });
                       setIsScheduleModalOpen(true);
                    }}
                    className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors flex items-center justify-center"
                 >
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Shift
                 </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                 <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Staff Availability
                 </h4>
                 <p className="text-xs text-blue-700">
                    Ensure shifts do not overlap for the same user. Currently displaying assignments for {new Date(planningDate).toLocaleDateString()}.
                 </p>
              </div>
           </div>

           {/* Schedule List */}
           <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-700 flex items-center">
                    <List className="w-5 h-5 mr-2 text-slate-500" />
                    Shift Roster for {new Date(planningDate).toLocaleDateString()}
                 </h3>
                 <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    {filteredSchedules.length} Shifts
                 </span>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                 {filteredSchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                       <Calendar className="w-12 h-12 mb-3 opacity-30" />
                       <p>No shifts assigned for this date.</p>
                    </div>
                 ) : (
                    filteredSchedules.map(schedule => {
                       const user = users.find(u => u.id === schedule.userId);
                       const branch = branches.find(b => b.id === schedule.branchId);
                       
                       return (
                          <div key={schedule.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors bg-white group">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                   {user?.name.charAt(0) || 'U'}
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-800">{user?.name || 'Unknown User'}</h4>
                                   <div className="flex items-center text-xs text-slate-500 mt-1">
                                      <span className="flex items-center mr-3">
                                         <MapPin className="w-3 h-3 mr-1" /> {branch?.name}
                                      </span>
                                      <span className="flex items-center">
                                         <Clock className="w-3 h-3 mr-1" /> {schedule.startTime} - {schedule.endTime}
                                      </span>
                                   </div>
                                   {schedule.note && (
                                      <p className="text-xs text-slate-400 mt-1 italic">"{schedule.note}"</p>
                                   )}
                                </div>
                             </div>
                             
                             <button 
                                onClick={() => deleteShiftSchedule(schedule.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       );
                    })
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {isScheduleModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                  <h3 className="text-lg font-bold text-slate-800">Assign Shift</h3>
                  <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Branch Location</label>
                     <select
                        required
                        value={scheduleForm.branchId}
                        onChange={(e) => setScheduleForm({...scheduleForm, branchId: e.target.value, userId: ''})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                     >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                           <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                     <select
                        required
                        value={scheduleForm.userId}
                        onChange={(e) => setScheduleForm({...scheduleForm, userId: e.target.value})}
                        disabled={!scheduleForm.branchId}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                     >
                        <option value="">Select Employee</option>
                        {users
                           .filter(u => u.branchId === scheduleForm.branchId)
                           .map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                           ))
                        }
                     </select>
                     {!scheduleForm.branchId && (
                        <p className="text-xs text-orange-500 mt-1">Please select a branch first.</p>
                     )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                        <input
                           type="time"
                           required
                           value={scheduleForm.startTime}
                           onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                        <input
                           type="time"
                           required
                           value={scheduleForm.endTime}
                           onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                     <input
                        type="text"
                        value={scheduleForm.note}
                        onChange={(e) => setScheduleForm({...scheduleForm, note: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Opening duty"
                     />
                  </div>

                  <div className="flex justify-end pt-4 space-x-3">
                     <button
                        type="button"
                        onClick={() => setIsScheduleModalOpen(false)}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                     >
                        Save Assignment
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};