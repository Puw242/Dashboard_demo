import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Tabs, 
  Tab, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Avatar,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Chatbot icon
import DeleteIcon from '@mui/icons-material/Delete';
import AddCommentIcon from '@mui/icons-material/AddComment';

import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import HeaderLogos from './components/HeaderLogos';

// Import local logos (Consistent with WelcomePage)
import chatbotLogo from './assets/Chatbot.png';

// Import React PDF
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF Worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// --- Configuration ---
// TODO: Replace with your actual API Key
const API_KEY = "AIzaSyBCkGVmjnNO7WAFHynSUmdz8dVMYCnPCHk"; 

// --- Shared Styles (Consistent with WelcomePage) ---

const NavBar = styled(Box)({
  position: 'fixed', 
  top: 0,
  left: 0,
  right: 0,
  height: '80px', 
  backgroundColor: 'rgba(255, 255, 255, 0.5)', 
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 50px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  zIndex: 100,
});

const NavLinks = styled(Box)({
  display: 'flex',
  gap: '30px',
});

const NavLink = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ active }) => ({
  fontSize: '1.3rem',
  fontWeight: 600,
  color: active ? '#1976d2' : '#333',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    color: '#1976d2',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: active ? '100%' : '0%',
    height: '2px',
    bottom: '-5px',
    left: '0',
    backgroundColor: '#1976d2',
    transition: 'width 0.3s',
  },
  '&:hover::after': {
    width: '100%',
  },
}));

const MainContainer = styled(Box)({
  display: 'flex',
  flexGrow: 1,
  minHeight: 0,
  paddingTop: '80px',
  backgroundColor: '#f5f7fa',
});

const Sidebar = styled(Paper)({
  width: '350px',
  flexShrink: 0,
  backgroundColor: '#ffffff',
  borderRight: '1px solid rgba(0, 0, 0, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  zIndex: 90,
  minHeight: 0,
});

const ContentArea = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
});

const FunctionTabs = styled(Paper)({
  padding: '0 20px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  zIndex: 95,
});

