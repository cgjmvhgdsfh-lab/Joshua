import React, { useState, FC, useEffect } from 'react';
import { XIcon, CheckIcon, GoogleDriveIcon, OneDriveIcon, SearchIcon, LanguagesIcon, LinkIcon, DatabaseIcon, TrashIcon, DownloadIcon, LoadingSpinner, SunIcon, MoonIcon, BrainCircuitIcon, FoldersIcon, MessageSquareTextIcon, BarChartIcon, ImageIcon, AudioFileIcon, CodeIcon, ClipboardCheckIcon, UserIcon, PaletteIcon, WordFileIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';
import { Locale, CloudProvider, User, MemoryFact, Conversation, CoachGoal } from '../types';
import { useTheme, AppFont, AppBackground } from '../contexts/ThemeContext';
import { AnalyticsModal } from './AnalyticsModal';
import { MemoryModal } from './MemoryModal';
import { CoachModal } from './CoachModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  connectedClouds: Partial<Record<CloudProvider, boolean>>;
  onDisconnectCloud: (provider: CloudProvider) => void;
  onExportAllData: () => void;
  onDeleteAccount: () => Promise<void>;
  memoryFacts: MemoryFact[];
  onUpdateMemory: (newMemory: MemoryFact[]) => void;
  coachGoals: CoachGoal[];
  onUpdateCoachGoals: (newGoals: CoachGoal[]) => void;
  conversations: Conversation[];
}

type Tab = 'general' | 'connections' | 'memory' | 'coach' | 'analytics' | 'data';

