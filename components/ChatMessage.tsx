import React, { useState, FC, memo, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import { useTheme } from '../contexts/ThemeContext';
import { useLocale } from '../contexts/LocaleContext';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';
import { AudioPlayer } from './AudioPlayer';
import { YouTubePlayer } from './YouTubePlayer';
import { VideoSearchResults } from './VideoSearchResults';
import { ArVrModelViewer } from './ArVrModelViewer';

import { Role, Message, GroundingChunk, SlideAnimation, PresentationTheme, Slide, TextElement, ContentElement } from '../types';
import { UserIcon, BotIcon, CopyIcon, CheckIcon, ChevronDownIcon, ImageIcon, ThumbsUpIcon, ThumbsDownIcon, Volume2Icon, VolumeXIcon, DownloadIcon, SearchIcon, LoadingSpinner, PencilIcon, ZapIcon, RefreshCcwIcon, FileTextIcon, MoreHorizontalIcon, InfoIcon, ChevronLeftIcon, ChevronRightIcon, CodeIcon, SheetIcon, PresentationIcon, FilmIcon, ClipboardCheckIcon, CubeIcon, WordFileIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { AnalysisIndicator } from './AnalysisIndicator';

// Helper hook to get the previous value of a prop or state.
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface ChatMessageProps {
  message: Message;
  isEditing: boolean;
  isLoading: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (newContent: string) => void;
  onRegenerate: () => void;
  isLastModelMessage: boolean;
  onExportMessageAsPdf: (content: string, messageId: string) => void;
  onVersionChange: (messageId: string, newIndex: number) => void;
}

const ImageGenerationLoader: FC = () => {
    const { t } = useLocale();
    return (
        <div className="w-64 h-64 bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center justify-center p-4 animate-pulse mt-2">
            <div className="flex flex-col items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                <ImageIcon className="w-10 h-10" />
                <p className="text-sm font-medium">{t('generatingImage')}</p>
            </div>
        </div>
    );
};

const Generating3dModelLoader: FC = () => {
    const { t } = useLocale();
    return (
        <div className="w-64 h-64 bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center justify-center p-4 animate-pulse mt-2">
            <div className="flex flex-col items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                <CubeIcon className="w-10 h-10" />
                <p className="text-sm font-medium">{t('generating3dModel')}</p>
            </div>
        </div>
    );
};

const VideoGenerationLoader: FC<{ status: string }> = ({ status }) => {
    const { t } = useLocale();
    return (
        <div className="w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex flex-col items-center justify-center gap-4 p-6 border border-base-300 dark:border-dark-base-200">
            <FilmIcon className="w-12 h-12 text-brand-primary animate-pulse-fast" />
            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary text-center">{status || t('generatingVideo')}</p>
            <div className="w-full bg-base-300 dark:bg-dark-base-300 rounded-full h-2 overflow-hidden">
                <div className="bg-brand-primary h-2 rounded-full w-full animate-shimmer"></div>
            </div>
        </div>
    );
};

const ApiKeyPrompt: FC<{ onSelectKey: () => void }> = ({ onSelectKey }) => {
    const { t } = useLocale();

    return (
        <div className="w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex flex-col items-center justify-center gap-4 p-6 border border-yellow-500/50">
            <ZapIcon className="w-12 h-12 text-yellow-500" />
            <h4 className="font-semibold text-text-primary dark:text-dark-text-primary">{t('apiKeyRequiredTitle')}</h4>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary text-center">{t('apiKeyRequiredDescription')}</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                <button
                    onClick={onSelectKey}
                    className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95"
                >
                    {t('selectApiKey')}
                </button>
                <a
                    href="https://ai.google.dev/gemini-api/docs/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-primary hover:underline"
                >
                    {t('billingInfo')}
                </a>
            </div>
        </div>
    );
};

const PdfGenerationLoader: FC<{ filename: string }> = ({ filename }) => {
    const { t } = useLocale();
    return (
        <div className="relative overflow-hidden w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-shimmer">
            <FileTextIcon className="w-10 h-10 text-red-500/50 flex-shrink-0" />
            <div className="overflow-hidden">
                <p className="text-sm font-semibold text-text-primary/50 dark:text-dark-text-primary/50 truncate">{filename}</p>
                <p className="text-xs text-text-secondary/50 dark:text-dark-text-secondary/50">{t('generatingPdf')}</p>
            </div>
        </div>
    );
};

const PdfResultCard: FC<{ file: NonNullable<Message['pdfFile']> }> = ({ file }) => {
    const { t } = useLocale();
    const { addToast } = useToast();

    const handleDownload = () => {
        try {
            const link = document.createElement('a');
            link.href = file.dataUrl;
            link.download = file.filename || 'universum_document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addToast(t('exportSuccess'), 'success');
        } catch (e) {
            console.error("PDF download failed:", e);
            addToast(t('pdfGenerationError'), 'error');
        }
    };

    return (
        <div className="w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-fade-in">
            <FileTextIcon className="w-10 h-10 text-red-500 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate" title={file.filename}>{file.filename}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('pagesCount', file.pageCount)}</p>
            </div>
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95"
                title={t('downloadFile')}
            >
                <DownloadIcon className="w-4 h-4" />
                <span>{t('download')}</span>
            </button>
        </div>
    );
};

const SpreadsheetGenerationLoader: FC<{ filename: string; sheetCount: number }> = ({ filename, sheetCount }) => {
    const { t } = useLocale();
    return (
        <div className="relative overflow-hidden w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-shimmer">
            <SheetIcon className="w-10 h-10 text-green-500/50 flex-shrink-0" />
            <div className="overflow-hidden">
                <p className="text-sm font-semibold text-text-primary/50 dark:text-dark-text-primary/50 truncate">{filename}</p>
                <p className="text-xs text-text-secondary/50 dark:text-dark-text-secondary/50">{t('generatingSheets', sheetCount)}</p>
            </div>
        </div>
    );
};

const PresentationGenerationLoader: FC<{ filename: string; slideCount: number }> = ({ filename, slideCount }) => {
    const { t } = useLocale();
    return (
        <div className="relative overflow-hidden w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-shimmer">
            <PresentationIcon className="w-10 h-10 text-orange-500/50 flex-shrink-0" />
            <div className="overflow-hidden">
                <p className="text-sm font-semibold text-text-primary/50 dark:text-dark-text-primary/50 truncate">{filename}</p>
                <p className="text-xs text-text-secondary/50 dark:text-dark-text-secondary/50">{t('generatingSlides', slideCount)}</p>
            </div>
        </div>
    );
};

const PresentationImageGenerationLoader: FC<{ filename: string; slideCount: number }> = ({ filename, slideCount }) => {
    const { t } = useLocale();
    return (
        <div className="relative overflow-hidden w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-shimmer">
            <ImageIcon className="w-10 h-10 text-purple-500/50 flex-shrink-0" />
            <div className="overflow-hidden">
                <p className="text-sm font-semibold text-text-primary/50 dark:text-dark-text-primary/50 truncate">{filename}</p>
                <p className="text-xs text-text-secondary/50 dark:text-dark-text-secondary/50">{t('generatingPresentationImages')}</p>
            </div>
        </div>
    );
};

const WordGenerationLoader: FC<{ filename: string }> = ({ filename }) => {
    const { t } = useLocale();
    return (
        <div className="relative overflow-hidden w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-shimmer">
            <WordFileIcon className="w-10 h-10 text-blue-500/50 flex-shrink-0" />
            <div className="overflow-hidden">
                <p className="text-sm font-semibold text-text-primary/50 dark:text-dark-text-primary/50 truncate">{filename}</p>
                <p className="text-xs text-text-secondary/50 dark:text-dark-text-secondary/50">{t('generatingWord')}</p>
            </div>
        </div>
    );
};

const WordResultCard: FC<{ file: NonNullable<Message['wordFile']> }> = ({ file }) => {
    const { t } = useLocale();
    const { addToast } = useToast();

    const handleDownload = () => {
        try {
            const url = URL.createObjectURL(file.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.filename || 'universum_document.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast(t('exportSuccess'), 'success');
        } catch (e) {
            console.error("Word download failed:", e);
            addToast(t('wordGenerationError'), 'error');
        }
    };

    return (
        <div className="w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-fade-in">
            <WordFileIcon className="w-10 h-10 text-blue-500 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate" title={file.filename}>{file.filename}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('wordDocument')}</p>
            </div>
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95"
                title={t('downloadFile')}
            >
                <DownloadIcon className="w-4 h-4" />
                <span>{t('download')}</span>
            </button>
        </div>
    );
};

const SpreadsheetResultCard: FC<{ file: NonNullable<Message['spreadsheetFile']> }> = ({ file }) => {
    const { t } = useLocale();
    const { addToast } = useToast();

    const handleDownload = () => {
        try {
            const workbook = XLSX.utils.book_new();
            file.data.sheets.forEach((sheetData, index) => {
                const isNewFormat = !!(sheetData as any).data;

                if (isNewFormat) {
                    const worksheet: XLSX.WorkSheet = {};
                    const data = (sheetData as any).data || [];
                    
                    let headerRows = 0;
                    if (data.length > 0) {
                        const firstCell = data[0][0];
                        if (typeof firstCell === 'object' && firstCell?.style?.font?.bold) {
                            headerRows = (data.length > 1 && Array.isArray(data[1]) && data[1].length === 0) ? 3 : 1;
                        }
                    }

                    data.forEach((row: any[], r: number) => {
                        if (!Array.isArray(row)) return;
                        row.forEach((cell: any, c: number) => {
                            if (cell === null || cell === undefined) return;

                            const cellAddress = XLSX.utils.encode_cell({ r, c });
                            let cellObject: XLSX.CellObject = {};

                            if (typeof cell === 'object' && cell !== null) {
                                if (cell.value === undefined && cell.formula === undefined) {
                                    return;
                                }

                                cellObject.v = cell.value;
                                if (cell.formula) cellObject.f = cell.formula;

                                if (cell.value === null || cell.value === undefined) {
                                    if (cell.formula) {
                                        delete cellObject.v;
                                        cellObject.t = 'n';
                                    } else {
                                        return;
                                    }
                                } else if (typeof cell.value === 'number') {
                                    cellObject.t = 'n';
                                } else if (typeof cell.value === 'boolean') {
                                    cellObject.t = 'b';
                                } else if (cell.value instanceof Date) {
                                    cellObject.t = 'd';
                                } else {
                                    cellObject.t = 's';
                                }
                                
                                const style: XLSX.CellStyle = {};
                                if (cell.style) {
                                    const s = cell.style;
                                    if (s.font) {
                                        if (typeof s.font === 'object') {
                                            style.font = { ...s.font };
                                            if (style.font.color && typeof style.font.color === 'object' && style.font.color.rgb) {
                                                style.font.color.rgb = style.font.color.rgb.replace('#','');
                                            }
                                        } else if (s.font === 'bold' || s.font === 'italic') {
                                            style.font = { bold: s.font === 'bold', italic: s.font === 'italic' };
                                        }
                                    }
                                    if (s.textColor) {
                                        if (!style.font) style.font = {};
                                        (style.font as any).color = { rgb: s.textColor.replace('#','') };
                                    }
                                    if (s.alignment) {
                                        style.alignment = { ...s.alignment };
                                    } else if (s.align || s.wrapText) {
                                        style.alignment = {};
                                        if (s.align) (style.alignment as any).horizontal = s.align;
                                        if (s.wrapText) (style.alignment as any).wrapText = true;
                                    }
                                    if (s.fill) {
                                        style.fill = { ...s.fill, patternType: 'solid' };
                                        if (style.fill.fgColor && typeof style.fill.fgColor === 'object' && style.fill.fgColor.rgb) {
                                            style.fill.fgColor.rgb = style.fill.fgColor.rgb.replace('#','');
                                        }
                                    } else if (s.bgColor) {
                                        style.fill = { fgColor: { rgb: s.bgColor.replace('#','') }, patternType: 'solid' };
                                    }
                                    if (s.border) {
                                        style.border = { ...s.border };
                                    }
                                }
                                
                                const formatMap: { [key: string]: string } = { 'currency_usd': '$#,##0.00', 'currency_eur': '€#,##0.00', 'percent': '0.00%', 'date_mdy': 'm/d/yy', 'date_dmy': 'd/m/yy' };
                                if (cell.format && formatMap[cell.format as string]) {
                                    style.numFmt = formatMap[cell.format as string];
                                    if ((cell.format as string).startsWith('date')) cellObject.t = 'd';
                                }

                                if (Object.keys(style).length > 0) cellObject.s = style;
                            } else {
                                cellObject.v = cell;
                                if (typeof cell === 'number') { cellObject.t = 'n'; } 
                                else if (typeof cell === 'boolean') { cellObject.t = 'b'; }
                                else { cellObject.t = 's'; }
                            }
                            worksheet[cellAddress] = cellObject;
                        });
                    });
                    
                    if (data.length > 0) {
                        const maxCols = data.reduce((max: number, row: any[]) => Math.max(max, row.length), 0);
                        worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: maxCols > 0 ? maxCols - 1 : 0 } });
                    }

                    if ((sheetData as any).merges) worksheet['!merges'] = (sheetData as any).merges.map((range: string) => XLSX.utils.decode_range(range));
                    if ((sheetData as any).columnWidths) worksheet['!cols'] = (sheetData as any).columnWidths.map((wch: number) => ({ wch }));

                    if (headerRows > 0 && worksheet['!ref']) {
                        worksheet['!view'] = { state: 'frozen', ySplit: headerRows };
                        const range = XLSX.utils.decode_range(worksheet['!ref']);
                        range.s.r = headerRows - 1;
                        worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
                    }
                    XLSX.utils.book_append_sheet(workbook, worksheet, (sheetData as any).sheetName || `Sheet${index + 1}`);

                } else {
                    const sheet = sheetData as { sheetName: string; headers: string[]; rows: any[][] };
                    const hasRows = sheet.rows && sheet.rows.length > 0;
                    const isJsonData = hasRows && typeof sheet.rows[0] === 'object' && sheet.rows[0] !== null && !Array.isArray(sheet.rows[0]);

                    let worksheet;
                    let dataForWidths: (string|number|boolean|Date|null)[][] = [];

                    if (isJsonData) {
                        worksheet = XLSX.utils.json_to_sheet(sheet.rows as any[], { header: sheet.headers });
                        dataForWidths = [
                            sheet.headers,
                            ...sheet.rows.map(row => sheet.headers.map(header => (row as any)[header]))
                        ];
                    } else {
                        const aoaData = [sheet.headers, ...(sheet.rows || [])];
                        worksheet = XLSX.utils.aoa_to_sheet(aoaData);
                        dataForWidths = aoaData;
                    }

                    if (dataForWidths.length > 0) {
                        const colWidths = dataForWidths[0].map((_, i) => {
                            const maxWidth = dataForWidths.reduce((w, r) => {
                                const cellContent = r[i] ? String(r[i]) : "";
                                return Math.max(w, cellContent.length);
                            }, 0);
                            return { wch: Math.max(10, maxWidth + 2) };
                        });
                        worksheet['!cols'] = colWidths;
                    }
                    
                    worksheet['!view'] = { state: 'frozen', ySplit: 1 };
                    
                    if (worksheet['!ref']) {
                        worksheet['!autofilter'] = { ref: worksheet['!ref'] };
                    }
                    
                    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName || `Sheet${index + 1}`);
                }
            });
            
            XLSX.writeFile(workbook, file.filename || 'universum_spreadsheet.xlsx');
            addToast(t('exportSuccess'), 'success');
        } catch (e) {
            console.error("Spreadsheet download failed:", e);
            addToast(t('spreadsheetGenerationError'), 'error');
        }
    };
    
    const sheetCount = file.data.sheets.length;

    return (
        <div className="w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-fade-in">
            <SheetIcon className="w-10 h-10 text-green-500 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate" title={file.filename}>{file.filename}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('sheetsCount', sheetCount)}</p>
            </div>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95"
                title={t('downloadFile')}
            >
                <DownloadIcon className="w-4 h-4" />
                <span>{t('download')}</span>
            </button>
        </div>
    );
};

