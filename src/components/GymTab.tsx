import React, { useState, useRef, useEffect } from 'react';
import { Camera, Calendar, ChevronLeft, ChevronRight, Trash2, Settings, Plus, X, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import type { GymSession, RoutineSplit, GymExerciseTemplate } from '../store';

// --- Helper for Collapsible ---
const CollapsibleSection = ({ title, children, defaultOpen = true, bgClass = "bg-[#F9F9FB] dark:bg-[#1A1A1A]/30", icon: Icon }: { title: string, children: React.ReactNode, defaultOpen?: boolean, bgClass?: string, icon?: any }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`border-b border-gray-100 dark:border-[#2D3748] ${bgClass}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-6 active:bg-gray-50 dark:active:bg-[#2D3748]/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon size={20} className="text-[#6B7280]" />}
          <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{title}</h2>
        </div>
        <ChevronDown size={20} className={`text-[#1A1A1A] dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

type DailyState = {
  splitId: string;
  bodyWeight: string;
  imagePreview: string | null;
  workoutData: { [exerciseIdx: number]: { [setIdx: number]: { weight: string; reps: string } } };
};

export const GymTab: React.FC = () => {
  const gymSessions = useStore(state => state.gym_sessions);
  const gymSplits = useStore(state => state.gym_splits);
  const updateGymSplit = useStore(state => state.updateGymSplit);
  const addGymSplit = useStore(state => state.addGymSplit);
  const deleteGymSplit = useStore(state => state.deleteGymSplit);

  const defaultSplitId = gymSplits[0]?.id || '';

  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = currentDate.split('-');
    return new Date(Number(y), Number(m) - 1, 1);
  });

  const [trackerState, setTrackerState] = useState<{ [date: string]: DailyState }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Settings Modal State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsSplitId, setActiveSettingsSplitId] = useState<string | null>(defaultSplitId);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  
  const closeCalendar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsCalendarOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];
    setCurrentDate(todayStr);
    closeCalendar();
  };

  const handleSelectDate = (day: number) => {
    const newDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCurrentDate(newDateStr);
    closeCalendar();
  };

  useEffect(() => {
    if (isCalendarOpen) {
      const [y, m] = currentDate.split('-');
      setViewDate(new Date(Number(y), Number(m) - 1, 1));
    }
  }, [isCalendarOpen, currentDate]);

  const activeState = trackerState[currentDate] || {
    splitId: defaultSplitId,
    bodyWeight: '',
    imagePreview: null,
    workoutData: {}
  };

  useEffect(() => {
    if (!trackerState[currentDate]) {
      const existing = gymSessions.find(s => s.date === currentDate);
      if (existing) {
        const workoutData: any = {};
        existing.exercise_data.forEach((ex, exIdx) => {
          workoutData[exIdx] = {};
          ex.sets.forEach((set, setIdx) => {
            workoutData[exIdx][setIdx] = { weight: set.weight ? set.weight.toString() : '', reps: set.reps ? set.reps.toString() : '' };
          });
          // Ensure at least 1 set exists if the exercise was logged but empty
          if (Object.keys(workoutData[exIdx]).length === 0) {
            workoutData[exIdx][0] = { weight: '', reps: '' };
          }
        });

        setTrackerState(prev => ({
          ...prev,
          [currentDate]: {
            splitId: existing.workout_type,
            bodyWeight: existing.body_weight?.toString() || '',
            imagePreview: existing.condition_pic_url || null,
            workoutData
          }
        }));
      } else {
        // Initialize fresh day with 1 set per exercise of current split
        const split = gymSplits.find(s => s.id === defaultSplitId);
        const workoutData: any = {};
        if (split) {
          split.exercises.forEach((ex, exIdx) => {
            workoutData[exIdx] = { 0: { weight: '', reps: '' } };
          });
        }
        setTrackerState(prev => ({
          ...prev,
          [currentDate]: {
            splitId: defaultSplitId,
            bodyWeight: '',
            imagePreview: null,
            workoutData
          }
        }));
      }
    }
  }, [currentDate, gymSessions, gymSplits, defaultSplitId, trackerState]);

  const updateActiveState = (updates: Partial<DailyState>) => {
    setTrackerState(prev => {
      const stateForDate = {
        ...(prev[currentDate] || { splitId: defaultSplitId, bodyWeight: '', imagePreview: null, workoutData: {} }),
        ...updates
      };
      
      // Auto-save logic
      setTimeout(() => {
        const split = gymSplits.find(s => s.id === stateForDate.splitId);
        if (split) {
          const sessionToSave: GymSession = {
            id: currentDate,
            date: currentDate,
            duration: 0,
            workout_type: stateForDate.splitId,
            body_weight: stateForDate.bodyWeight ? Number(stateForDate.bodyWeight) : null,
            condition_pic_url: stateForDate.imagePreview || '',
            exercise_data: split.exercises.map((ex, exIdx) => {
              const setsData = [];
              const savedExData = stateForDate.workoutData[exIdx] || {};
              const numSets = Math.max(1, Object.keys(savedExData).length);
              
              for (let setIdx = 0; setIdx < numSets; setIdx++) {
                 const s = savedExData[setIdx];
                 setsData.push({ reps: Number(s?.reps || 0), weight: Number(s?.weight || 0) });
              }
              return {
                id: ex.id || exIdx.toString(),
                name: ex.name,
                sets: setsData
              };
            })
          };
          const store = useStore.getState();
          if (store.gym_sessions.some(s => s.date === currentDate)) {
             store.updateGymSession(currentDate, sessionToSave);
          } else {
             store.addGymSession(sessionToSave);
          }
        }
      }, 0);

      return {
        ...prev,
        [currentDate]: stateForDate
      };
    });
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateActiveState({ imagePreview: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (exerciseIdx: number, setIdx: number, field: 'weight'|'reps', value: string) => {
    const newWorkoutData = { ...activeState.workoutData };
    if (!newWorkoutData[exerciseIdx]) newWorkoutData[exerciseIdx] = {};
    if (!newWorkoutData[exerciseIdx][setIdx]) newWorkoutData[exerciseIdx][setIdx] = { weight: '', reps: '' };
    
    newWorkoutData[exerciseIdx][setIdx][field] = value;
    updateActiveState({ workoutData: newWorkoutData });
  };

  const handleAddSet = (exIdx: number) => {
    const newWorkoutData = { ...activeState.workoutData };
    if (!newWorkoutData[exIdx]) newWorkoutData[exIdx] = { 0: { weight: '', reps: '' } };
    const nextSetIdx = Object.keys(newWorkoutData[exIdx]).length;
    newWorkoutData[exIdx][nextSetIdx] = { weight: '', reps: '' };
    updateActiveState({ workoutData: newWorkoutData });
  };

  const handleSplitChange = (newSplitId: string) => {
    const split = gymSplits.find(s => s.id === newSplitId);
    const workoutData: any = {};
    if (split) {
      split.exercises.forEach((ex, exIdx) => {
        workoutData[exIdx] = { 0: { weight: '', reps: '' } };
      });
    }
    updateActiveState({ splitId: newSplitId, workoutData });
  };

  const currentSplit = gymSplits.find(s => s.id === activeState.splitId) || gymSplits[0];

  // --- Image Library Grouping ---
  const imagesByMonth = gymSessions
    .filter(s => s.condition_pic_url)
    .reduce((acc, s) => {
      const dateObj = new Date(s.date);
      const monthStr = dateObj.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      if (!acc[monthStr]) acc[monthStr] = [];
      acc[monthStr].push(s);
      return acc;
    }, {} as Record<string, GymSession[]>);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden">
      
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* 1. Daily Biometric & Date Header */}
        <div className="px-6 pt-8 pb-6 border-b border-gray-100 dark:border-[#2D3748] bg-white dark:bg-[#121212]">
          <div className="relative mb-6">
            <label className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">Workout Date</label>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-[#2D3748] flex items-center justify-between px-4 py-3 active:scale-[0.98] transition-transform" 
              style={{ minHeight: '48px' }}
            >
              <span className="text-[#1A1A1A] dark:text-[#F3F4F6] font-medium" style={{ fontSize: '16px' }}>
                {(() => {
                  if (!currentDate) return 'Datum wählen';
                  const [y, m, d] = currentDate.split('-');
                  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
                  return dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                })()}
              </span>
              <Calendar size={20} className="text-[#6B7280]" />
            </button>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3F4F6] mb-4">Daily Biometrics</h2>
          <div className="flex items-start space-x-4">
            
            <div className="flex flex-col items-center space-y-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] flex items-center justify-center active:scale-95 transition-transform overflow-hidden"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {activeState.imagePreview ? (
                  <img src={activeState.imagePreview} alt="Condition" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-[#6B7280]" />
                )}
              </button>
              {activeState.imagePreview ? (
                <button 
                  onClick={() => updateActiveState({ imagePreview: null })}
                  className="flex items-center space-x-1 px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-lg active:scale-95 transition-transform"
                >
                  <Trash2 size={12} />
                  <span className="text-[10px] font-bold">Löschen</span>
                </button>
              ) : (
                <span className="text-[10px] font-medium text-[#6B7280] text-center leading-tight">Condition<br/>Check</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageCapture}
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F3F4F6] block">Körpergewicht (kg)</label>
              <input 
                type="number" 
                inputMode="decimal"
                value={activeState.bodyWeight}
                onChange={(e) => updateActiveState({ bodyWeight: e.target.value })}
                placeholder="e.g. 75.5"
                className="w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#8FA496] transition-colors"
                style={{ fontSize: '16px', minHeight: '44px' }}
              />
            </div>
          </div>
        </div>

        {/* 2. Dynamic Workout Split Selector */}
        <div className="sticky top-0 z-40 bg-white dark:bg-[#121212] pt-4 pb-4 border-b border-gray-100 dark:border-[#2D3748]">
          <div className="px-6 flex space-x-2 items-center">
            <div className="flex-1 flex space-x-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              {gymSplits.map(split => (
                <button
                  key={split.id}
                  onClick={() => handleSplitChange(split.id)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-none flex-shrink-0 ${
                    activeState.splitId === split.id 
                      ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212]' 
                      : 'bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#6B7280] border border-gray-200 dark:border-[#2D3748]'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {split.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-11 h-11 flex-shrink-0 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-white transition-colors active:scale-95"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* 3. Routine Routine */}
        {currentSplit && (
          <div className="p-6 space-y-6">
            {currentSplit.exercises.map((exercise, exIdx) => {
              const savedSets = activeState.workoutData[exIdx] || { 0: { weight: '', reps: '' } };
              const setKeys = Object.keys(savedSets).map(Number);
              const numSets = setKeys.length;

              return (
                <div key={exIdx} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2D3748] rounded-2xl p-5 shadow-sm">
                  <div className="mb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{exercise.name}</h3>
                      <span className="text-xs font-semibold px-2 py-1 bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#6B7280] rounded-md">
                        {numSets} Set{numSets !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F3F4F6] mt-1">{exercise.reps}</p>
                    {exercise.cue && (
                      <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed bg-[#F9F9FB] dark:bg-[#1A1A1A] p-2 rounded-lg inline-block">
                        {exercise.cue}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-2 mb-1">
                      <span className="w-6 text-xs font-bold text-[#6B7280] text-center">Set</span>
                      {exercise.hasWeight && <span className="flex-1 text-xs font-bold text-[#6B7280] text-center">Weight (kg)</span>}
                      <span className="flex-1 text-xs font-bold text-[#6B7280] text-center">Reps</span>
                    </div>

                    {setKeys.map((setIdx) => {
                      const savedWeight = savedSets[setIdx]?.weight || '';
                      const savedReps = savedSets[setIdx]?.reps || '';
                      
                      return (
                        <div key={setIdx} className="flex items-center space-x-3 animate-fade-in-subtle">
                          <span className="w-6 text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6] text-center">{setIdx + 1}</span>
                          
                          {exercise.hasWeight && (
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={savedWeight}
                              onChange={(e) => handleInputChange(exIdx, setIdx, 'weight', e.target.value)}
                              placeholder="kg"
                              className="flex-1 w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] text-center rounded-xl px-2 py-2 focus:outline-none focus:border-[#8FA496] transition-colors placeholder-[#A0AEC0] dark:placeholder-[#4A5568]"
                              style={{ fontSize: '16px', minHeight: '44px' }}
                            />
                          )}
                          
                          <input 
                            type="number" 
                            inputMode="numeric"
                            value={savedReps}
                            onChange={(e) => handleInputChange(exIdx, setIdx, 'reps', e.target.value)}
                            placeholder="reps"
                            className="flex-1 w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] text-center rounded-xl px-2 py-2 focus:outline-none focus:border-[#8FA496] transition-colors placeholder-[#A0AEC0] dark:placeholder-[#4A5568]"
                            style={{ fontSize: '16px', minHeight: '44px' }}
                          />
                        </div>
                      );
                    })}

                    <button 
                      onClick={() => handleAddSet(exIdx)}
                      className="w-full mt-2 py-3 flex items-center justify-center space-x-2 rounded-xl border border-dashed border-gray-300 dark:border-[#4A5568] text-[#6B7280] font-medium text-sm hover:bg-[#F9F9FB] dark:hover:bg-[#1A1A1A] transition-colors active:scale-95"
                    >
                      <Plus size={16} />
                      <span>Neues Set</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Image Library */}
        <CollapsibleSection title="Condition Galerie" icon={ImageIcon} defaultOpen={false}>
          {Object.keys(imagesByMonth).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Keine Bilder hochgeladen.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(imagesByMonth).map(([month, sessions]) => (
                <div key={month}>
                  <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F3F4F6] mb-3">{month}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {sessions.map(s => (
                      <div key={s.id} className="aspect-square rounded-xl overflow-hidden relative group">
                        <img src={s.condition_pic_url} alt={`Condition on ${s.date}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-[10px] font-bold text-white">
                            {new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in-up">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-[#121212] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-[#2D3748]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#2D3748]">
              <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">Workouts anpassen</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors active:scale-95"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              {/* Split Selector in Settings */}
              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
                {gymSplits.map(split => (
                  <button
                    key={split.id}
                    onClick={() => setActiveSettingsSplitId(split.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex-shrink-0 ${
                      activeSettingsSplitId === split.id 
                        ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212]' 
                        : 'bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#6B7280] border border-gray-200 dark:border-[#2D3748]'
                    }`}
                  >
                    {split.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const newId = `split_${Date.now()}`;
                    addGymSplit({ id: newId, label: 'Neuer Plan', exercises: [] });
                    setActiveSettingsSplitId(newId);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] border border-dashed border-gray-300 dark:border-[#4A5568] font-semibold text-sm flex items-center space-x-1 flex-shrink-0"
                >
                  <Plus size={16} /> <span>Plan</span>
                </button>
              </div>

              {activeSettingsSplitId && (
                <div className="space-y-6 animate-fade-in-subtle">
                  {(() => {
                    const activeSplit = gymSplits.find(s => s.id === activeSettingsSplitId);
                    if (!activeSplit) return null;

                    return (
                      <>
                        <div className="flex items-center space-x-2">
                          <input 
                            value={activeSplit.label} 
                            onChange={(e) => updateGymSplit(activeSplit.id, { label: e.target.value })}
                            className="flex-1 bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] font-bold text-lg rounded-xl px-4 py-3 outline-none"
                          />
                          <button 
                            onClick={() => {
                              deleteGymSplit(activeSplit.id);
                              setActiveSettingsSplitId(gymSplits[0]?.id || null);
                            }}
                            className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl active:scale-95"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6] uppercase tracking-wider">Übungen</h3>
                          {activeSplit.exercises.map((ex, idx) => (
                            <div key={ex.id || idx} className="bg-[#F9F9FB] dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-[#2D3748] space-y-3 relative group">
                              <button 
                                onClick={() => {
                                  const newEx = [...activeSplit.exercises];
                                  newEx.splice(idx, 1);
                                  updateGymSplit(activeSplit.id, { exercises: newEx });
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              <input 
                                value={ex.name} 
                                onChange={(e) => {
                                  const newEx = [...activeSplit.exercises];
                                  newEx[idx].name = e.target.value;
                                  updateGymSplit(activeSplit.id, { exercises: newEx });
                                }}
                                placeholder="Übungsname"
                                className="w-[85%] bg-transparent text-[#1A1A1A] dark:text-[#F3F4F6] font-bold outline-none"
                              />
                              <div className="flex space-x-2">
                                <input 
                                  value={ex.reps} 
                                  onChange={(e) => {
                                    const newEx = [...activeSplit.exercises];
                                    newEx[idx].reps = e.target.value;
                                    updateGymSplit(activeSplit.id, { exercises: newEx });
                                  }}
                                  placeholder="Rep-Ziel (z.B. 8-12)"
                                  className="flex-1 bg-white dark:bg-[#121212] rounded-lg px-3 py-2 text-sm border border-gray-100 dark:border-[#2D3748] outline-none"
                                />
                                <button
                                  onClick={() => {
                                    const newEx = [...activeSplit.exercises];
                                    newEx[idx].hasWeight = !newEx[idx].hasWeight;
                                    updateGymSplit(activeSplit.id, { exercises: newEx });
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${ex.hasWeight ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212]' : 'bg-gray-200 dark:bg-[#2D3748] text-gray-500'}`}
                                >
                                  Gewicht
                                </button>
                              </div>
                              <input 
                                value={ex.cue || ''} 
                                onChange={(e) => {
                                  const newEx = [...activeSplit.exercises];
                                  newEx[idx].cue = e.target.value;
                                  updateGymSplit(activeSplit.id, { exercises: newEx });
                                }}
                                placeholder="Mental Cue (Optional)"
                                className="w-full bg-white dark:bg-[#121212] rounded-lg px-3 py-2 text-sm border border-gray-100 dark:border-[#2D3748] outline-none"
                              />
                            </div>
                          ))}

                          <button 
                            onClick={() => {
                              const newEx = [...activeSplit.exercises, { id: Date.now().toString(), name: 'Neue Übung', reps: '10', hasWeight: true }];
                              updateGymSplit(activeSplit.id, { exercises: newEx });
                            }}
                            className="w-full py-4 rounded-xl border border-dashed border-gray-300 dark:border-[#4A5568] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                          >
                            <Plus size={18} />
                            <span>Übung hinzufügen</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Custom Calendar Modal Overlay */}
      {isCalendarOpen && (
        <div className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`bg-white dark:bg-[#121212] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-[#2D3748] ${isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6] capitalize">
                {viewDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex space-x-2">
                <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-gray-200 dark:hover:bg-[#2D3748] transition-colors active:scale-95">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-gray-200 dark:hover:bg-[#2D3748] transition-colors active:scale-95">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-[#6B7280]">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`} className="grid grid-cols-7 gap-1 animate-fade-in-subtle">
              {Array.from({ length: getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth()) }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const isSelected = currentDate === `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                // Identify today purely for UI hint, but we only style selected heavily
                const todayStr = new Date().toISOString().split('T')[0];
                const thisDayStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = todayStr === thisDayStr;
                const hasWorkout = gymSessions.some(s => s.date === thisDayStr && s.exercise_data.some(ex => ex.sets.some(set => set.reps > 0 || set.weight > 0)));

                return (
                  <button
                    key={day}
                    onClick={() => handleSelectDate(day)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all mx-auto relative ${
                      isSelected
                        ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] shadow-md scale-105'
                        : hasWorkout
                          ? 'border-[2.5px] border-accent-sage text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
                          : 'text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
                    }`}
                  >
                    {day}
                    {!isSelected && isToday && !hasWorkout && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-accent-sage"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex space-x-3">
              <button 
                onClick={closeCalendar}
                className="flex-1 py-3 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm hover:bg-gray-200 dark:hover:bg-[#2D3748] transition-colors active:scale-[0.98]"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleSelectToday}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] font-semibold text-sm transition-colors active:scale-[0.98] shadow-sm"
              >
                Heute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
