import React, { useState, useRef, useEffect, useMemo, FC } from 'react';
import { PlayIcon, PauseIcon } from './Icons';

interface AudioPlayerProps {
  src: string;
  fileName: string;
}

const formatTime = (time: number) => {
  if (isNaN(time) || time === Infinity) {
    return '0:00';
  }
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioPlayer: FC<AudioPlayerProps> = ({ src, fileName }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnd = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const waveformBars = useMemo(() => {
    return Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2); // Heights between 20% and 100%
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="p-3 bg-base-200/50 dark:bg-dark-base-200/30 rounded-lg w-full max-w-sm">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 dark:focus:ring-offset-dark-base-200 active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">{fileName}</p>
          <span className="text-xs text-text-secondary dark:text-dark-text-secondary font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
       <div className="relative w-full h-8 flex items-center mt-2">
           {/* Waveform background */}
           <div className="absolute w-full h-full flex items-center gap-px">
                {waveformBars.map((height, i) => (
                    <div key={i} className="w-1 flex-grow bg-base-300 dark:bg-dark-base-200/50 rounded-sm" style={{ height: `${height * 100}%` }} />
                ))}
            </div>
            {/* Waveform progress */}
            <div className="absolute w-full h-full flex items-center gap-px overflow-hidden" style={{ width: `${progressPercentage}%` }}>
                {waveformBars.map((height, i) => (
                    <div key={i} className="w-1 flex-grow bg-brand-primary rounded-sm" style={{ height: `${height * 100}%` }} />
                ))}
            </div>
        </div>
    </div>
  );
};