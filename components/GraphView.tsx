import React, { useState, useRef, useEffect, useMemo, FC } from 'react';
import { Conversation, Message, Role } from '../types';
import { UserIcon, BotIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLocale } from '../contexts/LocaleContext';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 48;
const VERTICAL_SPACING = 60;
const HORIZONTAL_SPACING = 250;

interface GraphNode {
    id: string;
    conversationId: string;
    label: string;
    role: Role;
    x: number;
    y: number;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    isFork: boolean;
}

interface GraphViewProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
}

export const GraphView: FC<GraphViewProps> = ({ conversations, activeConversationId, onSelectConversation }) => {
    const { theme } = useTheme();
    const { t } = useLocale();
    const svgRef = useRef<SVGSVGElement>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const { nodes, edges } = useMemo(() => {
        if (!activeConversationId || conversations.length === 0) {
            return { nodes: [], edges: [] };
        }

        const convsById = new Map((conversations as Conversation[]).map(c => [c.id, c]));
        let rootConv = convsById.get(activeConversationId);
        if (!rootConv) return { nodes: [], edges: [] };
        
        // Traverse up to find the absolute root of the tree
        while (rootConv.forkInfo && rootConv.forkInfo.parentConversationId) {
            const parent = convsById.get(rootConv.forkInfo.parentConversationId);
            if (!parent) break;
            rootConv = parent;
        }

        const localNodes: GraphNode[] = [];
        const localEdges: GraphEdge[] = [];
        
        const layoutBranch = (conv: Conversation, startX: number, startY: number): number => {
            let currentY = startY;
            let lastMessageId: string | null = null;

            conv.messages.forEach((msg) => {
                const nodeX = startX;
                const nodeY = currentY;
                const node: GraphNode = {
                    id: msg.id,
                    conversationId: conv.id,
                    label: (msg.contentHistory[msg.activeVersionIndex] || `(${msg.role})`).substring(0, 20),
                    role: msg.role,
                    x: nodeX,
                    y: nodeY,
                };
                localNodes.push(node);

                if (lastMessageId) {
                    localEdges.push({
                        id: `${lastMessageId}-${msg.id}`,
                        source: lastMessageId,
                        target: msg.id,
                        isFork: false,
                    });
                }
                lastMessageId = msg.id;
                
                let childY = currentY + NODE_HEIGHT + VERTICAL_SPACING;
                let isFirstChild = true;
                
                (conversations as Conversation[]).forEach((childConv: Conversation) => {
                    if (childConv.forkInfo?.parentConversationId === conv.id && childConv.forkInfo.parentMessageId === msg.id) {
                         if (childConv.messages.length > 0) {
                            localEdges.push({
                                id: `${msg.id}-${childConv.messages[0].id}`,
                                source: msg.id,
                                target: childConv.messages[0].id,
                                isFork: true,
                            });
                           const nextYForChild = isFirstChild ? currentY : childY;
                           const endYOfChildBranch = layoutBranch(childConv, startX + HORIZONTAL_SPACING, nextYForChild);
                           childY = endYOfChildBranch;
                           isFirstChild = false;
                        }
                    }
                });
                
                currentY = childY;
            });
            return currentY;
        };
        
        layoutBranch(rootConv, 0, 0);

        return { nodes: localNodes, edges: localEdges };

    }, [conversations, activeConversationId]);
    
    useEffect(() => {
        if(svgRef.current && nodes.length > 0) {
            const clientWidth = svgRef.current.clientWidth;
            const clientHeight = svgRef.current.clientHeight;
            if(clientWidth === 0 || clientHeight === 0) return;

            const xCoords = nodes.map(n => n.x);
            const yCoords = nodes.map(n => n.y);
            const minX = Math.min(...xCoords);
            const maxX = Math.max(...xCoords);
            const minY = Math.min(...yCoords);
            const maxY = Math.max(...yCoords);
            const graphWidth = maxX - minX + NODE_WIDTH;
            const graphHeight = maxY - minY + NODE_HEIGHT;
            
            const scaleX = clientWidth / (graphWidth + 100);
            const scaleY = clientHeight / (graphHeight + 100);
            const newScale = Math.min(1, scaleX, scaleY);

            const initialX = (clientWidth / 2) - ((minX + graphWidth / 2)) * newScale;
            const initialY = (clientHeight / 2) - ((minY + graphHeight / 2)) * newScale;

            setTransform({ x: initialX, y: initialY, k: newScale});
        }
    }, [nodes.length]);


    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const { clientX, clientY, deltaY } = event;
            const point = new DOMPoint(clientX, clientY);
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const { x: svgX, y: svgY } = point.matrixTransform(ctm.inverse());
            
            const scaleFactor = 1.1;
            const newScale = deltaY < 0 ? transform.k * scaleFactor : transform.k / scaleFactor;
            const newX = svgX - (svgX - transform.x) * (newScale / transform.k);
            const newY = svgY - (svgY - transform.y) * (newScale / transform.k);

            setTransform({ x: newX, y: newY, k: newScale });
        };

        const handleMouseDown = (event: MouseEvent) => {
            isDragging.current = true;
            lastPos.current = { x: event.clientX, y: event.clientY };
            svg.style.cursor = 'grabbing';
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = event.clientX - lastPos.current.x;
            const dy = event.clientY - lastPos.current.y;
            lastPos.current = { x: event.clientX, y: event.clientY };
            setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            svg.style.cursor = 'grab';
        };

        svg.addEventListener('wheel', handleWheel);
        svg.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        svg.style.cursor = 'grab';

        return () => {
            svg.removeEventListener('wheel', handleWheel);
            svg.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [transform]);

    if (nodes.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-text-secondary dark:text-dark-text-secondary">
                <p>{t('newChatTitle')}</p>
            </div>
        );
    }

    const nodePositions: Map<string, { x: number, y: number }> = new Map(nodes.map(n => [n.id, {x: n.x, y: n.y}]));

    return (
        <div className="w-full h-full bg-base-200/50 dark:bg-dark-base-200/20 overflow-hidden" role="graphics-document" aria-label="Conversation graph">
            <svg ref={svgRef} className="w-full h-full">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={theme === 'dark' ? '#64748b' : '#94a3b8'} />
                    </marker>
                </defs>
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                    {edges.map(edge => {
                        const sourcePos = nodePositions.get(edge.source);
                        const targetPos = nodePositions.get(edge.target);
                        if (!sourcePos || !targetPos) return null;

                        const d = edge.isFork 
                            ? `M ${sourcePos.x + NODE_WIDTH / 2},${sourcePos.y + NODE_HEIGHT} C ${sourcePos.x + NODE_WIDTH / 2},${sourcePos.y + NODE_HEIGHT + VERTICAL_SPACING} ${targetPos.x + NODE_WIDTH / 2},${targetPos.y - VERTICAL_SPACING} ${targetPos.x + NODE_WIDTH / 2},${targetPos.y}`
                            : `M ${sourcePos.x + NODE_WIDTH / 2},${sourcePos.y + NODE_HEIGHT} L ${targetPos.x + NODE_WIDTH / 2},${targetPos.y}`;

                        return (
                            <path
                                key={edge.id}
                                d={d}
                                stroke={theme === 'dark' ? '#475569' : '#e2e8f0'}
                                strokeWidth="2"
                                fill="none"
                                markerEnd={edge.isFork ? "url(#arrowhead)" : ""}
                                strokeDasharray={edge.isFork ? '5,5' : 'none'}
                            />
                        )
                    })}
                    {nodes.map(node => {
                        const isActive = node.conversationId === activeConversationId;
                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                className="cursor-pointer transition-opacity duration-300"
                                opacity={isActive ? 1 : 0.6}
                                onClick={() => onSelectConversation(node.conversationId)}
                            >
                                <rect
                                    width={NODE_WIDTH}
                                    height={NODE_HEIGHT}
                                    rx="8"
                                    strokeWidth="2"
                                    stroke={isActive ? '#22d3ee' : (theme === 'dark' ? '#334155' : '#cbd5e1')}
                                    fill={theme === 'dark' ? '#0f172a' : '#f8fafc'}
                                    className="drop-shadow-sm"
                                />
                                <foreignObject x="8" y="8" width="32" height="32">
                                     {node.role === Role.USER ? 
                                        <UserIcon className={`w-8 h-8 p-1.5 rounded-full ${isActive ? 'bg-brand-primary/20 text-brand-primary' : 'bg-base-300 dark:bg-dark-base-200 text-text-primary dark:text-dark-text-primary'}`} /> : 
                                        <BotIcon className={`w-8 h-8 p-1.5 rounded-full ${isActive ? 'bg-brand-primary/20 text-brand-primary' : 'bg-base-300 dark:bg-dark-base-200 text-text-primary dark:text-dark-text-primary'}`} />}
                                </foreignObject>
                                <text x={48} y={30} fill={theme === 'dark' ? '#f1f5f9' : '#0f172a'} className="text-xs font-semibold" textAnchor="start">
                                    {node.label}
                                </text>
                                <title>{node.label}</title>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};