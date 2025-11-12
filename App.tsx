import React, { useState, useEffect, useRef, useMemo, useCallback, FC } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import { GoogleGenAI, Part, Content, Type, FunctionDeclaration, FunctionCall, GenerateContentResponse, Modality } from '@google/genai';
import { ModelType, Message, Role, Conversation, GroundingChunk, MemoryFact, User, CloudProvider, RecentAttachment, AnalysisStep, AnalysisStepStatus, Slide, PresentationTheme, CoachGoal, VideoSearchResult } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { ModelSelector } from './components/ModelSelector';
import { MenuIcon, BotIcon, CheckCircleIcon, XCircleIcon, ZapIcon, XIcon, LoadingSpinner, StopCircleIcon, UserIcon, SearchIcon, BrainCircuitIcon, WandSparklesIcon } from './components/Icons';
import { useLocale } from './contexts/LocaleContext';
import { useTheme, AppFont, AppBackground } from './contexts/ThemeContext';
import { SettingsModal } from './components/SettingsModal';
import { Auth } from './components/Auth';
import { useToast } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { ExportModal } from './components/ExportModal';
import { PdfContent } from './components/PdfContent';
import { PdfCoverPage } from './components/PdfCoverPage';
import { PdfTocPage } from './components/PdfTocPage';
import { GraphView } from './components/GraphView';

type SerializableMessage = Omit<Message, 'isTyping' | 'isGeneratingImage' | 'isGeneratingPdf' | 'isGeneratingSpreadsheet' | 'isGeneratingPresentation' | 'isGeneratingPresentationImages' | 'analysisState' | 'isGeneratingCode' | 'codeBlock' | 'spreadsheetData' | 'spreadsheetFile' | 'presentationData' | 'presentationFile' | 'pdfData' | 'pdfFile' | 'isGeneratingVideo' | 'videoGenerationStatus' | 'requiresApiKeySelection' | 'isGeneratingWord' | 'wordData' | 'isGenerating3dModel' | 'model3dData'>;
type SerializableConversation = Omit<Conversation, 'messages'> & {
    messages: SerializableMessage[];
};

const USERS_DB_KEY = 'universum-users-db';
const SESSION_KEY = 'universum-session';
const GUEST_DATA_KEY = 'universum-guest-data';
const MAX_RECENT_ATTACHMENTS = 20;

const safeJsonParse = (key: string, fallback: any) => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return fallback;
        return JSON.parse(item);
    } catch (e) {
        console.error(`Failed to parse localStorage item "${key}":`, e);
        return fallback;
    }
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const weatherFunctionDeclaration: FunctionDeclaration = {
  name: 'getWeatherForecast',
  description: 'Get the weather forecast for a given location for a number of days.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: 'The city and state, e.g. San Francisco, CA',
      },
      days: {
        type: Type.NUMBER,
        description: 'The number of days to forecast, e.g., 5 for a 5-day forecast.'
      }
    },
    required: ['location'],
  },
};

const computerControlFunctionDeclaration: FunctionDeclaration = {
  name: 'computerControl',
  description: "Change settings on the user's computer interface, like the visual theme, font, or background style, or to trigger actions like logging in.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      setting: {
        type: Type.STRING,
        description: 'The setting to change or action to trigger.',
        enum: ['changeTheme', 'changeFont', 'changeBackground', 'login']
      },
      value: {
        type: Type.STRING,
        description: 'The value for the setting. For "changeTheme", use "light" or "dark". For "changeFont", use names like "sans", "serif", "mono", "poppins". For "changeBackground", use names like "neural", "starfield", "aurora". Not required for "login".',
      }
    },
    required: ['setting'],
  },
};

const openWebsiteFunctionDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a given URL in a new browser tab.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The full URL of the website to open, including http:// or https://',
      },
    },
    required: ['url'],
  },
};

const searchYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'searchYouTube',
  description: 'Search for videos on YouTube and display the results to the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query for YouTube, e.g., "how to learn react" or "lofi hip hop radio".',
      },
    },
    required: ['query'],
  },
};

const mockGetWeatherForecast = ({ location, days = 1 }: { location: string, days?: number }): any => {
    const forecast = [];
    const today = new Date();
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const lowerLocation = location.toLowerCase();
    let baseTemp = 20;
    let baseCondition = "Partly Cloudy";

    if (lowerLocation.includes("dubai") || lowerLocation.includes("cairo")) { baseTemp = 38; baseCondition = "Sunny"; }
    else if (lowerLocation.includes("london") || lowerLocation.includes("berlin")) { baseTemp = 15; baseCondition = "Cloudy"; }
    else if (lowerLocation.includes("moscow") || lowerLocation.includes("oslo")) { baseTemp = -2; baseCondition = "Snowing"; }
    else if (lowerLocation.includes("sydney")) { baseTemp = 22; baseCondition = "Showers"; }
    else if (lowerLocation.includes("tokyo")) { baseTemp = 28; baseCondition = "Humid"; }

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const high = baseTemp + Math.floor(Math.random() * 4) - 2 + i;
        const low = high - (5 + Math.floor(Math.random() * 3));
        let condition = baseCondition;
        if (i > 1 && Math.random() > 0.6) {
            const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Showers", "Thunderstorms"];
            condition = conditions[Math.floor(Math.random() * conditions.length)];
        }

        forecast.push({
            date: date.toISOString().split('T')[0],
            dayOfWeek: weekdays[date.getDay()],
            highTemperature: `${high}°C`,
            lowTemperature: `${low}°C`,
            condition: condition,
            humidity: `${40 + Math.floor(Math.random() * 30)}%`,
            windSpeed: `${5 + Math.floor(Math.random() * 15)} km/h`
        });
    }
    return { forecast };
};

const extractTextFromResponse = (response: GenerateContentResponse): string => {
    if (!response.candidates || response.candidates.length === 0) {
        return '';
    }
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
        return '';
    }
    // This explicitly gets only text parts, ignoring others like `thoughtSignature`
    // and suppresses the SDK warning about non-text parts.
    return candidate.content.parts
        .map(part => part.text)
        .filter(text => typeof text === 'string')
        .join('');
};

