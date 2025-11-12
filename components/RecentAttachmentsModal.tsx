import React, { useState, useMemo, FC, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { XIcon, SearchIcon, FileTextIcon, ImageIcon, AudioFileIcon, GoogleDriveIcon, OneDriveIcon } from './Icons';
import { RecentAttachment, CloudProvider } from '../types';

interface RecentAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (attachment: RecentAttachment) => void;
  recentAttachments: RecentAttachment[];
}

const getAttachmentIcon = (attachment: RecentAttachment): React.ReactNode => {
    switch(attachment.type) {
        case 'text':
            return <FileTextIcon className="w-6 h-6 text-purple-500" />;
        case 'cloud':
            return attachment.provider === 'Google Drive' 
                ? <GoogleDriveIcon className="w-6 h-6 text-yellow-500" />
                : <OneDriveIcon className="w-6 h-6 text-blue-500" />;
        case 'local':
            return attachment.fileType === 'image'
                ? <ImageIcon className="w-6 h-6 text-green-500" />
                : <AudioFileIcon className="w-6 h-6 text-red-500" />;
        default:
            return <FileTextIcon className="w-6 h-6 text-text-secondary dark:text-dark-text-secondary" />;
    }
};

const getAttachmentTitle = (attachment: RecentAttachment): string => {
    switch(attachment.type) {
        case 'local': return attachment.name;
        default: return attachment.title;
    }
}

const getAttachmentDescription = (attachment: RecentAttachment, t: (key: string, ...args: any[]) => string): string => {
    switch(attachment.type) {
        case 'text': return t('textContentAttachment');
        case 'cloud': return t('attachedFrom', attachment.provider);
        case 'local': return t('localFileAttachment');
        default: return '';
    }
}

export const RecentAttachmentsModal: FC<RecentAttachmentsModalProps> = ({ isOpen, onClose, onAttach, recentAttachments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAttachment, setSelectedAttachment] = useState<RecentAttachment | null>(null);
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

    const filteredAttachments = useMemo(() => {
        return recentAttachments.filter(att =>
            getAttachmentTitle(att).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, recentAttachments]);
    
    if (!isOpen) return null;

    const handleAttach = () => {
        if (selectedAttachment) {
            onAttach(selectedAttachment);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 animate-fade-in" style={{animationDuration: '0.2s'}} onClick={onClose}>
            <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[80vh] border border-base-300 dark:border-dark-base-200" role="dialog" aria-modal="true" aria-labelledby="recents-modal-title" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 sm:p-6 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
                    <h2 id="recents-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{t('recentAttachments')}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
                        <XIcon className="w-6 h-6" /><span className="sr-only">{t('close')}</span>
                    </button>
                </header>
                 <div className="p-4 flex-shrink-0 border-b border-base-200 dark:border-dark-base-200">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('searchRecents')}
                            className="w-full p-2 pl-10 bg-base-200 dark:bg-dark-base-200/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                        />
                    </div>
                </div>
                <main className="flex-grow overflow-y-auto p-2">
                    {filteredAttachments.length === 0 ? (
                        <div className="text-center py-16 text-text-secondary dark:text-dark-text-secondary">{t('noRecentAttachments')}</div>
                    ) : (
                        <ul className="space-y-1">
                            {filteredAttachments.map(att => (
                                <li key={att.timestamp}>
                                    <button
                                        onClick={() => setSelectedAttachment(att)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors ${selectedAttachment?.timestamp === att.timestamp ? 'bg-brand-primary/10' : 'hover:bg-base-200/50 dark:hover:bg-dark-base-200/40'}`}
                                    >
                                        <div className="flex-shrink-0">{getAttachmentIcon(att)}</div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold text-text-primary dark:text-dark-text-primary truncate">{getAttachmentTitle(att)}</p>
                                             <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{getAttachmentDescription(att, t)}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
                <footer className="p-4 sm:p-6 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors">{t('cancel')}</button>
                    <button onClick={handleAttach} disabled={!selectedAttachment} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50">{t('attach')}</button>
                </footer>
            </div>
        </div>
    );
};