const PresentationResultCard: FC<{ file: NonNullable<Message['presentationFile']> }> = ({ file }) => {
    const { t } = useLocale();
    const { addToast } = useToast();

    const handleDownload = () => {
        try {
            const sanitizeColor = (color?: string): string => (color || '000000').replace('#', '');
            
            const mapAnimationType = (type?: SlideAnimation['type']): 'none' | 'fadeIn' | 'fly' | 'slide' => {
                switch(type) {
                    case 'slideIn': return 'slide';
                    case 'flyIn': return 'fly';
                    case 'fadeIn': return 'fadeIn';
                    default: return 'none';
                }
            };

            const pptx = new PptxGenJS();

            pptx.layout = 'LAYOUT_WIDE';
            pptx.author = 'Universum AI';
            pptx.company = 'Powered by Gemini';
            pptx.title = file.filename;

            const theme = file.data.theme;
            const titleOptions: PptxGenJS.TextPropsOptions = {
                fontFace: theme.titleFontFace || 'Arial',
                color: sanitizeColor(theme.textColor),
                align: 'center',
                bold: true,
            };

            const bodyOptions: PptxGenJS.TextPropsOptions = {
                fontFace: theme.bodyFontFace || 'Calibri',
                color: sanitizeColor(theme.textColor),
            };

            const getBackgroundProps = (slide: Slide): PptxGenJS.SlideMasterProps => {
                const bg = slide.background || theme.background;
                if (bg?.gradient) {
                    return {
                        background: {
                            path: 'linear',
                            angle: bg.gradient.angle || 45,
                            colors: [
                                { color: sanitizeColor(bg.gradient.colors[0]), offset: 0 },
                                { color: sanitizeColor(bg.gradient.colors[1]), offset: 100 }
                            ]
                        }
                    };
                }
                if (bg?.color) {
                    return { bkgd: sanitizeColor(bg.color) };
                }
                return {};
            };

            file.data.slides.forEach((slideData, index) => {
                const sectionName = `Slide ${index + 1}`;
                pptx.addSection({ title: sectionName });
                let slide = pptx.addSlide({ sectionTitle: sectionName, ...getBackgroundProps(slideData) });
                
                const addAnimatedText = (
                    slide: PptxGenJS.Slide,
                    text: string,
                    options: PptxGenJS.TextPropsOptions,
                    animation?: SlideAnimation
                ) => {
                    if (animation) {
                        const animOpts = {
                            effect: mapAnimationType(animation.type), 
                            delay: animation.delay || 0,
                            duration: animation.duration || 1,
                        };
                         slide.addText(text, { ...options, anim: animOpts });
                    } else {
                         slide.addText(text, options);
                    }
                };
                
                if (slideData.title?.text) {
                    addAnimatedText(slide, slideData.title.text, { ...titleOptions, x: '5%', y: '5%', w: '90%', h: '15%', fontSize: 32 }, slideData.title.animation);
                }

                const contentX = '10%';
                const contentY = '25%';
                const contentW = '80%';
                const contentH = '65%';

                if (slideData.layout === 'title_and_content' && slideData.content) {
                    slide.addText(slideData.content.items.join('\n'), { ...bodyOptions, x: contentX, y: contentY, w: contentW, h: contentH, bullet: slideData.content.type === 'bullet', fontSize: 18 });
                } else if (slideData.layout === 'content_left_image_right' && slideData.content && slideData.image?.data) {
                    slide.addText(slideData.content.items.join('\n'), { ...bodyOptions, x: '5%', y: contentY, w: '40%', h: contentH, bullet: slideData.content.type === 'bullet' });
                    slide.addImage({ data: `base64,${slideData.image.data}`, x: '50%', y: contentY, w: '45%', h: '60%' });
                } else if (slideData.layout === 'image_left_content_right' && slideData.content && slideData.image?.data) {
                    slide.addImage({ data: `base64,${slideData.image.data}`, x: '5%', y: contentY, w: '45%', h: '60%' });
                    slide.addText(slideData.content.items.join('\n'), { ...bodyOptions, x: '55%', y: contentY, w: '40%', h: contentH, bullet: slideData.content.type === 'bullet' });
                } else if (slideData.layout === 'image_only' && slideData.image?.data) {
                     slide.addImage({ data: `base64,${slideData.image.data}`, x: '5%', y: '5%', w: '90%', h: '90%' });
                } else if (slideData.layout === 'table_of_contents' && slideData.content) {
                    slide.addText(slideData.content.items.join('\n'), { ...bodyOptions, x: contentX, y: contentY, w: contentW, h: contentH, bullet: true, fontSize: 20 });
                }
            });

            pptx.writeFile({ fileName: file.filename });
            addToast(t('exportSuccess'), 'success');

        } catch (e) {
            console.error("Presentation download failed:", e);
            addToast(t('presentationGenerationError'), 'error');
        }
    };

    const slideCount = file.data.slides.length;

    return (
        <div className="w-full max-w-sm bg-base-200 dark:bg-dark-base-200 rounded-lg flex items-center gap-4 p-4 border border-base-300 dark:border-dark-base-200 animate-fade-in">
            <PresentationIcon className="w-10 h-10 text-orange-500 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate" title={file.filename}>{file.filename}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{t('slidesCount', slideCount)}</p>
            </div>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95"
                title={t('downloadFile')}
            >
                <DownloadIcon className="w-4 h-4" />
                <span>{t('download')}</span>
            </button>
        </div>
    );
};