export const App: React.FC = () => {
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);
  const [coachGoals, setCoachGoals] = useState<CoachGoal[]>([]);
  const [recentAttachments, setRecentAttachments] = useState<RecentAttachment[]>([]);
  const [connectedClouds, setConnectedClouds] = useState<Partial<Record<CloudProvider, boolean>>>({});
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousUser = useRef<User | null>(null);
  const { t, locale } = useLocale();
  const { setTheme, setFont, setBackground } = useTheme();
  const { addToast } = useToast();
  const isGenerationCancelledRef = useRef(false);

  const getStorageKey = useCallback((email: string, key: string) => `universum-${key}-${email}`, []);
  const isGuest = currentUser === null;

  useEffect(() => {
    if (error) {
        addToast(error, 'error', t('toastErrorTitle'));
        setError(null);
    }
  }, [error, addToast, t]);

  useEffect(() => {
    if (authError) {
        addToast(authError, 'error', t('toastErrorTitle'));
        setAuthError(null);
    }
  }, [authError, addToast, t]);

  useEffect(() => {
    try {
      if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set.");
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setAi(genAI);

      const savedUser = safeJsonParse(SESSION_KEY, null);
      if (savedUser && typeof savedUser === 'object' && savedUser.email) {
          setCurrentUser(savedUser);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during initialization.');
    } finally {
        setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ai || isAuthLoading) return;

    if (previousUser.current && !currentUser) {
        const conversationsToSave: SerializableConversation[] = conversations.map((conv) => ({
            ...conv,
            messages: conv.messages.map(({ isTyping, isGeneratingImage, isGeneratingPdf, isGeneratingSpreadsheet, isGeneratingPresentation, isGeneratingPresentationImages, analysisState, isGeneratingCode, codeBlock, spreadsheetData, spreadsheetFile, presentationData, presentationFile, pdfData, pdfFile, isGeneratingVideo, videoGenerationStatus, requiresApiKeySelection, isGeneratingWord, wordData, isGenerating3dModel, model3dData, ...msg }) => msg)
        }));
        const dataToSave = { conversations: conversationsToSave, memoryFacts, coachGoals, recentAttachments };
        localStorage.setItem(getStorageKey(previousUser.current.email, 'chat-data'), JSON.stringify(dataToSave));
        localStorage.setItem(getStorageKey(previousUser.current.email, 'cloud-connections'), JSON.stringify(connectedClouds));
    }
    
    let chatDataKey: string;
    let connectionsKey: string;

    if (currentUser) {
        chatDataKey = getStorageKey(currentUser.email, 'chat-data');
        connectionsKey = getStorageKey(currentUser.email, 'cloud-connections');
    } else { 
        chatDataKey = GUEST_DATA_KEY;
        connectionsKey = 'universum-guest-cloud-connections';
    }

    const savedData = localStorage.getItem(chatDataKey);
    if (!savedData) {
        setConversations([]);
        setMemoryFacts([]);
        setCoachGoals([]);
        setRecentAttachments([]);
        setActiveConversationId(null);
    } else {
        let data;
        try {
            data = JSON.parse(savedData);
        } catch (e) {
            console.error("Failed to parse user data from localStorage. Data might be corrupted.", e);
            localStorage.setItem(`${chatDataKey}-corrupted-backup-${new Date().toISOString()}`, savedData);
            addToast(t('dataLoadError'), 'error');
            setConversations([]);
            setMemoryFacts([]);
            setCoachGoals([]);
            setRecentAttachments([]);
            setActiveConversationId(null);
            data = null;
        }

        if (data) {
            const migratedConvs = (data.conversations || []).reduce((acc: Conversation[], conv: any, index: number) => {
                try {
                    const migratedMessages = (conv.messages || []).filter(Boolean).map((msg: any) => {
                        const newMsg = { ...msg };
                        if (typeof newMsg.content === 'string' && !Array.isArray(newMsg.contentHistory)) {
                            newMsg.contentHistory = [newMsg.content];
                            if (typeof newMsg.activeVersionIndex !== 'number') {
                                newMsg.activeVersionIndex = 0;
                            }
                        }
                        delete newMsg.content;
                        if (!Array.isArray(newMsg.contentHistory)) {
                            newMsg.contentHistory = [];
                        }
                        const historyLength = newMsg.contentHistory.length;
                        const isIndexInvalid = typeof newMsg.activeVersionIndex !== 'number' || newMsg.activeVersionIndex < 0 || (historyLength > 0 && newMsg.activeVersionIndex >= historyLength) || (historyLength === 0 && newMsg.activeVersionIndex !== 0);
                        if (isIndexInvalid) {
                            newMsg.activeVersionIndex = Math.max(0, historyLength - 1);
                        }
                        return newMsg;
                    });
                    
                    let modelToSet: ModelType = 'universum-4.0';
                    const currentModel = conv.model as any;
                    if (['fast', 'universum-1.3-schnell', 'universum-1.4-schnell', 'universum-1.5-schnell', 'universum-1.6-schnell', 'universum-1.7-schnell'].includes(currentModel)) {
                        modelToSet = 'universum-4.0-schnell';
                    } else if (['universum-1.3', 'universum-pro', 'genius-pro', 'genius', 'smart', 'universum-1.4', 'universum-1.5', 'universum-1.6', 'universum-1.7'].includes(currentModel)) {
                        modelToSet = 'universum-4.0';
                    }

                    acc.push({
                        ...conv,
                        messages: migratedMessages,
                        model: modelToSet,
                        createdAt: conv.createdAt || new Date(parseInt(conv.id.split('-')[1] || Date.now())).toISOString(),
                    });
                } catch (e) {
                    console.error(`Failed to load/migrate conversation at index ${index}. Skipping it.`, e, conv);
                    addToast(t('conversationLoadError', conv.title || `Chat #${index + 1}`), 'error');
                }
                return acc;
            }, []);

            setConversations(migratedConvs);
            setActiveConversationId(migratedConvs[0]?.id || null);
            setMemoryFacts(data.memoryFacts || []);
            setCoachGoals(data.coachGoals || []);
            setRecentAttachments(data.recentAttachments || []);
        }
    }

    try {
        const savedConnections = localStorage.getItem(connectionsKey);
        setConnectedClouds(savedConnections ? JSON.parse(savedConnections) : {});
    } catch (e) {
        console.error("Failed to parse cloud connections from localStorage.", e);
        setConnectedClouds({});
    }

    previousUser.current = currentUser;
  }, [currentUser, ai, getStorageKey, isAuthLoading, addToast, t]);

  useEffect(() => {
      if (isAuthLoading) return;
      
      const conversationsToSave: SerializableConversation[] = conversations.map((conv) => ({
          ...conv,
          messages: conv.messages.map(({ isTyping, isGeneratingImage, isGeneratingPdf, isGeneratingSpreadsheet, isGeneratingPresentation, isGeneratingPresentationImages, analysisState, isGeneratingCode, codeBlock, spreadsheetData, spreadsheetFile, presentationData, presentationFile, pdfData, pdfFile, isGeneratingVideo, videoGenerationStatus, requiresApiKeySelection, isGeneratingWord, wordData, isGenerating3dModel, model3dData, ...msg }) => msg)
      }));
      const dataToSave = { conversations: conversationsToSave, memoryFacts, coachGoals, recentAttachments };

      if (isGuest) {
          localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(dataToSave));
          localStorage.setItem('universum-guest-cloud-connections', JSON.stringify(connectedClouds));
      } else if (currentUser) {
          localStorage.setItem(getStorageKey(currentUser.email, 'chat-data'), JSON.stringify(dataToSave));
          localStorage.setItem(getStorageKey(currentUser.email, 'cloud-connections'), JSON.stringify(connectedClouds));
      }

  }, [conversations, memoryFacts, coachGoals, recentAttachments, connectedClouds, currentUser, isGuest, isAuthLoading, getStorageKey]);

  useEffect(() => {
    if (!isLoading) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId, isLoading]);

  const migrateGuestData = (user: User) => {
    const guestDataStr = localStorage.getItem(GUEST_DATA_KEY);
    if (!guestDataStr) return;
    
    const guestData = JSON.parse(guestDataStr);
    const guestConversations = guestData.conversations || [];
    const guestRecentAttachments = guestData.recentAttachments || [];
    
    const userStorageKey = getStorageKey(user.email, 'chat-data');
    const userDataStr = localStorage.getItem(userStorageKey);
    const userData = userDataStr ? JSON.parse(userDataStr) : { conversations: [], memoryFacts: [], recentAttachments: [] };
    
    userData.conversations = [...guestConversations, ...userData.conversations];

    const existingRecentTitles = new Set(userData.recentAttachments.map((r: RecentAttachment) => r.type === 'local' ? r.name : r.title));
    const mergedRecents = [...guestRecentAttachments.filter((r: RecentAttachment) => !existingRecentTitles.has(r.type === 'local' ? r.name : r.title)), ...userData.recentAttachments];
    userData.recentAttachments = mergedRecents.slice(0, MAX_RECENT_ATTACHMENTS);


    localStorage.setItem(userStorageKey, JSON.stringify(userData));
    localStorage.removeItem(GUEST_DATA_KEY);
  };

  const handleLogin = async (email: string, password: string): Promise<void> => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
          const users = safeJsonParse(USERS_DB_KEY, []);
          if (!Array.isArray(users)) {
              console.error("User DB is corrupted, resetting.");
              localStorage.removeItem(USERS_DB_KEY);
              setAuthError(t('loginError'));
              return;
          }
          const user = users.find((u: any) => u && typeof u === 'object' && u.email === email && u.password === password);
          if (user) {
              const userData = { name: user.name, email: user.email };
              migrateGuestData(userData);
              localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
              setCurrentUser(userData);
              setShowAuthModal(false);
          } else {
              setAuthError(t('loginError'));
          }
      } catch (e) {
          console.error("Login error:", e);
          setAuthError(t('errorMessageDefault', e instanceof Error ? e.message : 'Unknown error'));
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleRegister = async (name: string, email: string, password: string): Promise<void> => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
          let users = safeJsonParse(USERS_DB_KEY, []);
          if (!Array.isArray(users)) {
              console.error("User DB is corrupted, resetting.");
              users = [];
          }
          if (users.some((u: any) => u && typeof u === 'object' && u.email === email)) {
              setAuthError(t('registerErrorUserExists'));
              return;
          }
          users.push({ name, email, password });
          localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
          
          const userData = { name, email };
          migrateGuestData(userData);
          localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
          setCurrentUser(userData);
          setShowAuthModal(false);
      } catch (e) {
          console.error("Registration error:", e);
          setAuthError(t('errorMessageDefault', e instanceof Error ? e.message : 'Unknown error'));
      } finally {
          setIsAuthLoading(false);
      }
  };
  
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setShowAuthModal(false);
  };

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);
  
  const sortedConversations = useMemo(() => {
      return [...conversations].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [conversations]);

  const handleNewChat = useCallback(() => {
    if (!ai || isLoading) return;
    setEditingMessageId(null);
    const newId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newConversation: Conversation = {
      id: newId,
      title: t('newChatTitle'),
      messages: [],
      model: 'universum-4.0',
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [ai, isLoading, t]);

  const handleSelectConversation = useCallback((id: string) => {
    if (isLoading) return;
    setActiveConversationId(id);
    setEditingMessageId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isAuthLoading) {
        return;
    }

    if (conversations.length === 0) {
        handleNewChat();
        return; 
    }

    const activeConvExists = conversations.some(c => c.id === activeConversationId);
    if (!activeConvExists && conversations.length > 0) {
        const newActiveId = sortedConversations[0]?.id;
        if (newActiveId) {
            setActiveConversationId(newActiveId);
        }
    }
  }, [conversations, activeConversationId, sortedConversations, isAuthLoading, handleNewChat]);


  const updateConversation = useCallback((id: string, updateFn: (conv: Conversation) => Conversation) => {
      setConversations(prev => prev.map(conv => conv.id === id ? updateFn(conv) : conv));
  }, []);

  const handleDeleteConversation = useCallback((idToDelete: string) => {
    if (isLoading) return;
    setConversations(prev => prev.filter(c => c.id !== idToDelete));
    if (activeConversationId === idToDelete) {
      setActiveConversationId(null);
    }
  }, [isLoading, activeConversationId]);

  const handleRenameConversation = useCallback((idToRename: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      updateConversation(idToRename, conv => ({ ...conv, title: newTitle.trim() }));
  }, [updateConversation]);

  const handleTogglePinConversation = useCallback((idToPin: string) => {
    updateConversation(idToPin, conv => ({ ...conv, isPinned: !conv.isPinned }));
  }, [updateConversation]);

  const handleModelChange = useCallback((id: string, newModel: ModelType) => {
    updateConversation(id, conv => ({ ...conv, model: newModel }));
  }, [updateConversation]);
  
  const handleConnectCloud = (provider: CloudProvider): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            setConnectedClouds(prev => ({ ...prev, [provider]: true }));
            addToast(t('connectionSuccess', provider), 'success');
            resolve();
        }, 1500); 
    });
  };

  const handleDisconnectCloud = (provider: CloudProvider) => {
      setConnectedClouds(prev => {
          const newClouds = { ...prev };
          delete newClouds[provider];
          return newClouds;
      });
      addToast(t('disconnectionSuccess', provider), 'info');
  };

  const handleExportAllData = useCallback(() => {
      const dataToExport = {
          user: currentUser,
          conversations,
          memoryFacts,
          coachGoals,
          recentAttachments,
          connectedClouds,
      };
      const content = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `universum_export_${currentUser?.name || 'guest'}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // FIX: Use revokeObjectURL to release the object URL from memory, not createObjectURL.
      URL.revokeObjectURL(url);
  }, [currentUser, conversations, memoryFacts, coachGoals, recentAttachments, connectedClouds]);
  
  const handleDeleteAccount = useCallback(async (): Promise<void> => {
      if (!currentUser) return;
      const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]') as any[];
      const updatedUsers = users.filter(u => u.email !== currentUser.email);
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));
      localStorage.removeItem(getStorageKey(currentUser.email, 'chat-data'));
      localStorage.removeItem(getStorageKey(currentUser.email, 'cloud-connections'));
      handleLogout();
  }, [currentUser, getStorageKey]);

  const generateImage = useCallback(async (actionData: { prompt: string; count?: number }, modelMessageId: string, convId: string) => {
    if (!ai) return;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: actionData.prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagesData: { mimeType: string; data: string }[] = [];
        if (response.candidates && response.candidates[0] && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imagesData.push({
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data,
                    });
                }
            }
        }

        if (imagesData.length === 0) {
            throw new Error("The API did not return any images.");
        }

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, imagesData: imagesData, isGeneratingImage: false }
                    : m
            ),
        }));

    } catch (e) {
        console.error("Image generation failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to generate the image.';
        
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m => {
                if (m.id !== modelMessageId) return m;

                const errorText = `${t('imageGenerationError')}: ${errorMessage}`;
                const currentContent = m.contentHistory[m.activeVersionIndex] || '';
                const newContent = currentContent ? `${currentContent}\n\n${errorText}` : errorText;
                
                const newHistory = [...m.contentHistory];
                newHistory[m.activeVersionIndex] = newContent;
                
                return { ...m, contentHistory: newHistory, isGeneratingImage: false };
            }),
        }));
    }
}, [ai, updateConversation, t]);

const handleGenerateVideo = useCallback(async (
    actionData: { prompt: string; aspectRatio?: '16:9' | '9:16' },
    modelMessageId: string,
    convId: string
) => {
    if (!window.aistudio) {
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, isGeneratingVideo: false, contentHistory: [t('videoGenerationError')], activeVersionIndex: 0, analysisState: null }
                    : m
            ),
        }));
        return;
    }

    const hasApiKey = await window.aistudio.hasSelectedApiKey();
    if (!hasApiKey) {
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, isGeneratingVideo: false, requiresApiKeySelection: true, analysisState: null }
                    : m
            ),
        }));
        return;
    }

    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, videoGenerationStatus: t('videoStatusGenerating') }
                    : m
            ),
        }));

        let operation = await localAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: actionData.prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: actionData.aspectRatio || '16:9',
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            if (isGenerationCancelledRef.current) throw new Error("Cancelled");
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(operation.error.message);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation finished but no download link was provided.');
        }

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, videoGenerationStatus: t('videoStatusFinalizing') }
                    : m
            ),
        }));

        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        
        const videoBlob = await videoResponse.blob();
        const videoDataUrl = await blobToDataURL(videoBlob);

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? {
                        ...m,
                        isGeneratingVideo: false,
                        videoData: { url: videoDataUrl, mimeType: videoBlob.type },
                    }
                    : m
            ),
        }));

    } catch (e) {
        if (isGenerationCancelledRef.current || (e as Error).message === "Cancelled") {
            throw e; 
        }

        console.error("Video generation failed:", e);
        let errorMessage = e instanceof Error ? e.message : 'Failed to generate the video.';
        
        if (errorMessage.includes("Requested entity was not found.")) {
            updateConversation(convId, conv => ({
                ...conv,
                messages: conv.messages.map(m =>
                    m.id === modelMessageId
                        ? { ...m, isGeneratingVideo: false, requiresApiKeySelection: true, analysisState: null }
                        : m
                ),
            }));
            return;
        }

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, isGeneratingVideo: false, contentHistory: [`${t('videoGenerationError')}: ${errorMessage}`], activeVersionIndex: 0, analysisState: null }
                    : m
            ),
        }));
    }
}, [updateConversation, t]);

const handleGeneratePdf = useCallback(async (actionData: { filename: string; title: string; content: string }, modelMessageId: string, convId: string) => {
    if (!ai) return;

    try {
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 40;

        const renderComponentToCanvas = async (element: React.ReactElement, width?: number): Promise<{ canvas: HTMLCanvasElement | null, breakPoints: number[] }> => {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            if (width) {
                container.style.width = `${width}px`;
            }
            document.body.appendChild(container);

            const root = ReactDOM.createRoot(container);
            root.render(element);

            await new Promise(resolve => setTimeout(resolve, 300));
            const images = Array.from(container.getElementsByTagName('img'));
            const imagePromises = images.map(img => {
                if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
                return new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
            });
            await Promise.all(imagePromises);
            await new Promise(resolve => setTimeout(resolve, 100));

            const breakNodes = container.querySelectorAll('.pdf-page-break-suggestion');
            const containerTop = container.getBoundingClientRect().top;
            const breakPoints = Array.from(breakNodes).map(node => (node as HTMLElement).getBoundingClientRect().top - containerTop);

            const canvas = await html2canvas(container, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                width: container.scrollWidth,
                height: container.scrollHeight,
                windowWidth: container.scrollWidth,
                windowHeight: container.scrollHeight,
            });

            root.unmount();
            document.body.removeChild(container);
            return { canvas, breakPoints };
        };

        const tocRegex = /(?:^#+\s*(?:Table of Contents|Inhaltsverzeichnis)[\s\S]*?)(?=\n#+|$)/i;
        const match = actionData.content.match(tocRegex);
        const tocMarkdown = match ? match[0] : '';
        const mainContentMarkdown = match ? actionData.content.replace(match[0], '').trim() : actionData.content;
        const hasToc = !!tocMarkdown;

        const [coverResult, tocResult, contentResult] = await Promise.all([
            renderComponentToCanvas(<PdfCoverPage title={actionData.title} />, 794),
            hasToc 
                ? renderComponentToCanvas(<PdfTocPage tocMarkdown={tocMarkdown} />, 794) 
                : Promise.resolve({ canvas: null, breakPoints: [] }),
            mainContentMarkdown.trim() 
                ? renderComponentToCanvas(<PdfContent markdown={mainContentMarkdown} />, 794) 
                : Promise.resolve({ canvas: null, breakPoints: [] }),
        ]);

        const { canvas: coverCanvas } = coverResult;
        const { canvas: tocCanvas, breakPoints: tocBreakPoints } = tocResult;
        const { canvas: contentCanvas, breakPoints: contentBreakPoints } = contentResult;
        
        const getPageSlices = (canvas: HTMLCanvasElement | null, breakPoints: number[]): { start: number, height: number }[] => {
            if (!canvas) return [];
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / (pdfWidth - margin * 2);
            const pageContentHeight = pdfHeight - (margin * 2);
            const scaledPageContentHeight = pageContentHeight * ratio;
            
            const html2canvasScale = 1.5;
            const scaledBreakPoints = breakPoints.map(bp => bp * html2canvasScale);

            let yPos = 0;
            const pages: { start: number, height: number }[] = [];
            while (yPos < imgHeight) {
                const endOfPage = yPos + scaledPageContentHeight;
                let cutY = endOfPage;

                if (cutY < imgHeight) {
                    const possibleBreaks = scaledBreakPoints.filter(bp => bp > yPos + 20 && bp <= endOfPage);
                    if (possibleBreaks.length > 0) {
                        cutY = Math.max(...possibleBreaks);
                    }
                } else {
                    cutY = imgHeight;
                }

                const sliceHeight = cutY - yPos;
                if (sliceHeight <= 0) {
                    if (imgHeight - yPos > 0) {
                        pages.push({ start: yPos, height: imgHeight - yPos });
                    }
                    break;
                }
                pages.push({ start: yPos, height: sliceHeight });
                yPos = cutY;
            }
            return pages;
        };
        
        const tocPageSlices = getPageSlices(tocCanvas, tocBreakPoints);
        const contentPageSlices = getPageSlices(contentCanvas, contentBreakPoints);
        const totalPages = 1 + tocPageSlices.length + contentPageSlices.length;
        const generationDate = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

        if (coverCanvas) {
            pdf.addImage(coverCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        const renderPages = (canvas: HTMLCanvasElement | null, pages: { start: number, height: number }[], pageOffset: number) => {
            if (!canvas) return;
            const imgWidth = canvas.width;
            const ratio = imgWidth / (pdfWidth - margin * 2);

            pages.forEach((page, i) => {
                pdf.addPage();
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = page.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(canvas, 0, page.start, imgWidth, page.height, 0, 0, imgWidth, page.height);
                    const imgData = tempCanvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - margin * 2, page.height / ratio);
                }
            });
        };

        renderPages(tocCanvas, tocPageSlices, 2);
        renderPages(contentCanvas, contentPageSlices, 2 + tocPageSlices.length);
        
        for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139);

            const headerText = actionData.title.length > 80 ? actionData.title.substring(0, 77) + '...' : actionData.title;
            pdf.text(headerText, margin, margin - 20);
            
            const pageNumText = t('pdfPage', i, totalPages);
            pdf.text(generationDate, margin, pdfHeight - margin + 22);
            pdf.text(pageNumText, pdfWidth - margin, pdfHeight - margin + 22, { align: 'right' });
            
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, margin - 12, pdfWidth - margin, pdfWidth - 12);
            pdf.line(margin, pdfHeight - margin + 12, pdfWidth - margin, pdfHeight - margin + 12);
        }

        const dataUrl = pdf.output('datauristring');

        const pdfFileData = {
            filename: actionData.filename,
            dataUrl: dataUrl,
            pageCount: totalPages,
        };

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId ? { ...m, isGeneratingPdf: false, pdfData: undefined, pdfFile: pdfFileData } : m
            ),
        }));
        addToast(t('exportSuccess'), 'success');

    } catch (e) {
        console.error("PDF generation failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to generate the PDF.';
        const newContent = `${t('pdfGenerationError')}: ${errorMessage}`.trim();
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, contentHistory: [newContent], activeVersionIndex: 0, isGeneratingPdf: false, pdfData: undefined }
                    : m
            ),
        }));
    }
}, [ai, updateConversation, t, locale]);


const handleGenerateSpreadsheet = useCallback(async (actionData: { filename: string; sheets: { sheetName: string; headers: string[]; rows: any[][] }[] }, modelMessageId: string, convId:string) => {
    if (!ai) return;

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const fileData = {
            filename: actionData.filename || 'universum_spreadsheet.xlsx',
            data: {
                sheets: actionData.sheets
            }
        };

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId 
                ? { 
                    ...m, 
                    isGeneratingSpreadsheet: false, 
                    spreadsheetData: undefined,
                    spreadsheetFile: fileData,
                } 
                : m
            ),
        }));

    } catch (e) {
        console.error("Spreadsheet preparation failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to prepare the spreadsheet data.';
        
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m => {
                if (m.id !== modelMessageId) return m;

                const newContent = `${t('spreadsheetGenerationError')}: ${errorMessage}`.trim();
                const currentContent = m.contentHistory[m.activeVersionIndex] || '';
                const updatedContent = currentContent ? `${currentContent}\n\n${newContent}` : newContent;
                const newHistory = [...m.contentHistory];
                newHistory[m.activeVersionIndex] = updatedContent;

                return { 
                    ...m, 
                    contentHistory: newHistory,
                    isGeneratingSpreadsheet: false,
                    spreadsheetData: undefined,
                };
            }),
        }));
    }
}, [ai, updateConversation, t]);

const generateImagesForPresentation = useCallback(async (
    ai: GoogleGenAI,
    slides: Slide[]
): Promise<Slide[]> => {
    const imagePrompts: { slideIndex: number, prompt: string }[] = [];
    slides.forEach((slide, index) => {
        if (slide.image?.prompt) {
            imagePrompts.push({ slideIndex: index, prompt: slide.image.prompt });
        }
    });

    if (imagePrompts.length === 0) {
        return slides;
    }

    const updatedSlides = [...slides]; 

    for (const { slideIndex, prompt } of imagePrompts) {
        try {
            if (isGenerationCancelledRef.current) {
                console.log("Image generation for presentation cancelled.");
                break; 
            }

            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const imageData = response.generatedImages[0].image.imageBytes;
                if (updatedSlides[slideIndex].image) {
                    updatedSlides[slideIndex].image!.data = imageData;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 4000));

        } catch (e) {
            console.error(`Failed to generate image for prompt: "${prompt}"`, e);
            const errorBody = e instanceof Error ? e.message : (typeof e === 'object' && e !== null) ? JSON.stringify(e) : String(e);
            addToast(`${t('imageGenerationError')}: ${errorBody}`, 'error');
        }
    }

    return updatedSlides;
}, [addToast, t]);

const handleGeneratePresentation = useCallback(async (
    actionData: { filename: string; data: { theme: PresentationTheme, slides: Slide[] } },
    modelMessageId: string,
    convId: string
) => {
    if (!ai) return;

    const hasImagesToGenerate = actionData.data.slides.some(slide => slide.image?.prompt && !slide.image.data);

    if (hasImagesToGenerate) {
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                ? { ...m, isGeneratingPresentation: false, isGeneratingPresentationImages: true }
                : m
            ),
        }));
    }

    try {
        const slidesWithImages = hasImagesToGenerate 
            ? await generateImagesForPresentation(ai, actionData.data.slides)
            : actionData.data.slides;
        
        const fileData = {
            filename: actionData.filename || 'universum_presentation.pptx',
            data: {
                theme: actionData.data.theme,
                slides: slidesWithImages
            }
        };

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                ? { 
                    ...m, 
                    isGeneratingPresentation: false,
                    isGeneratingPresentationImages: false,
                    presentationData: undefined,
                    presentationFile: fileData,
                } 
                : m
            ),
        }));

    } catch (e) {
        console.error("Presentation generation failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to prepare the presentation data.';
        
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m => {
                if (m.id !== modelMessageId) return m;
                const newContent = `${t('presentationGenerationError')}: ${errorMessage}`.trim();
                const currentContent = m.contentHistory[m.activeVersionIndex] || '';
                const updatedContent = currentContent ? `${currentContent}\n\n${newContent}` : newContent;
                const newHistory = [...m.contentHistory];
                newHistory[m.activeVersionIndex] = updatedContent;
                return { 
                    ...m, 
                    contentHistory: newHistory,
                    isGeneratingPresentation: false,
                    isGeneratingPresentationImages: false,
                    presentationData: undefined,
                };
            }),
        }));
    }
}, [ai, updateConversation, t, generateImagesForPresentation]);

const handleGenerateWord = useCallback(async (
    actionData: {
        filename: string;
        theme?: { primaryColor?: string; font?: string };
        content: any[];
    },
    modelMessageId: string,
    convId: string
) => {
    if (!ai) return;

    try {
        const theme = actionData.theme || {};
        const primaryColor = theme.primaryColor || '2E74B5';
        const font = theme.font || 'Calibri';

        const docChildren = actionData.content.map(item => {
            if (!item || (typeof item !== 'object')) return null;

            const paragraphProps: any = { style: "Normal", spacing: {} };

            if (item.alignment) {
                switch (item.alignment.toUpperCase()) {
                    case 'CENTER': paragraphProps.alignment = AlignmentType.CENTER; break;
                    case 'END':
                    case 'RIGHT': paragraphProps.alignment = AlignmentType.END; break;
                    case 'JUSTIFY': paragraphProps.alignment = AlignmentType.JUSTIFY; break;
                    default: paragraphProps.alignment = AlignmentType.START; break;
                }
            }

            if (item.spacing) {
                if (typeof item.spacing.before === 'number') paragraphProps.spacing.before = item.spacing.before;
                if (typeof item.spacing.after === 'number') paragraphProps.spacing.after = item.spacing.after;
            }

            let children: TextRun[] = [];

            if (item.type?.startsWith('heading')) {
                const level = parseInt(item.type.replace('heading', ''), 10);
                if (level === 1) paragraphProps.style = "Heading1";
                if (level === 2) paragraphProps.style = "Heading2";
                children.push(new TextRun({ text: item.text || '', font }));
            } else if (item.type === 'bullet') {
                paragraphProps.bullet = { level: 0 };
                children.push(new TextRun({ text: item.text || '', font }));
            } else if (item.children && Array.isArray(item.children)) {
                item.children.forEach((child: any) => {
                    const textRunProps: any = { text: child.text || '', font };
                    if (child.style) {
                        if (child.style.bold) textRunProps.bold = true;
                        if (child.style.italic) textRunProps.italic = true;
                        if (child.style.color) textRunProps.color = child.style.color;
                        if (child.style.size) textRunProps.size = child.style.size;
                    }
                    children.push(new TextRun(textRunProps));
                });
            } else if (item.text) {
                children.push(new TextRun({ text: item.text, font }));
            } else {
                return null;
            }

            if (children.length === 0) return null;

            return new Paragraph({ ...paragraphProps, children });
        }).filter((p): p is Paragraph => p !== null);


        const doc = new Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        basedOn: "Normal",
                        next: "Normal",
                        run: { font: font, size: 22, color: "000000" }, // 11pt
                        paragraph: { spacing: { after: 120 } }
                    },
                    {
                        id: "Heading1",
                        name: "Heading 1",
                        basedOn: "Normal",
                        next: "Normal",
                        run: { font: font, size: 32, bold: true, color: primaryColor }, // 16pt
                        paragraph: { spacing: { before: 240, after: 120 } }
                    },
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        next: "Normal",
                        run: { font: font, size: 26, bold: true, color: primaryColor }, // 13pt
                        paragraph: { spacing: { before: 240, after: 120 } }
                    },
                ]
            },
            sections: [{
                children: docChildren,
            }],
        });
        
        const blob = await Packer.toBlob(doc);

        const wordFileData = {
            filename: actionData.filename,
            blob: blob,
        };

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId ? { ...m, isGeneratingWord: false, wordData: undefined, wordFile: wordFileData } : m
            ),
        }));
        addToast(t('exportSuccess'), 'success');

    } catch (e) {
        console.error("Word generation failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to generate the Word document.';
        const newContent = `${t('wordGenerationError')}: ${errorMessage}`.trim();
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, contentHistory: [newContent], activeVersionIndex: 0, isGeneratingWord: false, wordData: undefined }
                    : m
            ),
        }));
    }
}, [ai, updateConversation, t, addToast]);


const handleExportMessageAsPdf = useCallback(async (markdownContent: string, messageId: string) => {
    if (!markdownContent) return;
    addToast(t('generatingPdf'), 'info');

    try {
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 40;

        const contentContainer = document.createElement('div');
        contentContainer.style.position = 'fixed';
        contentContainer.style.left = '-9999px';
        contentContainer.style.top = '0';
        contentContainer.style.width = '794px';
        document.body.appendChild(contentContainer);

        const contentRoot = ReactDOM.createRoot(contentContainer);
        contentRoot.render(<PdfContent markdown={markdownContent} />);

        const images = Array.from(contentContainer.getElementsByTagName('img'));
        const imagePromises = images.map(img => new Promise<void>(resolve => {
            if (img.complete && img.naturalHeight !== 0) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
        }));
        await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 500));

        const contentCanvas = await html2canvas(contentContainer, { 
            scale: 2, 
            useCORS: true,
            width: contentContainer.scrollWidth,
            height: contentContainer.scrollHeight,
            windowWidth: contentContainer.scrollWidth,
            windowHeight: contentContainer.scrollHeight,
        });
        contentRoot.unmount();
        document.body.removeChild(contentContainer);

        const imgWidth = contentCanvas.width;
        const imgHeight = contentCanvas.height;
        const ratio = imgWidth / (pdfWidth - margin * 2);
        const scaledCanvasHeight = imgHeight / ratio;
        const pageContentHeight = pdfHeight - (margin * 2);
        const totalPages = Math.ceil(scaledCanvasHeight / pageContentHeight);
        let canvasY = 0;
        const pdfTitle = t('exportAsPdf');

        for (let i = 1; i <= totalPages; i++) {
            if (i > 1) pdf.addPage();
            
            // Header
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139); // slate-500
            const headerText = pdfTitle.length > 80 ? pdfTitle.substring(0, 77) + '...' : pdfTitle;
            pdf.text(headerText, margin, margin - 20);
            pdf.setDrawColor(226, 232, 240); // slate-200
            pdf.line(margin, margin - 12, pdfWidth - margin, pdfWidth - 12);


            const sliceHeight = Math.min(imgHeight - canvasY, pageContentHeight * ratio);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgWidth;
            tempCanvas.height = sliceHeight;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.drawImage(contentCanvas, 0, canvasY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
                pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, pdfWidth - margin * 2, sliceHeight / ratio);
            }
            canvasY += sliceHeight;
            
            // Footer
            const pageNumText = `${i} / ${totalPages}`;
            pdf.setDrawColor(226, 232, 240); // slate-200
            pdf.line(margin, pdfHeight - margin + 12, pdfWidth - margin, pdfHeight - margin + 12);
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139); // slate-500
            pdf.text(pageNumText, pdfWidth - margin, pdfHeight - margin + 22, { align: 'right' });
        }

        pdf.save(`universum-message-${messageId.substring(4, 10)}.pdf`);
        addToast(t('exportSuccess'), 'success');

    } catch (e) {
        console.error("Single message PDF export failed:", e);
        setError(t('pdfGenerationError'));
    }
}, [addToast, t]);

const getRecentConversationsContext = useCallback((convs: Conversation[], activeId: string | null): string => {
    if (!activeId || convs.length <= 1) return '';

    const recentConversations = convs
        .filter(c => c.id !== activeId && c.messages.length > 0)
        .slice(0, 5); 

    if (recentConversations.length === 0) return '';
    
    const contextHeader = t('memorySystemContextTitle');
    const contextInfo = t('memorySystemContextInfo');

    const contextBody = recentConversations.map(conv => {
        const title = `${t('conversationTitleLabel')}: ${conv.title}`;
        
        const messagesToSummarize: Message[] = [];
        const firstUserMessage = conv.messages.find(m => m.role === Role.USER);
        if (firstUserMessage) {
            messagesToSummarize.push(firstUserMessage);
        }
        
        const lastTwoMessages = conv.messages.slice(-2);
        lastTwoMessages.forEach(msg => {
            if (!messagesToSummarize.some(m => m.id === msg.id)) {
                messagesToSummarize.push(msg);
            }
        });

        const messagesSummary = messagesToSummarize
            .map(msg => {
                const prefix = msg.role === Role.USER ? 'User' : 'AI';
                const content = msg.contentHistory[msg.activeVersionIndex];
                if (!content) return null;
                const truncatedContent = content.substring(0, 250).replace(/\n/g, ' ');
                return `- ${prefix}: "${truncatedContent}${content.length > 250 ? '..."' : '"'}`;
            })
            .filter(Boolean)
            .join('\n');

        return `${title}\n${messagesSummary}`;
    }).join('\n\n');

    return `\n\n---\n${contextHeader}\n${contextInfo}\n\n${contextBody}\n---`;
}, [t]);

