import React, { FC, useMemo } from 'react';
import { Conversation, ModelType, Role } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { FoldersIcon, MessageSquareTextIcon, BarChartIcon, ImageIcon, AudioFileIcon, CodeIcon, WordFileIcon } from './Icons';
import { BarChart } from './BarChart';

interface AnalyticsModalProps {
  conversations: Conversation[];
}

interface KeyMetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
    description: string;
}

const KeyMetricCard: FC<KeyMetricCardProps> = ({ icon, title, value, description }) => (
    <div className="bg-base-200/50 dark:bg-dark-base-200/30 rounded-xl p-4 border border-base-300/50 dark:border-dark-base-200/50">
        <div className="flex items-center gap-3 mb-2">
            <div className="text-brand-primary">
                {icon}
            </div>
            <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{title}</p>
        </div>
        <p className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
        <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">{description}</p>
    </div>
);


const modelColors = [
    '#22d3ee', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#6366f1', '#10b981', '#f97316', '#d946ef'
];

const PieChart: FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    const segments = data.map((item, index) => {
        const percent = (item.value / total) * 100;
        return {
            ...item,
            percent,
            color: modelColors[index % modelColors.length]
        };
    });

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="0 0 200 200" className="-rotate-90">
                    {segments.map((segment, index) => {
                        const strokeDasharray = `${(segment.percent / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedOffset;
                        accumulatedOffset += (segment.percent / 100) * circumference;
                        
                        return (
                            <circle
                                key={index}
                                r={radius}
                                cx="100"
                                cy="100"
                                fill="transparent"
                                stroke={segment.color}
                                strokeWidth="40"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{total}</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{total === 1 ? 'Entry' : 'Entries'}</p>
                    </div>
                </div>
            </div>
            <ul className="w-full md:w-auto">
                {segments.map((segment) => (
                    <li key={segment.name} className="flex items-center justify-between md:justify-start gap-3 py-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                            <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{segment.name}</span>
                        </div>
                        <span className="text-sm font-mono text-text-secondary dark:text-dark-text-secondary">{segment.percent.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export const AnalyticsModal: FC<AnalyticsModalProps> = ({ conversations }) => {
    const { t, locale } = useLocale();

    const stats = useMemo(() => {
        const totalConversations = conversations.length;
        let totalMessages = 0;
        let userMessages = 0;
        let aiMessages = 0;
        let imageMessages = 0;
        let audioMessages = 0;
        let codeBlockMessages = 0;
        let wordMessages = 0;
        const modelUsage = new Map<ModelType, number>();

        const now = new Date();
        const dailyActivity: { [date: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            dailyActivity[d.toISOString().split('T')[0]] = 0;
        }

        conversations.forEach(conv => {
            let model: ModelType;
            const currentModel = conv.model as any;
             if (['fast', 'universum-1.3-schnell', 'universum-1.4-schnell', 'universum-1.5-schnell', 'universum-1.6-schnell', 'universum-1.7-schnell'].includes(currentModel)) {
                model = 'universum-4.0-schnell';
            } else {
                model = 'universum-4.0';
            }
            modelUsage.set(model, (modelUsage.get(model) || 0) + 1);

            conv.messages.forEach(msg => {
                totalMessages++;
                if (msg.role === Role.USER) userMessages++;
                if (msg.role === Role.MODEL) aiMessages++;
                if (msg.imagesData && msg.imagesData.length > 0) imageMessages++;
                if (msg.audioData) audioMessages++;
                if (msg.codeBlock) codeBlockMessages++;
                if (msg.wordFile) wordMessages++;
                
                // Track daily activity from message ID timestamp
                const timestamp = parseInt(msg.id.split('-')[1]);
                if (!isNaN(timestamp)) {
                    const msgDate = new Date(timestamp).toISOString().split('T')[0];
                    if (dailyActivity[msgDate] !== undefined) {
                        dailyActivity[msgDate]++;
                    }
                }
            });
        });

        const sortedModelUsage = Array.from(modelUsage.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => {
                const keySuffix = name
                    .split('-')
                    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                    .join('')
                    .replace('.', '_');
                return { name: t(`model${keySuffix}Name`), value };
            });
        
        const dailyActivityData = Object.entries(dailyActivity).map(([date, value]) => ({
            label: new Date(date).toLocaleDateString(locale, { weekday: 'short' }),
            value
        }));

        const averageMessagesPerConversation = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : '0.0';

        const userVsAiData = [
            { name: t('userMessages'), value: userMessages },
            { name: t('aiMessages'), value: aiMessages }
        ];

        return { 
            totalConversations, 
            totalMessages, 
            sortedModelUsage,
            dailyActivityData,
            averageMessagesPerConversation,
            imageMessages,
            audioMessages,
            codeBlockMessages,
            wordMessages,
            userVsAiData
        };
    }, [conversations, t, locale]);

    if (stats.totalConversations === 0) {
        return (
            <div className="flex items-center justify-center h-full text-text-secondary dark:text-dark-text-secondary">
                <p>{t('noDataAvailable')}</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <KeyMetricCard 
                    icon={<FoldersIcon className="w-5 h-5" />}
                    title={t('totalConversations')}
                    value={stats.totalConversations}
                    description={t('conversationsCreated')}
                />
                <KeyMetricCard 
                    icon={<MessageSquareTextIcon className="w-5 h-5" />}
                    title={t('totalMessages')}
                    value={stats.totalMessages}
                    description={t('messagesSent')}
                />
                <KeyMetricCard 
                    icon={<BarChartIcon className="w-5 h-5" />}
                    title={t('averageMessages')}
                    value={stats.averageMessagesPerConversation}
                    description={t('messagesPerConversation')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-base-200/50 dark:bg-dark-base-200/30 rounded-xl p-4 border border-base-300/50 dark:border-dark-base-200/50 lg:col-span-2">
                     <h3 className="font-semibold text-text-primary dark:text-dark-text-primary mb-2">{t('dailyActivity')}</h3>
                     <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4">{t('messagesLast7Days')}</p>
                     <div className="h-64">
                        <BarChart data={stats.dailyActivityData} />
                     </div>
                </div>

                <div className="bg-base-200/50 dark:bg-dark-base-200/30 rounded-xl p-4 border border-base-300/50 dark:border-dark-base-200/50">
                    <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{t('userVsAiMessages')}</h3>
                    <div className="mt-4">
                       {stats.userVsAiData[0].value > 0 || stats.userVsAiData[1].value > 0 ? (
                            <PieChart data={stats.userVsAiData} />
                       ) : (
                            <p className="text-sm text-center text-text-secondary dark:text-dark-text-secondary py-8">{t('noDataAvailable')}</p>
                       )}
                    </div>
                </div>
                
                <div className="bg-base-200/50 dark:bg-dark-base-200/30 rounded-xl p-4 border border-base-300/50 dark:border-dark-base-200/50">
                    <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{t('modelUsage')}</h3>
                    <div className="mt-4">
                       {stats.sortedModelUsage.length > 0 ? (
                            <PieChart data={stats.sortedModelUsage} />
                       ) : (
                            <p className="text-sm text-center text-text-secondary dark:text-dark-text-secondary py-8">{t('noDataAvailable')}</p>
                       )}
                    </div>
                </div>

                <div className="bg-base-200/50 dark:bg-dark-base-200/30 rounded-xl p-4 border border-base-300/50 dark:border-dark-base-200/50 lg:col-span-2">
                    <h3 className="font-semibold text-text-primary dark:text-dark-text-primary mb-4">{t('contentBreakdown')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 bg-base-100 dark:bg-dark-base-100 p-3 rounded-lg">
                            <ImageIcon className="w-6 h-6 text-green-500"/>
                            <div>
                                <p className="font-bold text-xl">{stats.imageMessages}</p>
                                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('imageMessages')}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 bg-base-100 dark:bg-dark-base-100 p-3 rounded-lg">
                            <AudioFileIcon className="w-6 h-6 text-red-500"/>
                            <div>
                                <p className="font-bold text-xl">{stats.audioMessages}</p>
                                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('audioMessages')}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 bg-base-100 dark:bg-dark-base-100 p-3 rounded-lg">
                            <CodeIcon className="w-6 h-6 text-purple-500"/>
                            <div>
                                <p className="font-bold text-xl">{stats.codeBlockMessages}</p>
                                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('codeMessages')}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 bg-base-100 dark:bg-dark-base-100 p-3 rounded-lg">
                            <WordFileIcon className="w-6 h-6 text-blue-500"/>
                            <div>
                                <p className="font-bold text-xl">{stats.wordMessages}</p>
                                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('wordDocuments')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};