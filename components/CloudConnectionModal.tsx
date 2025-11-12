import React, { useState, FC, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { XIcon, GoogleDriveIcon, OneDriveIcon, LoadingSpinner } from './Icons';
import { CloudProvider } from '../types';

interface CloudConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: CloudProvider) => void;
  provider: CloudProvider;
}

export const CloudConnectionModal: FC<CloudConnectionModalProps> = ({ isOpen, onClose, onConnect, provider }) => {
    const [isLoading, setIsLoading] = useState(false);
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

    const handleConnect = () => {
        setIsLoading(true);
        onConnect(provider);
    };

    const providerDetails = {
        'Google Drive': {
            icon: <GoogleDriveIcon className="w-12 h-12" />,
            permissions: t('googleDrivePermissions'),
        },
        'OneDrive': {
            icon: <OneDriveIcon className="w-12 h-12 text-blue-500" />,
            permissions: t('oneDrivePermissions'),
        }
    };

    const details = providerDetails[provider];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fade-in" style={{animationDuration: '0.2s'}} onClick={onClose}>
            <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-base-300 dark:border-dark-base-200" role="dialog" aria-modal="true" aria-labelledby="connect-modal-title" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 sm:p-6 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
                    <h2 id="connect-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{t('connectTo', provider)}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
                        <XIcon className="w-6 h-6" /><span className="sr-only">{t('close')}</span>
                    </button>
                </header>
                <main className="p-6 text-center">
                    <div className="mx-auto w-fit mb-4">{details.icon}</div>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{details.permissions}</p>
                </main>
                <footer className="p-4 sm:p-6 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors disabled:opacity-50">{t('cancel')}</button>
                    <button onClick={handleConnect} disabled={isLoading} className="px-4 py-2 w-28 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isLoading ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : t('connect')}
                    </button>
                </footer>
            </div>
        </div>
    );
};