const getSystemInstruction = useCallback(() => {
  const now = new Date();
  const dateTimeString = now.toLocaleString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
  });
  const dateTimeInstruction = t('currentDateTime', dateTimeString);
  const recentContext = getRecentConversationsContext(conversations, activeConversationId);
  const userNameInstruction = currentUser ? t('userName', currentUser.name) : '';
  const memoryInstruction = memoryFacts.length > 0
      ? `\n\n### ${t('memoryInfoTitle')}\n${memoryFacts.map(fact => fact.content).join('\n')}`
      : '';
  const automaticMemoryInstruction = t('systemInstructionMemory');
  const weatherInstruction = t('systemInstructionWeather');
  const pdfInstruction = t('systemInstructionPdfGeneration');
  const wordInstruction = t('systemInstructionWordGeneration');
  const computerControlInstruction = t('systemInstructionComputerControl');
  const openWebsiteInstruction = t('systemInstructionOpenWebsite');
  const youTubeSearchInstruction = t('systemInstructionYouTubeSearch');
  return `${userNameInstruction}\n${dateTimeInstruction}${recentContext}${memoryInstruction}\n\n${t('systemInstructionBase', locale)}${automaticMemoryInstruction}${weatherInstruction}${pdfInstruction}${wordInstruction}${computerControlInstruction}${openWebsiteInstruction}${youTubeSearchInstruction}`;
}, [t, locale, currentUser, memoryFacts, conversations, activeConversationId, getRecentConversationsContext]);