const UserMessageContent: FC<{ message: Message; isEditing: boolean; onSaveEdit: (newContent: string) => void; onCancelEdit: () => void; }> = ({ message, isEditing, onSaveEdit, onCancelEdit }) => {
    const [editText, setEditText] = useState(message.contentHistory[message.activeVersionIndex]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { t } = useLocale();

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    useLayoutEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 208; // 13rem
            
            if (scrollHeight > maxHeight) {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.height = `${scrollHeight}px`;
                textarea.style.overflowY = 'hidden';
            }
        }
    }, [isEditing, editText]);
    
    const handleSave = () => {
        if (editText.trim()) {
            onSaveEdit(editText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            onCancelEdit();
        }
    };

    if (isEditing) {
        return (
             <div className="w-full">
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 rounded-lg bg-base-200 dark:bg-dark-base-200 text-text-primary dark:text-dark-text-primary border border-transparent focus:outline-none resize-none animate-editing-glow"
                    aria-label={t('editMessage')}
                />
                <div className="flex justify-end items-center gap-2 mt-2">
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary mr-2">{t('editInstruction')}</p>
                    <button onClick={onCancelEdit} className="px-4 py-1.5 text-sm font-semibold rounded-lg hover:bg-base-300 dark:hover:bg-dark-base-200/50 transition-colors">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-1.5 text-sm font-semibold rounded-lg text-white bg-brand-primary hover:opacity-90 transition-opacity active:scale-95">{t('saveAndSend')}</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="prose prose-sm prose-invert max-w-none break-words">
            {message.imagesData && message.imagesData.map((img, index) => (
                <img key={index} src={`data:${img.mimeType};base64,${img.data}`} alt={t('userUpload')} className="max-w-xs rounded-lg mt-2" />
            ))}
             {message.audioData && <AudioPlayer src={`data:${message.audioData.mimeType};base64,${message.audioData.data}`} fileName={message.audioData.name} />}
             {message.textAttachment && (
                 <div className="p-3 my-2 bg-black/10 rounded-lg border border-white/20">
                     <p className="font-bold text-sm">{message.textAttachment.title}</p>
                     <p className="text-xs text-white/80 mt-1 max-h-24 overflow-hidden text-ellipsis">{message.textAttachment.content}</p>
                 </div>
             )}
            <ReactMarkdown>
                {message.contentHistory[message.activeVersionIndex]}
            </ReactMarkdown>
        </div>
    );
};

interface ModelMessageContentProps {
    message: Message;
    isLastModelMessage: boolean;
    onRegenerate: () => void;
}

const ModelMessageContent: FC<ModelMessageContentProps> = memo(({ message, isLastModelMessage, onRegenerate }) => {
  const { theme } = useTheme();
  const { t } = useLocale();
  const [copiedStates, setCopiedStates] = useState<{[key: number]: boolean}>({});
  const [animatedContent, setAnimatedContent] = useState('');
  const animationTimeoutRef = useRef<number | null>(null);

  // Track if the message was previously in an 'analyzing' state.
  const wasAnalyzing = usePrevious(message.analysisState);

  const activeContent = message.contentHistory[message.activeVersionIndex] || '';

  // Animate only if it's the last message AND it just transitioned from an analyzing state to a final content state.
  // This prevents animation on loading old chats.
  const shouldAnimate = isLastModelMessage && !!wasAnalyzing && !message.analysisState && !message.isTyping && activeContent && !message.imagesData && !message.videoData && !message.spreadsheetFile && !message.presentationFile && !message.codeBlock && !message.isGeneratingImage && !message.isGeneratingVideo && !message.videoSearchResults;

  useEffect(() => {
    if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
    }

    if (shouldAnimate) {
        const words = activeContent.split(/(\s+)/);
        let i = 0;
        const type = () => {
            if (i < words.length) {
                setAnimatedContent(prev => prev + words[i]);
                i++;
                animationTimeoutRef.current = window.setTimeout(type, 50); // 50ms per word/space
            } else {
                setAnimatedContent(activeContent);
            }
        };
        
        setAnimatedContent('');
        type();
    } else {
        setAnimatedContent(activeContent);
    }
    
    return () => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
    };
    
  }, [activeContent, shouldAnimate]);


  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedStates(prev => ({...prev, [index]: true}));
    setTimeout(() => setCopiedStates(prev => ({...prev, [index]: false})), 2000);
  };
  
  const handleSelectKey = async () => {
    if (!window.aistudio) return;
    try {
        await window.aistudio.openSelectKey();
        onRegenerate();
    } catch (e) {
        console.error("openSelectKey failed", e);
    }
  };

  if (message.requiresApiKeySelection) {
      return <ApiKeyPrompt onSelectKey={handleSelectKey} />;
  }
  
  if (message.analysisState) {
      return <AnalysisIndicator analysisState={message.analysisState} />
  }

  if (message.isTyping) {
    return (
        <div className="flex items-center gap-1.5 p-2">
            <div className="w-2 h-2 bg-text-secondary/50 dark:bg-dark-text-secondary/50 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-text-secondary/50 dark:bg-dark-text-secondary/50 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-text-secondary/50 dark:bg-dark-text-secondary/50 rounded-full animate-pulse"></div>
        </div>
    );
  }
  if (message.isGeneratingVideo) {
    return <VideoGenerationLoader status={message.videoGenerationStatus || t('generatingVideo')} />;
  }
   if (message.isGeneratingPdf && message.pdfData) {
      return <PdfGenerationLoader filename={message.pdfData.filename} />;
  }
  if (message.pdfFile) {
      return <PdfResultCard file={message.pdfFile} />;
  }
  if (message.isGeneratingSpreadsheet && message.spreadsheetData) {
      return <SpreadsheetGenerationLoader {...message.spreadsheetData} />;
  }
  if (message.spreadsheetFile) {
      return <SpreadsheetResultCard file={message.spreadsheetFile} />
  }
   if (message.isGeneratingPresentation && message.presentationData) {
      return <PresentationGenerationLoader {...message.presentationData} />;
  }
  if (message.isGeneratingPresentationImages && message.presentationData) {
      return <PresentationImageGenerationLoader {...message.presentationData} />;
  }
  if (message.presentationFile) {
      return <PresentationResultCard file={message.presentationFile} />;
  }
  if (message.isGeneratingWord && message.wordData) {
    return <WordGenerationLoader filename={message.wordData.filename} />;
  }
  if (message.wordFile) {
      return <WordResultCard file={message.wordFile} />;
  }
   if (message.isGeneratingCode) {
      return <div className="flex items-center gap-2"><LoadingSpinner className="w-5 h-5" /><span className="text-sm font-medium">{t('generatingCode')}</span></div>;
  }
  if (message.isGenerating3dModel) {
    return <Generating3dModelLoader />;
  }
  
  const isAnimating = shouldAnimate && animatedContent !== activeContent;
  const markdownContent = isAnimating ? animatedContent + '▍' : animatedContent;

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      {message.videoSearchResults && message.videoSearchResults.length > 0 && (
          <VideoSearchResults results={message.videoSearchResults} />
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ node, ...props }) => {
            const href = props.href || '';
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
            const match = href.match(youtubeRegex);

            if (match && match[1]) {
              return <YouTubePlayer videoId={match[1]} />;
            }
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          div({ className, children, ...props }) {
            if (className === 'math math-display') {
                return (
                    <div className="math-on-stripe my-4 p-4 bg-base-100 dark:bg-base-200 rounded-lg shadow-inner overflow-x-auto">
                        <div className={className} {...props}>
                            {children}
                        </div>
                    </div>
                );
            }
            return <div className={className} {...props}>{children}</div>;
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, '');
            const index = Number(node?.position?.start.line) || 0;

            if (match) {
              return (
                <div className="my-4 rounded-lg border border-base-300 dark:border-dark-base-200 bg-base-100 dark:bg-dark-base-300">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-base-200 dark:bg-dark-base-200/50 border-b border-base-300 dark:border-dark-base-200">
                    <span className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">{match[1]}</span>
                    <button onClick={() => handleCopy(codeString, index)} className="p-1 rounded-md text-text-secondary dark:text-dark-text-secondary hover:bg-base-300 dark:hover:bg-dark-base-200/50">
                        {copiedStates[index] ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4"/>}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={theme === 'dark' ? vscDarkPlus : materialLight}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      backgroundColor: 'transparent',
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return <code className="bg-base-200 dark:bg-dark-base-200 text-text-primary dark:text-dark-text-primary px-1.5 py-0.5 rounded-md" {...props}>{children}</code>;
          },
          table: ({node, ...props}) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-base-300 dark:border-dark-base-200">
                <table className="w-full text-sm text-left" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-base-200 dark:bg-dark-base-200 text-xs uppercase tracking-wider" {...props} />,
          tr: ({node, ...props}) => <tr className="border-b border-base-200 dark:border-dark-base-200 last:border-b-0 hover:bg-base-200/50 dark:hover:bg-dark-base-200/50" {...props} />,
          th: ({node, ...props}) => <th className="p-3 font-bold" {...props} />,
          td: ({node, ...props}) => <td className="p-3" {...props} />,
        }}
      >
        {markdownContent}
      </ReactMarkdown>
      {message.isGeneratingImage && <ImageGenerationLoader />}
      {message.imagesData && message.imagesData.map((img, index) => (
        <div key={index} className="relative group">
            <img src={`data:${img.mimeType};base64,${img.data}`} alt={t('generatedImage')} className="max-w-sm rounded-lg mt-2" />
            <a href={`data:${img.mimeType};base64,${img.data}`} download={`universum-image-${message.id}-${index}.jpg`} className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <DownloadIcon className="w-5 h-5" />
            </a>
        </div>
      ))}
       {message.videoData && (
        <div className="mt-2">
            <video
                controls
                src={message.videoData.url}
                className="max-w-sm rounded-lg"
            >
                Your browser does not support the video tag.
            </video>
        </div>
       )}
       {message.codeBlock && <InteractiveCodeBlock initialCode={message.codeBlock.code} />}
       {message.model3dData && (
            <div className="mt-4">
                <h4 className="font-semibold mb-2 text-text-primary dark:text-dark-text-primary">{t('model3dReady')}</h4>
                <ArVrModelViewer modelUrl={message.model3dData.url} />
            </div>
        )}
    </div>
  );
});

