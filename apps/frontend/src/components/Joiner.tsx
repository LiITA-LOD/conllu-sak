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
      downloadFile(joinedContent, 'joined.conllu');
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

  const downloadFile = (content: string, filename: string) => {
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
          single file. Files are joined in the order they appear in the list.
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
        {uploadedFiles.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Upload at least one file to enable processing
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Joiner;