const analyzeRequest = useCallback(async (contents: Content[]): Promise<{ intent: string, tool: string, domain: string, complexity: string }> => {
    if (!ai) return { intent: 'conversation', tool: 'standard', domain: 'general', complexity: 'simple' };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: t('systemInstructionAnalyzeRequest'),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        domain: { type: Type.STRING },
                        complexity: { type: Type.STRING },
                        intent: { type: Type.STRING },
                        tool: { type: Type.STRING },
                    },
                    required: ['domain', 'complexity', 'intent', 'tool'],
                },
                temperature: 0,
            }
        });
        
        let responseText = extractTextFromResponse(response).trim();
        
        // The model sometimes wraps JSON in markdown fences despite instructions.
        // This will strip them before parsing.
        const fenceRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/s;
        const match = responseText.match(fenceRegex);
        if (match && match[1]) {
            responseText = match[1];
        }

        const result = JSON.parse(responseText);
        return { 
            domain: result.domain || 'general',
            complexity: result.complexity || 'simple',
            intent: result.intent || 'conversation', 
            tool: result.tool || 'standard' 
        };
    } catch (e) {
        console.error("Failed to analyze request, defaulting to standard response:", e);
        return { intent: 'conversation', tool: 'standard', domain: 'general', complexity: 'simple' };
    }
}, [ai, t]);

