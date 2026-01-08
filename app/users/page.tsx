
'use client';
import { UserManagement } from '../../components/UserManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useGlobal();

  return (
    <UserManagement
      users={users}
      onAddUser={addUser}
      onUpdateUser={updateUser}
      onDeleteUser={deleteUser}
    />
  );
}
