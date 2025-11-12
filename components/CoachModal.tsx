import React, { useState, useMemo, FC, KeyboardEvent, useEffect, useLayoutEffect, useRef } from 'react';
import { XIcon, CheckIcon, SearchIcon, TrashIcon, PencilIcon, ClipboardCheckIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';
import { CoachGoal } from '../types';
import { useToast } from '../contexts/ToastContext';

interface CoachModalProps {
  coachGoals: CoachGoal[];
  onUpdateCoachGoals: (newGoals: CoachGoal[]) => void;
}

export const CoachModal: FC<CoachModalProps> = ({ coachGoals, onUpdateCoachGoals }) => {
  const [newGoalContent, setNewGoalContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const { t, locale } = useLocale();
  const { addToast } = useToast();

  useLayoutEffect(() => {
    if (editingGoalId && editInputRef.current) {
        const textarea = editInputRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.focus();
    }
  }, [editingGoalId, editingContent]);

  const sortedGoals = useMemo(() => 
    [...coachGoals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [coachGoals]
  );

  const filteredGoals = useMemo(() =>
    sortedGoals.filter(goal =>
        goal.content.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sortedGoals, searchTerm]
  );
  
  const handleSaveEdit = () => {
    if (!editingGoalId || !editingContent.trim()) {
        handleCancelEdit();
        return;
    }
    onUpdateCoachGoals(
        coachGoals.map(goal => 
            goal.id === editingGoalId ? { ...goal, content: editingContent.trim() } : goal
        )
    );
    addToast(t('goalUpdated'), 'success');
    handleCancelEdit();
  };
  
  const handleAddGoal = () => {
      if (newGoalContent.trim()) {
          const newGoal: CoachGoal = {
              id: `goal-${Date.now()}`,
              content: newGoalContent.trim(),
              createdAt: new Date().toISOString(),
          };
          onUpdateCoachGoals([newGoal, ...coachGoals]);
          setNewGoalContent('');
          addToast(t('goalAdded'), 'success');
      }
  };

  const handleDeleteGoal = (idToDelete: string) => {
      onUpdateCoachGoals(coachGoals.filter(goal => goal.id !== idToDelete));
      if (editingGoalId === idToDelete) {
        handleCancelEdit();
      }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleAddGoal();
    }
  };
  
  const handleStartEdit = (goal: CoachGoal) => {
    if (editingGoalId) {
        handleSaveEdit();
    }
    setEditingGoalId(goal.id);
    setEditingContent(goal.content);
  };
  
  const handleCancelEdit = () => {
      setEditingGoalId(null);
      setEditingContent('');
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSaveEdit();
      } else if (e.key === 'Escape') {
          handleCancelEdit();
      }
  };
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  };
  
  return (
    <div>
        <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-1">{t('yourGoals')}</h3>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
            {t('coachGoalsDescription')}
        </p>
        <div className="flex gap-2 mb-4">
            <input
                type="text"
                value={newGoalContent}
                onChange={(e) => setNewGoalContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('addGoalPlaceholder')}
                className="flex-grow p-2 bg-base-200 dark:bg-dark-base-300/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                aria-label={t('addGoalPlaceholder')}
            />
            <button
                onClick={handleAddGoal}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
                disabled={!newGoalContent.trim()}
            >
                {t('add')}
            </button>
        </div>

        <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-dark-text-secondary pointer-events-none" />
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchGoals')}
                className="w-full p-2 pl-10 bg-base-200 dark:bg-dark-base-300/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
            />
        </div>
      
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {filteredGoals.length === 0 ? (
                 <div className="text-center py-12 px-4 text-text-secondary dark:text-dark-text-secondary border-2 border-dashed border-base-300 dark:border-dark-base-200 rounded-xl">
                    <ClipboardCheckIcon className="w-12 h-12 mx-auto text-base-300 dark:text-dark-base-200" />
                    <p className="mt-4 font-semibold text-text-primary dark:text-dark-text-primary">{searchTerm ? t('noSearchResults') : t('goalsEmpty')}</p>
                    <p className="text-sm mt-1">{searchTerm ? t('tryDifferentKeywords') : t('goalsEmptyDescription')}</p>
                </div>
            ) : (
                filteredGoals.map(goal => {
                    if (editingGoalId === goal.id) {
                        return (
                            <div key={goal.id} className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-xl border-2 border-brand-primary animate-fade-in">
                                <textarea
                                    ref={editInputRef}
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    className="w-full p-2 bg-base-200 dark:bg-dark-base-200/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm resize-none overflow-hidden"
                                    autoFocus
                                    rows={1}
                                />
                                <div className="flex justify-end items-center gap-2 mt-2">
                                    <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-base-200 dark:hover:bg-dark-base-200/50" aria-label={t('cancel')}>
                                        {t('cancel')}
                                    </button>
                                     <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded-md text-sm font-semibold bg-brand-primary text-white hover:opacity-90" aria-label={t('save')}>
                                        {t('save')}
                                    </button>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={goal.id} className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-xl border border-base-300 dark:border-dark-base-200 group relative hover:border-brand-primary/40">
                            <p className="text-sm text-text-primary dark:text-dark-text-primary pr-16 leading-relaxed">{goal.content}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-2">
                                {t('goalAddedOn', formatDate(goal.createdAt))}
                            </p>
                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleStartEdit(goal)} 
                                    className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary"
                                    aria-label={t('editGoal')}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteGoal(goal.id)} 
                                    className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                    aria-label={t('deleteGoal')}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};