const getAIResponse = useCallback(async (
    messageHistory: Message[],
    convId: string,
    model: ModelType,
    analysis: { intent: string, tool: string, domain: string, complexity: string },
    modelMessageId: string
) => {
    if (!ai) return;

    isGenerationCancelledRef.current = false;
    setIsLoading(true);
    setError(null);
    setEditingMessageId(null);

    const contents: Content[] = messageHistory
        .map((message): Content | null => {
            if (message.role === Role.SYSTEM) return null; 
            const parts: Part[] = [];
            if (message.imagesData) {
                message.imagesData.forEach(img => {
                    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data }});
                });
            }
            if (message.audioData) {
              parts.push({ inlineData: { mimeType: message.audioData.mimeType, data: message.audioData.data }});
            }
            const activeContent = message.contentHistory[message.activeVersionIndex];
            if (activeContent) {
                parts.push({ text: activeContent });
            }
            if (parts.length > 0) {
                return { role: message.role, parts };
            }
            return null;
        })
        .filter((c): c is Content => c !== null);

    const startTime = performance.now();

    try {
        let finalSystemInstruction;
        const config: any = {
            tools: [{functionDeclarations: [weatherFunctionDeclaration, computerControlFunctionDeclaration, openWebsiteFunctionDeclaration, searchYouTubeFunctionDeclaration]}],
            temperature: 0.5,
        };

        if (analysis.domain === 'math') {
            finalSystemInstruction = t('systemInstructionMath');
            config.temperature = 0.0; // Math should be deterministic
        } else {
            finalSystemInstruction = getSystemInstruction();
            
            const isDeepSearch = analysis.tool === 'deep_search' || analysis.tool === 'multi_agent_collaboration';
            const isCreativeWriting = analysis.tool === 'creative_suite' || analysis.tool === 'multi_agent_collaboration';
            const isCodeGeneration = analysis.tool === 'code_interpreter' || analysis.tool === 'multi_agent_collaboration';
            const isSpreadsheetGeneration = analysis.tool === 'spreadsheet_specialist' || analysis.tool === 'multi_agent_collaboration';
            const isPresentationGeneration = analysis.tool === 'creative_suite' || analysis.tool === 'multi_agent_collaboration';
            const isVideoGeneration = analysis.domain === 'video';
    
            // Add model-specific instructions
            if (model === 'universum-4.0') {
                config.temperature = 0.0;
                finalSystemInstruction += t('systemInstructionUniversum4_0');
            } else if (model === 'universum-4.0-schnell') {
                if (!isCreativeWriting && !isCodeGeneration) {
                    config.thinkingConfig = { thinkingBudget: 0 };
                }
                config.temperature = 0.8;
            }
            
            if (isCreativeWriting) {
                finalSystemInstruction += t('systemInstructionCreativeWriting');
            }
            
            if (isCodeGeneration) {
                finalSystemInstruction += t('systemInstructionCodeGeneration');
            }
    
            if (isSpreadsheetGeneration) {
                finalSystemInstruction += t('systemInstructionSpreadsheetGeneration');
            }
    
            if (isPresentationGeneration) {
                finalSystemInstruction += t('systemInstructionPresentationGeneration');
            }
            
            if (isCreativeWriting || isPresentationGeneration) {
                finalSystemInstruction += t('systemInstructionImageGeneration');
            }

            if (isVideoGeneration) {
                finalSystemInstruction += t('systemInstructionVideoGeneration');
            }
        
            if (isDeepSearch) {
                if(!config.tools[0].googleSearch) {
                    config.tools.push({googleSearch: {}});
                }
                finalSystemInstruction += t('systemInstructionDeepSearch');
                config.temperature = 0.1;
            }
        }
        
        let modelToUse: string;
        switch (model) {
            case 'universum-4.0':
                modelToUse = 'gemini-2.5-pro';
                break;
            case 'universum-4.0-schnell':
                modelToUse = 'gemini-2.5-flash';
                break;
            default: 
                modelToUse = 'gemini-2.5-pro';
        }
        
        // For math problems, always use the most powerful model to ensure accuracy,
        // overriding the user's selection if necessary.
        if (analysis.domain === 'math') {
            modelToUse = 'gemini-2.5-pro';
        }

        config.systemInstruction = finalSystemInstruction;

        let response: GenerateContentResponse = await ai.models.generateContent({
            model: modelToUse,
            contents,
            config: config,
        });

        if (isGenerationCancelledRef.current) {
            const systemMessage: Message = { id: `msg-${Date.now()}-system`, role: Role.SYSTEM, contentHistory: [t('generationStopped')], activeVersionIndex: 0 };
            updateConversation(convId, c => ({ ...c, messages: [...c.messages.slice(0, -1), systemMessage] })); 
            return;
        }

        const functionCalls = response.functionCalls;
        const weatherCall = functionCalls?.find(fc => fc.name === 'getWeatherForecast');
        const computerControlCall = functionCalls?.find(fc => fc.name === 'computerControl');
        const openWebsiteCall = functionCalls?.find(fc => fc.name === 'openWebsite');
        const youtubeCall = functionCalls?.find(fc => fc.name === 'searchYouTube');

        if (weatherCall) {
            const initialText = extractTextFromResponse(response);
            const statusText = initialText || t('consultingWeatherService');
            updateConversation(convId, conv => ({
                ...conv,
                messages: conv.messages.map(m =>
                    m.id === modelMessageId ? { ...m, contentHistory: [statusText], activeVersionIndex: 0, isTyping: false } : m
                ),
            }));

            const location = weatherCall.args.location as string;
            const days = weatherCall.args.days as number | undefined;
            const weatherData = mockGetWeatherForecast({ location, days });

            const toolResponseContents: Content[] = [
                ...contents,
                response.candidates[0].content, 
                { role: 'tool', parts: [{ functionResponse: { name: 'getWeatherForecast', response: weatherData } }] }
            ];

            response = await ai.models.generateContent({
                model: modelToUse,
                contents: toolResponseContents,
                config: {...config, tools: []} 
            });
        }
        
        if (computerControlCall) {
            const initialText = extractTextFromResponse(response);
            const statusText = initialText || `Performing action: ${computerControlCall.args.setting}...`;
            updateConversation(convId, conv => ({
                ...conv,
                messages: conv.messages.map(m =>
                    m.id === modelMessageId ? { ...m, contentHistory: [statusText], activeVersionIndex: 0, isTyping: false } : m
                ),
            }));

            const setting = computerControlCall.args.setting as string;
            const value = computerControlCall.args.value as any;
            let result = "Unknown setting or value.";

            switch (setting) {
                case 'changeTheme':
                    if (value === 'light' || value === 'dark') {
                        setTheme(value);
                        result = `Theme successfully changed to ${value}.`;
                        addToast(t('themeChanged', value), 'success');
                    }
                    break;
                case 'changeFont':
                    const validFonts: AppFont[] = ['sans', 'serif', 'mono', 'lora', 'fira-code', 'poppins', 'montserrat', 'playfair', 'jetbrains-mono', 'nunito', 'merriweather', 'inconsolata', 'lato', 'oswald', 'roboto-mono'];
                    if (validFonts.includes(value)) {
                        setFont(value);
                        result = `Font successfully changed to ${value}.`;
                        addToast(t('fontChanged', value), 'success');
                    }
                    break;
                case 'changeBackground':
                    const validBackgrounds: AppBackground[] = ['universum', 'neural', 'cosmic', 'plain', 'geometric', 'starfield', 'gradient-wave', 'hexagon', 'bubbles', 'noise', 'topo', 'blueprint', 'aurora', 'circuit', 'wavy-grid', 'polka-dots', 'digital-rain', 'tetris-fall'];
                    if (validBackgrounds.includes(value)) {
                        setBackground(value);
                        result = `Background successfully changed to ${value}.`;
                        addToast(t('backgroundChanged', value), 'success');
                    }
                    break;
                case 'login':
                    setShowAuthModal(true);
                    result = `Login screen opened for user.`;
                    break;
            }

            const toolResponseContents: Content[] = [
                ...contents,
                response.candidates[0].content, 
                { role: 'tool', parts: [{ functionResponse: { name: 'computerControl', response: { result } } }] }
            ];

            response = await ai.models.generateContent({
                model: modelToUse,
                contents: toolResponseContents,
                config: {...config, tools: []} 
            });
        }

        if (openWebsiteCall) {
            const initialText = extractTextFromResponse(response);
            const statusText = initialText || `Opening website...`;
            updateConversation(convId, conv => ({
                ...conv,
                messages: conv.messages.map(m =>
                    m.id === modelMessageId ? { ...m, contentHistory: [statusText], activeVersionIndex: 0, isTyping: false } : m
                ),
            }));

            const url = openWebsiteCall.args.url as string;
            let result = "Failed to open website.";

            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                window.open(url, '_blank', 'noopener,noreferrer');
                result = `Successfully opened ${url}.`;
            } else {
                result = `Invalid or insecure URL provided: ${url}.`;
            }

            const toolResponseContents: Content[] = [
                ...contents,
                response.candidates[0].content,
                { role: 'tool', parts: [{ functionResponse: { name: 'openWebsite', response: { result } } }] }
            ];

            response = await ai.models.generateContent({
                model: modelToUse,
                contents: toolResponseContents,
                config: {...config, tools: []}
            });
        }

        if (youtubeCall) {
            const query = youtubeCall.args.query as string;
            const statusText = t('searchingYouTubeFor', query);
        
            updateConversation(convId, conv => ({
                ...conv,
                messages: conv.messages.map(m =>
                    m.id === modelMessageId ? { ...m, contentHistory: [statusText], activeVersionIndex: 0, isTyping: false } : m
                ),
            }));
        
            // This is a simulation. In a real app, you'd call the YouTube Data API.
            const mockSearchYouTube = (searchQuery: string): VideoSearchResult[] => {
                const lowerQuery = searchQuery.toLowerCase();
                if (lowerQuery.includes('lofi') || lowerQuery.includes('music')) {
                    return [
                        { id: 'yt1', videoId: 'jfKfPfyJRdk', title: 'lofi hip hop radio 📚 - beats to relax/study to', thumbnailUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault_live.jpg', channelTitle: 'Lofi Girl' },
                        { id: 'yt2', videoId: '5qap5aO4i9A', title: 'lofi hip hop radio 💤 - beats to sleep/chill to', thumbnailUrl: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault_live.jpg', channelTitle: 'Lofi Girl' },
                        { id: 'yt3', videoId: 'rUxyKA_-grg', title: '24/7 lofi hip hop radio - beats to study/relax/game to', thumbnailUrl: 'https://i.ytimg.com/vi/rUxyKA_-grg/hqdefault_live.jpg', channelTitle: 'the bootleg boy' },
                    ];
                }
                if (lowerQuery.includes('react') || lowerQuery.includes('tutorial')) {
                     return [
                        { id: 'yt4', videoId: 'bMknfKXIFA8', title: 'React Course - Beginner\'s Tutorial for React JavaScript Library [2022]', thumbnailUrl: 'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg', channelTitle: 'freeCodeCamp.org' },
                        { id: 'yt5', videoId: 'SqcY0GlETPk', title: 'React Tutorial for Beginners', thumbnailUrl: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg', channelTitle: 'Programming with Mosh' },
                    ];
                }
                return [ // Default generic results
                    { id: 'yt6', videoId: 'dQw4w9WgXcQ', title: 'Official Music Video', thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', channelTitle: 'Official Channel' },
                    { id: 'yt7', videoId: 'V-_O7nl0Ii0', title: 'The History of the World, I Guess', thumbnailUrl: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg', channelTitle: 'bill wurtz' },
                ];
            };
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call latency
            const searchResults = mockSearchYouTube(query);

            // Temporarily update UI to show results, will be updated again with final text
            updateConversation(convId, conv => ({
                ...conv,
                messages: conv.messages.map(m =>
                    m.id === modelMessageId
                        ? { ...m, isTyping: true, videoSearchResults: searchResults, contentHistory: [''], activeVersionIndex: 0 }
                        : m
                ),
            }));

            const toolResponseContents: Content[] = [
                ...contents,
                response.candidates[0].content,
                { role: 'tool', parts: [{ functionResponse: { name: 'searchYouTube', response: { results: searchResults } } }] }
            ];

            response = await ai.models.generateContent({
                model: modelToUse,
                contents: toolResponseContents,
                config: {...config, tools: []}
            });
        }
        
        let finalResponseText = extractTextFromResponse(response);
        let codeBlock: { code: string; language: string; } | null = null;
        const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const fenceRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/s;
        let jsonString: string | null = null;
        let textToReplace : string | RegExp = '';

        const match = finalResponseText.match(fenceRegex);

        if (match && match[1]) {
            jsonString = match[1].trim();
            textToReplace = fenceRegex;
        } else {
            // FIX: More robustly find a JSON object even if it's not in a code block or the only content.
            const firstBrace = finalResponseText.indexOf('{');
            const lastBrace = finalResponseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const potentialJson = finalResponseText.substring(firstBrace, lastBrace + 1);
                try {
                    const parsed = JSON.parse(potentialJson);
                    if (parsed && typeof parsed === 'object' && parsed.action) {
                        jsonString = potentialJson;
                        textToReplace = potentialJson;
                    }
                } catch (e) {
                    console.warn("Found potential JSON in response, but failed to parse:", e);
                }
            }
        }

        if (jsonString) {
            try {
                const parsed = JSON.parse(jsonString);

                if (parsed.action === 'generate_image' && typeof parsed.prompt === 'string') {
                    const confirmationText = finalResponseText.replace(textToReplace, '').trim() || t('imageGenerationConfirmation');
                    updateConversation(convId, conv => ({ ...conv, messages: conv.messages.map(m => m.id === modelMessageId ? { ...m, contentHistory: [confirmationText], activeVersionIndex: 0, isTyping: false, isGeneratingImage: true, analysisState: null } : m) }));
                    await generateImage({ prompt: parsed.prompt, count: parsed.count }, modelMessageId, convId);
                    return;
                }
            
                if (parsed.action === 'generate_pdf' && typeof parsed.filename === 'string' && typeof parsed.title === 'string' && typeof parsed.content === 'string') {
                    const confirmationText = finalResponseText.replace(textToReplace, '').trim() || t('pdfGenerationConfirmation', parsed.filename);
                    updateConversation(convId, conv => ({ ...conv, messages: conv.messages.map(m => m.id === modelMessageId ? { ...m, contentHistory: [confirmationText], activeVersionIndex: 0, isTyping: false, isGeneratingPdf: true, pdfData: { filename: parsed.filename }, analysisState: null } : m) }));
                    await handleGeneratePdf(parsed, modelMessageId, convId);
                    return;
                }
                
                if (parsed.action === 'generate_spreadsheet' && parsed.filename && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
                    const confirmationText = finalResponseText.replace(textToReplace, '').trim() || t('spreadsheetGenerationConfirmation', parsed.filename);
                    updateConversation(convId, conv => ({ ...conv, messages: conv.messages.map(m => m.id === modelMessageId ? { ...m, contentHistory: [confirmationText], activeVersionIndex: 0, isTyping: false, isGeneratingSpreadsheet: true, spreadsheetData: { filename: parsed.filename, sheetCount: parsed.sheets.length }, analysisState: null } : m) }));
                    await handleGenerateSpreadsheet(parsed as any, modelMessageId, convId);
                    return;
                }
                
                if (parsed.action === 'generate_presentation' && parsed.filename && parsed.data && Array.isArray(parsed.data.slides)) {
                    const confirmationText = finalResponseText.replace(textToReplace, '').trim() || t('presentationGenerationConfirmation', parsed.filename);
                    updateConversation(convId, conv => ({ ...conv, messages: conv.messages.map(m => m.id === modelMessageId ? { ...m, contentHistory: [confirmationText], activeVersionIndex: 0, isTyping: false, isGeneratingPresentation: true, presentationData: { filename: parsed.filename, slideCount: parsed.data.slides.length }, analysisState: null } : m) }));
                    await handleGeneratePresentation(parsed as any, modelMessageId, convId);
                    return;
                }

                if (parsed.action === 'generate_word' && parsed.filename && Array.isArray(parsed.content)) {
                    const confirmationText = finalResponseText.replace(textToReplace, '').trim() || t('wordGenerationConfirmation', parsed.filename);
                    updateConversation(convId, conv => ({ ...conv, messages: conv.messages.map(m => m.id === modelMessageId ? { ...m, contentHistory: [confirmationText], activeVersionIndex: 0, isTyping: false, isGeneratingWord: true, wordData: { filename: parsed.filename }, analysisState: null } : m) }));
                    await handleGenerateWord(parsed, modelMessageId, convId);
                    return;
                }
                
                if (parsed.action === 'generate_video') {
                    updateConversation(convId, conv => ({ ...conv, messages: conv.messages.map(m => m.id === modelMessageId ? { ...m, isTyping: false, isGeneratingVideo: true, videoGenerationStatus: t('videoStatusInitializing'), contentHistory: [''], activeVersionIndex: 0, analysisState: null } : m) }));
                    await handleGenerateVideo(parsed, modelMessageId, convId);
                    return;
                }

            } catch (e) {
                console.warn("Could not parse JSON block at the end of the message.", e);
            }
        }

        const codeBlockRegex = /```(html)\n([\s\S]*?)```\s*$/s;
        const codeMatch = finalResponseText.match(codeBlockRegex);

        if (codeMatch && codeMatch[1] === 'html' && codeMatch[2]) {
            codeBlock = {
                language: codeMatch[1],
                code: codeMatch[2].trim()
            };
            finalResponseText = finalResponseText.substring(0, codeMatch.index).trim();
        }
        
        const memoryRegex = /<memory>([\s\S]*?)<\/memory>/s;
        const memoryMatch = finalResponseText.match(memoryRegex);

        if (memoryMatch && memoryMatch[1]) {
            try {
                const memoryJson = JSON.parse(memoryMatch[1]);
                if (memoryJson.facts && Array.isArray(memoryJson.facts)) {
                    const newFactContents = memoryJson.facts.filter((fact: any): fact is string => typeof fact === 'string' && fact.trim() !== '');
                    if (newFactContents.length > 0) {
                        let addedFactsCount = 0;
                        setMemoryFacts(prevFacts => {
                            const existingFactContents = new Set(prevFacts.map(f => f.content.toLowerCase()));
                            const uniqueNewFacts = newFactContents
                                .filter(content => !existingFactContents.has(content.toLowerCase()))
                                .map((content, index): MemoryFact => ({ id: `fact-${Date.now()}-${index}`, content: content, createdAt: new Date().toISOString() }));
                            
                            addedFactsCount = uniqueNewFacts.length;
                            return uniqueNewFacts.length > 0 ? [...prevFacts, ...uniqueNewFacts] : prevFacts;
                        });
                        if (addedFactsCount > 0) {
                            addToast(t('memoryAutoSaveSuccess'), 'info', t('memory'));
                        }
                    }
                }
            } catch(e) { console.error("Failed to parse memory block:", e); }
            finalResponseText = finalResponseText.replace(memoryRegex, '').trim();
        }

        if (!finalResponseText.trim() && !codeBlock) {
            finalResponseText = t('emptyResponsePlaceholder');
        }

        const endTime = performance.now();
        const generationTime = endTime - startTime;

        const uniqueChunksMap = new Map<string, GroundingChunk>();
        groundingChunks.forEach(chunk => { if (chunk.web?.uri) uniqueChunksMap.set(chunk.web.uri, chunk); });
        const uniqueChunks = Array.from(uniqueChunksMap.values());

        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, contentHistory: [finalResponseText], activeVersionIndex: 0, groundingChunks: uniqueChunks.length > 0 ? uniqueChunks : undefined, isTyping: false, isGeneratingCode: false, codeBlock, generationTime, analysisState: null }
                    : m
            ),
        }));


    } catch (e) {
        console.error(e);

        if (isGenerationCancelledRef.current) {
            const systemMessage: Message = { id: `msg-${Date.now()}-system`, role: Role.SYSTEM, contentHistory: [t('generationStopped')], activeVersionIndex: 0 };
            updateConversation(convId, c => ({
                ...c,
                messages: [...c.messages.slice(0, -1), systemMessage],
            }));
            return;
        }

        let errorMessage = e instanceof Error ? e.message : 'Failed to get a response from the AI.';
        if (/API_KEY/i.test(errorMessage)) {
            errorMessage = t('apiKeyError');
        } else if (/network|fetch/i.test(errorMessage)) {
            errorMessage = t('networkError');
        } else {
            errorMessage = t('errorMessageDefault', errorMessage);
        }
        setError(errorMessage);
        updateConversation(convId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === modelMessageId
                    ? { ...m, contentHistory: [errorMessage], activeVersionIndex: 0, isTyping: false, isGeneratingCode: false, analysisState: null }
                    : m
            ),
        }));
    } finally {
        setIsLoading(false);
    }
}, [ai, updateConversation, generateImage, handleGeneratePdf, handleGenerateSpreadsheet, handleGeneratePresentation, handleGenerateWord, setMemoryFacts, t, getSystemInstruction, addToast, handleGenerateVideo, setTheme, setFont, setBackground]);