const Workspace = styled(Box)({
  flexGrow: 1,
  padding: '20px',
  overflowY: 'hidden', // Changed from auto to hidden to let children handle scrolling
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

// --- Components ---

// 1. Chatbot Component (Integrated with Gemini)
const ChatInterface = ({ uploadedFiles }) => {
  const initialMessage = {
    id: 1,
    sender: 'bot',
    text: 'Hello! I am your NJ DOT AI Assistant. I can analyze the files you upload (images, PDFs) and answer your questions.'
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 1. Add User Message
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        // 2. Initialize Gemini
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Use gemini-1.5-flash for speed and multimodal capabilities
        // const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });

        // 3. Prepare Content Parts (Text + Images)
        const prompt = input;
        const imageParts = uploadedFiles
            .filter(file => file.inlineData) // Only include processed files
            .map(file => ({
                inlineData: {
                    data: file.inlineData.data,
                    mimeType: file.inlineData.mimeType
                }
            }));

        const result = await model.generateContentStream([prompt, ...imageParts]);

        // 4. Create placeholder for Bot Message
        const botMsgId = Date.now() + 1;
        setMessages(prev => [...prev, { id: botMsgId, sender: 'bot', text: '' }]);
        setIsTyping(false); // Stop "typing dots", start streaming text

        // 5. Stream Response
        let fullText = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId ? { ...msg, text: fullText } : msg
            ));
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        setIsTyping(false);
        setMessages(prev => [...prev, { 
            id: Date.now() + 2, 
            sender: 'bot', 
            text: `Error: ${error.message || "Something went wrong with the AI service."}. Please check your API Key.` 
        }]);
    }
  };

  const handleNewChat = () => {
      setMessages([initialMessage]);
      setInput('');
      setIsTyping(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: 3 }}>

      {/* Header with New Chat Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<AddCommentIcon />}
            onClick={handleNewChat}
            size="small"
            sx={{ borderRadius: '20px', textTransform: 'none' }}
          >
              New Chat
          </Button>
      </Box>

      {/* Messages Container - This will scroll */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          px: 1,
          // Custom Scrollbar Styles
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#bdbdbd',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#9e9e9e',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
        {messages.map((msg) => (
          <Box 
            key={msg.id} 
            sx={{ 
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: 2
            }}
          >
            {msg.sender === 'bot' && (
                <Avatar sx={{ width: 58, height: 58, border: '1px solid #eee', bgcolor: '#fff', flexShrink: 0 }}>
                    <img src={chatbotLogo} alt="AI" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </Avatar>
            )}
            
            <Box
                sx={{
                  maxWidth: '70%',
                  borderRadius: msg.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                  backgroundColor: msg.sender === 'user' ? '#1976d2' : '#ffffff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  overflow: 'hidden', // 保持边框圆角裁剪
                  display: 'flex',
                  flexDirection: 'column'
                }}
            >
              {/* Inner container with padding and proper overflow handling */}
              <Box sx={{ p: 2, overflowX: 'auto', overflowY: 'visible' }}>
                {msg.sender === 'user' ? (
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      color: '#fff'
                    }}
                  >
                    {msg.text}
                  </Typography>
                ) : (
                  <Typography
                    component="div"
                    variant="body1"
                    sx={{
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      color: '#2c3e50',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      // Headers
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        mt: 2,
                        mb: 1,
                        fontWeight: 600,
                        color: '#1a202c',
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                        '&:first-of-type': { mt: 0 }
                      },
                      // Paragraphs
                      '& p': {
                        mb: 1.5,
                        '&:last-child': { mb: 0 },
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      },
                      // Lists
                      '& ul, & ol': {
                        mb: 1.5,
                        pl: 3,
                        '& li': { mb: 0.5 }
                      },
                      // Code blocks
                      '& pre': {
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowX: 'auto',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        p: 1.5,
                        my: 1.5,
                        maxWidth: '100%',
                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                        fontSize: '0.9em'
                      },
                      // Inline code
                      '& code': {
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderRadius: '3px',
                        px: 0.5,
                        py: 0.25,
                        fontSize: '0.9em',
                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
                      },
                      // Pre code combination
                      '& pre code': {
                        backgroundColor: 'transparent',
                        p: 0,
                        fontSize: '1em',
                        border: 'none'
                      },
                      // Images
                      '& img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        mt: 1.5,
                        display: 'block',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      // Tables
                      '& table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        my: 1.5,
                        fontSize: '0.95em',
                        overflowX: 'auto',
                        display: 'block'
                      },
                      '& th, & td': {
                        border: '1px solid #e0e0e0',
                        p: 1.5,
                        textAlign: 'left'
                      },
                      '& th': {
                        backgroundColor: '#f5f7fa',
                        fontWeight: 600,
                        color: '#333'
                      },
                      // Blockquotes
                      '& blockquote': {
                        borderLeft: '4px solid #1976d2',
                        pl: 2,
                        py: 0.5,
                        my: 1.5,
                        color: '#555',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '0 4px 4px 0'
                      },
                      // Strong/Bold
                      '& strong': {
                        fontWeight: 600,
                        color: '#000'
                      }
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        ))}
        
        {isTyping && (
           <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar sx={{ width: 58, height: 58, border: '1px solid #eee', bgcolor: '#fff' }}>
                    <img src={chatbotLogo} alt="AI" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </Avatar>
                <Box sx={{ p: 2, backgroundColor: '#ffffff', borderRadius: '20px 20px 20px 5px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: 8, height: 8, backgroundColor: '#aaa', borderRadius: '50%' }} />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} style={{ width: 8, height: 8, backgroundColor: '#aaa', borderRadius: '50%' }} />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} style={{ width: 8, height: 8, backgroundColor: '#aaa', borderRadius: '50%' }} />
                    </Box>
                </Box>
           </Box>
        )}
        <div ref={messagesEndRef} />
        </Box>
      </Box>
      
      {/* Input Area */}
      <Paper sx={{ p: '10px 20px', display: 'flex', alignItems: 'center', borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mt: 2, flexShrink: 0 }}>
        <TextField
          fullWidth
          placeholder="Ask about the inspection report..."
          variant="standard"
          InputProps={{ disableUnderline: true }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

// 2. Document Retrieval Component
const DocRetrievalInterface = ({ uploadedFiles }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [numPages, setNumPages] = useState(null);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleSearch = async () => {
    if (!query) return;

    // Filter PDF files from uploaded files
    const pdfFiles = uploadedFiles.filter(file =>
      file.inlineData && file.inlineData.mimeType === 'application/pdf' && !file.uploading
    );

    if (pdfFiles.length === 0) {
      setError('Please upload at least one PDF file to the workspace before searching.');
      return;
    }

    setSearching(true);
    setResult(null);
    setError(null);

    try {
      console.log("Starting document analysis...");
      console.log("Query:", query);
      console.log("PDF files found:", pdfFiles.length);

      // Check if API key is set
      if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
        throw new Error("API Key not configured. Please set a valid Google AI API key.");
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        generationConfig: { responseMimeType: "application/json" }
      });

      // Prepare PDF parts from uploaded files
      const pdfParts = pdfFiles.map(file => ({
        inlineData: {
          data: file.inlineData.data,
          mimeType: file.inlineData.mimeType
        }
      }));

      // Store the first PDF's data URL for display
      const firstPdfDataUrl = `data:${pdfFiles[0].inlineData.mimeType};base64,${pdfFiles[0].inlineData.data}`;
      setPdfDataUrl(firstPdfDataUrl);

      console.log("PDF files loaded from workspace");

      // --- PROMPT LOCATION ---
      const prompt = `
        You are an expert civil engineering inspector assistant.
        User Question: "${query}"
        Context: The attached PDF document(s) are inspection reports.

        Task:
        1. Analyze the document(s) to find the specific answer to the user's question.
        2. Identify the specific page numbers (1-indexed) where relevant information is found.
        3. For EACH relevant page, provide a specific summary explaining exactly what content on that page is relevant to the question.

        Output Format (JSON):
        {
          "overall_summary": "A high-level summary of the answer based on all findings.",
          "relevant_pages": [
            {
              "page_number": integer,
              "content_description": "Specific explanation of what is on this page relative to the query."
            }
          ]
        }
      `;

      console.log("Sending request to Gemini API...");
      const result = await model.generateContent([prompt, ...pdfParts]);
      const response = result.response;
      const text = response.text();
      console.log("Received response from API");

      const jsonResponse = JSON.parse(text);
      setResult(jsonResponse);
      console.log("Analysis completed successfully");

    } catch (err) {
      console.error("Error searching document:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to analyze the document. ";

      if (err.message?.includes("API key")) {
        errorMessage += "Please check your API key configuration.";
      } else if (err.message?.includes("quota")) {
        errorMessage += "API quota exceeded. Please try again later.";
      } else if (err.message?.includes("Load failed")) {
        errorMessage += "Network connection failed. Please check your internet connection and try again.";
      } else if (err.message?.includes("fetch")) {
        errorMessage += "Unable to connect to Google AI API. This might be a CORS or network issue.";
      } else if (err instanceof SyntaxError) {
        errorMessage += "Invalid response format from API.";
      } else {
        errorMessage += err.message || "Please try again.";
      }

      setError(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header Area */}
      <Box sx={{ flexShrink: 0, p: 3, pb: 0 }}>
        <Container maxWidth="lg">
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#444', mb: 3 }}>
            Semantic Document Search
          </Typography>
          
          <Paper sx={{ p: '4px 10px', display: 'flex', alignItems: 'center', mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            <InputBaseWrapper 
              fullWidth 
              placeholder="Ask a question about the PDF (e.g., 'What is the condition of the deck?')" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              disabled={searching}
              sx={{ borderRadius: '4px', boxShadow: 'none', px: 4 }}
            >
              {searching ? <CircularProgress size={24} color="inherit" /> : 'Search'}
            </Button>
          </Paper>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}
        </Container>
      </Box>

      {/* Scrollable Results Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Container maxWidth="lg">
          {result && (
            <Box>
              <Paper sx={{ p: 3, mb: 4, backgroundColor: '#f0f7ff', borderLeft: '5px solid #1976d2' }}>
                  <Typography variant="h6" gutterBottom color="primary">Overall Summary</Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '1.05rem', 
                      lineHeight: 1.7, 
                      color: '#2c3e50',
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                    }}
                  >
                    {result.overall_summary}
                  </Typography>
              </Paper>

              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Relevant Pages</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                {result.relevant_pages && result.relevant_pages.length > 0 ? (
                  <Document file={pdfDataUrl} onLoadSuccess={onDocumentLoadSuccess}>
                    {result.relevant_pages.map((item, index) => (
                      <Paper key={index} elevation={3} sx={{ p: 2, width: '100%', maxWidth: '800px', mb: 4 }}>
                          <Box sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                               <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                 Page {item.page_number}
                               </Typography>
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              sx={{ 
                                fontSize: '1rem', 
                                lineHeight: 1.6, 
                                color: '#444',
                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                              }}
                            >
                                {item.content_description}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'center', backgroundColor: '#525659', p: 1, borderRadius: '4px', overflow: 'auto' }}>
                              <Page 
                                pageNumber={item.page_number} 
                                width={750} 
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                error={<Typography color="error">Failed to load page {item.page_number}</Typography>}
                              />
                          </Box>
                      </Paper>
                    ))}
                  </Document>
                ) : (
                    <Typography>No specific pages found.</Typography>
                )}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

const InputBaseWrapper = styled(TextField)({
  '& .MuiInputBase-input': {
    padding: '10px',
  },
  '& fieldset': { border: 'none' },
});


// 3. Defect Prediction Component (Integrated with Gemini)
const PredictionInterface = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
        const data = e.dataTransfer.getData("application/json");
        if (data) {
            const file = JSON.parse(data);
            if (file.inlineData) {
                setSelectedFile(file);
                setAnalysis(null);
                setError(null);
            }
        }
    } catch (err) {
        console.error("Error parsing dropped file:", err);
    }
  };

  const runPrediction = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setAnalysis(null);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-pro-preview",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        You are an expert civil engineering inspector for NJ DOT.
        Analyze the provided image of a bridge component to identify defects.
        
        Using the following NJ DOT Priority Repair Categories, classify the defect:

        1. Emergency / Critical Finding
           - Criteria: Major defects, potential collapse, immediate safety hazard.
           - Timeframe: Repairs within 7 days.
           - Examples: Crack in non-redundant member, >50% undermining of bearing area, unstable member, loose concrete over road, missing railings.

        2. High Priority 1
           - Criteria: Serious structural deficiency to primary element, potential for load restrictions/closures.
           - Timeframe: Repairs within 30 days.
           - Examples: Longitudinal crack in primary member, substantial section loss, pier cap distress, major scour (not critical).

        3. Priority 1
           - Criteria: Advance deficiency on primary element, potential for future deterioration.
           - Timeframe: Repairs within 90 days.
           - Examples: Similar to High Priority 1 but less immediate severity based on judgment.

        4. Priority 2
           - Criteria: Minor defects, not immediate risk but needs maintenance.
           - Timeframe: Repair within next 12 months (or monitor).
           - Examples: Short crack in redundant member, minor section loss, minor railing problems.

        Output strictly in JSON format:
        {
          "defectType": "Short description of the defect",
          "severity": "Critical/High/Medium/Low",
          "priority": "The Category Name (e.g., Emergency / Critical Finding, High Priority 1, etc.)",
          "lifecycle": "Estimated stage (e.g., Initiation, Propagation, Advanced)",
          "recommendation": "Specific repair action based on the identified defect and priority",
          "reasoning": "Detailed explanation of why this priority was chosen based on the visual evidence and criteria."
        }
      `;

      const imagePart = {
        inlineData: {
          data: selectedFile.inlineData.data,
          mimeType: selectedFile.inlineData.mimeType
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      const jsonResponse = JSON.parse(text);
      
      setAnalysis(jsonResponse);

    } catch (err) {
      console.error("Error analyzing defect:", err);
      setError("Failed to analyze the defect. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#444', mb: 2 }}>
        Defect Lifecycle & Priority Analysis
      </Typography>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', pb: 2 }}>
        
        {/* Drop Zone / Selection Area */}
        <Paper
            elevation={0}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{ 
            border: '2px dashed', 
            borderColor: selectedFile ? '#1976d2' : '#ccc', 
            borderRadius: '16px', 
            p: 4, 
            backgroundColor: selectedFile ? '#f0f7ff' : '#fafafa',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            flexShrink: 0
            }}
        >
            {selectedFile ? (
                <Box sx={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <img 
                        src={selectedFile.preview} 
                        alt="Selected" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                     <IconButton 
                        size="small" 
                        onClick={() => { setSelectedFile(null); setAnalysis(null); }}
                        sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white', border: '1px solid #ccc', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>{selectedFile.name}</Typography>
                </Box>
            ) : (
                <>
                    <AutoAwesomeIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                        Drag & Drop a Project File Here
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Select a file from the sidebar to analyze its defects.
                    </Typography>
                </>
            )}
        </Paper>

        {/* Action Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button 
                variant="contained" 
                size="large"
                disabled={!selectedFile || analyzing}
                onClick={runPrediction}
                startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                sx={{ px: 4, py: 1.5, borderRadius: '30px', textTransform: 'none', fontSize: '1.1rem' }}
            >
                {analyzing ? "Analyzing..." : "Analyze Defect"}
            </Button>
        </Box>

        {error && <Typography color="error">{error}</Typography>}

        {/* Results Area */}
        {analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card sx={{ textAlign: 'left', borderTop: '5px solid #d32f2f', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'visible' }}>
                <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>Defect Type</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>{analysis.defectType}</Typography>
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>Severity & Priority</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                <Chip label={analysis.severity} color={analysis.severity === 'Critical' || analysis.severity === 'High' ? "error" : "warning"} variant="outlined" />
                                <Chip label={analysis.priority} color="error" icon={<DescriptionIcon />} />
                            </Box>
                        </Box>
                        <Box>
                             <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>Lifecycle Stage</Typography>
                             <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{analysis.lifecycle}</Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 3, backgroundColor: '#f5f5f5', borderRadius: '12px', height: '100%' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AutoAwesomeIcon fontSize="small" color="primary" /> AI Recommendation
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                mb: 2, 
                                lineHeight: 1.6, 
                                fontSize: '1rem',
                                color: '#333',
                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                              }}
                            >
                              {analysis.recommendation}
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>Reasoning</Typography>
                            <Typography 
                              variant="body1" 
                              color="textSecondary" 
                              sx={{ 
                                lineHeight: 1.6, 
                                fontSize: '1rem',
                                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                              }}
                            >
                              {analysis.reasoning}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
                </CardContent>
            </Card>
            </motion.div>
        )}
      </Box>
    </Container>
  );
};


// --- Main Dashboard Page ---
const DashboardPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState([]); 
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const processFiles = (fileList) => {
    Array.from(fileList).forEach(file => {
      const sizeInMB = (file.size / (1024 * 1024)); 
      const sizeStr = sizeInMB.toFixed(1) === "0.0" ? "< 0.1 MB" : `${sizeInMB.toFixed(1)} MB`;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
          const base64Data = e.target.result.split(',')[1]; // Extract base64 part
          const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
          
          const newFile = { 
            name: file.name, 
            size: sizeStr, 
            preview: previewUrl,
            uploading: true,
            progress: 0,
            id: Date.now() + Math.random(), 
            originalSizeMB: sizeInMB,
            inlineData: { data: base64Data, mimeType: file.type } // Store for API
          };
    
          setFiles(prev => [...prev, newFile]);
    
          // Simulate upload progress
          const baseTimePerMB = 500; 
          const minUploadTimeMs = 1000;
          const totalUploadTimeMs = Math.max(minUploadTimeMs, sizeInMB * baseTimePerMB);
    
          const intervalDuration = 50; 
          const totalSteps = totalUploadTimeMs / intervalDuration;
          const progressPerStep = 100 / totalSteps;
    
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += progressPerStep; 
            
            if (currentProgress >= 100) {
              currentProgress = 100;
              clearInterval(interval);
            }
            
            setFiles(prevFiles => prevFiles.map(f => 
              f.id === newFile.id 
                ? { ...f, progress: currentProgress, uploading: currentProgress < 100 }
                : f
            ));
          }, intervalDuration);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileInputChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
          processFiles(e.target.files);
      }
      e.target.value = null;
  };

  const handleDeleteFile = (indexToDelete) => {
    setFiles(files.filter((file, index) => {
        if (index === indexToDelete && file.preview) {
            URL.revokeObjectURL(file.preview); 
        }
        return index !== indexToDelete;
    }));
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <NavBar>
        <NavLinks>
          <NavLink onClick={() => navigate('/')}>Home</NavLink>
          <NavLink active>Dashboard</NavLink>
        </NavLinks>
        
        <HeaderLogos />
      </NavBar>

      <MainContainer>
        {/* Sidebar */}
        <Sidebar elevation={0} sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
            Project Files
          </Typography>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileInputChange}
            multiple
          />

          <Box 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{ 
                mb: 3, 
                border: '2px dashed', 
                borderColor: isDragging ? '#1976d2' : '#ccc', 
                borderRadius: '8px', 
                p: 3, 
                textAlign: 'center', 
                backgroundColor: isDragging ? '#f0f7ff' : '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: '#f0f7ff'
                }
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 40, color: isDragging ? '#1976d2' : '#aaa', mb: 1 }} />
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                {isDragging ? "Drop files here" : "Click or Drag & Drop"}
            </Typography>
             <Typography variant="caption" color="textSecondary">
                Supported: PDF, JPG, PNG
            </Typography>
          </Box>

          <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {files.map((file, index) => (
              <ListItem 
                key={index} 
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(file));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => handleDeleteFile(index)}><DeleteIcon fontSize="small" /></IconButton>
                }
                sx={{ 
                  backgroundColor: '#f9f9f9', 
                  mb: 1, 
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {file.preview ? (
                        <Avatar variant="rounded" sx={{ width: 58, height: 58, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: '#fff' }}>
                            <img src={file.preview} alt="preview" style={{ maxWidth: '48px', maxHeight: '48px', objectFit: 'contain' }} />
                        </Avatar>
                    ) : (
                        <InsertDriveFileIcon color="action" fontSize="medium" />
                    )}
                </ListItemIcon>
                <ListItemText 
                  primary={file.name} 
                  secondary={
                    file.uploading ? (
                      <Box sx={{ width: '100%', mt: 0.5 }}>
                        <LinearProgress variant="determinate" value={file.progress} sx={{ height: 4, borderRadius: 2 }} />
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                            {Math.round(file.progress)}%
                        </Typography>
                      </Box>
                    ) : (
                      file.size
                    )
                  }
                  primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
                />
              </ListItem>
            ))}
            {files.length === 0 && (
                 <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4, fontStyle: 'italic' }}>
                    No files uploaded yet.
                </Typography>
            )}
          </List>
        </Sidebar>

        {/* Content Area */}
        <ContentArea>
          <FunctionTabs elevation={0}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              indicatorColor="primary" 
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<SmartToyIcon />} iconPosition="start" label="Chat Assistant" />
              <Tab icon={<SearchIcon />} iconPosition="start" label="Doc Retrieval" />
              <Tab icon={<AssessmentIcon />} iconPosition="start" label="Defect Analysis" />
            </Tabs>
          </FunctionTabs>

          <Workspace>
            <AnimatePresence mode="wait">
              {tabValue === 0 && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
                >
                  <ChatInterface uploadedFiles={files} />
                </motion.div>
              )}
              {tabValue === 1 && (
                <motion.div
                  key="retrieval"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
                >
                  <DocRetrievalInterface uploadedFiles={files} />
                </motion.div>
              )}
              {tabValue === 2 && (
                <motion.div 
                  key="prediction"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
                >
                  <PredictionInterface />
                </motion.div>
              )}
            </AnimatePresence>
          </Workspace>
        </ContentArea>
      </MainContainer>
    </Box>
  );
};

export default DashboardPage;
