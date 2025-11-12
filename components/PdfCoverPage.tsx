import React from 'react';

interface PdfCoverPageProps {
  title: string;
}

// Simple seeded random function to ensure deterministic "randomness"
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// Function to generate a unique SVG background as a data URL
const generateSvgBackground = (seedText: string): string => {
    let seed = 0;
    if (seedText) {
        for (let i = 0; i < seedText.length; i++) {
            seed += seedText.charCodeAt(i);
        }
    }

    const numStars = 20 + Math.floor(seededRandom(seed++) * 15);
    const stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: seededRandom(seed++) * 100,
            y: seededRandom(seed++) * 100,
            r: 0.1 + seededRandom(seed++) * 0.25,
        });
    }

    const numLines = 5 + Math.floor(seededRandom(seed++) * 5);
    const lines = [];
    for (let i = 0; i < numLines; i++) {
        const star1 = stars[Math.floor(seededRandom(seed++) * numStars)];
        const star2 = stars[Math.floor(seededRandom(seed++) * numStars)];
        lines.push({ x1: star1.x, y1: star1.y, x2: star2.x, y2: star2.y });
    }

    const svgContent = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            ${lines.map(l => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#67e8f9" stroke-width="0.1" stroke-opacity="0.5" />`).join('')}
            ${stars.map(s => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#a5f3fc" fill-opacity="0.9" />`).join('')}
        </svg>
    `;

    return `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`;
};

export const PdfCoverPage: React.FC<PdfCoverPageProps> = ({ title }) => {
    const backgroundImage = generateSvgBackground(title);

    const styles: { [key: string]: React.CSSProperties } = {
        page: {
            width: '794px',
            height: '1123px', // A4 dimensions
            background: 'linear-gradient(to bottom right, #1e3a8a, #111827)', // Deep blue to dark gray
            backgroundImage: backgroundImage,
            backgroundSize: 'cover',
            display: 'flex',
            flexDirection: 'column',
            color: '#f9fafb', // gray-50
            padding: '60px',
            boxSizing: 'border-box',
        },
        mainContent: {
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
        },
        title: {
            fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`,
            fontSize: '48pt',
            fontWeight: 700,
            marginBottom: '24px',
            lineHeight: '1.2',
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(34, 211, 238, 0.3)',
        },
        subtitle: {
            fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`,
            fontSize: '16pt',
            color: '#cbd5e1', // slate-300
            marginBottom: '48px',
            fontWeight: 400,
        },
        date: {
            fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`,
            fontSize: '12pt',
            color: '#9ca3af', // gray-400
        },
        footer: {
            fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`,
            fontSize: '10pt',
            color: '#9ca3af', // gray-400
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            paddingTop: '20px',
            borderTop: '1px solid #374151' // gray-700
        },
    };

    const currentDate = new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div style={styles.page}>
            <div style={styles.mainContent}>
                <h1 style={styles.title}>{title}</h1>
                <p style={styles.subtitle}>AI-Generated Document</p>
                <p style={styles.date}>{currentDate}</p>
            </div>
            <div style={styles.footer}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                <span>Powered by Universum</span>
            </div>
        </div>
    );
};
