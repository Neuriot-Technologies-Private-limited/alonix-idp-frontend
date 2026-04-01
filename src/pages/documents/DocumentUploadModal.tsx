import React from 'react';
import { UploadCloud, Upload, Folder, File, X, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgWideUpload: boolean;
  groups: any[];
  targetGroupId: string;
  setTargetGroupId: (id: string) => void;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isUploading: boolean;
  onUpload: () => Promise<void>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  orgWideUpload,
  groups,
  targetGroupId,
  setTargetGroupId,
  selectedFiles,
  setSelectedFiles,
  isUploading,
  onUpload,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Assets"
      subtitle="Ingest documents into the pipeline"
      icon={<UploadCloud className="w-6 h-6" />}
      footer={
        <div className="flex gap-3 min-w-0 items-stretch">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 min-h-[48px] min-w-0 px-4 rounded-2xl border border-border/10 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-surface-highest/10 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center shrink-0 touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedFiles.length === 0 || (orgWideUpload && !targetGroupId) || isUploading}
            onClick={onUpload}
            className={cn(
              'flex-1 min-h-[48px] min-w-0 px-4 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20',
              'flex items-center justify-center gap-2 shrink-0 touch-manipulation',
              'transition-colors hover:brightness-110 active:brightness-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary-foreground" aria-hidden />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 shrink-0" aria-hidden />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {orgWideUpload && (
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">
              Target Group
            </label>
            <div className="relative group">
              <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full bg-surface-highest/5 border border-border/10 rounded-xl pl-10 pr-5 py-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium appearance-none text-foreground"
              >
                <option value="" disabled className="bg-surface-lowest">
                  Select a group...
                </option>
                {groups.map((g: any) => (
                  <option key={g.groupId} value={g.groupId} className="bg-surface-lowest">
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles((prev) => [...prev, ...files]);
          }}
          className={cn(
            'border-2 border-dashed border-border/10 rounded-[24px] p-10 flex flex-col items-center justify-center gap-4 transition-all hover:bg-surface-highest/5 group/drop relative',
            selectedFiles.length > 0 ? 'border-primary/20 bg-primary/5' : 'hover:border-primary/20'
          )}
        >
          <div className="w-16 h-16 rounded-full bg-surface-highest/5 flex items-center justify-center text-muted-foreground/20 group-hover/drop:text-primary/40 transition-colors">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold text-foreground">Click or drag files here to upload</p>
            <p className="text-[10px] text-muted-foreground/30 font-medium mt-1">PDF, JSON, XLSX, or CSV up to 50MB</p>
          </div>
          <input
            type="file"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setSelectedFiles((prev) => [...prev, ...files]);
            }}
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
            {selectedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between p-3 bg-surface-highest/5 border border-border/10 rounded-xl group/file"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
