
import React, { useMemo, useState } from 'react';
import { ShiftSchedule, Shift, User, Branch } from '../../types';
import { List, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { RosterCalendar } from './roster/RosterCalendar';
import { RosterList } from './roster/RosterList';

interface ShiftRosterProps {
  shiftSchedules: ShiftSchedule[];
  shifts: Shift[];
  users: User[];
  branches: Branch[];
  canPlanShifts: boolean;
  onAddSchedule: () => void;
  onEditSchedule: (schedule: ShiftSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  planningDate: string;
  setPlanningDate: (date: string) => void;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
}

export const ShiftRoster: React.FC<ShiftRosterProps> = ({
  shiftSchedules, shifts, users, branches, canPlanShifts, 
  onAddSchedule, onEditSchedule, onDeleteSchedule,
  planningDate, setPlanningDate, calendarDate, setCalendarDate
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter schedules for List View
  const filteredSchedules = useMemo(() => {
    return shiftSchedules.filter(s => s.date === planningDate);
  }, [shiftSchedules, planningDate]);

  if (!canPlanShifts) return null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full print:hidden">
       {/* Controls */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <h3 className="font-bold text-slate-700 flex items-center">
                 <List className="w-5 h-5 mr-2 text-slate-500" />
                 Shift Roster
             </h3>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                   onClick={() => setViewMode('list')}
                   className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                >
                   List
                </button>
                <button 
                   onClick={() => setViewMode('calendar')}
                   className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                >
                   Calendar
                </button>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
             {viewMode === 'calendar' && (
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Auto-Fills from Prev. Month
                </div>
             )}

             {viewMode === 'list' && (
                <input 
                   type="date" 
                   value={planningDate} 
                   onChange={(e) => setPlanningDate(e.target.value)}
                   className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
             )}
             <button 
                onClick={onAddSchedule}
                className="flex items-center px-4 py-2 bg-construction-orange text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
             >
                <Plus className="w-4 h-4 mr-1.5" /> Add Shift
             </button>
          </div>
       </div>

       {/* LIST VIEW */}
       {viewMode === 'list' && (
          <RosterList 
            filteredSchedules={filteredSchedules}
            planningDate={planningDate}
            users={users}
            branches={branches}
            shifts={shifts}
            onEditSchedule={onEditSchedule}
            onDeleteSchedule={onDeleteSchedule}
          />
       )}

       {/* CALENDAR VIEW */}
       {viewMode === 'calendar' && (
          <div className="flex-1 flex flex-col gap-4">
             <RosterCalendar 
               shiftSchedules={shiftSchedules}
               users={users}
               calendarDate={calendarDate}
               setCalendarDate={setCalendarDate}
               planningDate={planningDate}
               setPlanningDate={setPlanningDate}
             />

             {/* Mobile Detail List Logic Duplication Removed - Can rely on switching to list view on mobile */}
             <div className="md:hidden bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">
                   Details for {new Date(planningDate).toLocaleDateString()}
                </h4>
                {filteredSchedules.length === 0 ? (
                   <p className="text-sm text-slate-400 italic">No shifts scheduled.</p>
                ) : (
                   <div className="space-y-2">
                      {filteredSchedules.map(sch => {
                         const u = users.find(user => user.id === sch.userId);
                         return (
                            <div key={sch.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg border border-slate-100">
                               <div>
                                  <span className="font-bold text-slate-800">{u?.name}</span>
                                  <span className="text-slate-500 text-xs ml-2">{sch.startTime} - {sch.endTime}</span>
                               </div>
                               {sch.isSwap && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded">Swap</span>}
                               <div className="flex gap-2">
                                   <button onClick={() => onEditSchedule(sch)}><Edit2 className="w-4 h-4 text-slate-400"/></button>
                                   <button onClick={() => onDeleteSchedule(sch.id)}><Trash2 className="w-4 h-4 text-red-400"/></button>
                               </div>
                            </div>
                         )
                      })}
                   </div>
                )}
             </div>
          </div>
       )}
    </div>
  );
};
