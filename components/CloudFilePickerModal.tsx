import React, { useState, useMemo, FC, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { XIcon, SearchIcon, FileIcon, PresentationIcon, SheetIcon, GoogleDriveIcon, OneDriveIcon } from './Icons';
import { CloudProvider } from '../types';

type MockFile = {
    id: string;
    name: string;
    type: 'doc' | 'sheet' | 'presentation';
    modified: string;
    content: string;
};

interface CloudFilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (title: string, content: string, provider: CloudProvider) => void;
  provider: CloudProvider;
}

const getMockFiles = (t: (key: string, ...args: any[]) => string): Record<CloudProvider, MockFile[]> => ({
    'Google Drive': [
        { id: 'g1', name: t('filePhoenixProposal'), type: 'doc', modified: t('dateYesterday'), content: t('filePhoenixProposalContent') },
        { id: 'g2', name: t('fileQ4Budget'), type: 'sheet', modified: 'Oct 15, 2023', content: t('fileQ4BudgetContent') },
        { id: 'g3', name: t('fileKickOffDeck'), type: 'presentation', modified: 'Oct 12, 2023', content: t('fileKickOffDeckContent') },
        { id: 'g4', name: t('fileUserResearch'), type: 'doc', modified: 'Sep 28, 2023', content: t('fileUserResearchContent') },
    ],
    'OneDrive': [
        { id: 'o1', name: t('fileAnnualReport'), type: 'doc', modified: '2 days ago', content: t('fileAnnualReportContent') },
        { id: 'o2', name: t('fileSalesProjections'), type: 'sheet', modified: 'Oct 18, 2023', content: t('fileSalesProjectionsContent') },
        { id: 'o3', name: t('fileCompetitorAnalysis'), type: 'presentation', modified: 'Sep 29, 2023', content: t('fileCompetitorAnalysisContent') },
        { id: 'o4', name: t('fileProjectTimeline'), type: 'sheet', modified: 'Sep 25, 2023', content: t('fileProjectTimelineContent') },
    ]
});

const fileTypeIcons: Record<MockFile['type'], React.ReactNode> = {
    doc: <FileIcon className="w-6 h-6 text-blue-500" />,
    sheet: <SheetIcon className="w-6 h-6 text-green-500" />,
    presentation: <PresentationIcon className="w-6 h-6 text-orange-500" />,
};

export const CloudFilePickerModal: FC<CloudFilePickerModalProps> = ({ isOpen, onClose, onAttach, provider }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const { t } = useLocale();
    const mockFiles = getMockFiles(t);

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

    const filteredFiles = useMemo(() => {
        return mockFiles[provider].filter(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, provider, mockFiles]);
    
    if (!isOpen) return null;

    const handleAttach = () => {
        const selectedFile = mockFiles[provider].find(f => f.id === selectedFileId);
        if (selectedFile) {
            onAttach(selectedFile.name, selectedFile.content, provider);
            onClose();
        }
    };
    
    const providerIcon = provider === 'Google Drive' 
        ? <GoogleDriveIcon className="w-6 h-6"/> 
        : <OneDriveIcon className="w-6 h-6" />;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 animate-fade-in" style={{animationDuration: '0.2s'}} onClick={onClose}>
            <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[80vh] border border-base-300 dark:border-dark-base-200" role="dialog" aria-modal="true" aria-labelledby="cloud-modal-title" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 sm:p-6 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
                    <h2 id="cloud-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary flex items-center gap-2">{providerIcon} {t('connectTo', provider)}</h2>
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
                            placeholder={t('searchFiles')}
                            className="w-full p-2 pl-10 bg-base-200 dark:bg-dark-base-200/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                        />
                    </div>
                </div>
                <main className="flex-grow overflow-y-auto p-2">
                    {filteredFiles.length === 0 ? (
                        <div className="text-center py-16 text-text-secondary dark:text-dark-text-secondary">{t('noFilesFound')}</div>
                    ) : (
                        <ul className="space-y-1">
                            {filteredFiles.map(file => (
                                <li key={file.id}>
                                    <button
                                        onClick={() => setSelectedFileId(file.id)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors ${selectedFileId === file.id ? 'bg-brand-primary/10' : 'hover:bg-base-200/50 dark:hover:bg-dark-base-200/40'}`}
                                    >
                                        <div className="flex-shrink-0">{fileTypeIcons[file.type]}</div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold text-text-primary dark:text-dark-text-primary truncate">{file.name}</p>
                                        </div>
                                        <div className="text-sm text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{file.modified}</div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
                <footer className="p-4 sm:p-6 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors">{t('cancel')}</button>
                    <button onClick={handleAttach} disabled={!selectedFileId} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity disabled:opacity-50">{t('attach')}</button>
                </footer>
            </div>
        </div>
    );
};