const GroundingSources: FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => {
    const { t } = useLocale();
    if (chunks.length === 0) return null;
    return (
        <div className="mt-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                <SearchIcon className="w-4 h-4"/>
                {t('sources')}
            </h4>
            <div className="flex flex-wrap gap-2">
                {chunks.map((chunk, index) => chunk.web?.uri && (
                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-1.5 text-xs bg-base-200/80 dark:bg-dark-base-200/50 hover:bg-base-300 dark:hover:bg-dark-base-200/80 px-2 py-1 rounded-full transition-colors">
                        <span className="truncate max-w-xs">{chunk.web.title || chunk.web.uri}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export const ChatMessage: FC<ChatMessageProps> = memo(({ message, isEditing, isLoading, onStartEdit, onCancelEdit, onSaveEdit, onRegenerate, isLastModelMessage, onExportMessageAsPdf, onVersionChange }) => {
  const { t } = useLocale();
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isFeedbackGiven, setIsFeedbackGiven] = useState<'good' | 'bad' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { addToast } = useToast();
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const isUser = message.role === Role.USER;
  const isSystem = message.role === Role.SYSTEM;
  const isCoach = message.role === Role.COACH;

  const handleCopyToClipboard = (textToCopy: string, id: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    addToast(t('copied'), 'success');
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead = message.contentHistory[message.activeVersionIndex];
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = t('speechLangCode');
      utterance.onend = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };
  
  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const handleFeedback = (feedback: 'good' | 'bad') => {
      setIsFeedbackGiven(feedback);
      addToast(t('problemReported'), 'info');
  };

  const hasMultipleVersions = message.contentHistory.length > 1;
  const canGoBack = message.activeVersionIndex > 0;
  const canGoForward = message.activeVersionIndex < message.contentHistory.length - 1;

  if (isSystem) {
      return (
          <div className="flex justify-center animate-message-in">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200 dark:bg-dark-base-200 rounded-lg text-sm text-text-secondary dark:text-dark-text-secondary">
                  <ZapIcon className="w-4 h-4"/>
                  <span>{message.contentHistory[0]}</span>
              </div>
          </div>
      );
  }

  if (isCoach) {
    return (
        <div className="flex justify-center animate-message-in">
            <div className="w-full max-w-2xl p-4 bg-base-200 dark:bg-dark-base-200 rounded-xl border border-brand-primary/20">
                <div className="flex items-center gap-3 mb-3">
                    <ClipboardCheckIcon className="w-6 h-6 text-brand-primary" />
                    <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">{t('dailyCoachTipTitle')}</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.contentHistory[0]}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={`flex w-full animate-message-in ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-start max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'gap-3'}`}>
            
            {!isUser &&
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-base-200 dark:bg-dark-base-300">
                  <BotIcon className="w-5 h-5 text-text-primary dark:text-dark-text-primary" />
              </div>
            }
            
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                    isUser 
                    ? 'bg-brand-primary text-white rounded-br-lg' 
                    : 'bg-base-300 dark:bg-dark-base-200 text-text-primary dark:text-dark-text-primary rounded-bl-lg'
                }`}>
                    {isUser ? (
                        <UserMessageContent message={message} isEditing={isEditing} onSaveEdit={onSaveEdit} onCancelEdit={onCancelEdit} />
                    ) : (
                        <ModelMessageContent message={message} isLastModelMessage={isLastModelMessage} onRegenerate={onRegenerate} />
                    )}
                </div>
                
                <div className="px-1">
                    {message.groundingChunks && <GroundingSources chunks={message.groundingChunks} />}
                    
                    {!isEditing && (
                        <div className={`flex items-center gap-1 mt-2 ${isUser ? 'justify-end' : 'justify-start -ml-2'}`}>
                            {isUser && !isLoading && (
                                <>
                                  {hasMultipleVersions && (
                                      <div className="flex items-center gap-1 p-0.5 bg-base-200 dark:bg-dark-base-200/50 rounded-lg">
                                          <button onClick={() => onVersionChange(message.id, message.activeVersionIndex - 1)} disabled={!canGoBack || isLoading} className="p-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-base-300 dark:hover:bg-dark-base-200" title={t('previousVersion')}>
                                              <ChevronLeftIcon className="w-4 h-4"/>
                                          </button>
                                          <span className="text-xs font-mono text-text-secondary dark:text-dark-text-secondary px-2">{message.activeVersionIndex + 1} / {message.contentHistory.length}</span>
                                          <button onClick={() => onVersionChange(message.id, message.activeVersionIndex + 1)} disabled={!canGoForward || isLoading} className="p-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-base-300 dark:hover:bg-dark-base-200" title={t('nextVersion')}>
                                              <ChevronRightIcon className="w-4 h-4"/>
                                          </button>
                                      </div>
                                  )}
                                  <button onClick={() => handleCopyToClipboard(message.contentHistory[message.activeVersionIndex], 'userMsg')} className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors" title={t('copy')}>
                                      {copiedStates['userMsg'] ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                  </button>
                                  <button onClick={onStartEdit} className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors" title={t('edit')}>
                                      <PencilIcon className="w-4 h-4"/>
                                  </button>
                                </>
                            )}
                            {!isUser && !message.isTyping && !message.analysisState && message.contentHistory[message.activeVersionIndex] && (
                                <>
                                    {hasMultipleVersions && (
                                        <div className="flex items-center gap-1 p-0.5 bg-base-200 dark:bg-dark-base-200/50 rounded-lg">
                                            <button onClick={() => onVersionChange(message.id, message.activeVersionIndex - 1)} disabled={!canGoBack || isLoading} className="p-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-base-300 dark:hover:bg-dark-base-200" title={t('previousVersion')}>
                                                <ChevronLeftIcon className="w-4 h-4"/>
                                            </button>
                                            <span className="text-xs font-mono text-text-secondary dark:text-dark-text-secondary px-2">{message.activeVersionIndex + 1} / {message.contentHistory.length}</span>
                                            <button onClick={() => onVersionChange(message.id, message.activeVersionIndex + 1)} disabled={!canGoForward || isLoading} className="p-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-base-300 dark:hover:bg-dark-base-200" title={t('nextVersion')}>
                                                <ChevronRightIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={() => handleCopyToClipboard(message.contentHistory[message.activeVersionIndex], 'modelMsg')} className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors" title={t('copy')}>
                                        {copiedStates['modelMsg'] ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleFeedback('good')} disabled={!!isFeedbackGiven} className={`p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors disabled:opacity-50 ${isFeedbackGiven === 'good' ? 'text-green-500' : ''}`} title={t('goodRating')}>
                                        <ThumbsUpIcon className="w-4 h-4"/>
                                    </button>
                                     <button onClick={() => handleFeedback('bad')} disabled={!!isFeedbackGiven} className={`p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors disabled:opacity-50 ${isFeedbackGiven === 'bad' ? 'text-red-500' : ''}`} title={t('badRating')}>
                                        <ThumbsDownIcon className="w-4 h-4"/>
                                    </button>
                                     <button onClick={handleTogglePlay} className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors" title={isPlaying ? t('stopReading') : t('readAloud')}>
                                        {isPlaying ? <VolumeXIcon className="w-4 h-4"/> : <Volume2Icon className="w-4 h-4"/>}
                                    </button>
                                    {isLastModelMessage && !isLoading && (
                                        <button onClick={onRegenerate} className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors" title={t('regenerateResponse')}>
                                            <RefreshCcwIcon className="w-4 h-4"/>
                                        </button>
                                    )}
                                    <div className="relative">
                                        <button onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)} className="p-1.5 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-base-200 dark:hover:bg-dark-base-200/50 hover:text-text-primary dark:hover:text-dark-text-primary transition-colors" title={t('moreOptions')}>
                                            <MoreHorizontalIcon className="w-4 h-4"/>
                                        </button>
                                        {isActionsMenuOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-48 bg-base-100 dark:bg-dark-base-300 rounded-lg shadow-lg border border-base-300 dark:border-dark-base-200 z-10 animate-fade-in" style={{animationDuration: '0.1s'}}>
                                                <ul className="py-1">
                                                    <li><button onClick={() => {onExportMessageAsPdf(message.contentHistory[message.activeVersionIndex], message.id); setIsActionsMenuOpen(false);}} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-base-200 dark:hover:bg-dark-base-200/50"><FileTextIcon className="w-4 h-4" />{t('exportAsPdf')}</button></li>
                                                    <li><button onClick={() => {handleFeedback('bad'); setIsActionsMenuOpen(false);}} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-base-200 dark:hover:bg-dark-base-200/50"><InfoIcon className="w-4 h-4"/>{t('reportProblem')}</button></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {message.generationTime && (
                                        <span className="text-xs text-text-secondary dark:text-dark-text-secondary ml-2">
                                            {`${(message.generationTime / 1000).toFixed(2)}s`}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
});