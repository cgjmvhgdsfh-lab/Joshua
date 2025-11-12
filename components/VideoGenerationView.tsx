import React from 'react';
import { FilmIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';

export const VideoGenerationView: React.FC = () => {
  const { t } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-base-200/50 dark:bg-dark-base-200/30 rounded-lg">
      <FilmIcon className="w-16 h-16 text-brand-primary mb-4" />
      <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
        {t('videoGeneration')}
      </h2>
      <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
        {t('videoGenerationDescription')}
      </p>
      <div className="mt-6 px-4 py-2 bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-full">
        {t('comingSoon')}
      </div>
    </div>
  );
};
