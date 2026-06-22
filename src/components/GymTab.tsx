import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import type { GymSession } from '../store';

type Exercise = {
  name: string;
  sets: number;
  reps: string;
  cue?: string;
  hasWeight: boolean;
  placeholders: { weight: string; reps: string }[];
};

type RoutineSplit = {
  id: string;
  label: string;
  exercises: Exercise[];
};

const SPLITS: RoutineSplit[] = [
  {
    id: 'brust_arme',
    label: 'Brust / Arme',
    exercises: [
      { name: 'Brustpresse', sets: 4, reps: '8–12 Reps', cue: 'Sitz: Griffe Höhe obere Brust • Handgelenke starr', hasWeight: true, placeholders: Array(4).fill({ weight: '18', reps: '8' }) },
      { name: 'Butterfly', sets: 3, reps: '12–15 Reps', cue: 'Brust maximal quetschen', hasWeight: true, placeholders: Array(3).fill({ weight: '18', reps: '5' }) },
      { name: 'Seitheben', sets: 4, reps: '15 Reps', cue: 'Schlüsselübung Schulterbreite', hasWeight: true, placeholders: Array(4).fill({ weight: '4', reps: '8' }) },
      { name: 'Hammer Curls', sets: 4, reps: '8–12 Reps', cue: 'Baut Arm-Dicke von vorne', hasWeight: true, placeholders: Array(4).fill({ weight: '6', reps: '6' }) },
      { name: 'Kabel Curls', sets: 3, reps: '12–15 Reps', cue: 'Ellbogen fixieren', hasWeight: true, placeholders: Array(3).fill({ weight: '6', reps: '5' }) },
    ]
  },
  {
    id: 'bauch_beine',
    label: 'Bauch / Beine',
    exercises: [
      { name: 'Cable Crunches', sets: 4, reps: '15–20 Reps', cue: 'Rücken rund, aus dem Bauch', hasWeight: true, placeholders: Array(4).fill({ weight: '', reps: '' }) },
      { name: 'Beinheben', sets: 4, reps: 'Versagen', cue: 'Fokus unterer Bauch', hasWeight: false, placeholders: Array(4).fill({ weight: '', reps: '' }) },
      { name: 'Beinpresse', sets: 4, reps: '10 schwer', cue: 'Ganzkörper-Stimulus', hasWeight: true, placeholders: Array(4).fill({ weight: '', reps: '' }) },
      { name: 'Beinstrecker', sets: 3, reps: '15 Reps', cue: 'Quadrizeps-Definition', hasWeight: true, placeholders: Array(3).fill({ weight: '', reps: '' }) },
      { name: 'Wadenheben', sets: 4, reps: '20 Reps', cue: '', hasWeight: true, placeholders: Array(4).fill({ weight: '', reps: '' }) },
    ]
  },
  {
    id: 'ruecken_trizeps',
    label: 'Rücken / Trizeps',
    exercises: [
      { name: 'Latzug (breit)', sets: 4, reps: '10–12 Reps', cue: 'Zug zur oberen Brust', hasWeight: true, placeholders: [
        { weight: '32', reps: '15' }, { weight: '39', reps: '8' }, { weight: '36.6', reps: '7' }, { weight: '34.3', reps: '9' }
      ]},
      { name: 'Kabelrudern (eng)', sets: 3, reps: '10–12 Reps', cue: 'Rückendicke', hasWeight: true, placeholders: [
        { weight: '25', reps: '17' }, { weight: '32', reps: '9' }, { weight: '32', reps: '8' }
      ]},
      { name: 'Face Pulls', sets: 3, reps: '15 Reps', cue: 'Zug zur Stirn', hasWeight: true, placeholders: Array(3).fill({ weight: '', reps: '' }) },
      { name: 'Reverse Butterfly', sets: 3, reps: '12–15 Reps', cue: 'Brust ans Polster pressen, mit Handkanten drücken', hasWeight: true, placeholders: [
        { weight: '18', reps: '10' }, { weight: '9', reps: '16' }, { weight: '', reps: '' }
      ]},
      { name: 'Trizepsdrücken', sets: 3, reps: '12–15 Reps', cue: '', hasWeight: true, placeholders: [
        { weight: '14', reps: '17' }, { weight: '16.3', reps: '15' }, { weight: '16.3', reps: '12' }
      ]},
    ]
  }
];

type DailyState = {
  splitId: string;
  bodyWeight: string;
  imagePreview: string | null;
  workoutData: { [exerciseIdx: number]: { [setIdx: number]: { weight: string; reps: string } } };
};

