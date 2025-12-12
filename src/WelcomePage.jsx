import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeaderLogos from './components/HeaderLogos';
import backgroundImg from './assets/background.png';

// Import local logos from assets directory
// Logos are now handled in HeaderLogos component

// Styled components
const WelcomeBackground = styled(Box)({
  position: 'fixed', 
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  textAlign: 'center',
  backgroundImage: `url(${backgroundImg})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center center',
  backgroundSize: 'cover', 
  zIndex: 0,
  overflow: 'hidden',
  // Semi-transparent light overlay
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(21, 21, 21, 0.15)', // Deeper background with a dark, less opaque overlay
    zIndex: 1, // Ensure overlay is above background image but below content
  },
});

const NavBar = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '80px',
  // Frosted Glass Effect - minimal background color, mostly blur
  backgroundColor: 'rgba(255, 255, 255, 0.5)', 
  backdropFilter: 'blur(20px)', // Increased blur for better separation without color
  WebkitBackdropFilter: 'blur(20px)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 50px',
  // Subtle border and shadow for depth
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  zIndex: 10,
});

const NavLinks = styled(Box)({
  display: 'flex',
  gap: '30px',
});

const NavLink = styled(Typography)({
  fontSize: '1.3rem', // Further increased font size
  fontWeight: 600,
  color: '#333',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    color: '#1976d2',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '0%',
    height: '2px',
    bottom: '-5px',
    left: '0',
    backgroundColor: '#1976d2',
    transition: 'width 0.3s',
  },
  '&:hover::after': {
    width: '100%',
  },
});

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/chatbot'); 
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
      },
    },
  };

  return (
    <WelcomeBackground>
      <NavBar>
        <NavLinks>
          <NavLink onClick={handleHomeClick} sx={{ color: '#1976d2' }}>Home</NavLink>
          <NavLink onClick={handleGetStarted}>Dashboard</NavLink>
        </NavLinks>
        
        <HeaderLogos />
      </NavBar>

      <Container 
        maxWidth="md" 
        component={motion.div} 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        sx={{ 
          paddingTop: '80px',
          position: 'relative', // Ensure content is positioned relative
          zIndex: 2, // Place content above the background overlay (zIndex: 1)
        }} 
      >
        <motion.div variants={itemVariants}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 800, 
              letterSpacing: '-0.5px',
              textShadow: '0px 4px 20px rgba(0,0,0,0.6)', 
              marginBottom: '1rem',
              fontSize: { xs: '2.5rem', md: '4rem' } 
            }}
          >
            NJ Bridge Inspection Report <br/>
            <span style={{ color: '#90caf9' }}>AI Analysis Platform</span>
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography 
            variant="h5" 
            component="p" 
            sx={{ 
              mb: 5, 
              fontWeight: 300,
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto',
              textShadow: '0px 2px 10px rgba(0,0,0,0.5)',
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.5rem' }
            }}
          >
            Empowering infrastructure safety with next-generation AI intelligence.
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGetStarted}
            sx={{
              px: 6,
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '50px',
              textTransform: 'none',
              backgroundColor: '#1976d2', 
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#2196f3', // Lighter blue on hover
                transform: 'translateY(-2px) scale(1.02)',
                // Bright glowing halo effect
                boxShadow: '0 0 25px rgba(33, 150, 243, 0.8), 0 0 50px rgba(33, 150, 243, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Enter Platform
          </Button>
        </motion.div>
      </Container>
    </WelcomeBackground>
  );
};

export default WelcomePage;
