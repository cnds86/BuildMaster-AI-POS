
'use client';
import { UserProfile } from '../../components/UserProfile';
import { useGlobal } from '../../context/GlobalContext';

export default function ProfilePage() {
  const { currentUser, shifts, sales } = useGlobal();

  if (!currentUser) return null;

  return (
    <UserProfile 
      user={currentUser}
      shifts={shifts}
      sales={sales}
    />
  );
}
