import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, Clock, X, ChevronLeft, Calendar, ChevronRight, Pencil, DownloadCloud } from 'lucide-react';
import JSZip from 'jszip';
import { useStore } from '../store';
import type { FinanceBudgetMonth, Envelope } from '../store';

// Circular Progress SVG Component
const CircularProgress = ({ current, target, size = 64 }: { current: number; target: number; size?: number }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(100, Math.max(0, (current / target) * 100));
  const dashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-[#2D3748]"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        className="text-[#1A1A1A] dark:text-[#F3F4F6] transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

// Custom Dropdown Component
const CustomSelect = ({ options, value, onChange }: { options: {id: string, name: string}[], value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.id === value) || options[0];
  
  return (
    <div className="relative flex-1">
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none transition-colors active:scale-95"
        style={{ fontSize: '16px', minHeight: '44px' }}
      >
        <span className="truncate font-medium">{selected?.name || 'Kategorie wählen'}</span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2D3748] rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in-up origin-top">
            {options.map(opt => (
              <button 
                key={opt.id} 
                type="button" 
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className="w-full text-left px-4 py-4 text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748] transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 font-medium"
              >
                {opt.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Collapsible Section Wrapper
const CollapsibleSection = ({ title, children, defaultOpen = true, bgClass = "bg-[#F9F9FB] dark:bg-[#1A1A1A]/30" }: { title: string, children: React.ReactNode, defaultOpen?: boolean, bgClass?: string }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={`border-b border-gray-100 dark:border-[#2D3748] ${bgClass}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-6 active:bg-gray-50 dark:active:bg-[#2D3748]/50 transition-colors"
      >
        <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{title}</h2>
        <ChevronDown size={20} className={`text-[#1A1A1A] dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export const FinanceTab: React.FC = () => {
  // --- GLOBAL STATE ---
  const months = useStore(state => state.finance_months);
  const addFinanceMonth = useStore(state => state.addFinanceMonth);
  const updateFinanceMonth = useStore(state => state.updateFinanceMonth);

  const savingsGoals = useStore(state => state.savings_goals);
  const addSavingsGoal = useStore(state => state.addSavingsGoal);
  const updateSavingsGoal = useStore(state => state.updateSavingsGoal);
  const deleteSavingsGoal = useStore(state => state.deleteSavingsGoal);

  const hourlyWageGlobal = useStore(state => state.hourly_wage);
  const setHourlyWageGlobal = useStore(state => state.setHourlyWage);

  const openAiApiKey = useStore(state => state.openai_api_key);
  const setOpenAiApiKey = useStore(state => state.setOpenAiApiKey);

  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);

  // --- MODALS STATE ---
  const [isPsychoModalOpen, setIsPsychoModalOpen] = useState(false);
  const [isPsychoClosing, setIsPsychoClosing] = useState(false);
  const [psychoMode, setPsychoMode] = useState<'fun'|'custom'>('fun');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCalendarClosing, setIsCalendarClosing] = useState(false);
  const [calendarGoalId, setCalendarGoalId] = useState<string | null>(null);
  
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // --- FORMS STATE ---
  const [newFcName, setNewFcName] = useState('');
  const [newFcAmount, setNewFcAmount] = useState('');
  
  const [envExpenseAmount, setEnvExpenseAmount] = useState('');
  const [envExpenseCategory, setEnvExpenseCategory] = useState('');
  
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvAmount, setNewEnvAmount] = useState('');

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');

  const [editBudgetModal, setEditBudgetModal] = useState<{ isOpen: boolean, envelopeId: string, name: string, budget: string, isClosing: boolean } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, isClosing: boolean } | null>(null);
  const [depositModal, setDepositModal] = useState<{ isOpen: boolean, goalId: string, amount: string, isClosing: boolean } | null>(null);

  const [isClosingMonth, setIsClosingMonth] = useState(false);

  // --- HELPERS & DERIVED ---
  const activeMonth = activeMonthId ? months.find(m => m.id === activeMonthId) : null;
  const activeMonthUnallocatedSavings = activeMonth ? activeMonth.savings_goal - (activeMonth.distributedSavings || []).reduce((sum, d) => sum + d.amount, 0) : 0;
  
  const derivedSavingsGoals = savingsGoals.map(g => ({
    ...g,
    current: g.current + months.reduce((sum, m) => sum + (m.distributedSavings || []).filter(d => d.goalId === g.id).reduce((s, d) => s + d.amount, 0), 0)
  }));
  
  const updateActiveMonth = (updates: Partial<FinanceBudgetMonth>) => {
    if (activeMonthId) updateFinanceMonth(activeMonthId, updates);
  };

  const totalFixedCosts = activeMonth?.fix_costs.reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const funMoney = Math.max(0, (activeMonth?.income || 0) - (activeMonth?.savings_goal || 0) - totalFixedCosts);

  // --- HANDLERS ---
  const handleCreateMonth = () => {
    const latestMonth = months[months.length - 1];
    let nextDate = new Date();
    if (latestMonth) {
       const [y, m] = latestMonth.id.split('-');
       nextDate = new Date(Number(y), Number(m), 1);
    }
    const id = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const label = nextDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    
    const newMonth: FinanceBudgetMonth = {
      id,
      label,
      income: latestMonth ? latestMonth.income : 0,
      savings_goal: latestMonth ? latestMonth.savings_goal : 0,
      fix_costs: latestMonth ? [...latestMonth.fix_costs] : [],
      envelopes: latestMonth ? latestMonth.envelopes.map(e => ({ ...e, spent: 0 })) : [],
      distributedSavings: []
    };
    
    addFinanceMonth(newMonth);
    setActiveMonthId(id);
  };

  const closePsychoModal = () => {
    setIsPsychoClosing(true);
    setTimeout(() => {
      setIsPsychoModalOpen(false);
      setIsPsychoClosing(false);
    }, 300);
  };

  const closeCalendarModal = () => {
    setIsCalendarClosing(true);
    setTimeout(() => {
      setIsCalendarOpen(false);
      setIsCalendarClosing(false);
      setCalendarGoalId(null);
    }, 300);
  };

  const handleSelectDate = (day: number) => {
    const newDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (calendarGoalId) {
      updateSavingsGoal(calendarGoalId, { deadlineDate: newDateStr });
    }
    closeCalendarModal();
  };

  const getProgressColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 85) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, isClosing: false });
  };

  const closeConfirm = () => {
    if (!confirmModal) return;
    setConfirmModal({ ...confirmModal, isClosing: true });
    setTimeout(() => setConfirmModal(null), 300);
  };

  const openEditBudget = (env: Envelope) => {
    setEditBudgetModal({ isOpen: true, envelopeId: env.id, name: env.name, budget: env.budgeted.toString(), isClosing: false });
  };

  const closeEditBudget = () => {
    if (!editBudgetModal) return;
    setEditBudgetModal({ ...editBudgetModal, isClosing: true });
    setTimeout(() => setEditBudgetModal(null), 300);
  };

  const saveEditBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBudgetModal || !activeMonth) return;
    updateActiveMonth({
        envelopes: activeMonth.envelopes.map(env => env.id === editBudgetModal.envelopeId ? { ...env, name: editBudgetModal.name, budgeted: Number(editBudgetModal.budget) } : env)
    });
    closeEditBudget();
  };

  const handleBack = () => {
    setIsClosingMonth(true);
    setTimeout(() => {
      setActiveMonthId(null);
      setIsClosingMonth(false);
    }, 300);
  };

  const openDeposit = (goalId: string) => {
    setDepositModal({ isOpen: true, goalId, amount: '', isClosing: false });
  };

  const closeDeposit = () => {
    if (!depositModal) return;
    setDepositModal({ ...depositModal, isClosing: true });
    setTimeout(() => setDepositModal(null), 300);
  };

  const saveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModal || !activeMonth) return;
    const amt = Number(depositModal.amount);
    if (amt > 0) {
      updateActiveMonth({
        distributedSavings: [...(activeMonth.distributedSavings || []), { goalId: depositModal.goalId, amount: amt }]
      });
    }
    closeDeposit();
  };

  const handleMasterExport = async () => {
    const state = useStore.getState();
    const zip = new JSZip();

    // Helper for basic CSV
    const toCSV = (data: any[]) => {
      if (!data.length) return '';
      const keys = Object.keys(data[0]);
      const header = keys.join(',') + '\n';
      const rows = data.map(obj => keys.map(k => {
        const val = obj[k];
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')).join('\n');
      return header + rows;
    };

    // 1. CSVs
    zip.file("notes.csv", toCSV(state.daily_notes));
    zip.file("finance.csv", toCSV(state.finance_months));
    
    // Gym CSV needs special handling for base64
    const cleanGymSessions = state.gym_sessions.map(s => {
      const { condition_pic_url, ...rest } = s;
      return { ...rest, has_image: !!condition_pic_url };
    });
    zip.file("gym.csv", toCSV(cleanGymSessions));

    // 2. Images
    const imgFolder = zip.folder("gym_images");
    state.gym_sessions.forEach(s => {
      if (s.condition_pic_url && s.condition_pic_url.startsWith('data:image')) {
        const base64Data = s.condition_pic_url.split(',')[1];
        // naive extension grab, defaulting to jpg
        const extMatch = s.condition_pic_url.match(/data:image\/([a-zA-Z0-9]+);base64,/);
        const ext = extMatch ? extMatch[1] : 'jpg';
        imgFolder?.file(`${s.date}_body.${ext}`, base64Data, { base64: true });
      } else if (s.condition_pic_url && s.condition_pic_url.startsWith('blob:')) {
         // Note: blo: urls are ephemeral and can't easily be exported synchronously here if they expired,
         // but our new state should use base64 if we wanted persistence. Since user asked for base64 strings in the schema:
         console.warn('Blob URL cannot be exported directly, requires fetch. Skipping:', s.condition_pic_url);
      }
    });

    // 3. Generate & Download
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SecondBrain_Backup_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- VIEWS ---
  
  if (!activeMonthId) {
    return (
      <div className="flex flex-col h-full bg-[#F9F9FB] dark:bg-[#121212] overflow-hidden animate-fade-in-up">
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          <button 
            onClick={handleCreateMonth} 
            className="w-full mb-8 py-5 rounded-2xl border border-gray-200 dark:border-[#2D3748] bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-bold text-base flex items-center justify-center space-x-2 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
             <Plus size={20} />
             <span>Neuen Monat planen</span>
          </button>

          <h2 className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-4 px-1">Deine Monate</h2>
          <div className="space-y-4">
             {months.slice().reverse().map(m => {
               const unallocated = m.savings_goal - (m.distributedSavings || []).reduce((sum, d) => sum + d.amount, 0);
               return (
                 <button 
                   key={m.id} 
                   onClick={() => setActiveMonthId(m.id)} 
                   className="w-full p-5 rounded-2xl border border-gray-100 dark:border-[#2D3748] bg-white dark:bg-[#1A1A1A] text-left shadow-sm active:scale-[0.98] transition-transform"
                 >
                    <h3 className="font-bold text-lg text-[#1A1A1A] dark:text-[#F3F4F6]">{m.label}</h3>
                    <div className="flex justify-between items-center mt-2 text-sm font-medium text-[#6B7280]">
                      <span>Einkommen: {m.income} €</span>
                      <span>Fixkosten: {m.fix_costs.reduce((s,c)=>s+c.amount,0).toFixed(2)} €</span>
                    </div>
                    {unallocated > 0 && (
                      <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-[#2D3748]">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E5D08F] shadow-[0_0_8px_rgba(229,208,143,0.6)] animate-pulse mr-3"></div>
                        <span className="text-base font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">
                          {unallocated.toLocaleString('de-DE')} € <span className="text-[#D4BA6A] font-medium">unverteilt</span>
                        </span>
                      </div>
                    )}
                 </button>
               );
             })}
          </div>

          {/* Master Export Section */}
          <div className="mt-12 mb-8 pt-8 border-t border-gray-200 dark:border-[#2D3748]">
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-4 px-1">Einstellungen & Sicherheit</h2>
            
            <div className="space-y-4">
              {/* API Key Input */}
              <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-gray-100 dark:border-[#2D3748] shadow-sm">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block">OpenAI API Key (Für Second Brain)</label>
                <input 
                  type="password" 
                  placeholder="sk-..." 
                  value={openAiApiKey || ''} 
                  onChange={(e) => setOpenAiApiKey(e.target.value)} 
                  className="w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] focus:border-[#8FA496] outline-none transition-colors"
                  style={{ fontSize: '16px', minHeight: '44px' }} 
                />
                <p className="text-[10px] text-gray-400 mt-2">Wird lokal gespeichert. Erforderlich für KI-Zusammenfassungen und Notiz-Verknüpfungen.</p>
              </div>

              {/* Export Button */}
              <button 
                onClick={handleMasterExport}
                className="w-full py-4 rounded-2xl bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-200 dark:border-[#2D3748] font-semibold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform shadow-sm"
              >
                <DownloadCloud size={18} />
                <span>Master-Export (.zip laden)</span>
              </button>
            </div>
            
            <p className="text-center text-[10px] text-gray-400 mt-4">Sichert alle Notizen, Workouts, Bilder und Budgets lokal auf dein Gerät.</p>
          </div>
          
        </div>
      </div>
    );
  }

  // Active Month View
  if (!activeMonth) return null;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden ${isClosingMonth ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-4 pt-6 pb-2">
          <button 
            onClick={handleBack} 
            className="flex items-center space-x-1 text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-[#F3F4F6] transition-colors p-2 active:scale-95"
          >
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm">Zurück</span>
          </button>
          <span className="font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{activeMonth.label}</span>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Section 1: HAUPT-BILANZ */}
        <div className="p-6 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-[#2D3748] space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5 block">Einkommen (€)</label>
                <input 
                  type="number" value={activeMonth.income || ''} 
                  onChange={(e) => updateActiveMonth({ income: Number(e.target.value) })} 
                  className="w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] focus:border-[#8FA496] outline-none transition-colors" 
                  style={{ fontSize: '16px', minHeight: '44px' }} 
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5 block">Sparziel (€)</label>
                <input 
                  type="number" value={activeMonth.savings_goal || ''} 
                  onChange={(e) => updateActiveMonth({ savings_goal: Number(e.target.value) })} 
                  className={`w-full rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border outline-none transition-colors ${activeMonth.savings_goal > activeMonth.income ? 'bg-red-50 dark:bg-red-500/10 border-red-500 dark:border-red-500 focus:border-red-500 text-red-600 dark:text-red-400' : 'bg-[#F9F9FB] dark:bg-[#1A1A1A] border-gray-100 dark:border-[#2D3748] focus:border-[#8FA496]'}`}
                  style={{ fontSize: '16px', minHeight: '44px' }} 
                />
              </div>
            </div>
            {activeMonth.savings_goal > activeMonth.income && (
              <div className="text-xs font-semibold text-red-500 dark:text-red-400 animate-fade-in-subtle text-right pr-2">
                Das Sparziel darf nicht höher als dein Einkommen sein.
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-[#2D3748] flex justify-between items-end">
            <div>
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Verfügbares Spaßgeld</h3>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6] tracking-tight">
                {funMoney.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            
            <button 
              onClick={() => setIsPsychoModalOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] active:scale-95 transition-transform"
            >
              <Clock size={20} />
            </button>
          </div>
        </div>

        {/* Section 2: FIXKOSTEN & ABO-KILLER */}
        <CollapsibleSection title="Fixkosten & Abo-Killer">
          <div className="space-y-3 mb-6">
            {activeMonth.fix_costs.length === 0 && <p className="text-sm text-gray-500">Keine Fixkosten eingetragen.</p>}
            {activeMonth.fix_costs.map(fc => (
              <div key={fc.id} className="flex justify-between items-center p-4 bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-[#2D3748] shadow-sm">
                <div>
                   <p className="font-semibold text-[#1A1A1A] dark:text-[#F3F4F6]">{fc.name}</p>
                   <p className="text-xs font-medium text-[#6B7280] mt-1">
                     {fc.amount.toFixed(2)} €/Monat <span className="text-gray-400 ml-1">({(fc.amount * 12).toFixed(2)} €/Jahr)</span>
                   </p>
                </div>
                <button onClick={() => confirmDelete('Fixkosten löschen', 'Möchtest du diesen Eintrag wirklich löschen?', () => updateActiveMonth({ fix_costs: activeMonth.fix_costs.filter(c => c.id !== fc.id) }))} className="text-gray-400 hover:text-red-500 p-2 active:scale-95">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newFcName && newFcAmount) {
              updateActiveMonth({ fix_costs: [...activeMonth.fix_costs, { id: Date.now().toString(), name: newFcName, amount: Number(newFcAmount) }] });
              setNewFcName(''); setNewFcAmount('');
            }
          }} className="flex space-x-2">
            <input 
              type="text" placeholder="Abo Name" value={newFcName} onChange={e => setNewFcName(e.target.value)} 
              className="flex-1 bg-white dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-200 dark:border-[#2D3748] outline-none" style={{ fontSize: '16px', minHeight: '44px' }} 
            />
            <input 
              type="number" step="0.01" placeholder="€" value={newFcAmount} onChange={e => setNewFcAmount(e.target.value)} 
              className="w-24 bg-white dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-200 dark:border-[#2D3748] outline-none text-center" style={{ fontSize: '16px', minHeight: '44px' }} 
            />
            <button type="submit" className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] rounded-xl px-4 flex items-center justify-center active:scale-95 transition-transform" style={{ minHeight: '44px' }}><Plus size={20} /></button>
          </form>
        </CollapsibleSection>

        {/* Section 3: UMSCHLAG-BUDGETS */}
        <CollapsibleSection title="Umschlag-Budgets" bgClass="bg-white dark:bg-[#121212]">
          <form onSubmit={(e) => {
            e.preventDefault();
            const amt = parseFloat(envExpenseAmount);
            if (!amt) return;
            const targetId = envExpenseCategory || activeMonth.envelopes[0]?.id;
            if (!targetId) return;
            
            updateActiveMonth({
              envelopes: activeMonth.envelopes.map(env => env.id === targetId ? { ...env, spent: env.spent + amt } : env)
            });
            setEnvExpenseAmount('');
          }} className="flex space-x-2 mb-8">
            <CustomSelect 
              options={activeMonth.envelopes} 
              value={envExpenseCategory || (activeMonth.envelopes[0]?.id || '')} 
              onChange={setEnvExpenseCategory} 
            />
            <input 
              type="number" step="0.01" placeholder="€ Ausgeben" value={envExpenseAmount} onChange={e => setEnvExpenseAmount(e.target.value)} 
              className="w-28 bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center" style={{ fontSize: '16px', minHeight: '44px' }} 
            />
            <button type="submit" className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] font-semibold text-sm rounded-xl px-5 active:scale-95 transition-transform" style={{ minHeight: '44px' }}>Log</button>
          </form>

          <div className="space-y-6 mb-8">
            {activeMonth.envelopes.length === 0 && <p className="text-sm text-gray-500">Keine Budgets angelegt.</p>}
            {activeMonth.envelopes.map(env => {
               const percent = Math.min(100, (env.spent / env.budgeted) * 100);
               const isExhausted = env.spent > env.budgeted;
               const barColor = getProgressColor(percent);
               
               return (
                 <div key={env.id} className="relative group">
                   <div className="flex justify-between items-end mb-2">
                     <div className="flex items-center space-x-2">
                       <span className="font-semibold text-sm text-[#1A1A1A] dark:text-[#F3F4F6]">{env.name}</span>
                       <button onClick={() => openEditBudget(env)} className="text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors"><Pencil size={12} /></button>
                       <button onClick={() => confirmDelete('Umschlag löschen', 'Möchtest du dieses Budget wirklich löschen?', () => updateActiveMonth({ envelopes: activeMonth.envelopes.filter(e => e.id !== env.id) }))} className="text-gray-300 hover:text-red-500 active:scale-95 transition-transform"><Trash2 size={14}/></button>
                     </div>
                     <span className={`text-xs font-bold tracking-wide ${isExhausted ? 'text-red-500' : 'text-[#6B7280]'}`}>
                         {env.spent.toFixed(0)} € / {env.budgeted} €
                     </span>
                   </div>
                   <div className="h-1.5 w-full bg-[#F9F9FB] dark:bg-[#2D3748]/50 rounded-full overflow-hidden border border-gray-100 dark:border-transparent">
                     <div className={`h-full rounded-full transition-all duration-700 ease-out ${isExhausted ? 'bg-red-500' : barColor}`} style={{ width: `${percent}%` }} />
                   </div>
                 </div>
               );
            })}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newEnvName && newEnvAmount) {
              const newEnv = { id: Date.now().toString(), name: newEnvName, budgeted: Number(newEnvAmount), spent: 0 };
              updateActiveMonth({ envelopes: [...activeMonth.envelopes, newEnv] });
              setNewEnvName(''); setNewEnvAmount('');
              if (!envExpenseCategory) setEnvExpenseCategory(newEnv.id);
            }
          }} className="flex space-x-2 pt-6 border-t border-gray-100 dark:border-[#2D3748]">
            <input type="text" placeholder="Neue Kategorie" value={newEnvName} onChange={e => setNewEnvName(e.target.value)} className="flex-1 bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none" style={{ fontSize: '16px', minHeight: '44px' }} />
            <input type="number" step="0.01" placeholder="Budget €" value={newEnvAmount} onChange={e => setNewEnvAmount(e.target.value)} className="w-24 bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center" style={{ fontSize: '16px', minHeight: '44px' }} />
            <button type="submit" className="bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-200 dark:border-[#2D3748] rounded-xl px-4 active:scale-95 transition-transform" style={{ minHeight: '44px' }}><Plus size={20} /></button>
          </form>
        </CollapsibleSection>

        {/* Section 4: SPARZIEL-KREISE */}
        <CollapsibleSection title="Globale Sparziele">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {derivedSavingsGoals.length === 0 && <p className="text-sm text-gray-500 col-span-2">Keine Sparziele angelegt.</p>}
            {derivedSavingsGoals.map(goal => (
              <div key={goal.id} className="bg-white dark:bg-[#121212] rounded-3xl p-5 border border-gray-100 dark:border-[#2D3748] shadow-sm flex flex-col items-center justify-center text-center relative group">
                
                <button onClick={() => confirmDelete('Sparziel löschen', 'Möchtest du dieses Sparziel wirklich löschen?', () => deleteSavingsGoal(goal.id))} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 active:scale-95 transition-transform"><Trash2 size={16}/></button>

                <div className="relative mb-3 mt-2 flex items-center justify-center">
                  <CircularProgress current={goal.current} target={goal.target} size={72} />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-xs font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{Math.floor((goal.current / goal.target) * 100)}%</span>
                  </div>
                </div>
                
                <span className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F3F4F6] leading-tight mb-1">{goal.name}</span>
                <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-2">{goal.current} / {goal.target} €</span>
                
                {/* Deposit Button */}
                {activeMonthUnallocatedSavings > 0 && (
                  <button 
                    onClick={() => openDeposit(goal.id)}
                    className="w-10 h-10 rounded-full bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95 mb-2 border border-gray-100 dark:border-[#2D3748]"
                  >
                    <Plus size={18} />
                  </button>
                )}

                {/* Deadline Button */}
                <button 
                  onClick={() => { setIsCalendarOpen(true); setCalendarGoalId(goal.id); }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-lg text-xs font-medium text-[#6B7280] hover:text-[#1A1A1A] active:scale-95 transition-transform"
                >
                  <Calendar size={12} />
                  <span>{goal.deadlineDate ? new Date(goal.deadlineDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Deadline'}</span>
                </button>
              </div>
            ))}
          </div>
          
          {activeMonthUnallocatedSavings > 0 && (
            <div className="mb-10 flex flex-col items-center justify-center text-center animate-fade-in-subtle">
              <span className="text-xs font-bold text-[#D4BA6A] uppercase tracking-[0.2em] mb-3">Offenes Budget</span>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-[#E5D08F] shadow-[0_0_15px_rgba(229,208,143,0.6)] animate-pulse"></div>
                <span className="text-5xl font-black text-[#1A1A1A] dark:text-[#F3F4F6] tracking-tighter">
                  {activeMonthUnallocatedSavings.toLocaleString('de-DE')} <span className="text-3xl text-[#D4BA6A] font-bold">€</span>
                </span>
              </div>
              <p className="text-sm text-[#6B7280] mt-4 font-medium">noch bereit zum Verteilen in deine Sparziele</p>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newGoalName && newGoalAmount) {
              addSavingsGoal({ id: Date.now().toString(), name: newGoalName, target: Number(newGoalAmount), current: 0 });
              setNewGoalName(''); setNewGoalAmount('');
            }
          }} className="flex space-x-2 pt-6 border-t border-gray-200 dark:border-[#2D3748]">
            <input type="text" placeholder="Neues Sparziel" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="flex-1 bg-white dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-200 dark:border-[#2D3748] outline-none" style={{ fontSize: '16px', minHeight: '44px' }} />
            <input type="number" step="1" placeholder="Ziel €" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} className="w-24 bg-white dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-200 dark:border-[#2D3748] outline-none text-center" style={{ fontSize: '16px', minHeight: '44px' }} />
            <button type="submit" className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] rounded-xl px-4 flex items-center justify-center active:scale-95 transition-transform" style={{ minHeight: '44px' }}><Plus size={20} /></button>
          </form>
        </CollapsibleSection>

      </div>

      {/* Psycho-Tracker Modal */}
      {isPsychoModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity duration-300 ${isPsychoClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={closePsychoModal} />
          <div className={`relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-2xl ${isPsychoClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
            <button onClick={closePsychoModal} className="absolute top-5 right-5 text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors active:scale-95"><X size={24} /></button>
            
            <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-6 text-center">Psycho-Tracker</h2>
            
            {/* Hourly Wage Input (Global) */}
            <div className="mb-6">
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block text-center">Dein Stundenlohn (€)</label>
              <input 
                type="number" value={hourlyWageGlobal} onChange={(e) => setHourlyWageGlobal(Number(e.target.value))} 
                className="w-full bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center font-bold text-lg" 
              />
            </div>

            {/* Mode Switcher */}
            <div className="flex space-x-2 bg-[#F9F9FB] dark:bg-[#121212] p-1 rounded-xl mb-6">
              <button onClick={() => setPsychoMode('fun')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${psychoMode === 'fun' ? 'bg-white dark:bg-[#1A1A1A] shadow-sm text-[#1A1A1A] dark:text-[#F3F4F6]' : 'text-gray-500'}`}>Spaßgeld</button>
              <button onClick={() => setPsychoMode('custom')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${psychoMode === 'custom' ? 'bg-white dark:bg-[#1A1A1A] shadow-sm text-[#1A1A1A] dark:text-[#F3F4F6]' : 'text-gray-500'}`}>Wunschkauf</button>
            </div>
            
            <div className="min-h-[140px] flex flex-col justify-center items-center">
              {psychoMode === 'fun' ? (
                <div className="text-center animate-fade-in-subtle">
                  <p className="text-sm text-[#6B7280] mb-2">Dein Spaßgeld diesen Monat entspricht</p>
                  <p className="text-4xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{(funMoney / (hourlyWageGlobal || 1)).toFixed(1)} <span className="text-2xl text-gray-400">h</span></p>
                  <p className="text-sm text-[#6B7280] mt-2">harter Arbeit.</p>
                </div>
              ) : (
                <div className="w-full space-y-4 animate-fade-in-subtle">
                  <input 
                    type="text" placeholder="Was willst du kaufen?" value={customItemName} onChange={e => setCustomItemName(e.target.value)} 
                    className="w-full bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center" 
                  />
                  <input 
                    type="number" placeholder="Preis (€)" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} 
                    className="w-full bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center font-bold" 
                  />
                  {customItemPrice && hourlyWageGlobal > 0 && (
                    <div className="pt-4 text-center">
                      <p className="text-sm text-[#6B7280]">Das kostet dich</p>
                      <p className="text-3xl font-bold text-red-500 my-1">{(Number(customItemPrice) / hourlyWageGlobal).toFixed(1)} <span className="text-xl opacity-80">h</span></p>
                      <p className="text-sm text-[#6B7280]">Lebenszeit.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Custom Calendar Modal Overlay */}
      {isCalendarOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-opacity duration-300 ${isCalendarClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCalendarModal} />
          <div className={`relative bg-white dark:bg-[#121212] w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-[#2D3748] ${isCalendarClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6] capitalize">
                {viewDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex space-x-2">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F9F9FB] dark:bg-[#1A1A1A] hover:bg-gray-200 transition-colors active:scale-95"><ChevronLeft size={20} /></button>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F9F9FB] dark:bg-[#1A1A1A] hover:bg-gray-200 transition-colors active:scale-95"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => <div key={day} className="text-center text-xs font-semibold text-[#6B7280]">{day}</div>)}
            </div>

            <div key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`} className="grid grid-cols-7 gap-1 animate-fade-in-subtle">
              {Array.from({ length: (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
              
              {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                return (
                  <button
                    key={day} onClick={() => handleSelectDate(day)}
                    className="h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748] transition-all mx-auto active:scale-95"
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex space-x-3">
              <button onClick={closeCalendarModal} className="w-full py-3 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm hover:bg-gray-200 transition-colors active:scale-[0.98]">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center px-6 transition-opacity duration-300 ${confirmModal.isClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeConfirm} />
          <div className={`relative w-full max-w-xs bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl text-center ${confirmModal.isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
            <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-[#6B7280] mb-6">{confirmModal.message}</p>
            <div className="flex space-x-3">
              <button onClick={closeConfirm} className="flex-1 py-3 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm active:scale-95 transition-transform">Abbrechen</button>
              <button onClick={() => { confirmModal.onConfirm(); closeConfirm(); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm active:scale-95 transition-transform shadow-sm">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editBudgetModal && (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center px-6 transition-opacity duration-300 ${editBudgetModal.isClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditBudget} />
          <div className={`relative w-full max-w-xs bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-2xl ${editBudgetModal.isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
            <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-6 text-center">Budget bearbeiten</h3>
            <form onSubmit={saveEditBudget} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block text-center">Kategorie Name</label>
                <input 
                  type="text" value={editBudgetModal.name} onChange={e => setEditBudgetModal({...editBudgetModal, name: e.target.value})} 
                  className="w-full bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center font-bold text-lg" 
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block text-center">Budget Summe (€)</label>
                <input 
                  type="number" step="0.01" value={editBudgetModal.budget} onChange={e => setEditBudgetModal({...editBudgetModal, budget: e.target.value})} 
                  className="w-full bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center font-bold text-lg" 
                />
              </div>
              <div className="flex space-x-3 mt-8">
                <button type="button" onClick={closeEditBudget} className="flex-1 py-3 rounded-xl bg-[#F9F9FB] dark:bg-[#121212] border border-gray-100 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm active:scale-95 transition-transform">Abbrechen</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] font-semibold text-sm active:scale-95 transition-transform shadow-sm">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <div className={`fixed inset-0 z-[120] flex items-center justify-center px-6 transition-opacity duration-300 ${depositModal.isClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDeposit} />
          <div className={`relative w-full max-w-xs bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-2xl ${depositModal.isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
            <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-2 text-center">Geld einzahlen</h3>
            <p className="text-sm text-[#6B7280] mb-6 text-center">Noch <strong className="text-[#1A1A1A] dark:text-white">{activeMonthUnallocatedSavings} €</strong> verfügbar</p>
            <form onSubmit={saveDeposit} className="space-y-4">
              <div>
                <input 
                  type="number" step="0.01" max={activeMonthUnallocatedSavings} value={depositModal.amount} onChange={e => setDepositModal({...depositModal, amount: e.target.value})} 
                  placeholder="Summe in €" autoFocus
                  className="w-full bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 text-[#1A1A1A] dark:text-[#F3F4F6] border border-gray-100 dark:border-[#2D3748] outline-none text-center font-bold text-xl" 
                />
              </div>
              <div className="flex space-x-3 mt-8">
                <button type="button" onClick={closeDeposit} className="flex-1 py-3 rounded-xl bg-[#F9F9FB] dark:bg-[#121212] border border-gray-100 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm active:scale-95 transition-transform">Abbrechen</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] font-semibold text-sm active:scale-95 transition-transform shadow-sm">Einzahlen</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
