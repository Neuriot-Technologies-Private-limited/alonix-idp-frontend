import { DocumentUploadModal } from '../../pages/documents/DocumentUploadModal';
import {
  continueDedupReview,
  dismissDedupReview,
  reviewItemsFromJobs,
  setDedupChoice,
} from '../../pages/documents/backgroundDocumentUpload';
import { useUploadStore } from '../../stores/uploadStore';

/** Duplicate review stays available after the upload modal closes and after the user leaves Documents. */
export function DedupReviewHost() {
  const jobs = useUploadStore((state) => state.jobs);
  const dedupReview = reviewItemsFromJobs(jobs);
  if (!dedupReview) return null;

  return (
    <DocumentUploadModal
      isOpen
      onClose={() => {
        void dismissDedupReview();
      }}
      orgWideUpload={false}
      groups={[]}
      targetGroupId=""
      setTargetGroupId={() => {}}
      selectedFiles={[]}
      setSelectedFiles={() => {}}
      uploadSensitivityLevel="INTERNAL_USE"
      onUploadSensitivityChange={() => {}}
      uploadSensitivityOptions={[]}
      attachClaimId={false}
      onAttachClaimIdChange={() => {}}
      claimId=""
      onClaimIdChange={() => {}}
      onUpload={() => {}}
      dedupReview={dedupReview}
      onDedupChoice={setDedupChoice}
      onContinueDedup={() => {
        void continueDedupReview();
      }}
    />
  );
}
