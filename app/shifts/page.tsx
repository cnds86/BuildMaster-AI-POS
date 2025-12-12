
'use client';
import { ShiftManagement } from '../../components/ShiftManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function ShiftsPage() {
  const { shifts, branches, users, currentUser, startShift, endShift } = useGlobal();

  return (
    <ShiftManagement 
      shifts={shifts}
      branches={branches}
      users={users}
      currentUser={currentUser}
      onStartShift={startShift}
      onEndShift={endShift}
    />
  );
}