const handleStopConversation = () => {
    isGenerationCancelledRef.current = true;
};

const handleExportConversation = useCallback(async (format: 'md' | 'json' | 'txt') => {
    if (!activeConversation) return;

    let content = '';
    let mimeType = 'text/plain';
    let fileExtension = format;

    const sanitizeFilename = (name: string) => {
        return name.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 50);
    };

    const getMessagePrefix = (msg: Message): string => {
        if (msg.role === Role.USER) return "User";
        if (msg.role === Role.MODEL) return "Universum";
        return "System";
    };
    
    const getActiveContent = (msg: Message): string => msg.contentHistory[msg.activeVersionIndex] || '';

    if (format === 'md') {
        mimeType = 'text/markdown';
        content = `# ${activeConversation.title}\n\n`;
        activeConversation.messages.forEach(msg => {
            const activeContent = getActiveContent(msg);
            if (!activeContent && !msg.imagesData && !msg.audioData) return;
            const prefix = getMessagePrefix(msg);
            content += `**${prefix}:**\n\n`;
            if (msg.imagesData && msg.imagesData.length > 0) content += `*${msg.imagesData.length} Image(s) attached by ${prefix}*\n\n`;
            if (msg.audioData) content += `*Audio attachment: ${msg.audioData.name}*\n\n`;
            if (activeContent) content += `${activeContent}\n\n`;
            content += '---\n\n';
        });
    } else if (format === 'json') {
        mimeType = 'application/json';
        const serializableConversation: SerializableConversation = {
            ...activeConversation,
            messages: activeConversation.messages.map(({ isTyping, isGeneratingImage, isGeneratingPdf, isGeneratingSpreadsheet, isGeneratingPresentation, isGeneratingPresentationImages, analysisState, isGeneratingCode, codeBlock, spreadsheetData, spreadsheetFile, presentationData, presentationFile, pdfData, pdfFile, isGeneratingVideo, videoGenerationStatus, requiresApiKeySelection, isGeneratingWord, wordData, isGenerating3dModel, model3dData, ...msg }) => msg)
        };
        content = JSON.stringify(serializableConversation, null, 2);
    } else { 
        content = `Conversation: ${activeConversation.title}\n=============================\n\n`;
        activeConversation.messages.forEach(msg => {
            const activeContent = getActiveContent(msg);
            if (!activeContent && !msg.imagesData && !msg.audioData) return;
            const prefix = getMessagePrefix(msg);
            content += `${prefix}:\n`;
            if (msg.imagesData && msg.imagesData.length > 0) content += `[${msg.imagesData.length} Image(s) attached by ${prefix}]\n`;
            if (msg.audioData) content += `[Audio attachment: ${msg.audioData.name}]\n`;
            if (activeContent) content += `${activeContent}\n`;
            content += `\n-----------------------------\n\n`;
        });
    }

    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFilename(activeConversation.title)}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(t('exportSuccess'), 'success');
    } catch (e) {
        console.error("Export failed:", e);
        setError("Export failed. Please try again.");
    }
}, [activeConversation, addToast, t]);

