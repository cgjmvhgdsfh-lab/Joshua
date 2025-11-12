import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';

type ExportFormat = 'md' | 'json' | 'txt';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  isLoading: boolean;
}

const FormatOption: React.FC<{
    value: ExportFormat,
    selectedValue: ExportFormat | null,
    onSelect: (value: ExportFormat) => void,
    title: string,
    description: string
}> = ({ value, selectedValue, onSelect, title, description }) => (
    <button
        onClick={() => onSelect(value)}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
            selectedValue === value
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-base-300 dark:border-dark-base-200 hover:border-brand-primary/50 bg-base-200/50 dark:bg-dark-base-200/30'
        }`}
    >
        <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary dark:text-dark-text-primary">{title}</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedValue === value ? 'border-brand-primary bg-brand-primary' : 'border-text-secondary/50 dark:border-dark-text-secondary/50'
            }`}>
                {selectedValue === value && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
        </div>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{description}</p>
    </button>
);

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, isLoading }) => {
  const [format, setFormat] = useState<ExportFormat | null>('md');
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

  const handleExportClick = () => {
    if (format) {
      onExport(format);
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 animate-fade-in" 
        style={{animationDuration: '0.2s'}}
        onClick={onClose}
    >
      <div 
        className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] border border-base-300 dark:border-dark-base-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
          <h2 id="export-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
            {t('exportConversation')}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
            <XIcon className="w-6 h-6" />
            <span className="sr-only">{t('close')}</span>
          </button>
        </header>

        <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                {t('exportAs')}
            </p>
            <div className="space-y-3">
                <FormatOption
                    value="md"
                    selectedValue={format}
                    onSelect={setFormat}
                    title={t('exportFormatMarkdown')}
                    description={t('exportFormatMarkdownDescription')}
                />
                <FormatOption
                    value="json"
                    selectedValue={format}
                    onSelect={setFormat}
                    title={t('exportFormatJSON')}
                    description={t('exportFormatJSONDescription')}
                />
                 <FormatOption
                    value="txt"
                    selectedValue={format}
                    onSelect={setFormat}
                    title={t('exportFormatText')}
                    description={t('exportFormatTextDescription')}
                />
            </div>
        </main>

        <footer className="p-4 sm:p-6 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-primary dark:text-dark-text-primary bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors active:scale-95 transition-transform"
          >
            {t('cancel')}
          </button>
          <button 
            onClick={handleExportClick}
            disabled={!format || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95 transition-transform"
          >
            <DownloadIcon className="w-5 h-5" />
            {t('download')}
          </button>
        </footer>
      </div>
    </div>
  );
};