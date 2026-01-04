
'use client';
import { UserManagement } from '../../components/UserManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function UsersPage() {
  // Fix: UserManagement does not accept props in its definition; it uses context internally.
  return (
    <UserManagement />
  );
}