const runAnalysisAndGetResponse = useCallback(async (historyForFork: Message[], convId: string, model: ModelType) => {
    const modelMessageId = `msg-${Date.now()}-model`;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const updateCognitiveState = (updater: (prev: AnalysisStep[]) => AnalysisStep[]) => {
        updateConversation(convId, c => ({
            ...c,
            messages: c.messages.map(m => m.id === modelMessageId ? { ...m, analysisState: updater(m.analysisState || []) } : m)
        }));
    };
    
    const placeholderMessage: Message = { id: modelMessageId, role: Role.MODEL, contentHistory: [''], activeVersionIndex: 0, analysisState: [] };
    updateConversation(convId, c => ({ ...c, messages: [...historyForFork, placeholderMessage] }));

    updateCognitiveState(() => [{ id: 'c0', type: 'core', title: t('coreStatusIngesting'), status: 'active' as AnalysisStepStatus, icon: 'brain-circuit' }]);
    await sleep(400 + Math.random() * 200);

    const contentsForAnalysis: Content[] = historyForFork
        .map((message): Content | null => {
            if (message.role === Role.SYSTEM) return null; 
            const parts: Part[] = [];
            if (message.imagesData) {
                message.imagesData.forEach(img => {
                    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data }});
                });
            }
            if (message.audioData) {
              parts.push({ inlineData: { mimeType: message.audioData.mimeType, data: message.audioData.data }});
            }
            const activeContent = message.contentHistory[message.activeVersionIndex];
            if (activeContent) {
                parts.push({ text: activeContent });
            }
            if (parts.length > 0) {
                return { role: message.role, parts };
            }
            return null;
        })
        .filter((c): c is Content => c !== null);

    const analysis = await analyzeRequest(contentsForAnalysis);
    updateCognitiveState(prev => [
        { ...prev[0], status: 'completed' as AnalysisStepStatus },
        { id: 'c1', type: 'core', title: t('coreStatusDeconstructing'), status: 'active' as AnalysisStepStatus, icon: 'zap', details: `${t('intent_label')}: ${t('intent_' + analysis.intent)}` }
    ]);
    await sleep(500 + Math.random() * 200);
    updateCognitiveState(prev => prev.map(s => s.id === 'c1' ? { ...s, details: `${s.details}, ${t('domain_label')}: ${t('domain_' + analysis.domain)}` } : s));
    await sleep(500 + Math.random() * 200);
    updateCognitiveState(prev => prev.map(s => s.id === 'c1' ? { ...s, details: `${s.details}, ${t('complexity_label')}: ${t('complexity_' + analysis.complexity)}` } : s));
    await sleep(400 + Math.random() * 200);

    updateCognitiveState(prev => [
        {...prev.find(s => s.id === 'c0')!, status: 'completed' as AnalysisStepStatus},
        {...prev.find(s => s.id === 'c1')!, status: 'completed' as AnalysisStepStatus},
        { id: 'c2', type: 'core', title: t('coreStatusStrategizing'), status: 'active' as AnalysisStepStatus, icon: 'wand-sparkles', details: `${t('strategyLabel')}: ${t('strategy_' + analysis.tool)}` }
    ]);
    await sleep(600 + Math.random() * 200);

    if (analysis.tool === 'multi_agent_collaboration' && analysis.complexity === 'complex') {
        const agentPool: AnalysisStep[] = [];
        if (['information_retrieval', 'data_analysis', 'research'].includes(analysis.intent) || analysis.domain === 'research') {
            agentPool.push({ id: 'a1', type: 'agent', title: t('agentDeepSearch'), icon: 'search', status: 'pending' as AnalysisStepStatus, details: t('agentTaskPending') });
        }
        if (['code_development', 'technical'].includes(analysis.intent) || analysis.domain === 'technical') {
            agentPool.push({ id: 'a2', type: 'agent', title: t('agentCodeInterpreter'), icon: 'code', status: 'pending' as AnalysisStepStatus, details: t('agentTaskPending') });
        }
        if (analysis.domain === 'spreadsheet') {
            agentPool.push({ id: 'a4', type: 'agent', title: t('agentSpreadsheetSpecialist'), icon: 'sheet', status: 'pending' as AnalysisStepStatus, details: t('agentTaskPending') });
        }
        if (['creative_ideation', 'creative'].includes(analysis.intent) || analysis.domain === 'creative' || agentPool.length === 0) {
            agentPool.push({ id: 'a3', type: 'agent', title: t('agentCreativeSuite'), icon: 'wand-sparkles', status: 'pending' as AnalysisStepStatus, details: t('agentTaskPending') });
        }

        updateCognitiveState(prev => [
            ...prev.filter(s => s.type === 'core').map(s => ({...s, status: 'completed' as AnalysisStepStatus})),
            { id: 'c3', type: 'core', title: t('coreStatusDispatching'), status: 'active' as AnalysisStepStatus, icon: 'zap'},
            ...agentPool
        ]);
        await sleep(500 + Math.random() * 200);

        for (let i = 0; i < agentPool.length; i++) {
            await sleep(400 + Math.random() * 200);
            const agentId = agentPool[i].id;
            updateCognitiveState(prev => prev.map(s => s.id === agentId ? { ...s, status: 'active' as AnalysisStepStatus, details: t('agentTaskInitializing') } : s));
        }
        
        for (let i = 0; i < agentPool.length; i++) {
            await sleep(800 + Math.random() * 500);
             const agentId = agentPool[i].id;
             let taskDetail = '';
             if (agentId === 'a1') taskDetail = t('agentTaskSearching');
             else if (agentId === 'a2') taskDetail = t('agentTaskCoding');
             else if (agentId === 'a3') taskDetail = t('agentTaskCreativeWriting');
             else if (agentId === 'a4') taskDetail = t('agentTaskSpreadsheet');
             updateCognitiveState(prev => prev.map(s => s.id === agentId ? { ...s, details: taskDetail } : s));
             await sleep(800 + Math.random() * 500);
             updateCognitiveState(prev => prev.map(s => s.id === agentId ? { ...s, status: 'completed' as AnalysisStepStatus, details: taskDetail } : s));
        }
         await sleep(400);
    }
    
    updateCognitiveState(prev => [
        ...prev.filter(s => s.id !== 'c3'),
        ...prev.filter(s => s.type === 'core').map(s => ({...s, status: 'completed' as AnalysisStepStatus})),
        ...prev.filter(s => s.type === 'agent').map(s => ({...s, status: 'completed' as AnalysisStepStatus})),
        { id: 'c4', type: 'core', title: t('coreStatusSynthesizing'), status: 'active' as AnalysisStepStatus, icon: 'folders' }
    ]);
    await sleep(800 + Math.random() * 200);
    
    updateCognitiveState(prev => [
        ...prev.map(s => ({...s, status: 'completed' as AnalysisStepStatus})),
        { id: 'c5', type: 'core', title: t('coreStatusFinalizing'), status: 'active' as AnalysisStepStatus, icon: 'zap' }
    ]);

    await getAIResponse(historyForFork, convId, model, analysis, modelMessageId);

}, [ai, updateConversation, analyzeRequest, getAIResponse, t]);


const addAttachmentsToRecents = useCallback((
    attachments: { file: File | null; text: { title: string; content: string; provider?: CloudProvider; } | null }
) => {
    const { file, text: textAttachment } = attachments;
    const newRecentAttachments: RecentAttachment[] = [];

    if (textAttachment) {
        if (textAttachment.provider) { 
             newRecentAttachments.push({ type: 'cloud', provider: textAttachment.provider, title: textAttachment.title, content: textAttachment.content, timestamp: Date.now() });
        } else { 
            newRecentAttachments.push({ type: 'text', title: textAttachment.title, content: textAttachment.content, timestamp: Date.now() });
        }
    }
    if (file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'audio';
        newRecentAttachments.push({ type: 'local', name: file.name, fileType: fileType, timestamp: Date.now() });
    }

    if (newRecentAttachments.length > 0) {
        setRecentAttachments(prev => {
            const getIdentifier = (r: RecentAttachment) => r.type === 'local' ? r.name : r.title;
            const existingIdentifiers = new Set(prev.map(getIdentifier));
            const uniqueNew = newRecentAttachments.filter(r => !existingIdentifiers.has(getIdentifier(r)));
            const updated = [...uniqueNew, ...prev];
            return updated.slice(0, MAX_RECENT_ATTACHMENTS);
        });
    }
}, []);


