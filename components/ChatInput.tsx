import React, { useState, useRef, useEffect, FC, useLayoutEffect } from 'react';
import { SendIcon, PaperclipIcon, XIcon, MicrophoneIcon, AudioFileIcon, StopSquareIcon, UploadCloudIcon, FileTextIcon, PencilIcon, GoogleDriveIcon, OneDriveIcon, ClockIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';
import { ModelType, CloudProvider, RecentAttachment } from '../types';
import { useToast } from '../contexts/ToastContext';
import { ModelSelector } from './ModelSelector';
import { TextAttachmentModal } from './TextAttachmentModal';
import { SketchpadModal } from './SketchpadModal';
import { CloudFilePickerModal } from './CloudFilePickerModal';
import { RecentAttachmentsModal } from './RecentAttachmentsModal';
import { CloudConnectionModal } from './CloudConnectionModal';

// Type definitions for the Web Speech API to fix TypeScript errors.
interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

type TextAttachment = { title: string; content: string; provider?: CloudProvider };
type AttachmentPayload = {
    file: File | null;
    text: TextAttachment | null;
};
interface ChatInputProps {
  onSendMessage: (message: string, attachments: AttachmentPayload) => void;
  isLoading: boolean;
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  isModelSelectorDisabled: boolean;
  onStopGenerating: () => void;
  recentAttachments: RecentAttachment[];
  connectedClouds: Partial<Record<CloudProvider, boolean>>;
  onConnectCloud: (provider: CloudProvider) => Promise<void>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  model,
  onModelChange,
  isModelSelectorDisabled,
  onStopGenerating,
  recentAttachments,
  connectedClouds,
  onConnectCloud,
}) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [textAttachment, setTextAttachment] = useState<TextAttachment | null>(null);
  const [filePreview, setFilePreview] = useState<{type: 'image' | 'audio' | 'cloud' | 'text', url?: string, name: string, provider?: CloudProvider} | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isTextAttachmentModalOpen, setIsTextAttachmentModalOpen] = useState(false);
  const [isSketchpadModalOpen, setIsSketchpadModalOpen] = useState(false);
  const [isCloudPickerOpen, setIsCloudPickerOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [cloudProvider, setCloudProvider] = useState<CloudProvider | null>(null);
  const [isRecentsOpen, setIsRecentsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const isSendable = !isLoading && (text.trim().length > 0 || !!file || !!textAttachment);
  const { t, speechLangCode } = useLocale();
  const { addToast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  // Cleanup effect to stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Effect to handle closing attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
            // Check if the click was on the attachment button itself to avoid immediate closing
            const attachmentButton = document.getElementById('attachment-button');
            if (attachmentButton && attachmentButton.contains(event.target as Node)) {
                return;
            }
            setIsAttachmentMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleMicClick = () => {
    if (isLoading || !isSpeechSupported) return;

    if (recognitionRef.current) {
        recognitionRef.current.stop();
        return;
    }

    try {
        const SpeechRecognitionAPI: SpeechRecognitionStatic = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;

        recognition.lang = speechLangCode;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            if (recognitionRef.current === recognition) {
                recognitionRef.current = null;
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setText(prev => (prev ? prev.trim() + ' ' : '') + transcript.trim());
            textareaRef.current?.focus();
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            switch (event.error) {
                case 'not-allowed':
                case 'service-not-allowed':
                    addToast(t('microphonePermissionDenied'), 'error');
                    break;
                case 'audio-capture':
                    addToast(t('microphoneAudioCaptureError'), 'error');
                    break;
                case 'network':
                    addToast(t('microphoneNetworkError'), 'error');
                    break;
                case 'aborted': // User clicked stop, do nothing.
                case 'no-speech': // No speech detected, do nothing.
                    break;
                default:
                    addToast(t('speechRecognitionError', event.error), 'error');
                    break;
            }
        };
        
        recognition.start();

    } catch (e) {
        console.error("Speech Recognition API not supported or failed to initialize.", e);
        addToast(t('speechRecognitionUnsupported'), 'error');
        setIsSpeechSupported(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  const handleRemoveAttachment = () => {
    setFile(null);
    setTextAttachment(null);
    if (filePreview && filePreview.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendable) {
      onSendMessage(text.trim(), { file, text: textAttachment });
      setText('');
      handleRemoveAttachment();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        handleRemoveAttachment(); 

        const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'audio';
        setFile(selectedFile);
        setTextAttachment(null);
        setFilePreview({
            type: fileType,
            url: URL.createObjectURL(selectedFile),
            name: selectedFile.name
        });
    }
  };

  const handleAddText = (title: string, content: string) => {
      handleRemoveAttachment();
      setTextAttachment({ title, content });
      setFilePreview({ type: 'text', name: title });
  };

  const handleAddSketch = (sketchFile: File) => {
      handleRemoveAttachment();
      setFile(sketchFile);
      setTextAttachment(null);
      setFilePreview({
          type: 'image',
          url: URL.createObjectURL(sketchFile),
          name: sketchFile.name
      });
  };

  const handleAttachCloudFile = (title: string, content: string, provider: CloudProvider) => {
    handleRemoveAttachment();
    setTextAttachment({ title, content, provider });
    setFilePreview({ type: 'cloud', name: title, provider });
  };

  const handleAttachRecent = (attachment: RecentAttachment) => {
      handleRemoveAttachment();
      if (attachment.type === 'local') {
          fileInputRef.current?.click();
          addToast(t('reselectLocalFile'), 'info');
      } else if (attachment.type === 'text') {
          setTextAttachment({ title: attachment.title, content: attachment.content });
          setFilePreview({ type: 'text', name: attachment.title });
      } else if (attachment.type === 'cloud') {
          setTextAttachment({ title: attachment.title, content: attachment.content, provider: attachment.provider });
          setFilePreview({ type: 'cloud', name: attachment.title, provider: attachment.provider });
      }
  };

  useLayoutEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const originalPlaceholder = textarea.placeholder;
      if (!text) textarea.placeholder = '';
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.placeholder = originalPlaceholder;
      const maxHeight = 208;
      
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [text]);
  
  useEffect(() => {
    return () => {
      if(filePreview && filePreview.url) {
        URL.revokeObjectURL(filePreview.url);
      }
    }
  }, [filePreview]);
  
  const handleMenuItemClick = (action: 'upload' | 'textContent' | 'sketch' | 'google_drive' | 'one_drive' | 'recents') => {
      setIsAttachmentMenuOpen(false);
      switch(action) {
        case 'upload':
          fileInputRef.current?.click();
          break;
        case 'textContent':
          setIsTextAttachmentModalOpen(true);
          break;
        case 'sketch':
          setIsSketchpadModalOpen(true);
          break;
        case 'google_drive':
        case 'one_drive':
            const provider: CloudProvider = action === 'google_drive' ? 'Google Drive' : 'OneDrive';
            if (connectedClouds[provider]) {
                setCloudProvider(provider);
                setIsCloudPickerOpen(true);
            } else {
                setCloudProvider(provider);
                setIsConnectionModalOpen(true);
            }
            break;
        case 'recents':
          setIsRecentsOpen(true);
          break;
      }
  };

  const handleCloudConnect = async (provider: CloudProvider) => {
    await onConnectCloud(provider);
    setIsConnectionModalOpen(false);
    // setCloudProvider is already set from handleMenuItemClick
    setIsCloudPickerOpen(true);
  };

  const renderFilePreview = () => {
    if (!filePreview) return null;

    switch(filePreview.type) {
        case 'image':
            return <img src={filePreview.url} alt={t('imagePreview')} className="h-20 w-20 object-cover rounded-lg" />;
        case 'audio':
            return (
                <div className="h-20 w-48 p-2 bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-2 border border-base-300 dark:border-dark-base-200">
                    <AudioFileIcon className="w-8 h-8 text-text-secondary dark:text-dark-text-secondary flex-shrink-0" />
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">{t('audioFile')}</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{filePreview.name}</p>
                    </div>
                </div>
            );
        case 'text':
        case 'cloud':
            const icon = filePreview.provider === 'Google Drive' ? <GoogleDriveIcon className="w-8 h-8"/> :
                         filePreview.provider === 'OneDrive' ? <OneDriveIcon className="w-8 h-8" /> :
                         <FileTextIcon className="w-8 h-8 text-text-secondary dark:text-dark-text-secondary flex-shrink-0" />;
            return (
                <div className="h-20 w-48 p-2 bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-2 border border-base-300 dark:border-dark-base-200">
                    {icon}
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">{filePreview.name}</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">
                            {filePreview.provider ? t('attachedFrom', filePreview.provider) : t('textAttachment')}
                        </p>
                    </div>
                </div>
            );
        default:
            return null;
    }
  }


  return (
    <>
    <TextAttachmentModal isOpen={isTextAttachmentModalOpen} onClose={() => setIsTextAttachmentModalOpen(false)} onAddText={handleAddText} />
    <SketchpadModal isOpen={isSketchpadModalOpen} onClose={() => setIsSketchpadModalOpen(false)} onAddSketch={handleAddSketch} />
    {cloudProvider && <CloudConnectionModal isOpen={isConnectionModalOpen} onClose={() => setIsConnectionModalOpen(false)} provider={cloudProvider} onConnect={handleCloudConnect} />}
    {cloudProvider && <CloudFilePickerModal isOpen={isCloudPickerOpen} onClose={() => setIsCloudPickerOpen(false)} onAttach={handleAttachCloudFile} provider={cloudProvider} />}
    <RecentAttachmentsModal isOpen={isRecentsOpen} onClose={() => setIsRecentsOpen(false)} onAttach={handleAttachRecent} recentAttachments={recentAttachments} />

    <div className="bg-gradient-to-t from-base-100 via-base-100/90 to-transparent dark:from-dark-base-100 dark:via-dark-base-100/90 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 pt-2 pb-3">
            <form
              onSubmit={handleSubmit}
              className="relative w-full"
            >
              {isAttachmentMenuOpen && (
                  <div ref={attachmentMenuRef} className="absolute bottom-full left-0 mb-3 w-72 animate-fade-in" style={{animationDuration: '0.15s'}}>
                      <div className="bg-base-100/80 dark:bg-dark-base-300/80 backdrop-blur-md rounded-xl shadow-2xl border border-base-300 dark:border-dark-base-200 p-2">
                          <ul className="space-y-1">
                              <li><button onClick={() => handleMenuItemClick('upload')} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60 transition-colors"><UploadCloudIcon className="w-5 h-5"/><span>{t('uploadFile')}</span></button></li>
                              <li><button onClick={() => handleMenuItemClick('textContent')} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60 transition-colors"><FileTextIcon className="w-5 h-5"/><span>{t('addTextContent')}</span></button></li>
                              <li><button onClick={() => handleMenuItemClick('sketch')} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60 transition-colors"><PencilIcon className="w-5 h-5"/><span>{t('drawSketch')}</span></button></li>
                              <li><button onClick={() => handleMenuItemClick('google_drive')} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60 transition-colors"><GoogleDriveIcon className="w-5 h-5"/><span>{t('connectGoogleDrive')}</span></button></li>
                              <li><button onClick={() => handleMenuItemClick('one_drive')} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60 transition-colors"><OneDriveIcon className="w-5 h-5"/><span>{t('connectOneDrive')}</span></button></li>
                              <li><button onClick={() => handleMenuItemClick('recents')} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/60 transition-colors"><ClockIcon className="w-5 h-5"/><span>{t('recentlyUsed')}</span></button></li>
                          </ul>
                      </div>
                  </div>
              )}
              {filePreview && (
                  <div className="relative inline-block ml-24 mb-2">
                     {renderFilePreview()}
                      <button 
                          onClick={handleRemoveAttachment}
                          className="absolute -top-2 -right-2 bg-base-300 dark:bg-dark-base-200 rounded-full p-0.5 text-text-primary dark:text-dark-text-primary hover:bg-base-200 dark:hover:bg-dark-base-200/50"
                          aria-label={t('removeFile')}
                      >
                          <XIcon className="w-4 h-4" />
                      </button>
                  </div>
              )}
               <div className="relative flex items-end w-full border border-base-300 bg-base-100 dark:border-dark-base-200 dark:bg-dark-base-300 rounded-2xl shadow-lg p-2 gap-2 transition-all duration-300 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.4)] focus-within:border-brand-primary/50">
                <button
                    id="attachment-button"
                    type="button"
                    onClick={() => setIsAttachmentMenuOpen(prev => !prev)}
                    disabled={isLoading}
                    aria-label={t('attachFile')}
                    className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-text-secondary dark:text-dark-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary active:scale-95 transition-transform"
                >
                    <PaperclipIcon className="w-6 h-6"/>
                </button>
                <ModelSelector
                    model={model}
                    onModelChange={onModelChange}
                    disabled={isModelSelectorDisabled}
                    label={null}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,audio/*"
                    disabled={isLoading}
                />
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('messagePlaceholder')}
                  rows={1}
                  className="flex-1 min-w-0 bg-transparent text-text-primary dark:text-dark-text-primary placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary resize-none leading-normal px-1 py-2 focus:outline-none focus:ring-0 transition-all duration-200 max-h-52"
                  disabled={isLoading}
                />
                {isSpeechSupported && (
                    <button
                      type="button"
                      onClick={handleMicClick}
                      disabled={isLoading}
                      aria-label={isListening ? 'Stop recording' : t('startSpeech')}
                      className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary active:scale-95 transition-transform
                      ${isListening ? 'text-red-500 animate-pulse-fast' : 'text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200'}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <MicrophoneIcon className="w-6 h-6" />
                    </button>
                )}
                {isLoading ? (
                    <button
                        type="button"
                        onClick={onStopGenerating}
                        aria-label={t('stopGenerating')}
                        className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 bg-red-600 text-white hover:bg-red-700 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                    >
                        <StopSquareIcon className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!isSendable}
                        aria-label={t('sendMessage')}
                        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary
                        ${isSendable ? 'bg-brand-primary text-white hover:opacity-90 transform hover:scale-105 active:scale-95' : 'bg-base-200 text-text-secondary dark:bg-dark-base-200 dark:text-dark-text-secondary cursor-not-allowed'}`}
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                )}
              </div>
            </form>
        </div>
    </div>
    </>
  );
};