const languages: { code: Locale, name: string }[] = [
    { code: 'ar', name: 'العربية' }, { code: 'bn', name: 'বাংলা' }, { code: 'cs', name: 'Čeština' }, 
    { code: 'da', name: 'Dansk' }, { code: 'de', name: 'Deutsch' }, { code: 'el', name: 'Ελληνικά' }, 
    { code: 'en', name: 'English' }, { code: 'es', name: 'Español' }, { code: 'fil', name: 'Filipino' }, 
    { code: 'fi', name: 'Suomi' }, { code: 'fr', name: 'Français' }, { code: 'he', name: 'עברית' }, 
    { code: 'hi', name: 'हिन्दी' }, { code: 'hu', name: 'Magyar' }, { code: 'id', name: 'Bahasa Indonesia' }, 
    { code: 'it', name: 'Italiano' }, { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' }, 
    { code: 'ms', name: 'Bahasa Melayu' }, { code: 'nl', name: 'Nederlands' }, { code: 'no', name: 'Norsk' }, 
    { code: 'pl', name: 'Polski' }, { code: 'pt', name: 'Português' }, { code: 'ro', name: 'Română' }, 
    { code: 'ru', name: 'Русский' }, { code: 'sv', name: 'Svenska' }, { code: 'th', name: 'ไทย' }, 
    { code: 'tr', name: 'Türkçe' }, { code: 'uk', name: 'Українська' }, { code: 'vi', name: 'Tiếng Việt' }, 
    { code: 'zh', name: '中文 (简体)' },
];

const BackgroundPreview: FC<{ type: AppBackground, name: string, active: boolean, onClick: () => void }> = ({ type, name, active, onClick }) => (
    <button onClick={onClick} className="text-left group w-full transition-transform duration-200 ease-in-out hover:scale-[1.03]">
        <div className={`w-full h-20 rounded-xl relative overflow-hidden transition-all duration-300 shadow-inner ${active ? 'ring-2 ring-offset-2 ring-brand-primary dark:ring-offset-dark-base-100' : 'ring-1 ring-base-300/50 dark:ring-dark-base-200/50'}`}>
            <div className={`absolute inset-0 bg-${type}`}></div>
            {active && (
                <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-brand-primary" />
                    </div>
                </div>
            )}
        </div>
        <p className={`mt-2 text-sm text-center font-semibold transition-colors ${active ? 'text-brand-primary' : 'text-text-primary dark:text-dark-text-primary'}`}>{name}</p>
    </button>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser, connectedClouds, onDisconnectCloud, onExportAllData, onDeleteAccount, memoryFacts, onUpdateMemory, coachGoals, onUpdateCoachGoals, conversations }) => {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme, font, setFont, background, setBackground } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [langSearch, setLangSearch] = useState('');
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (showDeleteAccountConfirm) setShowDeleteAccountConfirm(false);
            else onClose();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showDeleteAccountConfirm]);

  if (!isOpen) return null;

  const filteredLanguages = languages.filter(lang => lang.name.toLowerCase().includes(langSearch.toLowerCase()));

  const tabs: {id: Tab, label: string, icon: React.FC<{className?: string}>}[] = [
      { id: 'general', label: t('general'), icon: PaletteIcon },
      { id: 'connections', label: t('connections'), icon: LinkIcon },
      { id: 'memory', label: t('memory'), icon: BrainCircuitIcon },
      { id: 'coach', label: t('coach'), icon: ClipboardCheckIcon },
      { id: 'analytics', label: t('analyticsDashboard'), icon: BarChartIcon },
      { id: 'data', label: t('data'), icon: DatabaseIcon },
  ];
  
  const fontOptions: {id: AppFont, name: string, group: string}[] = [
      { id: 'sans', name: t('fontSans'), group: 'Sans-Serif' }, { id: 'lato', name: t('fontLato'), group: 'Sans-Serif' }, { id: 'oswald', name: t('fontOswald'), group: 'Sans-Serif' },
      { id: 'nunito', name: t('fontNunito'), group: 'Sans-Serif' }, { id: 'montserrat', name: t('fontMontserrat'), group: 'Sans-Serif' }, { id: 'poppins', name: t('fontPoppins'), group: 'Sans-Serif' },
      { id: 'serif', name: t('fontSerif'), group: 'Serif' }, { id: 'merriweather', name: t('fontMerriweather'), group: 'Serif' }, { id: 'playfair', name: t('fontPlayfair'), group: 'Serif' },
      { id: 'lora', name: t('fontLora'), group: 'Serif' }, { id: 'mono', name: t('fontMono'), group: 'Monospace' }, { id: 'roboto-mono', name: t('fontRobotoMono'), group: 'Monospace' },
      { id: 'inconsolata', name: t('fontInconsolata'), group: 'Monospace' }, { id: 'fira-code', name: t('fontFiraCode'), group: 'Monospace' }, { id: 'jetbrains-mono', name: t('fontJetbrains'), group: 'Monospace' }
  ];

  const fontGroups = [...new Set(fontOptions.map(f => f.group))];

  const renderContent = () => {
      const Card: React.FC<{children: React.ReactNode, title?: string, description?: string}> = ({ children, title, description }) => (
          <div className="bg-base-100 dark:bg-dark-base-200/50 p-6 rounded-2xl border border-base-200 dark:border-dark-base-200">
              {title && <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-1">{title}</h3>}
              {description && <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">{description}</p>}
              {children}
          </div>
      );

      switch(activeTab) {
          case 'general':
              return (
                  <div className="space-y-6">
                      <Card title={t('appearance')} description={t('appearanceDescription')}>
                          <div className="flex gap-2 p-1 bg-base-200 dark:bg-dark-base-300/50 rounded-lg">
                              {[ { value: 'light', label: t('lightTheme'), icon: SunIcon }, { value: 'dark', label: t('darkTheme'), icon: MoonIcon } ].map(item => (
                                  <button key={item.value} onClick={() => setTheme(item.value as 'light' | 'dark')} className={`w-full flex items-center justify-center gap-2 p-2 rounded-md text-sm font-semibold transition-all duration-300 ${theme === item.value ? 'bg-base-100 dark:bg-dark-base-100 text-brand-primary shadow-sm' : 'text-text-secondary dark:text-dark-text-secondary hover:bg-base-100/50 dark:hover:bg-dark-base-100/50'}`}>
                                      <item.icon className="w-5 h-5" /> {item.label}
                                  </button>
                              ))}
                          </div>
                      </Card>
                       <Card title={t('background')} description={t('backgroundDescription')}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                              {[ 'universum', 'neural', 'cosmic', 'plain', 'geometric', 'starfield', 'gradient-wave', 'hexagon', 'bubbles', 'noise', 'topo', 'blueprint', 'aurora', 'circuit', 'wavy-grid', 'polka-dots', 'digital-rain', 'tetris-fall' ].map(bg => (
                                  <BackgroundPreview key={bg} type={bg as AppBackground} name={t(`bg${bg.charAt(0).toUpperCase() + bg.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase())}`)} active={background === bg} onClick={() => setBackground(bg as AppBackground)} />
                              ))}
                          </div>
                      </Card>
                      <Card title={t('font')} description={t('fontDescription')}>
                          {fontGroups.map(group => (
                              <div key={group} className="mb-6 last:mb-0">
                                  <h4 className="font-bold text-text-secondary dark:text-dark-text-secondary mb-3">{group}</h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {fontOptions.filter(fo => fo.group === group).map(fontOption => (
                                          <button key={fontOption.id} onClick={() => setFont(fontOption.id)} className={`relative w-full p-4 rounded-xl text-left transition-all duration-200 ${font === fontOption.id ? 'bg-brand-primary/10 ring-2 ring-brand-primary' : 'bg-base-200 dark:bg-dark-base-300/50 hover:ring-2 hover:ring-brand-primary/50'}`}>
                                              <span className={`text-xl font-semibold ${`font-${fontOption.id}`}`}>{t('fontSample')}</span>
                                              <span className="text-xs text-text-secondary dark:text-dark-text-secondary block mt-1.5">{fontOption.name}</span>
                                              {font === fontOption.id && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center"><CheckIcon className="w-3 h-3 text-white" /></div>}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </Card>
                      <Card title={t('language')} description={t('languageDescription')}>
                          <div className="relative mb-3">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
                            <input type="text" value={langSearch} onChange={(e) => setLangSearch(e.target.value)} placeholder={t('searchLanguage')} className="w-full p-2 pl-10 bg-base-200 dark:bg-dark-base-300/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"/>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-2">
                            {filteredLanguages.map(lang => (
                                <button key={lang.code} onClick={() => setLocale(lang.code)} className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${locale === lang.code ? 'bg-brand-primary/10 font-bold text-brand-primary' : 'hover:bg-base-200 dark:hover:bg-dark-base-200/60'}`}>
                                    <span>{lang.name}</span>
                                    {locale === lang.code && <CheckIcon className="w-4 h-4" />}
                                </button>
                            ))}
                          </div>
                      </Card>
                  </div>
              );
          case 'connections':
              return (
                   <Card title={t('connectedApps')}>
                        <div className="space-y-3">
                            {(Object.keys(connectedClouds) as CloudProvider[]).length > 0 ? (
                                (Object.keys(connectedClouds) as CloudProvider[]).map(provider => (
                                    <div key={provider} className="flex items-center justify-between p-4 bg-base-100 dark:bg-dark-base-100/50 rounded-lg border border-base-200 dark:border-dark-base-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center">{provider === 'Google Drive' ? <GoogleDriveIcon /> : <OneDriveIcon />}</div>
                                            <span className="font-semibold text-sm text-text-primary dark:text-dark-text-primary">{provider}</span>
                                        </div>
                                        <button onClick={() => onDisconnectCloud(provider)} className="text-sm font-semibold text-red-500 hover:underline">{t('disconnect')}</button>
                                    </div>
                                ))
                            ) : (
                                 <p className="text-sm text-center text-text-secondary dark:text-dark-text-secondary py-8">{t('noConnectedApps')}</p>
                            )}
                        </div>
                    </Card>
              );
          case 'memory': return <MemoryModal memoryFacts={memoryFacts} onUpdateMemory={onUpdateMemory} />;
          case 'coach': return <CoachModal coachGoals={coachGoals} onUpdateCoachGoals={onUpdateCoachGoals} />;
          case 'analytics': return <AnalyticsModal conversations={conversations} />;
          case 'data':
              return (
                  <div className="space-y-6">
                      <Card title={t('dataManagement')} description={t('dataManagementDescription')}>
                           <button onClick={onExportAllData} className="w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors bg-base-100 dark:bg-dark-base-100/50 hover:bg-base-200/50 dark:hover:bg-dark-base-200/40 border border-base-200 dark:border-dark-base-200">
                              <div>
                                  <p className="font-semibold text-text-primary dark:text-dark-text-primary">{t('exportAllData')}</p>
                                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">{t('exportAllDataDescription')}</p>
                              </div>
                              <DownloadIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary"/>
                          </button>
                      </Card>
                       {currentUser && (
                            <Card title={t('dangerZone')} description={t('dangerZoneDescription')}>
                               <button onClick={() => setShowDeleteAccountConfirm(true)} className="w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors bg-red-500/5 hover:bg-red-500/10 border border-red-500/20">
                                  <div>
                                      <p className="font-semibold text-red-600 dark:text-red-400">{t('deleteAccount')}</p>
                                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">{t('deleteAccountDescription')} <span className="font-bold">{t('deleteAccountWarning')}</span></p>
                                  </div>
                                  <TrashIcon className="w-5 h-5 text-red-500"/>
                              </button>
                            </Card>
                          )}
                  </div>
              );
      }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-base-100 dark:bg-dark-base-100 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] border border-base-300 dark:border-dark-base-200 animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 sm:p-5 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
          <h2 id="settings-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{t('settings')}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors"><XIcon className="w-6 h-6" /><span className="sr-only">{t('close')}</span></button>
        </header>

        <div className="flex-grow flex flex-col md:flex-row min-h-0">
            <nav className="flex-shrink-0 md:w-56 p-4 border-b md:border-b-0 md:border-r border-base-200 dark:border-dark-base-200">
                <ul className="flex flex-row md:flex-col gap-1.5 overflow-x-auto -mx-4 px-4 pb-2 md:pb-0 md:mx-0 md:px-0 md:overflow-x-visible">
                    {tabs.map(tab => (
                        <li key={tab.id}>
                            <button onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60'}`}>
                                <tab.icon className="w-5 h-5 flex-shrink-0" />{tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <main className="p-6 flex-grow overflow-y-auto bg-base-200 dark:bg-dark-base-100/50">
                {renderContent()}
            </main>
        </div>

        <footer className="p-4 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0 bg-base-100 dark:bg-dark-base-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95">{t('done')}</button>
        </footer>
      </div>
    </div>
    
    {showDeleteAccountConfirm && currentUser && (
         <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowDeleteAccountConfirm(false)}>
             <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-xl p-6 w-full max-w-md border border-base-300 dark:border-dark-base-200" onClick={(e) => e.stopPropagation()}>
                 <h3 className="text-lg font-bold text-red-600 dark:text-red-400">{t('deleteAccount')}</h3>
                 <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{t('deleteAccountConfirmation')}</p>
                 <p className="mt-4 text-sm text-text-secondary dark:text-dark-text-secondary">{t('typeEmailToConfirm', currentUser.email)}</p>
                 <input type="email" value={deleteConfirmEmail} onChange={(e) => setDeleteConfirmEmail(e.target.value)} className="mt-2 w-full p-2 bg-base-200 dark:bg-dark-base-200/50 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"/>
                 <div className="mt-6 flex justify-end gap-3">
                     <button onClick={() => setShowDeleteAccountConfirm(false)} className="px-4 py-2 rounded-md text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50">{t('cancel')}</button>
                     <button onClick={async () => {setIsDeleting(true); await onDeleteAccount(); setIsDeleting(false); setShowDeleteAccountConfirm(false); onClose();}} disabled={deleteConfirmEmail !== currentUser.email || isDeleting} className="px-4 py-2 w-28 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                         {isDeleting ? <LoadingSpinner className="w-5 h-5 mx-auto" /> : t('delete')}
                     </button>
                 </div>
             </div>
         </div>
    )}
    </>
  );
};