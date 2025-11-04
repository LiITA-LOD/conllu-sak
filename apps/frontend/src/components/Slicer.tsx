import { Box, Typography } from '@mui/material';
import type React from 'react';

const Slicer: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Slicer Tool
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This tool will allow you to slice CoNLL-U files.
      </Typography>
    </Box>
  );
};

export default Slicer;
