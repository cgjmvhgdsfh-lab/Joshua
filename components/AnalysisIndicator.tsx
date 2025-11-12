import React, { FC, useMemo, useEffect, useRef } from 'react';
import { LoadingSpinner, CheckCircleIcon, BrainCircuitIcon, SearchIcon, CodeIcon, WandSparklesIcon, ZapIcon, FoldersIcon, SheetIcon, PenSquareIcon, DatabaseIcon, ImageIcon, PresentationIcon, FileTextIcon, UniverseIcon, CalendarCheckIcon, CubeIcon } from './Icons';
import { AnalysisStep } from '../types';
import { useLocale } from '../contexts/LocaleContext';

interface AnalysisIndicatorProps {
  analysisState: AnalysisStep[];
}

const ICONS: { [key: string]: React.FC<{className?: string}> } = {
    'brain-circuit': BrainCircuitIcon,
    'search': SearchIcon,
    'code': CodeIcon,
    'wand-sparkles': WandSparklesIcon,
    'zap': ZapIcon,
    'folders': FoldersIcon,
    'sheet': SheetIcon,
    'pen-square': PenSquareIcon,
    'database': DatabaseIcon,
    'image': ImageIcon,
    'presentation': PresentationIcon,
    'file-text': FileTextIcon,
    'calendar-check': CalendarCheckIcon,
    'cube': CubeIcon,
};

const Node: FC<{ step: AnalysisStep; isCore?: boolean }> = ({ step, isCore = false }) => {
    const Icon = step.icon ? ICONS[step.icon] : BrainCircuitIcon;
    const isCompleted = step.status === 'completed';
    const isActive = step.status === 'active';

    if (isCore) {
        const CoreIcon = UniverseIcon; // Using UniverseIcon for the core
        return (
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Animated Rings for active state */}
                <div className={`absolute inset-0 rounded-full border-2 border-brand-primary/20 ${isActive ? 'animate-pulse' : ''}`}></div>
                <div className={`absolute inset-2 rounded-full border border-brand-primary/30 ${isActive ? 'animate-pulse [animation-delay:0.3s]' : ''}`}></div>

                {/* Main Node */}
                <div className={`relative w-40 h-40 bg-base-200/80 dark:bg-dark-base-300/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center p-3 text-center border-2 transition-colors duration-500 ${isActive ? 'border-brand-primary' : 'border-base-300 dark:border-dark-base-200'}`}>
                    <div className={`absolute -top-1 -right-1 transition-all duration-300 transform ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                        <CheckCircleIcon className="w-8 h-8 text-green-500 bg-base-100 dark:bg-dark-base-300 rounded-full" />
                    </div>
                    {/* Icon a bit larger */}
                    <div className={`p-2.5 rounded-full mb-1 transition-colors duration-300 ${isActive ? 'bg-brand-primary/10' : 'bg-base-300/50 dark:bg-dark-base-200/50'}`}>
                        <CoreIcon className={`w-7 h-7 transition-colors duration-300 ${isActive ? 'text-brand-primary animate-pulse-fast' : 'text-text-secondary dark:text-dark-text-secondary'}`} />
                    </div>
                    <h4 className="font-bold text-sm text-text-primary dark:text-dark-text-primary">{step.title}</h4>
                    <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary leading-tight mt-0.5">{step.details}</p>
                </div>
            </div>
        )
    }

    // Agent Node
    const containerClasses = "w-36 h-36 bg-base-200/50 dark:bg-dark-base-200/30 border";
    const statusColor = isCompleted ? 'border-green-500/50' : isActive ? 'border-brand-primary' : 'border-base-300 dark:border-dark-base-200';
    const pulseAnimation = isActive ? 'animate-glow' : ''; // Using glow for agents

    return (
        <div className={`relative rounded-full flex flex-col items-center justify-center p-3 text-center transition-all duration-500 ${containerClasses} ${statusColor} ${pulseAnimation}`}>
            <div className={`absolute -top-1 -right-1 transition-all duration-300 transform ${isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <CheckCircleIcon className="w-7 h-7 text-green-500 bg-base-100 dark:bg-dark-base-300 rounded-full" />
            </div>
            <div className={`p-2.5 rounded-full mb-1 transition-colors duration-300 ${isActive ? 'bg-brand-primary/10' : 'bg-base-300/50 dark:bg-dark-base-200/50'}`}>
                <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-brand-primary' : 'text-text-secondary dark:text-dark-text-secondary'}`} />
            </div>
            <h4 className="font-bold text-xs text-text-primary dark:text-dark-text-primary">{step.title}</h4>
            <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary leading-tight mt-0.5">{step.details}</p>
        </div>
    );
};

const Synapse: FC<{ from: [number, number]; to: [number, number]; visible: boolean }> = ({ from, to, visible }) => {
    const pathRef = useRef<SVGPathElement>(null);
    
    useEffect(() => {
        if (visible && pathRef.current) {
            const length = pathRef.current.getTotalLength();
            pathRef.current.style.strokeDasharray = `${length}`;
            pathRef.current.style.strokeDashoffset = `${length}`;
            // Trigger reflow to apply styles before animation
            pathRef.current.getBoundingClientRect();
            pathRef.current.style.transition = 'stroke-dashoffset 1s ease-out';
            pathRef.current.style.strokeDashoffset = '0';
        }
    }, [visible]);

    return (
        <g className="transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }}>
            {/* Base static line */}
            <path
                d={`M ${from[0]} ${from[1]} C ${from[0]} ${from[1] + 60}, ${to[0]} ${to[1] - 60}, ${to[0]} ${to[1]}`}
                stroke="url(#synapseGradient)"
                strokeWidth="1.5"
                fill="none"
            />
             {/* Animated drawing line / pulse */}
            <path
                ref={pathRef}
                d={`M ${from[0]} ${from[1]} C ${from[0]} ${from[1] + 60}, ${to[0]} ${to[1] - 60}, ${to[0]} ${to[1]}`}
                stroke="url(#synapsePulseGradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                style={{ strokeDashoffset: 1000 }} // Initial offset
            />
        </g>
    );
};


const NeuralBackground: FC = () => {
    const points = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
        x: (i % 5) * 25 + 2.5 + Math.random() * 5 - 2.5,
        y: Math.floor(i / 5) * 25 + 2.5 + Math.random() * 5 - 2.5
    })), []);

    const lines = useMemo(() => {
        const lines = new Set<string>();
        for (let i = 0; i < 15; i++) {
            const p1Index = Math.floor(Math.random() * points.length);
            const p2Index = Math.floor(Math.random() * points.length);
            if (p1Index !== p2Index) {
                 const key = [p1Index, p2Index].sort().join('-');
                 lines.add(key);
            }
        }
        return Array.from(lines).map(key => {
            const [i1, i2] = key.split('-').map(Number);
            return { p1: points[i1], p2: points[i2] };
        });
    }, [points]);

    return (
        <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30" aria-hidden="true">
            <g transform="scale(3.5) translate(10, 20)">
                {lines.map(({ p1, p2 }, i) => (
                     <line 
                        key={i} 
                        x1={p1.x} y1={p1.y} 
                        x2={p2.x} y2={p2.y} 
                        stroke="var(--tw-colors-brand-primary)" 
                        strokeWidth="0.2"
                        className="animate-draw-line"
                        style={{animationDelay: `${Math.random() * 1}s`}}
                    />
                ))}
            </g>
        </svg>
    )
}