export const GymTab: React.FC = () => {
  const gymSessions = useStore(state => state.gym_sessions);
  const addGymSession = useStore(state => state.addGymSession);
  const updateGymSession = useStore(state => state.updateGymSession);

  // Initialize to today's local date
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

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Make Monday = 0
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

  // Initialize or get state for current date
  const activeState = trackerState[currentDate] || {
    splitId: SPLITS[0].id,
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
      }
    }
  }, [currentDate, gymSessions, trackerState]);

  const updateActiveState = (updates: Partial<DailyState>) => {
    setTrackerState(prev => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || { splitId: SPLITS[0].id, bodyWeight: '', imagePreview: null, workoutData: {} }),
        ...updates
      }
    }));
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

  const handleSave = () => {
    const currentSplit = SPLITS.find(s => s.id === activeState.splitId)!;
    const sessionToSave: GymSession = {
      id: currentDate,
      date: currentDate,
      duration: 0,
      workout_type: activeState.splitId,
      body_weight: activeState.bodyWeight ? Number(activeState.bodyWeight) : null,
      condition_pic_url: activeState.imagePreview || '',
      exercise_data: currentSplit.exercises.map((ex, exIdx) => {
        const setsData = [];
        for (let setIdx = 0; setIdx < ex.sets; setIdx++) {
           const s = activeState.workoutData[exIdx]?.[setIdx];
           setsData.push({ reps: Number(s?.reps || 0), weight: Number(s?.weight || 0) });
        }
        return {
          id: exIdx.toString(),
          name: ex.name,
          sets: setsData
        };
      })
    };
    
    if (gymSessions.some(s => s.date === currentDate)) {
       updateGymSession(currentDate, sessionToSave);
    } else {
       addGymSession(sessionToSave);
    }
    alert("Workout gespeichert!");
  };

  const currentSplit = SPLITS.find(s => s.id === activeState.splitId)!;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden">
      
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* 1. Daily Biometric & Date Header */}
        <div className="px-6 pt-8 pb-6 border-b border-gray-100 dark:border-[#2D3748] bg-white dark:bg-[#121212]">
          {/* Custom Date Picker Button */}
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
            
            {/* Camera Trigger */}
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
              <span className="text-[10px] font-medium text-[#6B7280] text-center leading-tight">Condition<br/>Check</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageCapture}
              />
            </div>

            {/* Weight Input */}
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

        {/* 2. Dynamic Workout Split Selector (Segment Control) */}
        <div className="sticky top-0 z-40 bg-white dark:bg-[#121212] pt-4 pb-4 border-b border-gray-100 dark:border-[#2D3748]">
          <div className="px-6 flex space-x-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {SPLITS.map(split => (
              <button
                key={split.id}
                onClick={() => updateActiveState({ splitId: split.id })}
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
        </div>

        {/* 3. Hardcoded Routine Correspondence */}
        <div className="p-6 space-y-6">
          {currentSplit.exercises.map((exercise, exIdx) => (
            <div key={exIdx} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2D3748] rounded-2xl p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{exercise.name}</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#6B7280] rounded-md">
                    {exercise.sets} Sets
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F3F4F6] mt-1">{exercise.reps}</p>
                {exercise.cue && (
                  <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed bg-[#F9F9FB] dark:bg-[#1A1A1A] p-2 rounded-lg inline-block">
                    {exercise.cue}
                  </p>
                )}
              </div>

              {/* Input Grid */}
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-center space-x-3 px-2 mb-1">
                  <span className="w-6 text-xs font-bold text-[#6B7280] text-center">Set</span>
                  {exercise.hasWeight && <span className="flex-1 text-xs font-bold text-[#6B7280] text-center">Weight (kg)</span>}
                  <span className="flex-1 text-xs font-bold text-[#6B7280] text-center">Reps</span>
                </div>

                {Array.from({ length: exercise.sets }).map((_, setIdx) => {
                  const savedWeight = activeState.workoutData[exIdx]?.[setIdx]?.weight || '';
                  const savedReps = activeState.workoutData[exIdx]?.[setIdx]?.reps || '';
                  
                  // Per-set placeholders
                  const placeholderWeight = exercise.placeholders[setIdx]?.weight || 'kg';
                  const placeholderReps = exercise.placeholders[setIdx]?.reps || 'reps';

                  return (
                    <div key={setIdx} className="flex items-center space-x-3">
                      <span className="w-6 text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6] text-center">{setIdx + 1}</span>
                      
                      {exercise.hasWeight && (
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={savedWeight}
                          onChange={(e) => handleInputChange(exIdx, setIdx, 'weight', e.target.value)}
                          placeholder={placeholderWeight}
                          className="flex-1 w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] text-center rounded-xl px-2 py-2 focus:outline-none focus:border-[#8FA496] transition-colors placeholder-[#A0AEC0] dark:placeholder-[#4A5568]"
                          style={{ fontSize: '16px', minHeight: '44px' }}
                        />
                      )}
                      
                      <input 
                        type="number" 
                        inputMode="numeric"
                        value={savedReps}
                        onChange={(e) => handleInputChange(exIdx, setIdx, 'reps', e.target.value)}
                        placeholder={placeholderReps}
                        className="flex-1 w-full bg-[#F9F9FB] dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F3F4F6] text-center rounded-xl px-2 py-2 focus:outline-none focus:border-[#8FA496] transition-colors placeholder-[#A0AEC0] dark:placeholder-[#4A5568]"
                        style={{ fontSize: '16px', minHeight: '44px' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 4. Architecture & Saving */}
          <div className="pt-4">
            <button onClick={handleSave} className="w-full flex items-center justify-center space-x-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] font-semibold rounded-2xl active:scale-95 transition-transform" style={{ minHeight: '52px', fontSize: '16px' }}>
              <Save size={20} />
              <span>Save Workout Session</span>
            </button>
          </div>
        </div>

      </div>

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

                return (
                  <button
                    key={day}
                    onClick={() => handleSelectDate(day)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all mx-auto relative ${
                      isSelected
                        ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] shadow-md scale-105'
                        : 'text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
                    }`}
                  >
                    {day}
                    {!isSelected && isToday && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-sage"></span>
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
