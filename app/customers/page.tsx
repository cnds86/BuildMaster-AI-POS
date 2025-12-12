
'use client';
import { CustomerManagement } from '../../components/CustomerManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useGlobal();

  return (
    <CustomerManagement
      customers={customers}
      onAddCustomer={addCustomer}
      onUpdateCustomer={updateCustomer}
      onDeleteCustomer={deleteCustomer}
    />
  );
}
