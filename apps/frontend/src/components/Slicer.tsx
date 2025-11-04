import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import type React from 'react';
import { useState } from 'react';
import { ZipWriter, BlobWriter, TextWriter } from '@zip.js/zip.js';

interface Chunk {
  content: string;
  tokenCount: number;
  sentenceCount: number;
  filename: string;
}

const Slicer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState(10000);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const splitConlluFile = (content: string, chunksSize: number): Chunk[] => {
    const lines = content.split('\n');
    const chunks: Chunk[] = [];

    let chunkNum = 1;
    let currentTokenCount = 0;
    let currentSentenceCount = 0;
    let currentChunkLines: string[] = [];

    // Get base filename without extension
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'sliced';
    const extension = selectedFile?.name.match(/\.[^/.]+$/)?.[0] || '.conllu';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentChunkLines.push(line);

      // Check if this is a token line (not a comment and not empty)
      if (line.trim() && !line.trim().startsWith('#')) {
        currentTokenCount += 1;
      }

      // Check if this is a sentence boundary (blank line)
      if (line.trim() === '') {
        currentSentenceCount += 1;

        // If we've reached the token threshold, save this chunk
        if (currentTokenCount >= chunksSize) {
          const chunkContent = currentChunkLines.join('\n');
          chunks.push({
            content: chunkContent,
            tokenCount: currentTokenCount,
            sentenceCount: currentSentenceCount,
            filename: `${baseName}.${chunkNum.toString().padStart(3, '0')}${extension}`,
          });

          // Reset for next chunk
          chunkNum += 1;
          currentTokenCount = 0;
          currentSentenceCount = 0;
          currentChunkLines = [];
        }
      }
    }

    // Save the last chunk if it has any content
    if (currentChunkLines.length > 0) {
      const chunkContent = currentChunkLines.join('\n');
      chunks.push({
        content: chunkContent,
        tokenCount: currentTokenCount,
        sentenceCount: currentSentenceCount,
        filename: `${baseName}.${chunkNum.toString().padStart(3, '0')}${extension}`,
      });
    }

    return chunks;
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    try {
      // Read file content
      const content = await readFileContent(selectedFile);

      // Split into chunks
      const chunks = splitConlluFile(content, chunkSize);

      if (chunks.length === 0) {
        alert('No chunks created. The file might be empty or invalid.');
        return;
      }

      // Create ZIP file
      const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
      for (const chunk of chunks) {
        await zipWriter.add(chunk.filename, new TextWriter(chunk.content));
      }

      // Generate ZIP blob
      const zipBlob = await zipWriter.close();

      // Download ZIP
      await downloadZip(zipBlob, `${selectedFile.name.replace(/\.[^/.]+$/, '')}_sliced.zip`);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
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

  const downloadZip = async (blob: Blob, filename: string) => {
    // Try to use File System Access API for native "Save As" dialog
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'ZIP Files',
              accept: {
                'application/zip': ['.zip'],
              },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
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
          <strong>Slicer Tool</strong> — Upload a CoNLL-U file and split it into multiple chunks
          based on token count. Each chunk will be saved as a separate file in a ZIP archive. Files
          are split at sentence boundaries when the token threshold is reached.
        </Typography>
      </Alert>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected'}
          </Typography>
          <input
            accept=".conllu"
            style={{ display: 'none' }}
            id="slicer-file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="slicer-file-upload">
            <Button variant="contained" component="span" startIcon={<UploadIcon />}>
              {selectedFile ? 'Change File' : 'Upload File'}
            </Button>
          </label>
        </Box>
      </Box>

      <Box sx={{ mb: 4, maxWidth: 400 }}>
        <TextField
          label="Tokens per chunk"
          type="number"
          value={chunkSize}
          onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 10000)}
          fullWidth
          variant="outlined"
          helperText="Number of tokens per chunk (default: 10000)"
          inputProps={{ min: 1 }}
        />
      </Box>

      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleProcess}
          disabled={!selectedFile}
          sx={{
            px: 4,
            py: 2,
            fontSize: '1.2rem',
            minWidth: 200,
          }}
        >
          Slice & Download ZIP
        </Button>
        {!selectedFile && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Upload a file to enable slicing
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Slicer;