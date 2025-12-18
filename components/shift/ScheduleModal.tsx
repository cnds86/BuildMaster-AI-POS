
import React, { useState } from 'react';
import { Branch, User, ShiftSchedule } from '../../types';
import { ArrowRightLeft, Repeat, X } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  users: User[];
  editingScheduleId: string | null;
  shiftSchedules: ShiftSchedule[];
  planningDate: string;
  selectedBranchId: string;
  calendarDate: Date;
  onSave: (schedule: any, isRecurring: boolean, recurringDays: number[]) => void;
  onRevertSwap: (id: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen, onClose, branches, users, editingScheduleId, shiftSchedules, planningDate, selectedBranchId, calendarDate, onSave, onRevertSwap
}) => {
  const [isRecurringMode, setIsRecurringMode] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 2, 3, 4, 5]);
  
  const editingSchedule = shiftSchedules.find(s => s.id === editingScheduleId);

  const [formData, setFormData] = useState({
    userId: editingSchedule?.userId || '',
    branchId: editingSchedule?.branchId || selectedBranchId,
    startTime: editingSchedule?.startTime || '09:00',
    endTime: editingSchedule?.endTime || '18:00',
    note: editingSchedule?.note || ''
  });

  if (!isOpen) return null;

  const handleToggleDay = (dayIndex: number) => {
    if (recurringDays.includes(dayIndex)) {
        setRecurringDays(prev => prev.filter(d => d !== dayIndex));
    } else {
        setRecurringDays(prev => [...prev, dayIndex].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, isRecurringMode, recurringDays);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                {editingScheduleId ? (
                  <>
                    <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-600" />
                    Manage / Swap Shift
                  </>
                ) : (
                  'Add Schedule Shift'
                )}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                 
                 {/* Mode Toggle (Only for New) */}
                 {!editingScheduleId && (
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                       <button 
                          type="button"
                          onClick={() => setIsRecurringMode(false)}
                          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isRecurringMode ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                       >
                          Single Day
                       </button>
                       <button 
                          type="button"
                          onClick={() => setIsRecurringMode(true)}
                          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isRecurringMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                       >
                          <Repeat className="w-3 h-3 inline mr-1" /> Weekly Pattern
                       </button>
                    </div>
                 )}

                 {/* Date Selection Logic */}
                 {isRecurringMode ? (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Pattern Settings</h4>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                             Applying for {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </span>
                       </div>
                       
                       <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Repeat On Days</label>
                          <div className="flex justify-between gap-1">
                             {['S','M','T','W','T','F','S'].map((day, idx) => (
                                <button
                                   key={idx}
                                   type="button"
                                   onClick={() => handleToggleDay(idx)}
                                   className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${recurringDays.includes(idx) ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}`}
                                >
                                   {day}
                                </button>
                             ))}
                          </div>
                          <p className="text-[10px] text-blue-600 mt-2 italic">
                             * This will generate shifts for the entire selected month automatically.
                          </p>
                       </div>
                    </div>
                 ) : (
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                       <input 
                          type="date"
                          disabled={!!editingScheduleId}
                          defaultValue={editingSchedule ? editingSchedule.date : planningDate}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                          readOnly={!!editingScheduleId}
                       />
                    </div>
                 )}

                 {/* Branch Context */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                    <select 
                       required
                       value={formData.branchId}
                       onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                       disabled={true} 
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                    >
                       <option value="">Select Branch</option>
                       {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                       ))}
                    </select>
                 </div>

                 {/* Staff Selection */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                       {editingScheduleId ? "Assign To (Swap User)" : "Staff Member"}
                    </label>
                    <select 
                       required
                       value={formData.userId}
                       onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                       <option value="">Select Staff</option>
                       {users
                          .filter(u => u.branchId === formData.branchId)
                          .map(u => (
                             <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))
                       }
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                       <input 
                          type="time" 
                          required
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                       <input 
                          type="time" 
                          required
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                    <textarea 
                       value={formData.note}
                       onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                       placeholder="e.g. Morning Shift"
                    />
                 </div>

                 <div className="pt-2 flex flex-col gap-3">
                    <button 
                       type="submit"
                       className={`w-full py-3 text-white rounded-lg font-bold shadow-md transition-colors ${editingScheduleId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                       {editingScheduleId ? 'Update / Swap Schedule' : isRecurringMode ? 'Generate Monthly Roster' : 'Add Single Shift'}
                    </button>
                    
                    {editingScheduleId && editingSchedule?.isSwap && (
                       <button 
                          type="button"
                          onClick={() => onRevertSwap(editingScheduleId)}
                          className="w-full py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold hover:bg-orange-200 transition-colors flex items-center justify-center"
                       >
                          <ArrowRightLeft className="w-4 h-4 mr-2" /> Revert to Original Owner
                       </button>
                    )}
                 </div>
              </form>
           </div>
        </div>
    </div>
  );
};
