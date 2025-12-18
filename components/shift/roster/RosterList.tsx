
import React from 'react';
import { ShiftSchedule, Shift, User, Branch } from '../../../types';
import { Calendar, MapPin, Clock, Edit2, Trash2, ArrowRightLeft } from 'lucide-react';

interface RosterListProps {
  filteredSchedules: ShiftSchedule[];
  planningDate: string;
  users: User[];
  branches: Branch[];
  shifts: Shift[];
  onEditSchedule: (schedule: ShiftSchedule) => void;
  onDeleteSchedule: (id: string) => void;
}

export const RosterList: React.FC<RosterListProps> = ({
  filteredSchedules, planningDate, users, branches, shifts, onEditSchedule, onDeleteSchedule
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto p-4 space-y-3">
        <h4 className="font-bold text-slate-700 mb-2">Schedule for {new Date(planningDate).toLocaleDateString()}</h4>
        {filteredSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <p>No shifts assigned for this date.</p>
        </div>
        ) : (
        filteredSchedules.map(schedule => {
            const user = users.find(u => u.id === schedule.userId);
            const branch = branches.find(b => b.id === schedule.branchId);
            const originalUser = schedule.originalUserId ? users.find(u => u.id === schedule.originalUserId) : null;
            
            const actualShift = shifts.find(s => 
                s.userId === schedule.userId && 
                s.branchId === schedule.branchId &&
                new Date(s.startTime).toISOString().split('T')[0] === schedule.date
            );

            let statusBadge = <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">Scheduled</span>;
            
            if (actualShift) {
                if (actualShift.status === 'Open') {
                    statusBadge = <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 font-bold animate-pulse">Working Now</span>;
                } else {
                    statusBadge = <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">Completed</span>;
                }
            }

            return (
                <div key={schedule.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors bg-white group shadow-sm relative">
                    {schedule.isSwap && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded border border-orange-200 tracking-wide" title={`Originally assigned to ${originalUser?.name || 'Unknown'}`}>
                        <ArrowRightLeft className="w-3 h-3" /> Swapped
                    </span>
                    )}
                    <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {user?.name.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">{user?.name || 'Unknown User'}</h4>
                            {statusBadge}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                            <span className="flex items-center mr-3">
                                <MapPin className="w-3 h-3 mr-1" /> {branch?.name}
                            </span>
                            <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {schedule.startTime} - {schedule.endTime}
                            </span>
                        </div>
                    </div>
                    </div>
                    
                    <div className="flex space-x-2">
                    <button 
                        onClick={() => onEditSchedule(schedule)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Shift"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Shift"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
            );
        })
        )}
    </div>
  );
};