export const AnalysisIndicator: FC<AnalysisIndicatorProps> = ({ analysisState }) => {
    const { t } = useLocale();
    if (!analysisState || analysisState.length === 0) return null;

    const coreSteps = useMemo(() => analysisState.filter(s => s.type === 'core'), [analysisState]);
    const agentSteps = useMemo(() => analysisState.filter(s => s.type === 'agent' || s.type === 'task'), [analysisState]);
    
    const activeCoreStep = coreSteps.find(s => s.status === 'active') || coreSteps[coreSteps.length - 1] || coreSteps[0];
    
    // Stable, symmetrical positions for agents/tasks
    const agentPositions = useMemo(() => [
        { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' },    // Top
        { top: '45%', left: '100%', transform: 'translate(-50%, -50%)' },  // Mid-Right
        { top: '100%', left: '75%', transform: 'translate(-50%, -50%)' }, // Bottom-Right
        { top: '100%', left: '25%', transform: 'translate(-50%, -50%)' }, // Bottom-Left
        { top: '45%', left: '0%', transform: 'translate(-50%, -50%)' },   // Mid-Left
    ], []);

    const getAgentPos = (agent: AnalysisStep, index: number) => agentPositions[index % agentPositions.length];

    const corePosition: [number, number] = [160, 160];
    const agentCoordinates = agentSteps.map((agent, index) => {
        const pos = getAgentPos(agent, index);
        // Approximate pixel coordinates from percentage for SVG lines
        const x = (parseFloat(pos.left) / 100) * 320;
        const y = (parseFloat(pos.top) / 100) * 320;
        return [x, y] as [number, number];
    });

    return (
        <div className="animate-fade-in relative overflow-hidden w-full">
            <NeuralBackground />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <BrainCircuitIcon className="w-5 h-5 text-brand-primary animate-pulse-fast" />
                    <h3 className="font-bold text-md text-text-primary dark:text-dark-text-primary">{t('cognitiveMatrixTitle')}</h3>
                </div>
                <div className="relative w-full h-[320px]">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{ width: 320, height: 320, margin: 'auto' }}>
                        <defs>
                             <linearGradient id="synapseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.5" />
                            </linearGradient>
                            <linearGradient id="synapsePulseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        {agentSteps.map((agent, index) => {
                            const isDispatched = agent.status !== 'pending';
                            return (
                               <Synapse key={`synapse-${agent.id}`} from={corePosition} to={agentCoordinates[index]} visible={isDispatched} />
                            );
                        })}
                    </svg>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        {activeCoreStep && <Node step={activeCoreStep} isCore />}
                    </div>

                    {agentSteps.map((agent, index) => {
                        const isDispatched = agent.status !== 'pending';
                        const pos = getAgentPos(agent, index);
                        return (
                            <div 
                                key={agent.id}
                                className="absolute transition-all duration-700 ease-out"
                                style={{
                                    top: pos.top,
                                    left: pos.left,
                                    opacity: isDispatched ? 1 : 0,
                                    transform: `${pos.transform} scale(${isDispatched ? 1 : 0.5})`,
                                    transitionDelay: `${isDispatched ? (index * 0.15) + 0.2 : 0}s`
                                }}
                            >
                                <Node step={agent} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};