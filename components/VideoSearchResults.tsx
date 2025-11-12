import React, { useState, FC } from 'react';
import { VideoSearchResult } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { YouTubePlayer } from './YouTubePlayer';
import { XIcon } from './Icons';

interface VideoSearchResultsProps {
  results: VideoSearchResult[];
}

export const VideoSearchResults: FC<VideoSearchResultsProps> = ({ results }) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const { t } = useLocale();

  return (
    <div className="w-full max-w-lg space-y-3">
      {selectedVideoId && (
        <div className="mb-4 animate-fade-in" style={{animationDuration: '0.3s'}}>
          <YouTubePlayer videoId={selectedVideoId} />
          <button
            onClick={() => setSelectedVideoId(null)}
            className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50"
            aria-label={t('closePlayer')}
          >
            <XIcon className="w-4 h-4" />
            <span>{t('closePlayer')}</span>
          </button>
        </div>
      )}

      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => setSelectedVideoId(result.videoId)}
          className="w-full flex items-start gap-3 text-left p-3 rounded-lg hover:bg-base-200/50 dark:hover:bg-dark-base-200/40 transition-colors"
        >
          <img src={result.thumbnailUrl} alt={result.title} className="w-32 h-20 object-cover rounded flex-shrink-0 bg-base-300 dark:bg-dark-base-200" />
          <div className="overflow-hidden">
            <p className="font-semibold text-sm leading-snug text-text-primary dark:text-dark-text-primary line-clamp-2">{result.title}</p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 truncate">{result.channelTitle}</p>
          </div>
        </button>
      ))}
    </div>
  );
};