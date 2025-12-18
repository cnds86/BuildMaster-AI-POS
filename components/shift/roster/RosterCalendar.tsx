
import React, { useMemo } from 'react';
import { ShiftSchedule, User } from '../../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RosterCalendarProps {
  shiftSchedules: ShiftSchedule[];
  users: User[];
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  planningDate: string;
  setPlanningDate: (date: string) => void;
}

export const RosterCalendar: React.FC<RosterCalendarProps> = ({
  shiftSchedules, users, calendarDate, setCalendarDate, planningDate, setPlanningDate
}) => {
  
  const calendarGrid = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    
    const days: { date: number; fullDate: string; schedules: ShiftSchedule[] }[] = [];
    
    for (let i = 0; i < startDay; i++) days.push({ date: 0, fullDate: '', schedules: [] });

    for (let i = 1; i <= daysInMonth; i++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const daySchedules = shiftSchedules.filter(s => s.date === fullDate);
        days.push({ date: i, fullDate, schedules: daySchedules });
    }
    return days;
  }, [calendarDate, shiftSchedules]);

  const handlePrevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
            <h3 className="font-bold text-lg text-slate-800">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5"/></button>
        </div>
        
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase text-center py-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
            {calendarGrid.map((day, idx) => {
                const isToday = day.fullDate === new Date().toISOString().split('T')[0];
                const isSelected = day.fullDate === planningDate;
                
                return (
                    <div 
                    key={idx} 
                    className={`border-b border-r border-slate-100 p-1 md:p-2 min-h-[60px] md:min-h-[100px] flex flex-col cursor-pointer transition-colors ${day.date === 0 ? 'bg-slate-50/50' : isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
                    onClick={() => {
                        if(day.date !== 0) {
                            setPlanningDate(day.fullDate);
                        }
                    }}
                    >
                    {day.date !== 0 && (
                        <>
                            <div className="flex justify-between items-start">
                                <span className={`text-xs md:text-sm font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                {day.date}
                                </span>
                                <div className="md:hidden flex gap-0.5">
                                {day.schedules.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                                </div>
                            </div>
                            <div className="hidden md:block space-y-1 overflow-y-auto max-h-[80px]">
                                {day.schedules.map(sch => {
                                const u = users.find(user => user.id === sch.userId);
                                return (
                                    <div key={sch.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border ${sch.isSwap ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {u?.name.split(' ')[0]} ({sch.startTime})
                                    </div>
                                );
                                })}
                            </div>
                        </>
                    )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};
