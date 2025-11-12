import React, { FC } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { LinkIcon } from './Icons';

interface YouTubePlayerProps {
  videoId: string;
}

export const YouTubePlayer: FC<YouTubePlayerProps> = ({ videoId }) => {
  const { t } = useLocale();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="w-full max-w-lg my-4">
      <div className="relative w-full overflow-hidden rounded-lg aspect-video bg-black shadow-lg">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={t('youtubePlayerTitle')}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="mt-2 text-right">
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
        >
          <span>{t('watchOnYouTube')}</span>
          <LinkIcon className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};