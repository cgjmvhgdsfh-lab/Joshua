import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Conversation, User } from '../types';
import { PlusIcon, BotIcon, XIcon, ArrowLeftIcon, MoreHorizontalIcon, PencilIcon, SettingsIcon, UserIcon, LogOutIcon, PinIcon, PinOffIcon, SearchIcon, TrashIcon, MessageSquareTextIcon, ChevronDownIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';
import { useToast } from '../contexts/ToastContext';

interface ConversationItemProps {
    conv: Conversation;
    isActive: boolean;
    onSelect: (id: string) => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string, title: string) => void;
    onTogglePin: (id: string) => void;
    isLoading: boolean;
    searchTerm: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conv, isActive, onSelect, onRename, onDelete, onTogglePin, isLoading, searchTerm }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState(conv.title);
    const renameInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLocale();

    useEffect(() => {
        if (isRenaming) {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        if (tempTitle.trim()) {
            onRename(conv.id, tempTitle);
        }
        setIsRenaming(false);
    };
    
    const handlePinClick = () => {
        onTogglePin(conv.id);
    };

    const handleDeleteClick = () => {
        onDelete(conv.id, conv.title);
    };

    const highlightedTitle = useMemo(() => {
        if (!searchTerm.trim()) {
            return <span className="truncate">{conv.title}</span>;
        }
        try {
            const escapedSearchTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const parts = conv.title.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));
            return (
                <span className="truncate">
                    {parts.map((part, i) =>
                        part.toLowerCase() === searchTerm.toLowerCase() ? (
                            <span key={i} className="bg-brand-primary/20 rounded font-bold text-text-primary dark:text-dark-text-primary">
                                {part}
                            </span>
                        ) : (
                            part
                        )
                    )}
                </span>
            );
        } catch (e) {
            console.error("Error creating regex for highlighting:", e);
            return <span className="truncate">{conv.title}</span>;
        }
    }, [conv.title, searchTerm]);


    return (
        <li className="group relative">
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    if (!isLoading && !isRenaming) onSelect(conv.id);
                }}
                className={`flex items-center justify-between w-full text-left pr-24 pl-3 py-2 rounded-lg truncate text-sm transition-all duration-200 border-l-4 ${
                    isActive
                        ? 'bg-brand-primary/10 text-brand-primary font-semibold border-brand-primary'
                        : 'text-text-primary dark:text-dark-text-primary hover:bg-base-300/50 dark:hover:bg-dark-base-200/50 border-transparent hover:border-brand-primary/40'
                } ${isLoading || isRenaming ? 'cursor-not-allowed opacity-70' : ''}`}
                aria-current={isActive ? 'page' : undefined}
            >
                <div className="flex items-center gap-2 truncate">
                    {isRenaming ? (
                        <input
                            ref={renameInputRef}
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') {
                                    setIsRenaming(false);
                                    setTempTitle(conv.title);
                                }
                            }}
                            className="w-full bg-transparent outline-none ring-1 ring-brand-primary rounded-sm px-1"
                        />
                    ) : (
                        highlightedTitle
                    )}
                </div>
            </a>
            {!isRenaming && (
                <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-opacity duration-200 focus-within:opacity-100 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={handlePinClick}
                        className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-base-300 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary"
                        title={conv.isPinned ? t('unpinConversation') : t('pinConversation')}
                        disabled={isLoading}
                    >
                        {conv.isPinned ? <PinOffIcon className="w-4 h-4" /> : <PinIcon className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsRenaming(true)}
                        className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-base-300 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary"
                        title={t('rename')}
                        disabled={isLoading}
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="p-1.5 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        title={t('delete')}
                        disabled={isLoading}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </li>
    );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUser: User | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onTogglePinConversation: (id: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  isLoading: boolean;
}

const groupConversationsByDate = (conversations: Conversation[], t: (key: string) => string) => {
    const groups: { [key: string]: Conversation[] } = {
        [t('dateToday')]: [],
        [t('dateYesterday')]: [],
        [t('datePrevious7Days')]: [],
        [t('datePrevious30Days')]: [],
        [t('dateOlder')]: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    conversations.forEach(conv => {
        const convDate = new Date(conv.createdAt);
        if (convDate >= today) {
            groups[t('dateToday')].push(conv);
        } else if (convDate >= yesterday) {
            groups[t('dateYesterday')].push(conv);
        } else if (convDate >= sevenDaysAgo) {
            groups[t('datePrevious7Days')].push(conv);
        } else if (convDate >= thirtyDaysAgo) {
            groups[t('datePrevious30Days')].push(conv);
        } else {
            groups[t('dateOlder')].push(conv);
        }
    });

    return groups;
};


export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  currentUser,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onTogglePinConversation,
  onOpenSettings,
  onLogout,
  onLoginClick,
  isLoading,
}) => {
  const { t } = useLocale();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<{id: string, title: string} | null>(null);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
        return conversations;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return conversations.filter(conv => {
        const titleMatch = conv.title.toLowerCase().includes(lowerCaseSearchTerm);
        if (titleMatch) return true;

        const contentToSearch = conv.messages
            .slice(-10)
            .map(msg => msg.contentHistory[msg.activeVersionIndex] || '')
            .join(' ')
            .toLowerCase();
        
        return contentToSearch.includes(lowerCaseSearchTerm);
    });
  }, [conversations, searchTerm]);

  const { pinned, unpinned } = useMemo(() => {
    const pinned: Conversation[] = [];
    const unpinned: Conversation[] = [];
    filteredConversations.forEach(conv => {
        if (conv.isPinned) {
            pinned.push(conv);
        } else {
            unpinned.push(conv);
        }
    });
    return { pinned, unpinned };
  }, [filteredConversations]);

  const groupedUnpinned = useMemo(() => groupConversationsByDate(unpinned, t), [unpinned, t]);

  const handleDeleteRequest = (id: string, title: string) => {
    setConfirmingDelete({ id, title });
  };

  const executeDelete = () => {
    if (confirmingDelete) {
        onDeleteConversation(confirmingDelete.id);
        setConfirmingDelete(null);
    }
  };

  const cancelDelete = useCallback(() => {
    setConfirmingDelete(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            cancelDelete();
        }
    };

    if (confirmingDelete) {
        document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmingDelete, cancelDelete]);

  return (
    <>
        <div 
            className={`fixed inset-0 bg-black/50 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
            aria-hidden="true"
        ></div>
        <aside className={`w-80 bg-base-200/95 dark:bg-dark-base-300/95 backdrop-blur-lg flex flex-col border-r border-base-300 dark:border-dark-base-200 h-screen 
                   fixed top-0 left-0 z-30 transition-transform duration-300 ease-in-out 
                   md:relative md:z-auto md:transition-[margin-left]
                   ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:-ml-80'}`}
        >
            <div className="p-4 border-b border-base-300 dark:border-dark-base-200 flex items-center justify-between h-16 flex-shrink-0">
                <h1 className="text-xl font-bold flex items-center gap-2 text-text-primary dark:text-dark-text-primary">
                    <div className="perspective-container">
                        <BotIcon className="text-brand-primary animate-rotate-3d"/>
                    </div>
                    {t('sidebarHeader')}
                </h1>
                <div>
                    <button
                        onClick={onClose}
                        aria-label={t('closeSidebar')}
                        className="p-2 rounded-md hover:bg-base-300 dark:hover:bg-dark-base-200 hidden md:block"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-text-primary dark:text-dark-text-primary" />
                    </button>
                    <button
                        onClick={onClose}
                        aria-label={t('closeSidebar')}
                        className="p-2 rounded-md hover:bg-base-300 dark:hover:bg-dark-base-200 md:hidden"
                    >
                        <XIcon className="w-6 h-6 text-text-primary dark:text-dark-text-primary" />
                    </button>
                </div>
            </div>
            <div className="p-4 space-y-3 flex-shrink-0">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchChats')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-base-100 dark:bg-dark-base-100/50 border border-base-300 dark:border-dark-base-200 rounded-lg py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                    {searchTerm && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <button
                                onClick={() => setSearchTerm('')}
                                className="p-1 rounded-full hover:bg-base-300 dark:hover:bg-dark-base-200 text-text-secondary dark:text-dark-text-secondary"
                                aria-label={t('clearSearch')}
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <button
                onClick={onNewChat}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-base-300 disabled:cursor-not-allowed dark:disabled:bg-dark-base-200 active:scale-95 transition-transform"
                aria-label={t('newChatButton')}
                >
                <PlusIcon className="w-5 h-5" />
                {t('newChatButton')}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="px-4 pb-4">
                  <button
                      onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-base-300/50 dark:hover:bg-dark-base-200/50 rounded-lg transition-colors"
                      aria-expanded={!isHistoryCollapsed}
                      aria-controls="chat-history-section"
                  >
                      <div className="flex items-center gap-2">
                          <MessageSquareTextIcon className="w-5 h-5" />
                          <span className="font-semibold">{t('chatHistory')}</span>
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isHistoryCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                  </button>
                  <div
                      id="chat-history-section"
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${isHistoryCollapsed ? 'max-h-0 mt-0' : 'max-h-[10000px] mt-2'}`}
                  >
                      {filteredConversations.length === 0 && searchTerm ? (
                          <div className="text-center py-8 px-4 text-text-secondary dark:text-dark-text-secondary">
                              <p className="font-medium">{t('noChatsFoundFor', searchTerm)}</p>
                          </div>
                      ) : (
                          <>
                              {pinned.length > 0 && (
                                  <div className="mb-4">
                                      <h2 className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary px-3 mb-2" id="pinned-chats-label">{t('pinned')}</h2>
                                      <ul className="space-y-1" aria-labelledby="pinned-chats-label">
                                          {pinned.map((conv) => (
                                              <ConversationItem
                                                  key={conv.id}
                                                  conv={conv}
                                                  isActive={activeConversationId === conv.id}
                                                  onSelect={onSelectConversation}
                                                  onRename={onRenameConversation}
                                                  onDelete={handleDeleteRequest}
                                                  onTogglePin={onTogglePinConversation}
                                                  isLoading={isLoading}
                                                  searchTerm={searchTerm}
                                              />
                                          ))}
                                      </ul>
                                  </div>
                              )}
                              {Object.keys(groupedUnpinned).map((groupTitle) => {
                                  const convsInGroup = groupedUnpinned[groupTitle as keyof typeof groupedUnpinned];
                                  if (convsInGroup.length === 0) return null;
                                  return (
                                      <div key={groupTitle} className="mb-4">
                                          <h2 className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary px-3 my-2" id={`group-label-${groupTitle}`}>{groupTitle}</h2>
                                          <ul className="space-y-1" aria-labelledby={`group-label-${groupTitle}`}>
                                              {convsInGroup.map((conv) => (
                                                  <ConversationItem
                                                      key={conv.id}
                                                      conv={conv}
                                                      isActive={activeConversationId === conv.id}
                                                      onSelect={onSelectConversation}
                                                      onRename={onRenameConversation}
                                                      onDelete={handleDeleteRequest}
                                                      onTogglePin={onTogglePinConversation}
                                                      isLoading={isLoading}
                                                      searchTerm={searchTerm}
                                                  />
                                              ))}
                                          </ul>
                                      </div>
                                  );
                              })}
                          </>
                      )}
                  </div>
              </nav>
            </div>
            <div className="p-4 border-t border-base-300 dark:border-dark-base-200 space-y-2 flex-shrink-0">
                {currentUser ? (
                    <div className="group relative flex items-center gap-3 p-2 rounded-lg bg-base-100 dark:bg-dark-base-100">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">{currentUser.name}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{currentUser.email}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            aria-label={t('logout')}
                            title={t('logout')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-all"
                        >
                            <LogOutIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-base-100 dark:bg-dark-base-100 border border-base-300 dark:border-dark-base-200 rounded-lg font-semibold hover:bg-base-200 dark:hover:bg-dark-base-200/50 transition-colors duration-200 active:scale-95"
                    >
                        <UserIcon className="w-5 h-5" />
                        <span>{t('login')} / {t('register')}</span>
                    </button>
                )}
                 <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-base-100 dark:bg-dark-base-100 border border-base-300 dark:border-dark-base-200 rounded-lg font-semibold hover:bg-base-200 dark:hover:bg-dark-base-200/50 transition-colors duration-200 active:scale-95"
                    aria-label={t('settings')}
                >
                    <SettingsIcon className="w-5 h-5" />
                    <span>{t('settings')}</span>
                </button>
            </div>
        </aside>
        {confirmingDelete && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ animationDuration: '0.2s' }}>
                <div 
                    className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-xl p-6 w-full max-w-sm border border-base-300 dark:border-dark-base-200"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <h3 id="delete-dialog-title" className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{t('deleteConfirmationTitle')}</h3>
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                        {t('deleteConfirmation', confirmingDelete.title)}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={cancelDelete} className="px-4 py-2 rounded-md text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors active:scale-95">
                            {t('cancel')}
                        </button>
                        <button onClick={executeDelete} className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors active:scale-95">
                            {t('delete')}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};