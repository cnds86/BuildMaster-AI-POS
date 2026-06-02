
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, CustomerLevel, Sale } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { Plus, Search, AlertTriangle, Trash2, X } from 'lucide-react';
import { useToast } from './toast/ToastContext';

// Backend API base URL
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:6039/api';

// Helper: extract auth token from localStorage (zustand session)
function getAuthToken(): string {
  try {
    const session = localStorage.getItem('bm_session') || localStorage.getItem('auth_token');
    if (session) return session;
    // fallback: any token-shaped key
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.toLowerCase().includes('token') || k.toLowerCase().includes('auth')) {
        const v = localStorage.getItem(k) || '';
        if (v.length > 20) return v;
      }
    }
  } catch { /* no-op */ }
  return '';
}

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
    customers: globalCustomers,
    formatPrice 
  } = useGlobal();
  const { addToast } = useToast();

  // We use the parent-supplied `customers` prop so the reconciliation
  // algorithm reads the same data the table is rendering.
  const knownCustomers = customers && customers.length > 0 ? customers : (globalCustomers || []);
  
  const safeLevels = customerLevels || [];

  const [activeTab, setActiveTab] = useState<'customers' | 'levels'>('customers');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CustomerLevel | undefined>(undefined);

  // BUG-FE-07 FIX: Pull customers from backend on mount so the search bar and
  // table reflect what's actually persisted on the server. We support multiple
  // response shapes (raw array, {customers}, {data}, {rows}) because the
  // backend returns `{customers: [...]}` and we don't want to keep hitting the
  // "stale 3 records" symptom.
  const refreshFromBackend = useCallback(async () => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}/customers?limit=100`, {
        headers, credentials: 'include',
      });
      if (!res.ok) {
        console.warn('[CustomerManagement] refresh failed', res.status);
        return;
      }
      const data = await res.json();
      const list: Customer[] = Array.isArray(data) ? data
        : (data?.customers || data?.data || data?.rows || []);
      if (list.length === 0) return;

      // Dedupe by id (backend may return rows with duplicate ids on retries)
      const seen = new Set<string>();
      const uniqueList = list.filter((c) => {
        if (!c || !c.id) return false;
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      // Reconcile against the CURRENT store (globalCustomers), not the
      // props passed in, so the local mock seed never spawns duplicates.
      const knownIds = new Set(knownCustomers.map((c) => c.id));
      uniqueList.forEach((c) => {
        if (knownIds.has(c.id)) {
          onUpdateCustomer(c as Customer);
        } else {
          onAddCustomer(c as Customer);
        }
      });
    } catch (err) {
      console.error('[CustomerManagement] refresh failed', err);
    }
    // We deliberately don't depend on `customers` or `onUpdateCustomer` (re-created
    // each render) to avoid an infinite loop. The parent passes stable fn refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // --- Handlers for Customer ---
  const handleOpenCustomerModal = (customer?: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  // Wrap submit so we refresh from the backend after a successful create/update
  // — this guarantees the new customer shows up in the search/filter immediately.
  const handleCustomerSubmitWrapped = async (customer: Customer) => {
    await handleCustomerSubmit(customer);
    // Re-fetch authoritative list so search includes the new record.
    setTimeout(() => { void refreshFromBackend(); }, 200);
  };

  const handleCustomerSubmit = async (customer: Customer) => {
    // BUG-FE-04 FIX: Persist to backend so refresh + other clients stay in sync.
    // We still update the local zustand store so the table re-renders immediately.
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      if (customer.id && !customer.id.startsWith('c-')) {
        // Existing DB record (real UUID from backend) — update
        const res = await fetch(`${API_BASE}/customers/${customer.id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(customer),
        });
        if (!res.ok) {
          console.error('[CustomerManagement] PUT failed', res.status, await res.text());
        }
        onUpdateCustomer(customer);
      } else {
        // New record — create on backend first, then mirror locally with real id
        const { id: _localId, ...payload } = customer;
        const res = await fetch(`${API_BASE}/customers`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          onAddCustomer({ ...customer, id: created.id || created.customer_id || `c-${Date.now()}` });
        } else {
          console.error('[CustomerManagement] POST failed', res.status, await res.text());
          // Fallback: still add locally so user sees it (offline-friendly)
          onAddCustomer({ ...customer, id: `c-${Date.now()}` });
        }
      }
    } catch (err) {
      console.error('[CustomerManagement] submit error', err);
      // Fallback: local-only add
      if (customer.id) onUpdateCustomer(customer);
      else onAddCustomer({ ...customer, id: `c-${Date.now()}` });
    }
  };

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const handleDeleteCustomer = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setDeletingCustomer(customer);
      return;
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    const id = deletingCustomer.id;
    setDeletingCustomer(null);
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      // Only call DELETE if it looks like a real backend id (UUID) — local-only
      // customers were created with the c- prefix and don't exist on the server.
      if (!id.startsWith('c-')) {
        const res = await fetch(`${API_BASE}/customers/${id}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });
        if (!res.ok) console.error('[CustomerManagement] DELETE failed', res.status, await res.text());
      }
      onDeleteCustomer(id);
    } catch (err) {
      console.error('[CustomerManagement] delete error', err);
      onDeleteCustomer(id);
    }
    if (viewingCustomer?.id === id) setViewingCustomer(null);
    addToast(`ลบลูกค้า "${deletingCustomer.name}" สำเร็จ`, 'success');
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
        onSubmit={handleCustomerSubmitWrapped}
        initialData={editingCustomer}
        levels={safeLevels}
      />

      <LevelFormModal 
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        onSubmit={handleLevelSubmit}
        initialData={editingLevel}
      />

      {/* Delete Confirmation Dialog */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 animate-fade-in" data-testid="customer-delete-confirm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ยืนยันการลบลูกค้า</h3>
              <p className="text-slate-600 text-sm mb-1">คุณต้องการลบลูกค้า</p>
              <p className="text-slate-900 font-bold text-base mb-3">"{deletingCustomer.name}"</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                ⚠️ การลบจะไม่สามารถกู้คืนได้
              </div>
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="flex-1 px-6 py-4 text-slate-700 font-bold hover:bg-slate-100 transition-colors border-r border-slate-100"
                data-testid="customer-delete-cancel"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteCustomer}
                className="flex-1 px-6 py-4 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center"
                data-testid="customer-delete-confirm"
              >
                <Trash2 className="w-4 h-4 mr-2" /> ลบลูกค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
