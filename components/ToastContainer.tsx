import React, { useEffect, useState } from 'react';
import { useToast, Toast as ToastInterface } from '../contexts/ToastContext';
import { CheckCircleIcon, XCircleIcon, InfoIcon, XIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';

const ICONS: { [key in ToastInterface['type']]: React.ReactNode } = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  error: <XCircleIcon className="w-6 h-6 text-red-500" />,
  info: <InfoIcon className="w-6 h-6 text-blue-500" />,
};

const BORDER_COLORS: { [key in ToastInterface['type']]: string } = {
    success: 'border-green-500/20',
    error: 'border-red-500/20',
    info: 'border-blue-500/20',
};


const ToastComponent: React.FC<{ toast: ToastInterface, onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 400); // Wait for animation to finish
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 400); // Wait for animation to finish
    };

    const { t } = useLocale();
    const defaultTitles = {
        success: t('toastSuccessTitle'),
        error: t('toastErrorTitle'),
        info: t('toastInfoTitle'),
    }

    return (
        <div 
            role="alert"
            className={`w-full bg-base-100/80 dark:bg-dark-base-300/80 backdrop-blur-md rounded-xl shadow-2xl border ${BORDER_COLORS[toast.type]}
                        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
        >
            <div className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                    {ICONS[toast.type]}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-text-primary dark:text-dark-text-primary">
                        {toast.title || defaultTitles[toast.type]}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                        {toast.message}
                    </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                    <button
                        onClick={handleDismiss}
                        className="-mx-1 -my-1 p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50"
                        aria-label={t('close')}
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div 
            aria-live="assertive"
            className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 z-[100]"
        >
            <div className="w-full max-w-sm space-y-3">
                {toasts.map(toast => (
                    <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </div>
    );
};