const handleSendMessage = useCallback(async (
    text: string, 
    attachments: { file: File | null; text: { title: string; content: string; provider?: CloudProvider; } | null }
) => {
    if (!activeConversationId || isLoading || !ai) return;

    try {
        const { file, text: textAttachment } = attachments;
        const convId = activeConversationId;
        const currentConv = conversations.find(c => c.id === convId);
        if (!currentConv) return;

        addAttachmentsToRecents(attachments);

        let combinedText = text;
        if (textAttachment && textAttachment.content) {
            const attachmentHeader = `\n\n--- ATTACHED DOCUMENT: "${textAttachment.title}" ---\n`;
            const attachmentFooter = `\n--- END OF DOCUMENT ---`;
            const fullAttachmentText = `${attachmentHeader}${textAttachment.content}${attachmentFooter}`;
            combinedText = text ? `${text}${fullAttachmentText}` : fullAttachmentText.trim();
        }
        
        setEditingMessageId(null);
        const userMessage: Message = { id: `msg-${Date.now()}-user`, role: Role.USER, contentHistory: [combinedText], activeVersionIndex: 0 };
        
        let titleText = text;

        if (textAttachment) {
            userMessage.textAttachment = textAttachment;
            if (!text) titleText = textAttachment.title;
        }

        if (file) {
            const isSupported = (file.type && (file.type.startsWith('image/') || file.type.startsWith('audio/')));
            if (!isSupported) {
                addToast(t('unsupportedFileType'), 'error');
                return; 
            }

            const base64Data = await fileToBase64(file);
            if (file.type.startsWith('image/')) {
                userMessage.imagesData = [{ mimeType: file.type, data: base64Data }];
                if (!text) titleText = t('imageChatTitle');
            } else if (file.type.startsWith('audio/')) {
                userMessage.audioData = { mimeType: file.type, data: base64Data, name: file.name };
                if (!text) titleText = t('audioChatTitle');
            }
        }
        
        const newHistory = [...currentConv.messages, userMessage];

        const isNewChat = currentConv.messages.length === 0;
        if (isNewChat && titleText.trim()) {
            const newTitle = titleText.substring(0, 30) + (titleText.length > 30 ? '...' : '');
            updateConversation(convId, c => ({ ...c, title: newTitle || t('newChatTitle') }));
        }

        let analysisPrompt = combinedText;
        if (!analysisPrompt.trim() && file) {
            if (file.type.startsWith('image/')) {
                analysisPrompt = t('describeThisImage'); 
            } else if (file.type.startsWith('audio/')) {
                analysisPrompt = t('transcribeThisAudio');
            }
        }

        if (!analysisPrompt.trim() && !file) {
            return;
        }

        await runAnalysisAndGetResponse(
            newHistory,
            convId,
            currentConv.model
        );
    } catch (e) {
        console.error("Error handling message:", e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to process message.';
        setError(t('errorMessageDefault', errorMessage));
        setIsLoading(false);
    }
}, [ai, activeConversationId, conversations, isLoading, updateConversation, t, runAnalysisAndGetResponse, addAttachmentsToRecents]);

const handleStartEdit = (messageId: string) => {
    if (isLoading) return;
    setEditingMessageId(messageId);
};

const handleCancelEdit = () => {
    setEditingMessageId(null);
};

const proceedWithSaveEdit = useCallback(async (messageId: string, newContent: string) => {
    if (!activeConversationId || isLoading || !ai) return;

    const convId = activeConversationId;
    const currentConv = conversations.find(c => c.id === convId);
    if (!currentConv) return;
    
    const messageIndex = currentConv.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const messageToEdit = currentConv.messages[messageIndex];

    const newContentHistory = [
        ...messageToEdit.contentHistory.slice(0, messageToEdit.activeVersionIndex + 1),
        newContent,
    ];

    const updatedMessage: Message = {
        ...messageToEdit,
        contentHistory: newContentHistory,
        activeVersionIndex: newContentHistory.length - 1,
    };

    const historyForAI = [
        ...currentConv.messages.slice(0, messageIndex),
        updatedMessage,
    ];

    updateConversation(convId, conv => ({
        ...conv,
        messages: historyForAI,
    }));
    
    setEditingMessageId(null);

    await runAnalysisAndGetResponse(
        historyForAI,
        convId,
        currentConv.model
    );
}, [ai, activeConversationId, conversations, isLoading, updateConversation, runAnalysisAndGetResponse]);

const handleSaveEdit = useCallback((messageId: string, newContent: string) => {
    if (!activeConversationId || isLoading) return;
    proceedWithSaveEdit(messageId, newContent);
}, [activeConversationId, isLoading, proceedWithSaveEdit]);

const proceedWithVersionChange = useCallback(async (messageId: string, newIndex: number) => {
    if (!activeConversationId || isLoading || !ai) return;
    
    const convId = activeConversationId;
    const currentConv = conversations.find(c => c.id === convId);
    if (!currentConv) return;
    
    const messageIndex = currentConv.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const messageToChange = currentConv.messages[messageIndex];
    
    const updatedMessage: Message = {
        ...messageToChange,
        activeVersionIndex: newIndex,
    };
    
    const newContent = updatedMessage.contentHistory[newIndex];

    const historyForAI = [
        ...currentConv.messages.slice(0, messageIndex),
        updatedMessage,
    ];

    updateConversation(convId, conv => ({
        ...conv,
        messages: historyForAI,
    }));

    await runAnalysisAndGetResponse(
        historyForAI,
        convId,
        currentConv.model
    );
}, [ai, activeConversationId, conversations, isLoading, updateConversation, runAnalysisAndGetResponse]);


const handleVersionChange = useCallback((messageId: string, newIndex: number) => {
    if (!activeConversationId || isLoading) return;
    const currentConv = conversations.find(c => c.id === activeConversationId);
    if (!currentConv) return;
    const messageIndex = currentConv.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const messageToChange = currentConv.messages[messageIndex];
    if (newIndex < 0 || newIndex >= messageToChange.contentHistory.length) {
        return;
    }

    const isForking = messageIndex < currentConv.messages.length - 1;

    if (isForking) {
        proceedWithVersionChange(messageId, newIndex);
    } else {
        // Not forking, just update the index of the last message
        updateConversation(activeConversationId, conv => ({
            ...conv,
            messages: conv.messages.map(m =>
                m.id === messageId ? { ...m, activeVersionIndex: newIndex } : m
            ),
        }));
    }
}, [activeConversationId, isLoading, conversations, proceedWithVersionChange, updateConversation]);

  const handleRegenerate = useCallback(() => {
    if (!activeConversationId || isLoading || !ai) return;

    const convId = activeConversationId;
    const currentConv = conversations.find(c => c.id === convId);
    if (!currentConv || currentConv.messages.length === 0) return;

    let lastUserMessageIndex = -1;
    for (let i = currentConv.messages.length - 1; i >= 0; i--) {
        if (currentConv.messages[i].role === Role.USER) {
            lastUserMessageIndex = i;
            break;
        }
    }

    if (lastUserMessageIndex === -1) return;

    const historyForAI = currentConv.messages.slice(0, lastUserMessageIndex + 1);
    const lastUserMessage = currentConv.messages[lastUserMessageIndex];
    const analysisPrompt = lastUserMessage.contentHistory[lastUserMessage.activeVersionIndex];

    updateConversation(convId, c => ({
        ...c,
        messages: historyForAI,
    }));
    
    runAnalysisAndGetResponse(historyForAI, convId, currentConv.model);
  }, [ai, activeConversationId, conversations, isLoading, updateConversation, runAnalysisAndGetResponse]);

  const handleClearConversations = () => {
      setConversations([]);
      handleNewChat();
  };

  if (isAuthLoading) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-base-100 dark:bg-dark-base-100">
              <LoadingSpinner className="w-10 h-10 text-brand-primary" />
          </div>
      );
  }

  return (
    <div className="h-screen w-screen bg-base-100 dark:bg-dark-base-100 flex overflow-hidden">
        <ToastContainer />
        {showAuthModal && (
            <Auth
                onLogin={handleLogin}
                onRegister={handleRegister}
                error={authError}
                isLoading={isAuthLoading}
                onClose={() => setShowAuthModal(false)}
            />
        )}
        {isSettingsModalOpen && (
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                currentUser={currentUser}
                connectedClouds={connectedClouds}
                onDisconnectCloud={handleDisconnectCloud}
                onExportAllData={handleExportAllData}
                onDeleteAccount={handleDeleteAccount}
                memoryFacts={memoryFacts}
                onUpdateMemory={setMemoryFacts}
                coachGoals={coachGoals}
                onUpdateCoachGoals={setCoachGoals}
                conversations={conversations}
            />
        )}
        {isExportModalOpen && (
            <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExportConversation}
                isLoading={isLoading}
            />
        )}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={sortedConversations}
        activeConversationId={activeConversationId}
        currentUser={currentUser}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
        isLoading={isLoading}
      />
      <main className="flex-1 flex flex-col h-screen min-w-0">
        <header className="flex-shrink-0 bg-base-100/80 dark:bg-dark-base-100/80 backdrop-blur-sm z-10 border-b border-base-200 dark:border-dark-base-200 h-16 flex items-center px-4">
          {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-base-200 dark:hover:bg-dark-base-200"
                aria-label={t('openSidebar')}
              >
                <MenuIcon className="w-6 h-6" />
              </button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto">
          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="max-w-4xl mx-auto p-4 space-y-6">
              {activeConversation.messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isEditing={editingMessageId === message.id}
                  isLoading={isLoading && index === activeConversation.messages.length - 1}
                  onStartEdit={() => handleStartEdit(message.id)}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={(newContent) => handleSaveEdit(message.id, newContent)}
                  onRegenerate={handleRegenerate}
                  isLastModelMessage={message.role === Role.MODEL && index === activeConversation.messages.length - 1}
                  onExportMessageAsPdf={handleExportMessageAsPdf}
                  onVersionChange={handleVersionChange}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
             <div className="flex h-full w-full flex-col items-center justify-center text-center p-4">
                <div className="flex items-center gap-3">
                    <BotIcon className="w-10 h-10 text-brand-primary" />
                    <h2 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary">{t('sidebarHeader')}</h2>
                </div>
                <p className="mt-2 text-md text-text-secondary dark:text-dark-text-secondary">{t('welcomeMessage')}</p>
             </div>
          )}
        </div>
        {activeConversation && (
            <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                model={activeConversation.model}
                onModelChange={(newModel) => handleModelChange(activeConversationId!, newModel)}
                isModelSelectorDisabled={activeConversation.messages.length > 0}
                onStopGenerating={handleStopConversation}
                recentAttachments={recentAttachments}
                connectedClouds={connectedClouds}
                onConnectCloud={handleConnectCloud}
            />
        )}
      </main>
    </div>
  );
};