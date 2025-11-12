import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Use a lighter, cleaner theme

interface PdfContentProps {
  markdown: string;
}

// A zero-height element to mark potential page break locations
const PageBreakSuggestion: React.FC = () => (
    <div className="pdf-page-break-suggestion" style={{ height: 0, overflow: 'hidden' }}></div>
);

/**
 * Renders the main body of the PDF content.
 * This component is rendered off-screen to be captured by html2canvas.
 * Header and footer are added dynamically per-page in the PDF generation logic.
 */
export const PdfContent: React.FC<PdfContentProps> = ({ markdown }) => {
  // A professional color and typography scheme for the PDF.
  const styles = {
    backgroundColor: '#ffffff',
    textColor: '#334155', // slate-700
    headingColor: '#1e293b', // slate-800
    secondaryTextColor: '#64748b', // slate-500
    borderColor: '#e2e8f0', // slate-200
    linkColor: '#2563eb', // blue-600
    codeBg: '#f8fafc', // slate-50
    codeBorder: '#e2e8f0', // slate-200
    codeColor: '#475569', // slate-600
    blockquoteBorder: '#93c5fd', // blue-300
    blockquoteBg: '#eff6ff', // blue-50
  };
  
  return (
    <div style={{
        fontFamily: `'Lora', 'Georgia', 'Times New Roman', serif`,
        backgroundColor: styles.backgroundColor,
        color: styles.textColor,
        padding: '20px', // Add some padding to avoid content touching edges
        boxSizing: 'border-box',
        lineHeight: '1.7',
        fontSize: '11pt',
        wordWrap: 'break-word',
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({node, ...props}) => <><h1 style={{fontFamily: `'Poppins', sans-serif`, fontSize: '24pt', fontWeight: 700, color: styles.headingColor, borderBottom: `2px solid ${styles.borderColor}`, paddingBottom: '10px', marginTop: '0', marginBottom: '24px'}} {...props} /><PageBreakSuggestion /></>,
          h2: ({node, ...props}) => <><h2 style={{fontFamily: `'Poppins', sans-serif`, fontSize: '18pt', fontWeight: 600, color: styles.headingColor, borderBottom: `1px solid ${styles.borderColor}`, paddingBottom: '8px', marginTop: '32px', marginBottom: '20px'}} {...props} /><PageBreakSuggestion /></>,
          h3: ({node, ...props}) => <><h3 style={{fontFamily: `'Poppins', sans-serif`, fontSize: '14pt', fontWeight: 600, color: styles.headingColor, marginTop: '28px', marginBottom: '16px'}} {...props} /><PageBreakSuggestion /></>,
          p: ({node, ...props}) => <><p style={{marginBottom: '16px',}} {...props} /><PageBreakSuggestion /></>,
          a: ({node, ...props}) => <a style={{color: styles.linkColor, textDecoration: 'none', fontWeight: 600, borderBottom: `1px solid ${styles.linkColor}`}} {...props} />,
          ul: ({node, ...props}) => <><ul style={{listStyleType: 'disc', paddingLeft: '28px', marginBottom: '16px'}} {...props} /><PageBreakSuggestion /></>,
          ol: ({node, ...props}) => <><ol style={{listStyleType: 'decimal', paddingLeft: '28px', marginBottom: '16px'}} {...props} /><PageBreakSuggestion /></>,
          li: ({node, ...props}) => <li style={{marginBottom: '8px'}} {...props} />,
          blockquote: ({node, ...props}) => <><blockquote style={{borderLeft: `4px solid ${styles.blockquoteBorder}`, padding: '12px 20px', margin: '20px 0', backgroundColor: styles.blockquoteBg, color: styles.secondaryTextColor, fontSize: '10.5pt'}} {...props} /><PageBreakSuggestion /></>,
          code: ({node, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, '');

            if (match) {
              return (
                <><div style={{ borderRadius: '6px', marginBottom: '16px', border: `1px solid ${styles.codeBorder}`, fontSize: '9.5pt', backgroundColor: styles.codeBg }}>
                   <div style={{padding: '6px 14px', borderBottom: `1px solid ${styles.codeBorder}`, color: styles.secondaryTextColor, backgroundColor: '#f1f5f9', fontSize: '9pt', textTransform: 'uppercase', fontWeight: '600', fontFamily: `'Poppins', sans-serif`, borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                    {match[1]}
                  </div>
                  <SyntaxHighlighter 
                    style={oneLight} 
                    language={match[1]} 
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '14px',
                        backgroundColor: 'transparent',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: `'JetBrains Mono', 'Courier New', monospace`,
                        }
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div><PageBreakSuggestion /></>
              );
            }
            return <code style={{backgroundColor: styles.codeBg, color: styles.codeColor, padding: '3px 6px', borderRadius: '4px', fontFamily: `'JetBrains Mono', 'Courier New', monospace`, fontSize: '10pt', border: `1px solid ${styles.codeBorder}`}} {...props}>{children}</code>;
          },
          pre: ({node, ...props}) => <>{props.children}</>, // The custom code renderer handles the pre tag logic
          img: ({node, ...props}) => {
            // Add a cache-busting parameter to prevent CORS issues with cached images.
            // This forces the browser to re-request the image with the correct crossOrigin attribute,
            // which is necessary for html2canvas to render it.
            let cacheBustedSrc = props.src;
            if (props.src && props.src.startsWith('http')) {
                try {
                    const url = new URL(props.src);
                    url.searchParams.set('_cache', `${Date.now()}${Math.random()}`);
                    cacheBustedSrc = url.toString();
                } catch (e) {
                    console.error("Failed to parse image URL for cache busting:", e);
                }
            }

            return (
              <>
                <img 
                  crossOrigin="anonymous" 
                  style={{maxWidth: '100%', height: 'auto', borderRadius: '8px', margin: '20px 0', border: `1px solid ${styles.borderColor}`}} 
                  {...props} 
                  src={cacheBustedSrc}
                />
                <PageBreakSuggestion />
              </>
            );
          },
          hr: ({node, ...props}) => <><hr style={{border: 0, borderTop: `1px solid #cbd5e1`, margin: '32px 0'}} {...props} /><PageBreakSuggestion /></>,
          table: ({node, ...props}) => <><table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: `1px solid ${styles.borderColor}`}} {...props} /><PageBreakSuggestion /></>,
          th: ({node, ...props}) => <th style={{border: `1px solid ${styles.borderColor}`, padding: '10px 12px', backgroundColor: styles.codeBg, fontWeight: '600', textAlign: 'left', fontFamily: `'Poppins', 'Helvetica', 'Arial', sans-serif`}} {...props} />,
          td: ({node, ...props}) => <td style={{border: `1px solid ${styles.borderColor}`, padding: '10px 12px'}} {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};