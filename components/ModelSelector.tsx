import React, { useState, useRef, useEffect, FC } from 'react';
import { ModelType } from '../types';
import { ChevronDownIcon, CheckIcon, BotIcon, WandSparklesIcon, SparklesIcon, ZapIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';

interface ModelSelectorProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  disabled: boolean;
  label: string | null;
}

const getModelOptions = (t: (key: string) => string) => ({
    'universum-4.0': {
        id: 'universum-4.0' as ModelType,
        name: t('modelUniversum4_0Name'),
        tag: t('modelUniversum4_0Tag'),
        description: t('modelUniversum4_0Description'),
        icon: (props: any) => <SparklesIcon {...props} />,
    },
    'universum-4.0-schnell': {
        id: 'universum-4.0-schnell' as ModelType,
        name: t('modelUniversum4_0SchnellName'),
        tag: t('modelUniversum4_0SchnellTag'),
        description: t('modelUniversum4_0SchnellDescription'),
        icon: (props: any) => <ZapIcon {...props} />,
    },
});

export const ModelSelector: FC<ModelSelectorProps> = ({ model, onModelChange, disabled, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const modelOptions = getModelOptions(t);
  const selectedOption = modelOptions[model] || modelOptions['universum-4.0'];

  const direction = label ? 'down' : 'up';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newModel: ModelType) => {
    onModelChange(newModel);
    setIsOpen(false);
  };
  
  return (
    <div ref={wrapperRef} className="relative">
      {label && <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-1 block">{label}</span>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-transparent border border-base-300 dark:border-dark-base-200 hover:bg-base-200/50 dark:hover:bg-dark-base-200/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('changeModel', selectedOption.name)}
      >
        <selectedOption.icon className="w-5 h-5 text-brand-primary" />
        <span className="font-semibold text-text-primary dark:text-dark-text-primary whitespace-nowrap">{selectedOption.name}</span>
        {!disabled && <ChevronDownIcon className={`w-5 h-5 text-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !disabled && (
        <div className={`absolute left-0 w-80 bg-base-100/80 dark:bg-dark-base-300/80 backdrop-blur-md rounded-lg shadow-2xl border border-base-300 dark:border-dark-base-200 z-20 animate-fade-in max-h-[70vh] overflow-y-auto ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`} style={{animationDuration: '0.1s'}}>
          <ul className="p-1">
            {[
                modelOptions['universum-4.0'],
                modelOptions['universum-4.0-schnell']
            ].filter(Boolean).map(option => (
              <li key={option.id}>
                <button
                  onClick={() => handleSelect(option.id)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-md hover:bg-base-200 dark:hover:bg-dark-base-200/60"
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {option.id === model ? (
                       <div className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-primary text-white">
                         <CheckIcon className="w-3.5 h-3.5" />
                       </div>
                    ) : (
                       <div className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-base-300 dark:border-dark-base-200"/>
                    )}
                  </div>
                  <div>
                      <div className="flex items-center gap-2">
                         <option.icon className="w-5 h-5 text-text-primary dark:text-dark-text-primary"/>
                         <span className="font-semibold text-text-primary dark:text-dark-text-primary">{option.name}</span>
                         <span className="text-xs font-medium py-0.5 px-1.5 bg-base-200 dark:bg-dark-base-200 text-text-secondary dark:text-dark-text-secondary rounded-full">{option.tag}</span>
                      </div>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">{option.description}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};