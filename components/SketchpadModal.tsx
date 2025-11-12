import React, { useState, useRef, useEffect, FC } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { XIcon, TrashIcon, PencilIcon, EraserIcon } from './Icons';

interface SketchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSketch: (sketchFile: File) => void;
}

const colors = ['#0f172a', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff'];
const line_widths = [2, 5, 10, 20];

export const SketchpadModal: FC<SketchpadModalProps> = ({ isOpen, onClose, onAddSketch }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#0f172a');
    const [lineWidth, setLineWidth] = useState(5);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const { t } = useLocale();

    const handleClear = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            const originalCompositeOp = context.globalCompositeOperation;
            context.globalCompositeOperation = 'source-over';
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.globalCompositeOperation = originalCompositeOp;
        }
    };

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

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                context.scale(dpr, dpr);
                
                context.lineCap = 'round';
                context.lineJoin = 'round';
                contextRef.current = context;
                handleClear();
            }
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth, tool]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const event = 'touches' in e ? e.touches[0] : e;
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!contextRef.current) return;
        const { x, y } = getCoords(e);
        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !contextRef.current) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
    };
    
    const handleAdd = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "sketch.png", { type: "image/png" });
                    onAddSketch(file);
                    onClose();
                }
            }, 'image/png');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-40 flex items-center justify-center p-4 animate-fade-in" style={{animationDuration: '0.2s'}} onClick={onClose}>
            <div className="bg-base-100 dark:bg-dark-base-300 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] border border-base-300 dark:border-dark-base-200" role="dialog" aria-modal="true" aria-labelledby="sketch-modal-title" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-base-200 dark:border-dark-base-200 flex items-center justify-between flex-shrink-0">
                    <h2 id="sketch-modal-title" className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{t('drawSketchTitle')}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
                        <XIcon className="w-6 h-6" /><span className="sr-only">{t('close')}</span>
                    </button>
                </header>
                <div className="p-2 flex-shrink-0 border-b border-base-200 dark:border-dark-base-200 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-base-200 dark:hover:bg-dark-base-200'}`} title={t('pen')}><PencilIcon className="w-5 h-5" /></button>
                        <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-base-200 dark:hover:bg-dark-base-200'}`} title={t('eraser')}><EraserIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="h-6 w-px bg-base-300 dark:bg-dark-base-200"></div>
                    <div className="flex items-center gap-2" title={t('color')}>
                        {colors.map(c => <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-brand-primary ring-offset-base-100 dark:ring-offset-dark-base-300' : ''}`} style={{backgroundColor: c, border: c==='#ffffff' ? '1px solid #e2e8f0' : 'none'}} />)}
                    </div>
                    <div className="h-6 w-px bg-base-300 dark:bg-dark-base-200"></div>
                    <div className="flex items-center gap-2" title={t('lineWidth')}>
                        {line_widths.map(lw => <button key={lw} onClick={() => setLineWidth(lw)} className={`flex items-center justify-center w-8 h-8 rounded-lg ${lineWidth === lw ? 'bg-brand-primary/20' : 'hover:bg-base-200 dark:hover:bg-dark-base-200'}`}><span className="rounded-full bg-text-primary dark:bg-dark-text-primary" style={{width: lw, height: lw}} /></button>)}
                    </div>
                    <div className="ml-auto">
                        <button onClick={handleClear} className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 dark:hover:bg-dark-base-200 text-sm font-semibold" title={t('clearCanvas')}><TrashIcon className="w-5 h-5" /><span>{t('clearCanvas')}</span></button>
                    </div>
                </div>
                <main className="flex-grow bg-base-200/30 dark:bg-dark-base-200/20 p-2 overflow-hidden">
                    <canvas ref={canvasRef} className="w-full h-full bg-white rounded-lg shadow-inner cursor-crosshair" onMouseDown={startDrawing} onMouseUp={finishDrawing} onMouseLeave={finishDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchEnd={finishDrawing} onTouchMove={draw} />
                </main>
                <footer className="p-4 border-t border-base-200 dark:border-dark-base-200 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors">{t('cancel')}</button>
                    <button onClick={handleAdd} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity">{t('add')}</button>
                </footer>
            </div>
        </div>
    );
};