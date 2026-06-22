import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock, Plus, Trash2, Sparkles, X } from 'lucide-react';

import { useStore } from '../store';
import type { DailyNote } from '../store';
import { processNoteWithAI } from '../aiService';

export const NotesTab: React.FC = () => {
  const notes = useStore(state => state.daily_notes);
  const addNote = useStore(state => state.addNote);
  const updateNote = useStore(state => state.updateNote);
  const deleteNoteFromStore = useStore(state => state.deleteNote);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  const [swipedNoteId, setSwipedNoteId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  
  // Long-Press Quick Card State
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [quickCardNote, setQuickCardNote] = useState<DailyNote | null>(null);
  const isLongPressActive = useRef(false);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Editor State
  const [editorContent, setEditorContent] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10:00 limit
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Format Helpers
  const formatTimeSpent = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Grouping Logic
  const groupNotes = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    const groups: { [key: string]: typeof notes } = {
      'Heute': [],
      'Letzte 7 Tage': [],
      'Letzte 30 Tage': []
    };

    notes.slice().sort((a, b) => b.date - a.date).forEach(note => {
      if (note.date >= todayStart) {
        groups['Heute'].push(note);
      } else if (note.date >= sevenDaysAgo) {
        groups['Letzte 7 Tage'].push(note);
      } else if (note.date >= thirtyDaysAgo) {
        groups['Letzte 30 Tage'].push(note);
      } else {
        const dateObj = new Date(note.date);
        const monthYear = dateObj.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(note);
      }
    });

    return groups;
  };

  const groupedNotes = groupNotes();

  // Handlers
  const openNote = (noteId: string | null) => {
    if (noteId) {
      const existing = notes.find(n => n.id === noteId);
      if (existing) {
        setEditorContent(existing.raw_text);
        setTimeLeft(Math.max(0, 600 - existing.time_used));
      }
    } else {
      // New Note
      setEditorContent('');
      setTimeLeft(600);
    }
    setIsTimerRunning(false);
    setActiveNoteId(noteId || 'new');
  };

  const handleBack = () => {
    setIsTimerRunning(false);
    
    // Auto-Save Logic
    if (editorContent.trim() !== '') {
      const timeSpent = 600 - timeLeft;
      
        if (activeNoteId === 'new') {
          const newId = Date.now().toString();
          addNote({
            id: newId,
            raw_text: editorContent,
            date: Date.now(),
            time_used: timeSpent,
            ai_summary: '',
            mood_score: null
          });
          processNoteWithAI(newId, editorContent); // Fire & Forget
        } else if (activeNoteId) {
          const oldNote = notes.find(n => n.id === activeNoteId);
          updateNote(activeNoteId, {
            raw_text: editorContent,
            time_used: timeSpent
          });
          if (!oldNote || oldNote.raw_text !== editorContent) {
            processNoteWithAI(activeNoteId, editorContent); // Fire & Forget
          }
        }
    }
    
    // Return to list view
    setActiveNoteId(null);
  };

  const deleteNote = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = () => {
    if (deleteConfirmId) {
      deleteNoteFromStore(deleteConfirmId);
      setSwipedNoteId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
    if (!isTimerRunning && e.target.value.trim().length > 0) {
      setIsTimerRunning(true);
    }
  };

  // View: Editor
  if (activeNoteId !== null) {
    return (
      <div key="editor" className="flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden animate-fade-in-up">
        {/* Editor Header */}
        <div className="flex justify-between items-center px-4 pt-6 pb-4 border-b border-gray-100 dark:border-[#2D3748]">
          <button 
            onClick={handleBack} 
            className="flex items-center space-x-1 text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-[#F3F4F6] transition-colors p-2 active:scale-95"
          >
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm">Zurück</span>
          </button>
          
          <div className="flex items-center space-x-2 text-[#6B7280] mr-2">
            <Clock size={16} />
            <span className="text-base font-semibold tracking-wide" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>

        {/* Fullscreen Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <textarea
            value={editorContent}
            onChange={handleContentChange}
            placeholder="Start thinking on paper..."
            className="flex-1 w-full bg-transparent text-[#1A1A1A] dark:text-[#F3F4F6] placeholder-[#A0AEC0] dark:placeholder-[#4A5568] resize-none focus:outline-none leading-relaxed pb-32"
            style={{ fontSize: '16px' }}
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  // View: Overview List
  return (
    <div key="list" className="flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden animate-fade-in-up">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-8 px-6 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* Top New Note Button */}
        <button 
          onClick={() => openNote(null)} 
          className="w-full mb-8 py-4 rounded-2xl border border-gray-200 dark:border-[#2D3748] bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-gray-100 dark:hover:bg-[#2D3748] transition-colors active:scale-[0.98]"
        >
           <Plus size={18} />
           <span>Neue Notiz</span>
        </button>
        
        {/* Empty State */}
        {notes.length === 0 && (
          <div className="text-center text-[#6B7280] text-sm mt-12 mb-12">
            Keine Notizen vorhanden.
          </div>
        )}

        {/* Dynamic Groups */}
        {Object.entries(groupedNotes).map(([groupName, groupNotes]) => {
           if (groupNotes.length === 0) return null;
           return (
             <div key={groupName} className="mb-8">
               <h3 className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-3 px-1">
                 {groupName}
               </h3>
               <div className="space-y-3">
                 {groupNotes.map(note => {
                   const preview = note.raw_text.split('\n')[0].substring(0, 40) || 'Leere Notiz';
                   const displayDate = groupName === 'Heute' 
                      ? 'Heute' 
                      : new Date(note.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });

                   return (
                     <div key={note.id} className="relative w-full rounded-2xl bg-red-500 overflow-hidden">
                       {/* Hidden Delete Button (Underneath) */}
                       <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center">
                         <button 
                           onClick={() => deleteNote(note.id)} 
                           className="w-full h-full text-white font-bold flex flex-col items-center justify-center text-xs active:scale-95 transition-transform"
                         >
                           <Trash2 size={20} className="mb-1" />
                           Löschen
                         </button>
                       </div>

                       {/* Foreground Note Card */}
                       <button 
                         onTouchStart={(e) => {
                           touchStartX.current = e.touches[0].clientX;
                           isLongPressActive.current = false;
                           const timer = setTimeout(() => {
                             isLongPressActive.current = true;
                             setQuickCardNote(note);
                           }, 500); // 500ms for long press
                           setLongPressTimer(timer);
                         }}
                         onTouchEnd={(e) => {
                           if (longPressTimer) clearTimeout(longPressTimer);
                           if (touchStartX.current !== null) {
                             const touchEndX = e.changedTouches[0].clientX;
                             const delta = touchStartX.current - touchEndX;
                             if (delta > 40 && !isLongPressActive.current) {
                               setSwipedNoteId(note.id); // swiped left
                             } else if (delta < -40 && !isLongPressActive.current) {
                               if (swipedNoteId === note.id) setSwipedNoteId(null); // swiped right
                             }
                             touchStartX.current = null;
                           }
                         }}
                         onTouchMove={() => {
                           if (longPressTimer) clearTimeout(longPressTimer);
                         }}
                         onMouseDown={() => {
                           isLongPressActive.current = false;
                           const timer = setTimeout(() => {
                             isLongPressActive.current = true;
                             setQuickCardNote(note);
                           }, 500);
                           setLongPressTimer(timer);
                         }}
                         onMouseUp={() => {
                           if (longPressTimer) clearTimeout(longPressTimer);
                         }}
                         onMouseLeave={() => {
                           if (longPressTimer) clearTimeout(longPressTimer);
                         }}
                         onClick={() => {
                           if (isLongPressActive.current) return; // Prevent click if it was a long press
                           if (swipedNoteId === note.id) {
                             setSwipedNoteId(null);
                           } else {
                             openNote(note.id);
                           }
                         }} 
                         className={`relative z-10 w-full text-left p-4 rounded-2xl border border-gray-100 dark:border-[#2D3748] bg-white dark:bg-[#121212] transition-transform duration-300 shadow-sm ${
                           swipedNoteId === note.id ? '-translate-x-24' : 'translate-x-0'
                         }`}
                       >
                         <p className="text-[#1A1A1A] dark:text-[#F3F4F6] font-medium text-base truncate mb-1.5 flex items-center justify-between">
                           <span className="truncate">{preview}</span>
                           {note.ai_summary && <Sparkles size={14} className="text-[#D4BA6A] ml-2 flex-shrink-0" />}
                         </p>
                         <p className="text-[#6B7280] text-xs font-medium">
                           {displayDate} • {formatTimeSpent(note.time_used)} Min genutzt
                         </p>
                       </button>
                     </div>
                   );
                 })}
               </div>
             </div>
           )
        })}

        {/* Bottom New Note Button (Convenience) */}
        {notes.length > 3 && (
          <button 
            onClick={() => openNote(null)} 
            className="w-full mt-4 py-4 rounded-2xl border border-gray-200 dark:border-[#2D3748] bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-gray-100 dark:hover:bg-[#2D3748] transition-colors active:scale-[0.98]"
          >
             <Plus size={18} />
             <span>Neue Notiz</span>
          </button>
        )}
      </div>

      {/* Quick Card Popover (Long Press) */}
      {quickCardNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fade-in-up">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setQuickCardNote(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl">
            <button onClick={() => setQuickCardNote(null)} className="absolute top-4 right-4 text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors active:scale-95"><X size={20} /></button>
            
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={18} className="text-[#D4BA6A]" />
              <h3 className="font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">KI-Zusammenfassung</h3>
            </div>
            
            <p className="text-sm text-[#6B7280] leading-relaxed mb-6 font-medium">
              {quickCardNote.ai_summary || 'Noch keine Zusammenfassung verfügbar. Lade API-Key in den Finanzen hoch und bearbeite die Notiz.'}
            </p>
            
            {quickCardNote.mood_score !== null && quickCardNote.mood_score !== undefined && (
              <div className="flex justify-between items-center bg-[#F9F9FB] dark:bg-[#121212] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#2D3748]">
                <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Mood Score</span>
                <span className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">{quickCardNote.mood_score} / 10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6 animate-fade-in-up">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-2">Notiz löschen</h3>
            <p className="text-sm text-[#6B7280] mb-6">Möchtest du diese Notiz wirklich endgültig löschen?</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-[#F9F9FB] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F3F4F6] font-semibold text-sm active:scale-95 transition-transform border border-gray-100 dark:border-[#2D3748]">Abbrechen</button>
              <button onClick={executeDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm active:scale-95 transition-transform shadow-sm">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
