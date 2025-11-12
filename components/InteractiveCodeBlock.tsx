import React, { useState, FC, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useToast } from '../contexts/ToastContext';
import { CodeIcon, PresentationIcon, CopyIcon, CheckIcon, MaximizeIcon, MinimizeIcon, RefreshCcwIcon } from './Icons';

interface InteractiveCodeBlockProps {
  initialCode: string;
}

export const InteractiveCodeBlock: FC<InteractiveCodeBlockProps> = ({ initialCode }) => {
  const [code, setCode] = useState(initialCode);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();
  const { addToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      addToast(t('copied'), 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setCode(initialCode);
    addToast(t('reset'), 'info');
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullScreen) {
            setIsFullScreen(false);
        }
    };
    if (isFullScreen) {
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullScreen]);

  // Reset code state if the initial code prop changes (e.g., on regeneration)
  useEffect(() => {
      setCode(initialCode);
  }, [initialCode]);

  const containerClass = isFullScreen 
    ? "fixed inset-0 bg-base-100 dark:bg-dark-base-100 z-50 p-4 flex" 
    : "my-4 h-72 relative w-full max-w-4xl";

  return (
    <div className={containerClass}>
        <div className="rounded-lg border border-base-300 dark:border-dark-base-200 bg-base-100 dark:bg-dark-base-100 flex flex-col h-full w-full">
            <header className="flex items-center justify-between px-3 py-2 bg-base-200 dark:bg-dark-base-200/50 flex-shrink-0 border-b border-base-300 dark:border-dark-base-200">
                <div className="flex items-center gap-1 p-0.5 bg-base-300/50 dark:bg-dark-base-200/50 rounded-lg">
                    <button
                        onClick={() => setView('preview')}
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${
                        view === 'preview'
                            ? 'bg-base-100 dark:bg-dark-base-300 font-semibold text-text-primary dark:text-dark-text-primary shadow-sm'
                            : 'text-text-secondary dark:text-dark-text-secondary hover:bg-base-100/50 dark:hover:bg-dark-base-300/50'
                        }`}
                    >
                        <PresentationIcon className="w-4 h-4" />
                        {t('preview')}
                    </button>
                    <button
                        onClick={() => setView('code')}
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${
                        view === 'code'
                            ? 'bg-base-100 dark:bg-dark-base-300 font-semibold text-text-primary dark:text-dark-text-primary shadow-sm'
                            : 'text-text-secondary dark:text-dark-text-secondary hover:bg-base-100/50 dark:hover:bg-dark-base-300/50'
                        }`}
                    >
                        <CodeIcon className="w-4 h-4" />
                        {t('code')}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} title={t('copy')} className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-base-300 dark:hover:bg-dark-base-200/50">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                     <button onClick={handleReset} title={t('reset')} className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-base-300 dark:hover:bg-dark-base-200/50">
                        <RefreshCcwIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsFullScreen(p => !p)} title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-base-300 dark:hover:bg-dark-base-200/50">
                        {isFullScreen ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
                    </button>
                </div>
            </header>
            <main className="flex-grow min-h-0 bg-base-100 dark:bg-dark-base-300">
                {view === 'preview' ? (
                <iframe
                    srcDoc={code}
                    title={t('htmlPreview')}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0"
                    loading="lazy"
                />
                ) : (
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none bg-transparent text-text-primary dark:text-dark-text-primary [white-space:pre] overflow-x-auto"
                        spellCheck="false"
                        aria-label="Code Editor"
                    />
                )}
            </main>
        </div>
    </div>
  );
};