import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { announce } = useAnnounce();

  const allowedExtensions = ['pdf', 'docx', 'pptx', 'txt', 'mp3', 'mp4'];

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      const errorMsg = `Invalid file format ".${ext}". Accepted formats: PDF, DOCX, PPTX, TXT, MP3, MP4.`;
      setValidationError(errorMsg);
      setSelectedFileName(null);
      announce(errorMsg, 'assertive');
      return;
    }

    setValidationError(null);
    setSelectedFileName(file.name);
    announce(`File "${file.name}" selected. Starting accessibility pipeline conversion.`, 'polite');
    onFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Accessible Upload Target Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
          isDragOver
            ? 'border-accent bg-accent/10 ring-2 ring-accent'
            : 'border-border bg-surface-raised hover:bg-surface'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-saathi-navy text-white flex items-center justify-center font-bold shadow-md">
          <Upload className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-extrabold text-text-primary">
            Drag & Drop Course Materials
          </h2>
          <p className="text-xs text-text-secondary">
            Supported formats: <strong>PDF, DOCX, PPTX, TXT, MP3, MP4</strong>
          </p>
        </div>

        {/* Real HTML Input File Button */}
        <div>
          <input
            ref={fileInputRef}
            id="real-file-input"
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.mp3,.mp4"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor="real-file-input"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="px-6 py-2.5 font-bold text-xs rounded-xl bg-accent text-accent-fg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center space-x-2 shadow-xs focus-visible:ring-2"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>Browse File from Device</span>
          </label>
        </div>

        {/* Selected File or Inline Error Validation Message */}
        {selectedFileName && !validationError && (
          <div className="p-2.5 rounded-lg bg-success/10 border border-success text-success text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>File Ready: {selectedFileName}</span>
          </div>
        )}

        {validationError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-danger/10 border border-danger text-danger text-xs font-bold flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
