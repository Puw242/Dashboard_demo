import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/system';

import jhuLogo from '../assets/JHU_logo_icon_only.svg';
import njdotLogo from '../assets/njdot_Logo.png';
import rutgersLogo from '../assets/Rutgers-Logo_icon_only.png';
import keanLogo from '../assets/Kean_Logo.png';

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

const HeaderLogos = () => {
  return (
    <LogoContainer>
      <Logo src={njdotLogo} alt="NJ Department of Transportation" />
      <Box sx={{ width: '2px', height: '35px', backgroundColor: 'rgba(0,0,0,0.1)', marginLeft: '25px' }} />
      <Logo src={rutgersLogo} alt="Rutgers University" sx={{ marginLeft: '10px' }} />
      <Logo src={jhuLogo} alt="Johns Hopkins University" sx={{ marginLeft: '10px' }} />
      {/* Unified control for Kean Logo: spacing is now consistent across pages */}
      <Logo src={keanLogo} alt="Kean University" sx={{ marginLeft: '6px', marginRight: '-20px' }} />
    </LogoContainer>
  );
};

export default HeaderLogos;
