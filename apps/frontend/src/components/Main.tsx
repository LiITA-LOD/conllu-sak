import { Box, Tab, Tabs } from '@mui/material';
import type React from 'react';
import { useState } from 'react';
import Joiner from './Joiner';
import Slicer from './Slicer';

type ToolTab = 'slicer' | 'joiner';

const Main: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolTab>('slicer');

  const handleToolChange = (_event: React.SyntheticEvent, newValue: ToolTab) => {
    setSelectedTool(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={selectedTool}
          onChange={handleToolChange}
          aria-label="tool selection tabs"
          centered
        >
          <Tab label="Slicer" value="slicer" />
          <Tab label="Joiner" value="joiner" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 4 }}>
        {selectedTool === 'slicer' && <Slicer />}
        {selectedTool === 'joiner' && <Joiner />}
      </Box>
    </Box>
  );
};

export default Main;
