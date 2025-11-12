import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { XIcon, LoadingSpinner, CopyIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';
import { useToast } from '../contexts/ToastContext';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isLoading }) => {
  const { t } = useLocale();
  const { addToast } = useToast();

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

  const handleCopy = () => {
    navigator.clipboard.writeText(summary).then(() => {
        addToast(t('summaryCopied'), 'success');
    });
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 animate-fade-in" 
        style={{animationDuration: '0.2s'}}
        onClick={onClose}
    >
      <div 
        className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-base-300 dark:border-dark-base-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
          <h2 id="summary-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
            {t('summaryModalTitle')}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
            <XIcon className="w-6 h-6" />
            <span className="sr-only">{t('close')}</span>
          </button>
        </header>

        <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary dark:text-dark-text-secondary">
              <LoadingSpinner className="w-10 h-10 mb-4" />
              <p className="text-lg font-semibold">{t('generatingSummary')}</p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{summary || ''}</ReactMarkdown>
            </div>
          )}
        </main>

        <footer className="p-4 sm:p-6 border-t border-base-200 dark:border-dark-base-200 flex justify-between items-center flex-shrink-0">
          <button 
            onClick={handleCopy}
            disabled={isLoading || !summary}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-text-primary dark:text-dark-text-primary bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors disabled:opacity-50"
          >
            <CopyIcon className="w-4 h-4"/>
            {t('copySummary')}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity"
          >
            {t('done')}
          </button>
        </footer>
      </div>
    </div>
  );
};