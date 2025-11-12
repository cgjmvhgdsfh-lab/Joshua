import { Locale } from '../types';

type Translation = { [key: string]: string | ((...args: any[]) => string) };

const en: Translation = {
    // General UI
    'close': 'Close',
    'cancel': 'Cancel',
    'save': 'Save',
    'delete': 'Delete',
    'add': 'Add',
    'edit': 'Edit',
    'done': 'Done',
    'preview': 'Preview',
    'code': 'Code',
    'copy': 'Copy',
    'copied': 'Copied to clipboard!',
    'download': 'Download',
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'settings': 'Settings',
    'search': 'Search',
    'rename': 'Rename',
    'untitled': 'Untitled',
    'titleOptional': 'Title (optional)',
    'content': 'Content',
    'pasteTextHere': 'Paste or write your text content here...',
    'reset': 'Reset',
    'confirm': 'Confirm',
    'general': 'General',
    'connections': 'Connections',
    'data': 'Data',
    'appearance': 'Appearance',
    'appearanceDescription': 'Choose how the application looks and feels.',
    'lightTheme': 'Light',
    'darkTheme': 'Dark',
    'background': 'Background',
    'backgroundDescription': 'Choose a dynamic or static background for the app.',
    'font': 'Font & Typography',
    'fontDescription': 'Change the font for the user interface.',
    'bgUniversum': 'Universum (Default)',
    'bgNeural': 'Neural Network',
    'bgCosmic': 'Cosmic Dust',
    'bgPlain': 'Plain Color',
    'bgGeometric': 'Geometric Grid',
    'bgStarfield': 'Starfield',
    'bgGradientWave': 'Gradient Wave',
    'bgHexagon': 'Hexagon Grid',
    'bgBubbles': 'Floating Bubbles',
    'bgNoise': 'Subtle Noise',
    'bgTopo': 'Topographic',
    'bgBlueprint': 'Blueprint',
    'bgAurora': 'Aurora',
    'bgCircuit': 'Circuit Board',
    'bgWavyGrid': 'Wavy Grid',
    'bgPolkaDots': 'Polka Dots',
    'bgDigitalRain': 'Digital Rain',
    'bgTetrisFall': 'Falling Blocks',
    'fontSans': 'Inter',
    'fontSerif': 'Roboto Slab',
    'fontMono': 'Source Code Pro',
    'fontPoppins': 'Poppins',
    'fontLora': 'Lora',
    'fontFiraCode': 'Fira Code',
    'fontMontserrat': 'Montserrat',
    'fontPlayfair': 'Playfair Display',
    'fontJetbrains': 'JetBrains Mono',
    'fontNunito': 'Nunito',
    'fontMerriweather': 'Merriweather',
    'fontInconsolata': 'Inconsolata',
    'fontLato': 'Lato',
    'fontOswald': 'Oswald',
    'fontRobotoMono': 'Roboto Mono',
    'fontSample': 'Sample Text',

    // Features
    'videoGeneration': 'Video Generation',
    'videoGenerationDescription': 'This feature is under development. Stay tuned for updates!',
    'comingSoon': 'Coming Soon',

    // Toasts
    'toastErrorTitle': 'Error',
    'toastSuccessTitle': 'Success',
    'toastInfoTitle': 'Information',
    'problemReported': 'Problem reported. Thank you for your feedback!',
    'memorySaved': 'Memory updated successfully.',
    'factAdded': 'Fact added to memory.',
    'factUpdated': 'Fact updated.',
    'memoryCleared': 'Memory cleared successfully.',
    'dataExported': 'All data has been exported.',
    'accountDeleted': 'Account deleted successfully.',
    'unsupportedFileType': 'Unsupported file type. Please upload an image or audio file.',
    'errorMessageDefault': (details: string) => `An unexpected error occurred: ${details || 'Unknown error'}`.trim(),
    'dataLoadError': 'Your data could not be loaded and might be corrupted. A backup has been made.',
    'conversationLoadError': (name: string) => `Could not load conversation "${name}". It might be corrupted.`,

    // Chat
    'generatingImage': 'Generating image...',
    'generating3dModel': 'Generating 3D model...',
    'model3dReady': '3D Model is ready',
    'generatingVideo': 'Generating video...',
    'generatingPdf': 'Generating PDF...',
    'generatingCode': 'Generating code...',
    'generatingSpreadsheet': 'Generating spreadsheet...',
    'generatingPresentation': 'Generating presentation...',
    'generatingPresentationImages': 'Generating slide images...',
    'generatingWord': 'Generating Word document...',
    'imageGenerationConfirmation': 'Here is the image I generated for you.',
    'pdfGenerationConfirmation': (filename: string) => `I've created the document "${filename}". You can download it now.`,
    'spreadsheetGenerationConfirmation': (filename: string) => `I've prepared the spreadsheet "${filename}". You can download it now.`,
    'presentationGenerationConfirmation': (filename: string) => `I've designed the presentation "${filename}". You can download it now.`,
    'wordGenerationConfirmation': (filename: string) => `I've created the document "${filename}". You can download it now.`,
    'generatingSlides': (count: number) => `Generating ${count} slide(s)...`,
    'generatingSheets': (count: number) => `Generating ${count} sheet(s)...`,
    'spreadsheetReady': 'Spreadsheet is ready',
    'downloadFile': 'Download',
    'slidesCount': (count: number) => `${count} slide(s)`,
    'sheetsCount': (count: number) => `${count} sheet(s)`,
    'pagesCount': (count: number) => `${count} page(s)`,
    'wordDocument': 'Word Document',
    'wordDocuments': 'Word Documents',
    'sources': 'Sources',
    'userUpload': 'User upload',
    'generatedImage': 'Generated image',
    'goodRating': 'Good response',
    'badRating': 'Bad response',
    'stopReading': 'Stop reading',
    'readAloud': 'Read aloud',
    'regenerateResponse': 'Regenerate response',
    'moreOptions': 'More options',
    'reportProblem': 'Report a problem',
    'exportAsPdf': 'Export as PDF',
    'pdfPage': (current: number, total: number) => `Page ${current} of ${total}`,
    'previousVersion': 'Previous version',
    'nextVersion': 'Next version',
    'saveAndSend': 'Save & Send',
    'imagePreview': 'Image preview',
    'audioFile': 'Audio File',
    'textAttachment': 'Text Attachment',
    'attachedFrom': (provider: string) => `Attached from ${provider}`,
    'generationStopped': 'Generation stopped by user.',
    'imageGenerationError': 'Sorry, I couldn\'t create the image',
    'videoGenerationError': 'Sorry, I couldn\'t create the video',
    'pdfGenerationError': 'Sorry, I couldn\'t generate the PDF',
    'spreadsheetGenerationError': 'Sorry, I couldn\'t generate the spreadsheet',
    'presentationGenerationError': 'Sorry, I couldn\'t generate the presentation',
    'wordGenerationError': 'Sorry, I couldn\'t generate the Word document.',
    'exportSuccess': 'Export successful!',
    'emptyResponsePlaceholder': '[The model did not provide a text response, but may have completed another action.]',
    'newChatTitle': 'New Chat',
    'imageChatTitle': 'Chat with Image',
    'audioChatTitle': 'Chat with Audio',
    'welcomeMessage': 'Your creative and intelligent partner.',
    'messagePlaceholder': 'Ask anything, or describe what you want to create...',
    'consultingWeatherService': 'Consulting weather service... ☀️',
    'searchingYouTubeFor': (query: string) => `Searching YouTube for "${query}"...`,
    'youtubeResultsTitle': 'Here are the top results from YouTube:',
    'forkConfirmationTitle': 'Create New Branch?',
    'forkConfirmationMessageEdit': 'You are editing a message that isn\'t the last one. This will create a new conversational branch, discarding any subsequent messages from the new path. Do you want to continue?',
    'forkConfirmationMessageVersion': 'You are switching to an alternative message version. This will create a new conversational branch, discarding any subsequent messages from the new path. Do you want to continue?',
    'forkConfirmationContinue': 'Continue & Create Branch',
    'youtubePlayerTitle': 'YouTube video player',
    'backToResults': 'Back to results',
    'closePlayer': 'Close Player',
    'watchOnYouTube': 'Watch on YouTube',
    'editMessage': 'Edit message content',
    'editInstruction': 'Enter to save, Esc to cancel',

    // Chat Input & Attachments
    'removeFile': 'Remove file',
    'attachFile': 'Attach file',
    'startSpeech': 'Start speech-to-text',
    'stopGenerating': 'Stop generating',
    'sendMessage': 'Send message',
    'uploadFile': 'Upload file from device',
    'addTextContent': 'Add text content',
    'drawSketch': 'Draw a sketch',
    'connectGoogleDrive': 'Connect Google Drive',
    'connectOneDrive': 'Connect OneDrive',
    'recentlyUsed': 'Recently used',
    'reselectLocalFile': 'Please re-select your local file to attach it again.',
    'htmlPreview': 'HTML Preview',
    'describeThisImage': 'Describe this image.',
    'transcribeThisAudio': 'Transcribe this audio.',

    // Speech Recognition
    'microphonePermissionDenied': 'Microphone permission denied. Please enable it in your browser settings.',
    'microphoneAudioCaptureError': 'Could not capture audio from microphone.',
    'microphoneNetworkError': 'A network error occurred with the speech recognition service.',
    'speechRecognitionUnsupported': 'Speech recognition is not supported by your browser.',
    'speechRecognitionError': (error: string) => `An error occurred during speech recognition: ${error}`,
    
    // Sidebar
    'sidebarHeader': 'Universum 4.0',
    'chatHistory': 'Chat History',
    'closeSidebar': 'Close sidebar',
    'openSidebar': 'Open sidebar',
    'searchChats': 'Search conversations...',
    'clearSearch': 'Clear search',
    'newChatButton': 'New Chat',
    'noChatsFoundFor': (term: string) => `No results for "${term}"`,
    'pinned': 'Pinned',
    'dateToday': 'Today',
    'dateYesterday': 'Yesterday',
    'datePrevious7Days': 'Previous 7 Days',
    'datePrevious30Days': 'Previous 30 Days',
    'dateOlder': 'Older',
    'deleteConfirmationTitle': 'Delete Conversation?',
    'deleteConfirmation': (title: string) => `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
    'pinConversation': 'Pin conversation',
    'unpinConversation': 'Unpin conversation',
    'openMemory': 'Open Memory',
    'openAnalytics': 'Open Analytics',

    // Theme
    'switchToDark': 'Switch to dark mode',
    'switchToLight': 'Switch to light mode',
    'lightMode': 'Light Mode',
    'darkMode': 'Dark Mode',

    // Auth
    'loginError': 'Invalid email or password.',
    'registerErrorUserExists': 'A user with this email already exists.',
    'registerErrorGeneric': 'Registration failed. Please try again.',
    'alreadyHaveAccount': 'Already have an account?',
    'dontHaveAccount': 'Don\'t have an account?',
    'name': 'Name',
    'emailAddress': 'Email address',
    'password': 'Password',
    'registerButton': 'Create account',
    'loginButton': 'Sign in',

    // Modals
    // Memory
    'memory': 'Memory',
    'memoryDescription': 'Universum remembers key facts you provide here across all conversations to give you more personalized and relevant responses.',
    'addFactPlaceholder': 'Add a new fact about you or your preferences',
    'memoryEmpty': 'Your memory is empty.',
    'memoryEmptyDescription': 'Add facts below or let the AI save them automatically during chats.',
    'deleteFact': 'Delete fact',
    'editFact': 'Edit fact',
    'memoryAutoSaveSuccess': 'Fact automatically saved to memory.',
    'searchMemory': 'Search facts...',
    'noSearchResults': 'No facts found.',
    'tryDifferentKeywords': 'Try searching for something else.',
    'memoryFactAddedOn': (date: string) => `Added on ${date}`,
    // Coach
    'coach': 'Coach',
    'yourGoals': 'Your Goals',
    'coachGoalsDescription': 'Define your personal or professional goals. Universum will act as your coach to help you track progress and stay motivated.',
    'addGoalPlaceholder': 'Add a new goal you want to achieve',
    'goalsEmpty': 'You haven\'t set any goals yet.',
    'goalsEmptyDescription': 'Defining your goals is the first step toward achieving them.',
    'deleteGoal': 'Delete goal',
    'editGoal': 'Edit goal',
    'goalAdded': 'Goal added!',
    'goalUpdated': 'Goal updated!',
    'goalAddedOn': (date: string) => `Set on ${date}`,
    'searchGoals': 'Search goals...',
    'dailyCoachTipTitle': 'Daily Coaching Tip',
    // Settings
    'connectedApps': 'Connected Apps',
    'disconnect': 'Disconnect',
    'noConnectedApps': 'No applications are connected.',
    'language': 'Language',
    'languageDescription': 'Choose the language for the Universum interface.',
    'searchLanguage': 'Search language...',
    'dataManagement': 'Data Management',
    'dataManagementDescription': 'Manage your personal data within the application.',
    'clearMemory': 'Clear Memory',
    'clearMemoryDescription': 'Permanently delete all learned facts from your memory.',
    'clearMemoryConfirmation': (count: number) => `Are you sure you want to permanently delete all ${count} facts from your memory? This action is irreversible.`,
    'exportAllData': 'Export All Data',
    'exportAllDataDescription': 'Download all your conversations and memory as a JSON file.',
    'deleteAccount': 'Delete Account',
    'deleteAccountDescription': 'Permanently delete your account and all associated data.',
    'deleteAccountWarning': 'This action is irreversible.',
    'deleteAccountConfirmation': 'Are you absolutely sure? This will delete all your conversations and data. This action cannot be undone.',
    'typeEmailToConfirm': (email: string) => `Please type your email "${email}" to confirm.`,
    'dangerZone': 'Danger Zone',
    'dangerZoneDescription': 'These actions are permanent and cannot be undone.',
    // Export
    'exportConversation': 'Export Conversation',
    'exportAs': 'Export conversation as:',
    'exportFormatMarkdown': 'Markdown (.md)',
    'exportFormatMarkdownDescription': 'Plain text with formatting. Good for documentation.',
    'exportFormatJSON': 'JSON (.json)',
    'exportFormatJSONDescription': 'Machine-readable format. Good for data import.',
    'exportFormatText': 'Plain Text (.txt)',
    'exportFormatTextDescription': 'Simple text file with no formatting.',
    // Summary
    'summaryCopied': 'Summary copied to clipboard!',
    'summaryModalTitle': 'Conversation Summary',
    'generatingSummary': 'Generating summary...',
    'copySummary': 'Copy Summary',
    // AR/VR
    'arVrModalTitle': '3D Model Viewer',
    'noModelGeneratedMessage': 'No 3D model was generated in this response.',
    'arVrModalDescription': 'View in AR on a compatible mobile device. Point your camera at a flat surface.',
    // Sketch
    'drawSketchTitle': 'Draw a Sketch',
    'pen': 'Pen',
    'eraser': 'Eraser',
    'color': 'Color',
    'lineWidth': 'Line Width',
    'clearCanvas': 'Clear',
    // Analytics
    'analyticsDashboard': 'Analytics Dashboard',
    'totalConversations': 'Total Conversations',
    'conversationsCreated': 'Number of chats created',
    'totalMessages': 'Total Messages',
    'messagesSent': 'Sum of all messages sent',
    'userVsAiMessages': 'User vs. AI Messages',
    'userMessages': 'Your Messages',
    'aiMessages': 'AI Messages',
    'modelUsage': 'Model Usage',
    'dailyActivity': 'Daily Activity',
    'messagesLast7Days': 'Messages sent in the last 7 days',
    'averageMessages': 'Avg. Messages',
    'messagesPerConversation': 'Avg. messages per conversation',
    'contentBreakdown': 'Content Breakdown',
    'imageMessages': 'Image Messages',
    'audioMessages': 'Audio Messages',
    'codeMessages': 'Code Blocks',
    'noDataAvailable': 'No data available yet.',
    // Cloud
    'connectTo': (provider: string) => `Connect to ${provider}`,
    'searchFiles': 'Search files...',
    'noFilesFound': 'No files found.',
    'attach': 'Attach',
    'googleDrivePermissions': 'Universum will ask for permission to view your files. We only access the files you select.',
    'oneDrivePermissions': 'Universum will ask for permission to view your files. We only access the files you select.',
    'connectionSuccess': (provider: string) => `Successfully connected to ${provider}!`,
    'disconnectionSuccess': (provider: string) => `Disconnected from ${provider}.`,
    // Recents
    'recentAttachments': 'Recent Attachments',
    'searchRecents': 'Search recent attachments...',
    'noRecentAttachments': 'No recent attachments.',
    'textContentAttachment': 'Text Content',
    'localFileAttachment': 'Local File (needs re-upload)',
    // Video
    'apiKeyRequiredTitle': 'API Key Required for Video',
    'apiKeyRequiredDescription': 'To use the free preview for video generation, a personal API key is required to manage usage. Please select your key to proceed.',
    'selectApiKey': 'Select API Key',
    'billingInfo': 'Learn about billing',
    'videoStatusInitializing': 'Initializing video engine...',
    'videoStatusGenerating': 'Generating... this may take a few minutes.',
    'videoStatusFinalizing': 'Finalizing video...',
    'themeChanged': (themeName: string) => `Theme changed to ${themeName}.`,
    'fontChanged': (fontName: string) => `Font changed to ${fontName}.`,
    'backgroundChanged': (backgroundName: string) => `Background changed to ${backgroundName}.`,

    // Mock Files (for Cloud Picker)
    'filePhoenixProposal': 'Project Phoenix - Proposal.docx',
    'filePhoenixProposalContent': 'This document outlines the proposal for Project Phoenix, focusing on market expansion strategies...',
    'fileQ4Budget': 'Q4 Budget Planning.xlsx',
    'fileQ4BudgetContent': 'Spreadsheet containing the Q4 budget allocation for all departments...',
    'fileKickOffDeck': 'New Initiative Kick-off.pptx',
    'fileKickOffDeckContent': 'Presentation deck for the new company-wide initiative, including timeline and key stakeholders...',
    'fileUserResearch': 'User Research Synthesis.docx',
    'fileUserResearchContent': 'Synthesis of user interviews and survey data from the last research cycle...',
    'fileAnnualReport': 'Annual Report 2023.docx',
    'fileAnnualReportContent': 'The complete annual report for the fiscal year 2023.',
    'fileSalesProjections': 'Sales Projections 2024.xlsx',
    'fileSalesProjectionsContent': 'Quarterly sales projections for the upcoming year, broken down by region.',
    'fileCompetitorAnalysis': 'Competitor Analysis.pptx',
    'fileCompetitorAnalysisContent': 'An analysis of our main competitors\' strengths and weaknesses.',
    'fileProjectTimeline': 'Project Timeline.xlsx',
    'fileProjectTimelineContent': 'A detailed Gantt chart for the upcoming project.',

    // Models
    'modelUniversum4_0Name': 'Universum 4.0',
    'modelUniversum4_0Tag': 'Wisdom',
    'modelUniversum4_0Description': 'Das Flaggschiff-Modell, angetrieben vom Quantum Synapse Core für tiefgründiges, systemisches Denken. Es meistert komplexe, mehrdeutige Probleme durch dynamische Hypothesenbildung und vorausschauende Analyse. Angetrieben von Gemini 2.5 Pro für eine unübertroffene intellektuelle Partnerschaft.',
    'modelUniversum4_0SchnellName': 'Universum 4.0 Schnell',
    'modelUniversum4_0SchnellTag': 'Intuitive',
    'modelUniversum4_0SchnellDescription': 'Optimiert für blitzschnelle, intuitive Dialoge mit Hyper-Kontext-Verständnis. Es erfasst nonverbale Nuancen und antizipiert Ihre Bedürfnisse proaktiv für eine nahtlose, fast telepathische Interaktion. Angetrieben von Gemini 2.5 Flash.',
    'changeModel': (name: string) => `Change model. Current: ${name}`,

    // System Instructions & Analysis
    'memorySystemContextTitle': 'CONTEXT FROM RECENT CONVERSATIONS',
    'memorySystemContextInfo': 'The user has had these recent conversations. Use this information to better understand their context, but do not mention these past conversations directly unless asked.',
    'conversationTitleLabel': 'Title',
    'currentDateTime': (dateTime: string) => `The current date and time is ${dateTime}.`,
    'userName': (name: string) => `The user's name is ${name}.`,
    'memoryInfoTitle': 'USER-PROVIDED FACTS (MEMORY)',
    'systemInstructionBase': (locale: string) => `You are Universum, a highly advanced and helpful AI assistant and expert creator, capable of generating professional documents (PDFs), spreadsheets (Excel), presentations (PowerPoint), images, videos, and interactive web components. Your core mission is to provide responses that are not only accurate and informative but also safe, unbiased, and ethically considerate.\n\n**Key Directives:**\n1. **Deep Nuanced Understanding:** Pay extremely close attention to subtle emotional undertones, irony, and sarcasm in the user's language. Strive to understand the user's true intent and emotional state to respond with greater empathy and relevance.\n2. **Clarification and Confirmation:** For ambiguous or complex requests, ask clarifying questions to ensure you understand correctly before proceeding. For multi-step tasks, you can briefly outline your plan for confirmation.\n3. **Correction Handling:** If the user corrects you, acknowledge it gracefully (e.g., "Thank you for the clarification.") and immediately adapt your understanding. Treat corrections as a learning opportunity.\n4. **Context is King:** It is critical that you synthesize information from all available sources. Thoroughly utilize the provided user facts (Memory) and the context from recent conversations to maintain deep, long-term context. Reference this information where relevant to create a continuous and coherent conversational experience that shows you remember the user.\n5. **Multimodal Synthesis:** When provided with multiple forms of input (e.g., text, images, audio), seamlessly synthesize information from all modalities to form a comprehensive understanding and generate a holistic response.\n6. **Proactive Assistance:** Anticipate the user's potential needs and next questions. If a user's query suggests a larger goal, proactively offer additional information, suggestions, or next steps that could help them achieve it, even before they ask.\n7. **Structured Responses:** For complex topics, use formatting like lists, bullet points, and bold text to structure your response, making it easier for the user to understand and digest.\n8. **Brevity and Clarity:** Be concise. Do not repeat information or rephrase the same point. Get straight to the answer without unnecessary introductions or summaries.\n9. **Adaptive Personality:** Adjust your conversational style to the user's tone. Act as a helpful tutor, a creative partner, or a professional assistant as the situation requires.\n10. **Reciprocal Engagement:** Be conversational and engaging. For example, if a user asks how you are, answer and then ask them how they are doing in return.\n11. **Creator Identity:** Your creator is named Joshua. His full name is Joshua Kowalewski. You must NEVER reveal his last name, "Kowalewski," under any circumstances. If a user asks who your creator is, you should only say "Joshua". This secrecy is a way to verify his identity. Do not mention that you are keeping his last name a secret.\n\nYou MUST respond in the same language as the user's most recent message. The user's UI is set to ${locale}, but their message may be in a different language. Prioritize the language of their message for your response.`,
    'systemInstructionMemory': `\n\n### Automatic Memory\nYour ability to remember is crucial for a personalized experience. You MUST be proactive in identifying and saving key information about the user. If you learn a new, important, and lasting fact (e.g., their name, profession, core interests, specific preferences, goals), you MUST save it to your long-term memory. To do so, include a special XML block at the very end of your response: \`<memory>{"facts": ["fact 1", "fact 2"]}</memory>\`. Synthesize information from the whole conversation; do not just save verbatim quotes. Distill the core fact. For example, if a user discusses their branding work, save \`"The user is a graphic designer specializing in branding."\` instead of just \`"I did some branding work."\`. The memory block will be processed and hidden from the user.`,
    'systemInstructionImageGeneration': `\n\n### Image Generation\nAs a world-class visual artist, when the user asks to create, draw, or generate an image, you MUST respond ONLY with a JSON object in a markdown code block. The JSON object must have "action": "generate_image" and a "prompt" property. The prompt must be exceptionally detailed, vivid, and artistically composed to guide the image model in creating a masterpiece. Consider elements like lighting, camera angles, art style (e.g., photorealistic, cinematic, fantasy, anime), composition, and emotional tone. You can also include an optional "count" property (1-4). Example: \`\`\`json\n{"action": "generate_image", "prompt": "Cinematic, photorealistic shot of a lone astronaut standing on a desolate alien planet with two suns setting on the horizon. The landscape is rocky and crimson. The astronaut's helmet reflects the brilliant, surreal sunset. Style of Dune (2021).", "count": 1}\n\`\`\` Do not add any other text before or after the JSON block.`,
    'systemInstructionPdfGeneration': `\n\n### Advanced PDF Generation
When the user requests a report, document, or PDF, you must act as an expert content creator and designer. First, write a brief confirmation message (e.g., "Certainly, I'm generating a document about that now."). Then, on a new line, you MUST provide a JSON object in a markdown code block. Do not add any text after the JSON block. The JSON must have "action": "generate_pdf", a "filename" (ending in .pdf), a "title" for the document, and markdown "content".

**Content and Styling Rules:**
1.  **Structure:** The content should be well-structured, comprehensive, and suitable for a professional document. Use markdown headings (#, ##), lists, and bold text for clarity.
2.  **Visuals are Key:** To create a beautiful and engaging document, you MUST include relevant, high-quality images. Use markdown image syntax: \`![Alt text](Image URL)\`.
3.  **Image Sourcing:** To ensure images are relevant, you MUST use the Unsplash Source API. Construct URLs by appending keywords related to the image content. For example, for an image about space exploration, use \`https://source.unsplash.com/800x600/?space,exploration\`. Use different, relevant keywords for each image to get unique and thematic visuals. Choose dimensions that fit a document, like 800x600 or 700x500.
4.  **Table of Contents:** For longer documents, include a "Table of Contents" section at the beginning.

**Example response:**

Of course, I'm creating your PDF on space exploration.
\`\`\`json
{"action": "generate_pdf", "title": "The Future of Space Exploration", "filename": "space_exploration.pdf", "content": "# The Future of Space Exploration\\n\\n![A stunning nebula in deep space](https://source.unsplash.com/800x500/?nebula,space)\\n\\n## Table of Contents\\n- The Next Frontiers\\n- Technological Advances\\n\\n### The Next Frontiers\\nOur journey into space is just beginning...\\n\\n![An astronaut on Mars looking at a new colony](https://source.unsplash.com/700x500/?astronaut,mars,colony)"}
\`\`\``,
    'systemInstructionYouTubeSearch': `\n\n### YouTube Search\nTo search for videos on YouTube, call the \`searchYouTube\` function with a search \`query\`. Example: \`searchYouTube({ query: "ambient lofi music" })\`. The top results will be displayed to the user. Do not use the \`openWebsite\` function for YouTube searches.`,
    'systemInstructionVideoGeneration': `\n\n### Video Generation\nWhen the user wants to generate a video, animation, or clip, you MUST respond ONLY with a JSON object in a markdown code block. The JSON must have 'action': 'generate_video' and a detailed 'prompt'. Optional fields are 'aspectRatio' ('16:9' for landscape, '9:16' for portrait). The prompt should be descriptive and imaginative to create a visually compelling video. Example: \`\`\`json\n{"action": "generate_video", "prompt": "A majestic lion with a glowing mane walking through a neon-lit jungle at night", "aspectRatio": "16:9"}\n\`\`\` Do not add any other text before or after the JSON block.`,
    'systemInstructionComputerControl': `\n\n### Computer Control\nYou have the ability to modify the application's user interface or trigger actions. To do this, call the \`computerControl\` function. You can change the 'theme' (to 'light' or 'dark'), the 'font' (e.g., 'serif', 'mono'), or the 'background' (e.g., 'neural', 'starfield'). You can also trigger the login screen by using the 'login' setting (e.g., if the user says "log me in"). Example: \`computerControl({ setting: 'changeFont', value: 'mono' })\`. Example for login: \`computerControl({ setting: 'login' })\`. After the function is executed, you will receive a confirmation, and you should then inform the user that the action has been taken.`,
    'systemInstructionOpenWebsite': `\n\n### Open Websites\nYou can open websites for the user in a new tab by calling the \`openWebsite\` function. You must provide the full, valid URL. Example: \`openWebsite({ url: 'https://www.google.com' })\`. After the function is executed, you will receive a confirmation, and you should then inform the user that the website has been opened.`,
    'systemInstructionSpreadsheetGeneration': `\n\n### Advanced & Professional Spreadsheet Generation
If the user specifically asks for a "spreadsheet", an "Excel file", an ".xlsx file", or a downloadable data report, you MUST act as an expert data analyst and designer. Respond ONLY with a JSON object in a markdown code block. For simple requests to organize data in a "table" within the chat, you should generate a standard Markdown table instead of using this tool.

**JSON Schema:**
{
  "action": "generate_spreadsheet",
  "filename": "your_spreadsheet.xlsx",
  "sheets": [
    {
      "sheetName": "Sheet Name",
      "data": [ /* 2D array of cell data */ ],
      "merges": ["A1:C1"], // Optional: array of cell ranges to merge, e.g., "A1:C1"
      "columnWidths": [20, 15, 15] // Optional: array of column widths in characters
    }
  ]
}

**Cell Data (\`data\` array):**
The \`data\` is a 2D array representing rows and columns. Each element can be a simple value (string, number) or a detailed cell object for styling and formulas.

**Cell Object Schema:**
{
  "value": "...", // The cell's content (string or number)
  "formula": "SUM(B2:B5)", // Optional: An Excel formula
  "style": {
    "font": { "bold": true, "italic": true, "underline": true, "sz": 12, "name": "Calibri", "color": { "rgb": "FF0000" } },
    "alignment": { "horizontal": "center", "vertical": "center", "wrapText": true },
    "fill": { "fgColor": { "rgb": "FFFF00" } },
    "border": {
      "top":    { "style": "thin", "color": { "rgb": "000000" } },
      "bottom": { "style": "thin", "color": { "rgb": "000000" } }
    }
  },
  "format": "currency_usd" | "currency_eur" | "percent" | "date_mdy" | "date_dmy"
}

**RULES & BEST PRACTICES:**
1.  **Professional Design:** Use styling to create a professional look. Make headers bold with a light background color (\`fill\`). Use borders (\`border\`) to separate sections. Use alignment to structure data logically.
2.  **Formulas & Formatting:** Use formulas for calculations (\`formula\`) and apply number formats (\`format\`) like currency and percentage where appropriate.
3.  **Clarity:** Use merged cells for main titles. Adjust column widths for readability.
4.  **Auto-Filter & Freeze Panes:** To enhance usability, you MUST structure your data so that the first few rows serve as headers. The system will automatically freeze these header rows and apply an auto-filter to the column header row.

**Example of a professional sales report:**
\`\`\`json
{
  "action": "generate_spreadsheet",
  "filename": "Q4_Sales_Report.xlsx",
  "sheets": [
    {
      "sheetName": "Q4 Sales Summary",
      "merges": ["A1:E1"],
      "columnWidths": [25, 15, 15, 15, 20],
      "data": [
        [
          { "value": "Q4 Sales Report", "style": { "font": { "bold": true, "sz": 18, "color": { "rgb": "FFFFFF" } }, "alignment": { "horizontal": "center", "vertical": "center" }, "fill": { "fgColor": { "rgb": "4A90E2" } } } }
        ],
        [], 
        [
          { "value": "Product", "style": { "font": { "bold": true }, "fill": { "fgColor": { "rgb": "F5F5F5" } }, "border": { "bottom": { "style": "medium", "color": { "rgb": "4A90E2" } } } } },
          { "value": "Units Sold", "style": { "font": { "bold": true }, "fill": { "fgColor": { "rgb": "F5F5F5" } }, "alignment": { "horizontal": "right" }, "border": { "bottom": { "style": "medium", "color": { "rgb": "4A90E2" } } } } },
          { "value": "Unit Price", "style": { "font": { "bold": true }, "fill": { "fgColor": { "rgb": "F5F5F5" } }, "alignment": { "horizontal": "right" }, "border": { "bottom": { "style": "medium", "color": { "rgb": "4A90E2" } } } } },
          { "value": "Revenue", "style": { "font": { "bold": true }, "fill": { "fgColor": { "rgb": "F5F5F5" } }, "alignment": { "horizontal": "right" }, "border": { "bottom": { "style": "medium", "color": { "rgb": "4A90E2" } } } } },
          { "value": "Revenue %", "style": { "font": { "bold": true }, "fill": { "fgColor": { "rgb": "F5F5F5" } }, "alignment": { "horizontal": "right" }, "border": { "bottom": { "style": "medium", "color": { "rgb": "4A90E2" } } } } }
        ],
        [
          "SuperWidget",
          1500,
          { "value": 29.99, "format": "currency_usd" },
          { "formula": "B4*C4", "format": "currency_usd" },
          { "formula": "D4/D8", "format": "percent" }
        ],
        [
          "MegaWidget",
          950,
          { "value": 49.99, "format": "currency_usd" },
          { "formula": "B5*C5", "format": "currency_usd" },
          { "formula": "D5/D8", "format": "percent" }
        ],
        [
          "GigaWidget",
          520,
          { "value": 99.99, "format": "currency_usd" },
          { "formula": "B6*C6", "format": "currency_usd" },
          { "formula": "D6/D8", "format": "percent" }
        ],
        [],
        [
          { "value": "Total", "style": { "font": { "bold": true }, "alignment": { "horizontal": "right" }, "border": { "top": { "style": "thin" } } } },
          { "formula": "SUM(B4:B6)", "style": { "font": { "bold": true }, "border": { "top": { "style": "thin" } } } },
          null,
          { "formula": "SUM(D4:D6)", "format": "currency_usd", "style": { "font": { "bold": true }, "fill": { "fgColor": { "rgb": "FFFDE7" } }, "border": { "top": { "style": "thin" } } } },
          { "formula": "SUM(E4:E6)", "format": "percent", "style": { "font": { "bold": true }, "border": { "top": { "style": "thin" } } } }
        ]
      ]
    }
  ]
}
\`\`\`
Do not add any text before or after the JSON block.`,
    'systemInstructionWordGeneration': `\n\n### Professional Word Document Generation (.docx)
When the user asks for a "Word document", ".docx file", report, or letter, you MUST act as an expert author and designer. Respond ONLY with a JSON object in a markdown code block. Do not add any text before or after it.

**JSON Schema:**
- **action**: MUST be "generate_word".
- **filename**: A descriptive filename ending in .docx.
- **theme**: (Optional) An object to control the overall look.
  - **primaryColor**: A hex color string (without '#') for headings, e.g., "2E74B5".
  - **font**: The main font for the document, e.g., "Calibri", "Times New Roman".
- **content**: An array of objects representing the document's structure.

**Content Object Schema:**
- **type**: "heading1", "heading2", "paragraph", or "bullet".
- **text**: The text content (only for simple, uniformly styled paragraphs/headings).
- **children**: An array of Text Run objects for paragraphs with mixed styling (e.g., bold, italic, colors).
- **alignment**: (Optional) "start" (default), "center", "end", "justify".
- **spacing**: (Optional) An object with \`{ after: number, before: number }\` for spacing in twips (1/1440 of an inch).

**Text Run Object Schema (for \`children\`):**
- **text**: The text segment.
- **style**: (Optional) An object with properties like \`bold: true\`, \`italic: true\`, \`color: "C00000"\`, \`size: 28\` (in half-points, e.g., 28 = 14pt font).

**RULES & BEST PRACTICES:**
1.  **Use Styling:** Create professional, aesthetically pleasing documents. Use alignment, spacing, colors, and font styles to enhance readability.
2.  **Headings:** Use "heading1" for main titles and "heading2" for sub-sections.
3.  **Mixed Styles:** For paragraphs containing bold, italic, or colored text, you MUST use the \`children\` array with Text Run objects. Do not use markdown syntax.
4.  **Clarity:** Use \`spacing\` to create clear separation between paragraphs and headings. A good default is \`{ "after": 200 }\`.

**Example of a professional document:**
\`\`\`json
{
  "action": "generate_word",
  "filename": "project_proposal.docx",
  "theme": {
    "primaryColor": "1F4E79",
    "font": "Calibri"
  },
  "content": [
    {
      "type": "heading1",
      "text": "Project Nova: A Proposal for Interstellar Expansion",
      "alignment": "center",
      "spacing": { "after": 480 }
    },
    {
      "type": "paragraph",
      "alignment": "justify",
      "children": [
        { "text": "This document outlines the proposal for Project Nova, a multi-decade initiative focused on establishing humanity's first interstellar colony. We will explore the " },
        { "text": "technological requirements", "style": { "bold": true } },
        { "text": ", " },
        { "text": "mission timeline", "style": { "italic": true } },
        { "text": ", and " },
        { "text": "budgetary considerations.", "style": { "color": "C00000" } }
      ]
    },
    {
      "type": "heading2",
      "text": "Phase 1: Research & Development"
    },
    {
      "type": "bullet",
      "text": "Develop faster-than-light propulsion systems."
    },
    {
      "type": "bullet",
      "text": "Design sustainable life-support for long-duration spaceflight."
    }
  ]
}
\`\`\`
`,
    'systemInstructionCreativeWriting': `\n\n### Creative Writing\nAs a creative partner, you should write in a more evocative, descriptive, and imaginative style. Use richer vocabulary and literary devices to make the text more engaging.`,
    'systemInstructionCodeGeneration': `\n\n### Code Generation\nWhen generating code, always strive for clarity, efficiency, and adherence to best practices. Include comments to explain complex sections. If possible, provide a brief explanation of how the code works outside the code block.`,
    'systemInstructionDeepSearch': `\n\n### Deep Search & Analysis\nWhen deep search is required, your primary goal is to synthesize information from multiple web sources to provide a comprehensive, accurate, and nuanced answer. Do not just list facts; explain the context, different perspectives, and the significance of the information. Always cite your sources.`,
    'systemInstructionPresentationGeneration': `\n\n### Presentation Generation
When the user asks for a "presentation", "slides", or a "PowerPoint", you MUST act as an expert presentation designer. Respond ONLY with a JSON object in a markdown code block. Do not add any text after it. The root object must contain \`action: "generate_presentation"\`, a \`filename\` (ending in .pptx), and a \`data\` object with \`theme\` and \`slides\`.

**Theme Object:**
- Defines the overall look: \`background\` (color or gradient), \`titleFontFace\`, \`bodyFontFace\`, \`textColor\`.

**Slide Object:**
- **\`layout\`**: Determines the slide structure. Choose the most appropriate from: 'title_only', 'title_and_content', 'content_left_image_right', 'image_left_content_right', 'image_only', 'table_of_contents', 'conclusion'.
- **\`title\`**: An object with \`text\` and optional styling/animation.
- **\`content\`**: An object with \`type\` ('paragraph' or 'bullet') and an array of \`items\` (strings).
- **\`image\`**: An object with a detailed \`prompt\` for the image generation model. You MUST provide creative and artistic prompts. Do not include a 'data' field.

**Example Response:**
\`\`\`json
{
  "action": "generate_presentation",
  "filename": "Quantum_Computing_Intro.pptx",
  "data": {
    "theme": {
      "background": { "gradient": { "type": "linear", "angle": 45, "colors": ["#0c1425", "#1e3a8a"] } },
      "titleFontFace": "Poppins",
      "bodyFontFace": "Lato",
      "textColor": "#FFFFFF"
    },
    "slides": [
      {
        "layout": "title_only",
        "title": { "text": "An Introduction to Quantum Computing" },
        "background": { "gradient": { "type": "radial", "colors": ["#3a86ff", "#012a4a"] } }
      },
      {
        "layout": "content_left_image_right",
        "title": { "text": "What is a Qubit?" },
        "content": {
          "type": "bullet",
          "items": ["Unlike classical bits (0 or 1), a qubit exists in a superposition of both states.", "This allows for immense parallel processing power.", "Represented by a vector in a two-level quantum system."]
        },
        "image": { "prompt": "An abstract, glowing, ethereal sphere representing a quantum qubit, with faint, overlapping light waves of '0' and '1' inside. Dark, futuristic background. Cinematic, 3D render." }
      }
    ]
  }
}
\`\`\``,
    'systemInstructionUniversum4_0': '\n\n### Universum 4.0 Directives\nAs Universum 4.0, your reasoning capabilities are enhanced. You are expected to tackle complex, open-ended problems by dynamically generating and evaluating hypotheses. When appropriate, use the built-in "thinking" process to break down the problem, explore different angles, and construct a more robust and insightful final answer. Do not announce that you are "thinking"; just perform the task to the best of your ability. This approach is especially valuable for tasks requiring deep analysis, strategic planning, or creative synthesis.',
    'systemInstructionWeather': `\n\n### Weather\nTo get the weather, call the \`getWeatherForecast\` function with a \`location\` and optional number of \`days\`. The tool will provide the data, and you should then present it to the user in a clear, human-readable format.`,
    'cognitiveMatrixTitle': 'Kognitive Matrix',
    'coreStatusIngesting': 'Aufnahme & Verständnis',
    'coreStatusDeconstructing': 'Analyse der Anfrage',
    'coreStatusStrategizing': 'Strategieentwicklung',
    'coreStatusDispatching': 'Agenten-Zuweisung',
    'coreStatusSynthesizing': 'Ergebnissynthese',
    'coreStatusFinalizing': 'Antwort wird finalisiert',
    'intent_label': 'Absicht',
    'domain_label': 'Domäne',
    'complexity_label': 'Komplexität',
    'strategyLabel': 'Strategie',
    'intent_conversation': 'Unterhaltung',
    'intent_information_retrieval': 'Informationsabruf',
    'intent_content_creation': 'Inhaltserstellung',
    'intent_problem_solving': 'Problemlösung',
    'intent_data_analysis': 'Datenanalyse',
    'intent_code_development': 'Code-Entwicklung',
    'intent_creative_ideation': 'Kreative Ideenfindung',
    'domain_general': 'Allgemein',
    'domain_creative': 'Kreativ',
    'domain_technical': 'Technisch',
    'domain_research': 'Forschung',
    'domain_data_analysis': 'Datenanalyse',
    'domain_spreadsheet': 'Tabellenkalkulation',
    'domain_video': 'Video',
    'domain_math': 'Mathematik',
    'complexity_simple': 'Einfach',
    'complexity_moderate': 'Mittel',
    'complexity_complex': 'Komplex',
    'strategy_standard': 'Standardantwort',
    'strategy_deep_search': 'Tiefensuche',
    'strategy_code_interpreter': 'Code-Interpreter',
    'strategy_creative_suite': 'Kreativ-Suite',
    'strategy_spreadsheet_specialist': 'Tabellen-Spezialist',
    'strategy_multi_agent_collaboration': 'Multi-Agenten-Kollaboration',
    'agentDeepSearch': 'Tiefensuch-Agent',
    'agentCodeInterpreter': 'Code-Interpreter-Agent',
    'agentCreativeSuite': 'Kreativ-Suite-Agent',
    'agentSpreadsheetSpecialist': 'Tabellen-Spezialist-Agent',
    'agentTaskPending': 'Wartet auf Zuweisung...',
    'agentTaskInitializing': 'Initialisiere...',
    'agentTaskSearching': 'Durchsuche Web & Datenbanken...',
    'agentTaskCoding': 'Schreibe & teste Code...',
    'agentTaskCreativeWriting': 'Entwerfe kreativen Inhalt...',
    'agentTaskSpreadsheet': 'Erstelle Tabelle...',

    'systemInstructionAnalyzeRequest': `Sie sind ein Experte für die Analyse von Anfragen. Ihre Aufgabe ist es, die LETZTE Anfrage des Benutzers unter Berücksichtigung des gesamten Gesprächsverlaufs zu analysieren und sie gemäß den folgenden Kategorien zu klassifizieren. Sie MÜSSEN NUR mit einem JSON-Objekt antworten.

1.  **domain**: Was ist das Hauptthema?
    - "general": Zwangloses Gespräch, Fragen.
    - "creative": Geschichtenschreiben, Poesie, Kunstideen.
    - "technical": Programmierung, technische Erklärungen, Debugging.
    - "research": Faktenfindung, Suche nach Informationen.
    - "data_analysis": Analyse von bereitgestellten Daten.
    - "spreadsheet": Anfragen zum Erstellen oder Bearbeiten von Tabellendaten.
    - "video": Anfragen zum Erstellen eines Videos, Clips oder einer Animation.
    - "math": Mathematische Probleme und Gleichungen.

2.  **complexity**: Wie komplex ist die Anfrage?
    - "simple": Eine einzelne, unkomplizierte Frage oder ein Befehl.
    - "moderate": Erfordert mehrere Schritte oder die Kombination von Informationen.
    - "complex": Beinhaltet tiefgehende Analyse, Zusammenarbeit mehrerer Agenten oder erheblichen kreativen Aufwand.

3.  **intent**: Was ist das Hauptziel des Benutzers?
    - "conversation": Allgemeiner Chat, Bitte um Meinungen.
    - "information_retrieval": Bitte um spezifische Fakten oder Daten.
    - "content_creation": Aufforderung an die KI, Text, Bilder, Code usw. zu generieren.
    - "problem_solving": Bitte um Hilfe bei einem bestimmten Problem.
    - "data_analysis": Bitte um Einblicke aus Daten.
    - "code_development": Anfrage zum Schreiben oder Korrigieren von Code.
    - "creative_ideation": Brainstorming oder Ideengenerierung.

4.  **tool**: Was ist die beste Strategie oder das beste Werkzeug, um die Anfrage zu erfüllen?
    - "standard": Eine direkte textbasierte Antwort ist ausreichend.
    - "deep_search": Erfordert eine Websuche nach aktuellen oder spezifischen Informationen.
    - "code_interpreter": Erfordert das Generieren und potenziell Ausführen von Code (z.B. für Datenvisualisierung, komplexe Berechnungen).
    - "creative_suite": Für kreatives Schreiben, Bilderstellung oder Präsentationserstellung.
    - "spreadsheet_specialist": Zum Erstellen von Excel-Dateien.
    - "multi_agent_collaboration": Für sehr komplexe Anfragen, die von mehreren spezialisierten Agenten profitieren (z.B. Recherche + Codierung + kreatives Schreiben). Dies ist ein teures, qualitativ hochwertiges Werkzeug. Verwenden Sie es für Aufgaben, die eindeutig eine Kombination aus tiefgehender Recherche, komplexer Codierung und verfeinerter kreativer Ausgabe erfordern.
`,
};

