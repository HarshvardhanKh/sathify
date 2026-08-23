import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { DocumentGrid } from '../../components/features/library/DocumentGrid';
import { UploadZone } from '../../components/features/library/UploadZone';
import { ConversionJobCard } from '../../components/features/library/ConversionJobCard';
import { ConversionJob } from '../../types/domain';
import { Plus } from 'lucide-react';
import { useAnnounce } from '../../hooks/useAnnounce';
import { api } from '../../services/api';

export const LibraryPage: React.FC = () => {
  const library = useAppStore((s) => s.library);
  const addDocumentToLibrary = useAppStore((s) => s.addDocumentToLibrary);
  
  const [isUploading, setIsUploading] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ConversionJob[]>([]);
  const { announce } = useAnnounce();

  const handleFileUpload = async (file: File) => {
    const jobId = `job-${Date.now()}`;

    const newJob: ConversionJob = {
      jobId,
      documentId: file.name,
      progressPct: 10,
      currentStep: 'Uploading file',
      status: 'converting',
      estimatedTimeRemainingSec: 15,
    };
    setActiveJobs((prev) => [newJob, ...prev]);

    // Real upload: PDF/PPTX/image handled by the backend's document
    // intelligence pipeline (pypdf / python-pptx / Gemini semantic
    // restructuring, with an honest fallback when no Gemini key is configured).
    const uploadResult = await api.uploadDocument(file);
    if (!uploadResult.ok) {
      setActiveJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, status: 'failed', error: uploadResult.error.message } : j))
      );
      announce(`Upload failed for "${file.name}": ${uploadResult.error.message}`, 'assertive');
      return;
    }

    setActiveJobs((prev) =>
      prev.map((j) => (j.jobId === jobId ? { ...j, progressPct: 40, currentStep: 'Extracting and restructuring content' } : j))
    );

    const convertResult = await api.convertDocument(uploadResult.value.id, 'original');
    if (!convertResult.ok) {
      setActiveJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, status: 'failed', error: convertResult.error.message } : j))
      );
      announce(`Conversion failed for "${file.name}": ${convertResult.error.message}`, 'assertive');
      return;
    }

    setActiveJobs((prev) =>
      prev.map((j) => (j.jobId === jobId ? { ...j, progressPct: 100, currentStep: 'Ready', status: 'completed' } : j))
    );
    addDocumentToLibrary(convertResult.value.document);
    announce(
      `"${file.name}" converted and added to your library` +
        (convertResult.value.aiUsed ? '.' : ' (AI restructuring unavailable — showing raw extracted text).'),
      'polite'
    );
  };

  const handleRetryStage = (jobId: string, stageName: string) => {
    announce(`Retrying pipeline stage "${stageName}" for job ${jobId}.`, 'polite');
    setActiveJobs((prev) =>
      prev.map((j) => (j.jobId === jobId ? { ...j, status: 'converting', progressPct: 50, currentStep: stageName } : j))
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Course Material Library</h1>
          <p className="text-xs text-text-secondary">Converted course materials, textbooks, and in-flight pipeline jobs</p>
        </div>

        <button
          onClick={() => setIsUploading(!isUploading)}
          aria-expanded={isUploading}
          className="px-4 py-2.5 font-bold text-sm rounded-xl bg-accent text-accent-fg hover:opacity-90 flex items-center space-x-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Course Material</span>
        </button>
      </div>

      {/* Upload Zone Drawer */}
      {isUploading && (
        <div className="space-y-4">
          <UploadZone onFileUpload={handleFileUpload} />
        </div>
      )}

      {/* Active Pipeline Conversion Jobs */}
      {activeJobs.length > 0 && (
        <section aria-label="In-Flight Conversion Jobs" className="space-y-3">
          <h2 className="text-lg font-bold text-text-primary">In-Flight Pipeline Conversions ({activeJobs.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <ConversionJobCard key={job.jobId} job={job} onRetryStage={handleRetryStage} />
            ))}
          </div>
        </section>
      )}

      {/* Document Grid Collection */}
      <DocumentGrid documents={library} onUploadClick={() => setIsUploading(true)} />
    </div>
  );
};
