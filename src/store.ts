import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DailyNote = {
  id: string;
  date: number; // timestamp
  raw_text: string;
  ai_summary: string;
  mood_score: number | null;
  time_used: number; // seconds
};

export type NoteConnection = {
  id: string;
  source_note_id: string;
  target_note_id: string;
  connection_reason: string;
  strength: number; // 1-100
};

export type GymExerciseData = {
  id: string;
  name: string;
  sets: { reps: number; weight: number }[];
};

export type GymSession = {
  id: string;
  date: string; // ISO string
  duration: number; // optional tracking
  workout_type: string;
  body_weight: number | null;
  condition_pic_url: string; // base64
  exercise_data: GymExerciseData[];
};

export type FixedCost = { id: string; name: string; amount: number; };
export type Envelope = { id: string; name: string; budgeted: number; spent: number; };
export type DistributedSaving = { goalId: string; amount: number; };
export type SavingsGoalGlobal = { id: string; name: string; target: number; current: number; deadlineDate?: string; };

export type FinanceBudgetMonth = {
  id: string; // 'YYYY-MM'
  label: string;
  income: number;
  savings_goal: number;
  fix_costs: FixedCost[];
  envelopes: Envelope[];
  distributedSavings: DistributedSaving[];
};

type AppState = {
  // SETTINGS
  openai_api_key: string | null;
  setOpenAiApiKey: (key: string | null) => void;

  // NOTES
  daily_notes: DailyNote[];
  note_connections: NoteConnection[];
  addNote: (note: DailyNote) => void;
  updateNote: (id: string, updates: Partial<DailyNote>) => void;
  deleteNote: (id: string) => void;
  addNoteConnections: (connections: NoteConnection[]) => void;

  // GYM
  gym_sessions: GymSession[];
  addGymSession: (session: GymSession) => void;
  updateGymSession: (id: string, updates: Partial<GymSession>) => void;
  deleteGymSession: (id: string) => void;

  // FINANCE
  finance_months: FinanceBudgetMonth[];
  savings_goals: SavingsGoalGlobal[];
  hourly_wage: number;
  setHourlyWage: (wage: number) => void;
  addFinanceMonth: (month: FinanceBudgetMonth) => void;
  updateFinanceMonth: (id: string, updates: Partial<FinanceBudgetMonth>) => void;
  
  addSavingsGoal: (goal: SavingsGoalGlobal) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoalGlobal>) => void;
  deleteSavingsGoal: (id: string) => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // INITIAL STATE
      openai_api_key: null,
      daily_notes: [],
      note_connections: [],
      gym_sessions: [],
      finance_months: [],
      savings_goals: [],
      hourly_wage: 15,

      // ACTIONS: NOTES
      addNote: (note) => set((state) => ({ daily_notes: [note, ...state.daily_notes] })),
      updateNote: (id, updates) => set((state) => ({
        daily_notes: state.daily_notes.map(n => n.id === id ? { ...n, ...updates } : n)
      })),
      deleteNote: (id) => set((state) => ({
        daily_notes: state.daily_notes.filter(n => n.id !== id),
        note_connections: state.note_connections.filter(c => c.source_note_id !== id && c.target_note_id !== id)
      })),
      addNoteConnections: (connections) => set((state) => ({
        note_connections: [...state.note_connections, ...connections]
      })),

      // SETTINGS
      setOpenAiApiKey: (key) => set({ openai_api_key: key }),

      // ACTIONS: GYM
      addGymSession: (session) => set((state) => ({ gym_sessions: [session, ...state.gym_sessions] })),
      updateGymSession: (id, updates) => set((state) => ({
        gym_sessions: state.gym_sessions.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteGymSession: (id) => set((state) => ({
        gym_sessions: state.gym_sessions.filter(s => s.id !== id)
      })),

      // ACTIONS: FINANCE
      setHourlyWage: (wage) => set({ hourly_wage: wage }),
      addFinanceMonth: (month) => set((state) => ({ finance_months: [...state.finance_months, month] })),
      updateFinanceMonth: (id, updates) => set((state) => ({
        finance_months: state.finance_months.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      addSavingsGoal: (goal) => set((state) => ({ savings_goals: [...state.savings_goals, goal] })),
      updateSavingsGoal: (id, updates) => set((state) => ({
        savings_goals: state.savings_goals.map(g => g.id === id ? { ...g, ...updates } : g)
      })),
      deleteSavingsGoal: (id) => set((state) => ({
        savings_goals: state.savings_goals.filter(g => g.id !== id)
      }))
    }),
    {
      name: 'second-brain-storage', // key in localStorage
    }
  )
);
