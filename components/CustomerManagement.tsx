
import React, { useState } from 'react';
import { Customer, CustomerLevel, Sale } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { Plus, Search } from 'lucide-react';

// Sub-components
import { CustomerList } from './customer/CustomerList';
import { CustomerFormModal } from './customer/CustomerFormModal';
import { LevelManagement } from './customer/LevelManagement';
import { LevelFormModal } from './customer/LevelFormModal';
import { CustomerDetailProfile } from './customer/CustomerDetailProfile';

interface CustomerManagementProps {
  customers: Customer[];
  sales?: Sale[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers = [],
  sales = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}) => {
  const { 
    customerLevels, 
    addCustomerLevel, 
    updateCustomerLevel, 
    deleteCustomerLevel, 
    formatPrice 
  } = useGlobal();
  
  const safeLevels = customerLevels || []; 

  const [activeTab, setActiveTab] = useState<'customers' | 'levels'>('customers');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CustomerLevel | undefined>(undefined);

  // --- Handlers for Customer ---
  const handleOpenCustomerModal = (customer?: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleCustomerSubmit = (customer: Customer) => {
    if (customer.id) {
      onUpdateCustomer(customer);
    } else {
      onAddCustomer({ ...customer, id: `c-${Date.now()}` });
    }
  };

  const handleDeleteCustomer = (id: string) => {
    if(confirm('Are you sure you want to delete this customer?')) {
      onDeleteCustomer(id);
      if (viewingCustomer?.id === id) setViewingCustomer(null);
    }
  };

  // --- Handlers for Levels ---
  const handleOpenLevelModal = (level?: CustomerLevel) => {
    setEditingLevel(level);
    setIsLevelModalOpen(true);
  };

  const handleLevelSubmit = (level: CustomerLevel) => {
    if (level.id) {
      updateCustomerLevel(level);
    } else {
      addCustomerLevel({ ...level, id: `lvl-${Date.now()}` });
    }
  };

  const handleDeleteLevel = (id: string) => {
    if(confirm('Delete this membership level?')) {
      deleteCustomerLevel(id);
    }
  };

  if (viewingCustomer) {
    return (
      <CustomerDetailProfile 
        customer={viewingCustomer}
        sales={sales}
        formatPrice={formatPrice}
        onBack={() => setViewingCustomer(null)}
        onEdit={() => handleOpenCustomerModal(viewingCustomer)}
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Management</h2>
          <p className="text-slate-500">Manage customer profiles and membership tiers.</p>
        </div>
      </div>

      {/* Style A: Pill Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
         <button 
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
             activeTab === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Customers
        </button>
        <button 
          onClick={() => setActiveTab('levels')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
             activeTab === 'levels' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Membership Levels
        </button>
      </div>

      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
           <CustomerList 
             customers={customers}
             levels={safeLevels}
             onAdd={() => handleOpenCustomerModal()}
             onEdit={handleOpenCustomerModal}
             onDelete={handleDeleteCustomer}
             onView={setViewingCustomer}
           />
        </div>
      )}

      {activeTab === 'levels' && (
        <LevelManagement 
          levels={safeLevels}
          onAdd={() => handleOpenLevelModal()}
          onEdit={handleOpenLevelModal}
          onDelete={handleDeleteLevel}
        />
      )}

      {/* Modals */}
      <CustomerFormModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleCustomerSubmit}
        initialData={editingCustomer}
        levels={safeLevels}
      />

      <LevelFormModal 
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        onSubmit={handleLevelSubmit}
        initialData={editingLevel}
      />
    </div>
  );
};
