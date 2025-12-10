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

// Import local logos (Consistent with WelcomePage)
import jhuLogo from './assets/JHU.logo_horizontal.blue.svg';
import njdotLogo from './assets/njdot_Logo.png';
import chatbotLogo from './assets/Chatbot.png';

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

const NavLink = styled(Typography)(({ active }) => ({
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

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

const Logo = styled('img')({
  height: '50px',
  width: 'auto',
  objectFit: 'contain',
  transition: 'transform 0.3s ease',
  marginLeft: '25px',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

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
                      lineHeight: 1.6,
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
                      lineHeight: 1.6,
                      color: '#333',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      // Headers
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        mt: 2,
                        mb: 1,
                        fontWeight: 600,
                        '&:first-of-type': { mt: 0 }
                      },
                      // Paragraphs
                      '& p': {
                        mb: 1,
                        '&:last-child': { mb: 0 },
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      },
                      // Lists
                      '& ul, & ol': {
                        mb: 1,
                        pl: 3,
                        '& li': { mb: 0.5 }
                      },
                      // Code blocks
                      '& pre': {
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowX: 'auto',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderRadius: '4px',
                        p: 1,
                        my: 1,
                        maxWidth: '100%'
                      },
                      // Inline code
                      '& code': {
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderRadius: '3px',
                        px: 0.5,
                        py: 0.25,
                        fontSize: '0.9em'
                      },
                      // Pre code combination
                      '& pre code': {
                        backgroundColor: 'transparent',
                        p: 0,
                        fontSize: '1em'
                      },
                      // Images
                      '& img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        mt: 1,
                        display: 'block'
                      },
                      // Tables
                      '& table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        my: 1,
                        fontSize: '0.9em',
                        overflowX: 'auto',
                        display: 'block'
                      },
                      '& th, & td': {
                        border: '1px solid rgba(0,0,0,0.1)',
                        p: 1,
                        textAlign: 'left'
                      },
                      '& th': {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        fontWeight: 600
                      },
                      // Blockquotes
                      '& blockquote': {
                        borderLeft: '3px solid rgba(0,0,0,0.2)',
                        pl: 2,
                        my: 1,
                        color: 'rgba(0,0,0,0.7)'
                      },
                      // Strong/Bold
                      '& strong': {
                        fontWeight: 600
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

// 2. Document Retrieval Component (Mocked for now)
const DocRetrievalInterface = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!query) return;
    setSearching(true);
    setResults([]);
    
    // Mock Search
    setTimeout(() => {
      setResults([
        { id: 1, page: 4, score: 0.95, text: "...visual inspection revealed <b style='color:#d32f2f'>spalling on the northwest abutment</b>. The area measures approximately 2ft x 3ft...", img: "https://via.placeholder.com/150" },
        { id: 2, page: 12, score: 0.88, text: "...recommend immediate <b style='color:#d32f2f'>repair of the expansion joint</b> at Pier 2 due to excessive leakage observed during...", img: "https://via.placeholder.com/150" },
        { id: 3, page: 4, score: 0.82, text: "...Table 3-1: Summary of <b style='color:#d32f2f'>Spalling Locations</b>. 1. NW Abutment (Severe). 2. SE Girder (Minor)...", img: "https://via.placeholder.com/150" }
      ]);
      setSearching(false);
    }, 1500);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#444', mb: 3 }}>
        Semantic Document Search
      </Typography>
      
      <Paper sx={{ p: '4px 10px', display: 'flex', alignItems: 'center', mb: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
        <InputBaseWrapper 
          fullWidth 
          placeholder="Describe the issue (e.g., 'spalling on abutments')" 
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

      <Box>
        {results.map((res) => (
          <Card key={res.id} sx={{ mb: 2, borderLeft: '5px solid #1976d2', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="primary">Page {res.page}</Typography>
                <Chip label={`Match: ${(res.score * 100).toFixed(0)}%`} size="small" color="success" variant="outlined" />
              </Box>
              <Typography variant="body1" sx={{ color: '#555' }} dangerouslySetInnerHTML={{ __html: res.text }} />
            </CardContent>
          </Card>
        ))}
        {!searching && results.length === 0 && query && (
            <Typography variant="body2" color="text.secondary" align="center">No results found yet.</Typography>
        )}
      </Box>
    </Container>
  );
};

const InputBaseWrapper = styled(TextField)({
  '& .MuiInputBase-input': {
    padding: '10px',
  },
  '& fieldset': { border: 'none' },
});


// 3. Defect Prediction Component (Mocked for now)
const PredictionInterface = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runPrediction = () => {
    setAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      setAnalysis({
        defectType: "Vertical Crack",
        severity: "High",
        priority: "Urgent (Within 48h)",
        lifecycle: "Stage 3 - Rapid Propagation",
        recommendation: "Inject epoxy resin immediately and monitor for structural shift."
      });
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#444', mb: 4 }}>
        Defect Lifecycle & Priority Analysis
      </Typography>

      <Box 
        sx={{ 
          border: '2px dashed #ccc', 
          borderRadius: '10px', 
          p: 6, 
          mb: 4, 
          backgroundColor: '#fafafa',
          cursor: 'pointer',
          '&:hover': { borderColor: '#1976d2', backgroundColor: '#f0f7ff' }
        }}
        onClick={runPrediction}
      >
        <AutoAwesomeIcon sx={{ fontSize: 60, color: '#aaa', mb: 2 }} />
        <Typography color="textSecondary">
          {analyzing ? "Gemini is analyzing the defect pattern..." : "Click to Analyze selected File/Image"}
        </Typography>
        {analyzing && <CircularProgress sx={{ mt: 2 }} />}
      </Box>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card sx={{ textAlign: 'left', borderTop: '5px solid #d32f2f', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="textSecondary">Defect Type</Typography>
                  <Typography variant="h6">{analysis.defectType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="textSecondary">Severity</Typography>
                  <Typography variant="h6" color="error">{analysis.severity}</Typography>
                </Grid>
                <Grid item xs={12}>
                   <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="textSecondary">Lifecycle Stage</Typography>
                  <Chip label={analysis.lifecycle} color="warning" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="textSecondary">Priority</Typography>
                  <Chip label={analysis.priority} color="error" />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                    <Typography variant="subtitle2" gutterBottom>AI Recommendation:</Typography>
                    <Typography variant="body2">{analysis.recommendation}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}
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
        
        <LogoContainer>
          <Logo src={njdotLogo} alt="NJ Department of Transportation" />
          <Logo src={jhuLogo} alt="Johns Hopkins University" />
        </LogoContainer>
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
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => handleDeleteFile(index)}><DeleteIcon fontSize="small" /></IconButton>
                }
                sx={{ 
                  backgroundColor: '#f9f9f9', 
                  mb: 1, 
                  borderRadius: '8px',
                  border: '1px solid #eee'
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
                >
                  <DocRetrievalInterface />
                </motion.div>
              )}
              {tabValue === 2 && (
                <motion.div 
                  key="prediction"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
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
