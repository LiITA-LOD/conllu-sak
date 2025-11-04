import { Alert, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Paper } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import type React from 'react';
import { useState, useEffect } from 'react';
import { ZipWriter, BlobWriter, TextReader } from '@zip.js/zip.js';

interface Chunk {
  content: string;
  tokenCount: number;
  sentenceCount: number;
  filename: string;
  byteSize: number;
}

const Slicer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState(10000);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const content = await readFileContent(file);
        setFileContent(content);
      } catch (error) {
        console.error('Error reading file:', error);
        setFileContent(null);
      }
    }
  };

  useEffect(() => {
    if (fileContent && selectedFile) {
      const previewChunks = splitConlluFile(fileContent, chunkSize);
      setChunks(previewChunks);
    } else {
      setChunks([]);
    }
  }, [fileContent, chunkSize, selectedFile]);

  const splitConlluFile = (content: string, chunksSize: number): Chunk[] => {
    const lines = content.split('\n');
    const chunks: Chunk[] = [];

    let chunkNum = 1;
    let currentTokenCount = 0;
    let currentSentenceCount = 0;
    let currentChunkLines: string[] = [];

    // Get base filename without extension - always use .conllu extension
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'sliced';

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
          const byteSize = new TextEncoder().encode(chunkContent).length;
          chunks.push({
            content: chunkContent,
            tokenCount: currentTokenCount,
            sentenceCount: currentSentenceCount,
            filename: `${baseName}.${chunkNum.toString().padStart(3, '0')}.conllu`,
            byteSize,
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
      const byteSize = new TextEncoder().encode(chunkContent).length;
      chunks.push({
        content: chunkContent,
        tokenCount: currentTokenCount,
        sentenceCount: currentSentenceCount,
        filename: `${baseName}.${chunkNum.toString().padStart(3, '0')}.conllu`,
        byteSize,
      });
    }

    return chunks;
  };

  const handleProcess = async () => {
    if (!selectedFile || chunks.length === 0) return;

    try {
      // Create ZIP file
      const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
      for (const chunk of chunks) {
        await zipWriter.add(chunk.filename, new TextReader(chunk.content));
      }

      // Generate ZIP blob
      const zipBlob = await zipWriter.close();

      // Download ZIP
      await downloadZip(zipBlob, `${selectedFile.name.replace(/\.[^/.]+$/, '')}.zip`);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
          are split at sentence boundaries when the tokens per chunk target is reached.
        </Typography>
      </Alert>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Tokens per chunk target"
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 10000)}
              variant="outlined"
              size="small"
              sx={{ width: 200 }}
              inputProps={{ min: 1 }}
            />
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
      </Box>

      {chunks.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Preview ({chunks.length} chunk{chunks.length !== 1 ? 's' : ''})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Sentences</TableCell>
                  <TableCell align="right">Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chunks.map((chunk) => (
                  <TableRow key={chunk.filename}>
                    <TableCell>{chunk.filename}</TableCell>
                    <TableCell align="right">{chunk.tokenCount.toLocaleString()}</TableCell>
                    <TableCell align="right">{chunk.sentenceCount.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatBytes(chunk.byteSize)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleProcess}
          disabled={!selectedFile || chunks.length === 0}
          sx={{
            px: 4,
            py: 2,
            fontSize: '1.2rem',
            minWidth: 200,
          }}
        >
          Download ZIP
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
