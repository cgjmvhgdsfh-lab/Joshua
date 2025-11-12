import React, { FC, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface BarChartProps {
    data: { label: string; value: number }[];
}

export const BarChart: FC<BarChartProps> = ({ data }) => {
    const { theme } = useTheme();

    const colors = useMemo(() => ({
        grid: theme === 'dark' ? '#374151' : '#e5e7eb',
        text: theme === 'dark' ? '#9ca3af' : '#6b7280',
        bar: '#22d3ee',
        barHover: '#67e8f9',
    }), [theme]);

    const chartHeight = 250;
    const chartWidth = 500; // Example width, will scale
    const padding = { top: 20, right: 20, bottom: 30, left: 30 };

    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    const yAxisTicks = 5;
    const yTickInterval = Math.ceil(maxValue / yAxisTicks);
    const yAxisMax = yTickInterval * yAxisTicks;

    const xScale = (index: number) => padding.left + index * ((chartWidth - padding.left - padding.right) / data.length);
    const yScale = (value: number) => chartHeight - padding.bottom - (value / yAxisMax) * (chartHeight - padding.top - padding.bottom);
    const barWidth = ((chartWidth - padding.left - padding.right) / data.length) * 0.6;

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="Bar chart showing activity">
            {/* Y-axis grid lines and labels */}
            {Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
                const value = i * yTickInterval;
                const y = yScale(value);
                return (
                    <g key={i} className="text-xs">
                        <line
                            x1={padding.left}
                            y1={y}
                            x2={chartWidth - padding.right}
                            y2={y}
                            stroke={colors.grid}
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                        <text x={padding.left - 8} y={y + 4} fill={colors.text} textAnchor="end">
                            {value}
                        </text>
                    </g>
                );
            })}

            {/* Bars and X-axis labels */}
            {data.map((d, i) => {
                const x = xScale(i);
                const y = yScale(d.value);
                const height = chartHeight - padding.bottom - y;

                return (
                    <g key={d.label}>
                        <rect
                            x={x + barWidth * 0.33}
                            y={y}
                            width={barWidth}
                            height={Math.max(0, height)}
                            fill={colors.bar}
                            rx="2"
                            className="transition-all duration-300 hover:fill-brand-secondary"
                        >
                           <title>{`${d.label}: ${d.value}`}</title>
                        </rect>
                        <text
                            x={x + barWidth / 2 + barWidth * 0.33}
                            y={chartHeight - padding.bottom + 15}
                            fill={colors.text}
                            textAnchor="middle"
                            className="text-xs"
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};