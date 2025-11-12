import React, { useState, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { XIcon } from './Icons';

interface TextAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddText: (title: string, content: string) => void;
}

export const TextAttachmentModal: React.FC<TextAttachmentModalProps> = ({ isOpen, onClose, onAddText }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { t } = useLocale();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (content.trim()) {
      onAddText(title.trim() || t('untitled'), content.trim());
      setTitle('');
      setContent('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 animate-fade-in" style={{animationDuration: '0.2s'}} onClick={onClose}>
      <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-base-300 dark:border-dark-base-200" role="dialog" aria-modal="true" aria-labelledby="text-attachment-modal-title" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 sm:p-6 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
          <h2 id="text-attachment-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{t('addTextContent')}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
            <XIcon className="w-6 h-6" />
            <span className="sr-only">{t('close')}</span>
          </button>
        </header>
        <main className="p-4 sm:p-6 flex-grow overflow-y-auto flex flex-col gap-4">
          <div>
            <label htmlFor="text-attachment-title" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1 block">{t('titleOptional')}</label>
            <input
              id="text-attachment-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('untitled')}
              className="w-full p-2 bg-base-200 dark:bg-dark-base-200/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
            />
          </div>
          <div>
            <label htmlFor="text-attachment-content" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1 block">{t('content')}</label>
            <textarea
              id="text-attachment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('pasteTextHere')}
              className="w-full h-64 p-2 bg-base-200 dark:bg-dark-base-200/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm resize-y"
              required
            />
          </div>
        </main>
        <footer className="p-4 sm:p-6 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors">{t('cancel')}</button>
          <button onClick={handleAdd} disabled={!content.trim()} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50">{t('add')}</button>
        </footer>
      </div>
    </div>
  );
};