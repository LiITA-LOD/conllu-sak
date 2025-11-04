import {
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
}

interface FileItemProps {
  file: UploadedFile;
  removeFile: (id: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, removeFile }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  return (
    <ListItem
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: isDragging ? 'primary.light' : 'background.paper',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: isDragging ? 4 : 0,
        position: 'relative',
        zIndex: isDragging ? 1000 : 'auto',
      }}
    >
      <ListItemIcon {...attributes} {...listeners}>
        <DragIndicatorIcon
          color="action"
          sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
        />
      </ListItemIcon>
      <ListItemText
        primary={file.name}
        secondary={`${(file.file.size / 1024).toFixed(1)} KB`}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => removeFile(file.id)}
          color="error"
          title="Remove file"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </ListItem>
  );
};

interface FileUploadProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  uploadedFiles,
  onFilesChange,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = uploadedFiles.findIndex((file) => file.id === active.id);
      const newIndex = uploadedFiles.findIndex((file) => file.id === over.id);
      onFilesChange(arrayMove(uploadedFiles, oldIndex, newIndex));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
    }));
    onFilesChange([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (id: string) => {
    onFilesChange(uploadedFiles.filter((file) => file.id !== id));
  };

  return (
    <Box sx={{ mb: 4 }}>
      {uploadedFiles.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={uploadedFiles.map((file) => file.id)}
            strategy={verticalListSortingStrategy}
          >
            <List>
              {uploadedFiles.map((file) => (
                <FileItem key={file.id} file={file} removeFile={removeFile} />
              ))}
            </List>
          </SortableContext>
        </DndContext>

      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Uploaded Files: {uploadedFiles.length}
        </Typography>
        <input
          accept=".conllu"
          style={{ display: 'none' }}
          id="file-upload"
          multiple
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
          >
            Upload Files
          </Button>
        </label>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select multiple files to upload. You can drag and drop to reorder
        them.
      </Typography>

    </Box>
  );
};

export default FileUpload;
