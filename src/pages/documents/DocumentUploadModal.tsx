import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Upload, Folder, File, X, Shield } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ThemedSelect } from '../../components/ui/ThemedSelect';
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
  /** Sensitivity tier applied to every file in this batch. */
  uploadSensitivityLevel: string;
  onUploadSensitivityChange: (level: string) => void;
  uploadSensitivityOptions: { value: string; label: string; hint: string }[];
  onUpload: () => void;
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
  uploadSensitivityLevel,
  onUploadSensitivityChange,
  uploadSensitivityOptions,
  onUpload,
}) => {
  const { t } = useTranslation('documents');

  const selectedHint =
    uploadSensitivityOptions.find((o) => o.value === uploadSensitivityLevel)?.hint ??
    t('upload.appliesHint');

  const groupSelectOptions = useMemo(
    () => groups.map((g: { groupId: string; groupName: string }) => ({ value: g.groupId, label: g.groupName })),
    [groups]
  );

  const sensitivitySelectOptions = useMemo(
    () => uploadSensitivityOptions.map((o) => ({ value: o.value, label: o.label, description: o.hint })),
    [uploadSensitivityOptions]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('upload.title')}
      subtitle={t('upload.subtitle')}
      icon={<UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-2.5 min-w-0 items-stretch sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] min-w-0 rounded-xl border border-border/40 bg-surface-lowest/80 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:border-border hover:bg-surface-highest/15 hover:text-foreground sm:min-h-[48px] sm:px-4 sm:text-[11px]"
          >
            {t('upload.cancelButton')}
          </button>
          <button
            type="button"
            disabled={selectedFiles.length === 0 || (orgWideUpload && !targetGroupId)}
            onClick={onUpload}
            className={cn(
              'flex-1 min-h-[44px] min-w-0 rounded-xl bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-md shadow-primary/15 sm:min-h-[48px] sm:px-4 sm:text-[11px]',
              'inline-flex items-center justify-center gap-2 transition-[filter,opacity] hover:brightness-105 active:brightness-95',
              'disabled:pointer-events-none disabled:opacity-45 disabled:brightness-100'
            )}
          >
            <Upload className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            {selectedFiles.length > 0
              ? t('upload.uploadWithCount', { count: selectedFiles.length })
              : t('upload.uploadButton')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Primary: drop zone — compact vertical footprint */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles((prev) => [...prev, ...files]);
          }}
          className={cn(
            'relative overflow-hidden rounded-2xl border-2 border-dashed border-border/25 bg-gradient-to-b from-surface-highest/12 to-transparent px-4 py-7 transition-colors',
            'hover:border-primary/30 hover:from-primary/[0.06]',
            selectedFiles.length > 0 && 'border-primary/35 from-primary/[0.08]'
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.04] to-transparent" />
          <div className="relative flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/30 bg-surface-lowest/80 text-primary/80 shadow-sm">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t('upload.dropZoneTitle')}</p>
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/55">
                {t('upload.dropZoneHint')}
              </p>
            </div>
          </div>
          <input
            type="file"
            multiple
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setSelectedFiles((prev) => [...prev, ...files]);
            }}
          />
        </div>

        {/* Settings: single card, dropdowns only — minimal scroll */}
        <div className="rounded-xl border border-border/35 bg-surface-highest/[0.06] p-3.5 dark:bg-surface-highest/10">
          <div className="mb-2.5 flex items-center gap-2 border-b border-border/20 pb-2 dark:border-border/30">
            <Shield className="h-3.5 w-3.5 text-primary/70" aria-hidden />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
              {t('upload.batchSettings')}
            </span>
          </div>

          <div className="space-y-3">
            {orgWideUpload ? (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground/70">{t('upload.workspaceLabel')}</span>
                <ThemedSelect
                  id="upload-modal-group"
                  aria-label={t('upload.workspaceLabel')}
                  placeholder={t('upload.workspacePlaceholder')}
                  value={targetGroupId}
                  onChange={setTargetGroupId}
                  options={groupSelectOptions}
                  leftIcon={<Folder className="h-3.5 w-3.5" />}
                />
              </div>
            ) : null}

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground/70">{t('upload.sensitivityLabel')}</span>
              {uploadSensitivityOptions.length > 0 ? (
                <>
                  <ThemedSelect
                     id="upload-modal-sensitivity"
                     aria-label={t('upload.sensitivityLabel')}
                     value={uploadSensitivityLevel}
                     onChange={onUploadSensitivityChange}
                     options={sensitivitySelectOptions}
                  />
                  <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground/50">{selectedHint}</p>
                </>
              ) : (
                <p className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                  {t('upload.noSensitivityTiers')}
                </p>
              )}
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                {t('upload.filesLabel', { count: selectedFiles.length })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 transition-colors hover:text-destructive"
              >
                {t('upload.clearAll')}
              </button>
            </div>
            <ul className="max-h-[min(28vh,9.5rem)] space-y-1 overflow-y-auto rounded-lg border border-border/25 bg-surface-highest/[0.04] p-1.5 pr-1 dark:border-border/35">
              {selectedFiles.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-border/30 hover:bg-surface-lowest/40"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <File className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[9px] font-medium tabular-nums text-muted-foreground/45">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground/35 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
