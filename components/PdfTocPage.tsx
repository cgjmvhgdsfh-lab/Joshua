import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PdfTocPageProps {
  tocMarkdown: string;
}

export const PdfTocPage: React.FC<PdfTocPageProps> = ({ tocMarkdown }) => {
    let pageCounter = 1; // Placeholder page numbers

    return (
        <div style={{
            width: '794px',
            height: '1123px', // A4 dimensions
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            color: '#2d3748',
            padding: '80px 60px',
            boxSizing: 'border-box',
            fontFamily: `'Lora', 'Georgia', 'Times New Roman', serif`,
        }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Render H2/H3 as the main title for the TOC
                    h2: ({node, ...props}) => <h2 style={{ fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`, fontSize: '24pt', fontWeight: 700, color: '#1a202c', textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #22d3ee', paddingBottom: '15px' }} {...props} />,
                    h3: ({node, ...props}) => <h2 style={{ fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`, fontSize: '24pt', fontWeight: 700, color: '#1a202c', textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #22d3ee', paddingBottom: '15px' }} {...props} />,

                    // The list will be the container for TOC entries
                    ul: ({node, ...props}) => <ul style={{ listStyleType: 'none', padding: 0, margin: '0 auto', maxWidth: '90%', fontSize: '12pt', lineHeight: 2.5 }} {...props} />,
                    
                    // Each list item is a TOC entry
                    li: ({node, children, ...props}) => {
                        const pageNum = pageCounter++;
                        return (
                            <li style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }} {...props}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
                                <span style={{ flexGrow: 1, borderBottom: '1px dotted #94a3b8', margin: '0 8px' }}></span>
                                <span style={{ fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`, fontWeight: 600 }}>{pageNum}</span>
                            </li>
                        );
                    },
                    // Ensure links and paragraphs inside LIs are styled correctly without extra margins
                    a: ({node, ...props}) => <a style={{ textDecoration: 'none', color: '#2d3748', fontWeight: 600 }} {...props} />,
                    p: ({node, children}) => <>{children}</> 
                }}
            >
                {tocMarkdown}
            </ReactMarkdown>
        </div>
    );
};