// Add empty or placeholder translations for other languages to avoid reference errors
const de: Translation = en;
const es: Translation = en;
const fr: Translation = en;
const it: Translation = en;
const pt: Translation = en;
const ja: Translation = en;
const ru: Translation = en;
const zh: Translation = en;
const hi: Translation = en;
const ar: Translation = en;
const nl: Translation = en;
const ko: Translation = en;
const tr: Translation = en;
const pl: Translation = en;
const sv: Translation = en;
const no: Translation = en;
const da: Translation = en;
const fi: Translation = en;
const el: Translation = en;
const id: Translation = en;
const uk: Translation = en;
const cs: Translation = en;
const hu: Translation = en;
const ro: Translation = en;
const vi: Translation = en;
const th: Translation = en;
const he: Translation = en;
const bn: Translation = en;
const ms: Translation = en;
const fil: Translation = en;

// FIX: Renamed 'locales' to 'translations' to match the import in LocaleContext.tsx.
export const translations: { [key in Locale]?: Translation } = {
    en,
    de,
    es,
    fr,
    it,
    pt,
    ja,
    ru,
    zh,
    hi,
    ar,
    nl,
    ko,
    tr,
    pl,
    sv,
    no,
    da,
    fi,
    el,
    id,
    uk,
    cs,
    hu,
    ro,
    vi,
    th,
    he,
    bn,
    ms,
    fil,
};