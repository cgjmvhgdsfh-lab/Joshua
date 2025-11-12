import React, { useState, useMemo, FC, KeyboardEvent, useEffect, useLayoutEffect, useRef } from 'react';
import { XIcon, CheckIcon, SearchIcon, TrashIcon, PencilIcon, BrainCircuitIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';
import { MemoryFact } from '../types';
import { useToast } from '../contexts/ToastContext';

interface MemoryModalProps {
  memoryFacts: MemoryFact[];
  onUpdateMemory: (newMemory: MemoryFact[]) => void;
}

export const MemoryModal: FC<MemoryModalProps> = ({ memoryFacts, onUpdateMemory }) => {
  const [newFactContent, setNewFactContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const { t, locale } = useLocale();
  const { addToast } = useToast();
  const [showClearMemoryConfirm, setShowClearMemoryConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setShowClearMemoryConfirm(false);
        }
    };

    if (showClearMemoryConfirm) {
        document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showClearMemoryConfirm]);

  useLayoutEffect(() => {
    if (editingFactId && editInputRef.current) {
        const textarea = editInputRef.current;
        textarea.style.height = 'auto'; // Reset height to shrink if needed
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.focus();
    }
  }, [editingFactId, editingContent]);


  const sortedFacts = useMemo(() => 
    [...memoryFacts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [memoryFacts]
  );

  const filteredFacts = useMemo(() =>
    sortedFacts.filter(fact =>
        fact.content.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sortedFacts, searchTerm]
  );
  
  const handleSaveEdit = () => {
    if (!editingFactId || !editingContent.trim()) {
        handleCancelEdit();
        return;
    }
    onUpdateMemory(
        memoryFacts.map(fact => 
            fact.id === editingFactId ? { ...fact, content: editingContent.trim() } : fact
        )
    );
    addToast(t('factUpdated'), 'success');
    handleCancelEdit();
  };
  
  const handleAddFact = () => {
      if (newFactContent.trim()) {
          const newFact: MemoryFact = {
              id: `manual-${Date.now()}`,
              content: newFactContent.trim(),
              createdAt: new Date().toISOString(),
          };
          onUpdateMemory([newFact, ...memoryFacts]);
          setNewFactContent('');
          addToast(t('factAdded'), 'success');
      }
  };

  const handleDeleteFact = (idToDelete: string) => {
      onUpdateMemory(memoryFacts.filter(fact => fact.id !== idToDelete));
      if (editingFactId === idToDelete) {
        handleCancelEdit();
      }
  };
  
  const handleClearMemory = () => {
    onUpdateMemory([]);
    addToast(t('memoryCleared'), 'success');
    setShowClearMemoryConfirm(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleAddFact();
    }
  };
  
  const handleStartEdit = (fact: MemoryFact) => {
    if (editingFactId) { // Save any other fact being edited before starting a new one
        handleSaveEdit();
    }
    setEditingFactId(fact.id);
    setEditingContent(fact.content);
  };
  
  const handleCancelEdit = () => {
      setEditingFactId(null);
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
    <>
    <div>
        <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-1">{t('memory')}</h3>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
            {t('memoryDescription')}
        </p>
        <div className="flex gap-2 mb-4">
            <input
                type="text"
                value={newFactContent}
                onChange={(e) => setNewFactContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('addFactPlaceholder')}
                className="flex-grow p-2 bg-base-200 dark:bg-dark-base-300/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                aria-label={t('addFactPlaceholder')}
            />
            <button
                onClick={handleAddFact}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
                disabled={!newFactContent.trim()}
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
                placeholder={t('searchMemory')}
                className="w-full p-2 pl-10 bg-base-200 dark:bg-dark-base-300/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
            />
        </div>
      
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {filteredFacts.length === 0 ? (
                 <div className="text-center py-12 px-4 text-text-secondary dark:text-dark-text-secondary border-2 border-dashed border-base-300 dark:border-dark-base-200 rounded-xl">
                    <BrainCircuitIcon className="w-12 h-12 mx-auto text-base-300 dark:text-dark-base-200" />
                    <p className="mt-4 font-semibold text-text-primary dark:text-dark-text-primary">{searchTerm ? t('noSearchResults') : t('memoryEmpty')}</p>
                    <p className="text-sm mt-1">{searchTerm ? t('tryDifferentKeywords') : t('memoryEmptyDescription')}</p>
                </div>
            ) : (
                filteredFacts.map(fact => {
                    if (editingFactId === fact.id) {
                        return (
                            <div key={fact.id} className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-xl border-2 border-brand-primary animate-fade-in">
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
                        <div key={fact.id} className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-xl border border-base-300 dark:border-dark-base-200 group relative hover:border-brand-primary/40">
                            <p className="text-sm text-text-primary dark:text-dark-text-primary pr-16 leading-relaxed">{fact.content}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-2">
                                {t('memoryFactAddedOn', formatDate(fact.createdAt))}
                            </p>
                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleStartEdit(fact)} 
                                    className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary"
                                    aria-label={t('editFact')}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteFact(fact.id)} 
                                    className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                    aria-label={t('deleteFact')}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
        {memoryFacts.length > 0 && (
            <div className="mt-6">
                 <button onClick={() => setShowClearMemoryConfirm(true)} className="w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors bg-red-500/5 hover:bg-red-500/10 border border-red-500/20">
                    <div>
                        <p className="font-semibold text-red-600 dark:text-red-400">{t('clearMemory')}</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">{t('clearMemoryDescription')}</p>
                    </div>
                    <TrashIcon className="w-5 h-5 text-red-500"/>
                </button>
            </div>
        )}
    </div>

    {showClearMemoryConfirm && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowClearMemoryConfirm(false)}>
             <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-base-300 dark:border-dark-base-200" onClick={(e) => e.stopPropagation()}>
                 <h3 className="text-lg font-bold">{t('clearMemory')}</h3>
                 <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{t('clearMemoryConfirmation', memoryFacts.length)}</p>
                 <div className="mt-6 flex justify-end gap-3">
                     <button onClick={() => setShowClearMemoryConfirm(false)} className="px-4 py-2 rounded-md text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50">{t('cancel')}</button>
                     <button onClick={handleClearMemory} className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700">{t('delete')}</button>
                 </div>
             </div>
         </div>
    )}
    </>
  );
};