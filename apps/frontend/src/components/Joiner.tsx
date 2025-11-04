import { Alert, Box, Button, Typography } from '@mui/material';
import type React from 'react';
import { useState } from 'react';
import FileUpload, { type UploadedFile } from './Joiner/FileUpload';

const Joiner: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleProcess = async () => {
    try {
      // Read all file contents
      const fileContents = await Promise.all(
        uploadedFiles.map(async (uploadedFile) => {
          const content = await readFileContent(uploadedFile.file);
          return content;
        })
      );

      // Join all file contents with newlines
      const joinedContent = fileContents.join('\n');

      // Create and download the file
      await downloadFile(joinedContent, 'joined.conllu');
    } catch (error) {
      console.error('Error processing files:', error);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(e);
      };
      reader.readAsText(file);
    });
  };

  const downloadFile = async (content: string, filename: string) => {
    // Try to use File System Access API for native "Save As" dialog
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'CoNLL-U Files',
              accept: {
                'text/plain': ['.conllu'],
              },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch (error: any) {
        // User cancelled the dialog, abort silently
        if (error.name !== 'AbortError') {
          console.error('Error saving file:', error);
        }
        return;
      }
    }

    // Fallback to programmatic download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2" component="div">
          <strong>Joiner Tool</strong> — Upload multiple CoNLL-U files and combine them into a
          single file. Files are joined in the order they appear in the list. You can drag and drop
          to reorder them, or use the "Sort Alphabetically" button.
        </Typography>
      </Alert>

      <FileUpload
        uploadedFiles={uploadedFiles}
        onFilesChange={setUploadedFiles}
      />

      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleProcess}
          disabled={uploadedFiles.length === 0}
          sx={{
            px: 4,
            py: 2,
            fontSize: '1.2rem',
            minWidth: 200,
          }}
        >
          Download CoNLL-U
        </Button>
      </Box>
    </Box>
  );
};

export default Joiner;
