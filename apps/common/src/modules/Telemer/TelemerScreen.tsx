import { useState, useCallback, useMemo, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import {
  CustomButton,
  CustomDialog,
  CustomSnackbar,
  colors,
} from "@insurance-poc/ui";
import Medical, {
  TELEMER_GROUPS,
  TELEMER_SECTIONS,
  type MedicalApplicantTab,
  type MedicalGroup,
  type MedicalHistoryEntry,
  type MedicalSaveRequest,
  type MedicalSaveResponse,
  type MedicalSection,
  type MedicalSubmitPayload,
} from "../Medical";

export interface TelemerHistoryAttempt {
  readonly id: string;
  readonly attemptNumber: number;
  readonly callType: "Telephonic-MER" | "Video-MER";
  readonly callDate: string;
  readonly duration: string;
  readonly examinerName: string;
  readonly registrationId: string;
  readonly summary: string;
  readonly disclosures: readonly string[];
}

export interface TelemerDocumentItem {
  readonly id: string;
  readonly name: string;
  readonly uploadedDate: string;
  readonly fileType: "PDF" | "IMAGE" | "DOC";
}

export interface TelemerScreenProps {
  summary?: ReactNode;
  applicationNo?: string;
  taskId?: string;
  applicants?: readonly MedicalApplicantTab[];
  /** Party id of each applicant tab, keyed by the tab key. The save request needs the active tab's party id. */
  partyIds?: Readonly<Record<string, string>>;
  /**
   * Saves one edited section through the medical save API (same contract as `Medical.onSaveSection`).
   * When omitted, Save stays local-only.
   */
  onSaveSection?: (request: MedicalSaveRequest) => Promise<MedicalSaveResponse>;
  groups?: readonly MedicalGroup[];
  sections?: readonly MedicalSection[];
  /** Past section data (from the medical fetch mapper), shown by the MER / Tele MER History button. */
  history?: Readonly<Record<string, readonly MedicalHistoryEntry[]>>;
  historyRecords?: Record<string, readonly TelemerHistoryAttempt[]>;
  documents?: Record<string, readonly TelemerDocumentItem[]>;
  onBack?: () => void;
  onSubmitTask?: (payload: {
    taskId: string;
    applicationNo: string;
    completedApplicants: string[];
  }) => Promise<void> | void;
  onNavigateInbox?: () => void;
}

/** The document list of the Telemer screen offers only the Tele MER sections. */
const TELEMER_CATALOG = { sections: TELEMER_SECTIONS, groups: TELEMER_GROUPS } as const;

const DEFAULT_TELEMER_APPLICANTS: readonly MedicalApplicantTab[] = [
  { key: "lifeAssured1", label: "Life Assured 1" },
  { key: "lifeAssured2", label: "Life Assured 2" },
  { key: "proposer", label: "Proposer" },
];

const DEFAULT_TELEMER_HISTORY: Record<string, readonly TelemerHistoryAttempt[]> = {
  lifeAssured1: [
    {
      id: "hist-1",
      attemptNumber: 2,
      callType: "Video-MER",
      callDate: "12 Nov 2026, 11:30 AM",
      duration: "14 min 22 sec",
      examinerName: "Dr. Mina Sharma",
      registrationId: "REG-123456",
      summary: "Identity verified via video check. Applicant disclosed Scoliosis (15% disability). Alcohol disclosed (Beer 4 qty/wk, 12 yrs).",
      disclosures: [
        "Height: 160 cm, Weight: 60 kg, BMI: 23.44",
        "Disclosed physical deformity: Scoliosis (spine affected, disability certificate present)",
        "Disclosed previous life insurance postponement 2 years ago due to BMI, accepted now",
      ],
    },
    {
      id: "hist-2",
      attemptNumber: 1,
      callType: "Telephonic-MER",
      callDate: "08 Nov 2026, 04:15 PM",
      duration: "3 min 45 sec",
      examinerName: "Tele-Nurse Priya V",
      registrationId: "REG-994821",
      summary: "Video-MER recommended for posture check due to physical deformity disclosure.",
      disclosures: [
        "Physical deformity disclosed over phone. Converted to Video-MER per UW protocol.",
      ],
    },
  ],
  lifeAssured2: [
    {
      id: "hist-3",
      attemptNumber: 1,
      callType: "Telephonic-MER",
      callDate: "10 Nov 2026, 02:00 PM",
      duration: "8 min 10 sec",
      examinerName: "Dr. Anil Kumar",
      registrationId: "REG-552109",
      summary: "Clear telephonic report. No adverse medical or lifestyle findings reported.",
      disclosures: [
        "Height: 155 cm, Weight: 52 kg, BMI: 21.64",
        "No previous hospitalizations or critical illnesses disclosed",
      ],
    },
  ],
  proposer: [
    {
      id: "hist-4",
      attemptNumber: 1,
      callType: "Telephonic-MER",
      callDate: "10 Nov 2026, 03:30 PM",
      duration: "6 min 15 sec",
      examinerName: "Dr. Anil Kumar",
      registrationId: "REG-552109",
      summary: "Clear report for Proposer. All lifestyle questions answered negative.",
      disclosures: [
        "Height: 172 cm, Weight: 70 kg, BMI: 23.66",
        "Non-smoker, non-drinker",
      ],
    },
  ],
};

const DEFAULT_TELEMER_DOCUMENTS: Record<string, readonly TelemerDocumentItem[]> = {
  lifeAssured1: [
    { id: "doc-1", name: "Tele-MER Report PDF (Dr. Mina Sharma)", uploadedDate: "12 Nov 2026", fileType: "PDF" },
    { id: "doc-2", name: "Application Form (Duly Signed)", uploadedDate: "02 Nov 2026", fileType: "PDF" },
    { id: "doc-3", name: "Disability Certificate (Scoliosis 15%)", uploadedDate: "05 Nov 2026", fileType: "PDF" },
    { id: "doc-4", name: "Previous Insurance Policy & Terms Letter", uploadedDate: "05 Nov 2026", fileType: "PDF" },
    { id: "doc-5", name: "Aadhaar / Video KYC Verification Document", uploadedDate: "12 Nov 2026", fileType: "PDF" },
  ],
  lifeAssured2: [
    { id: "doc-6", name: "Tele-MER Report PDF (Dr. Anil Kumar)", uploadedDate: "10 Nov 2026", fileType: "PDF" },
    { id: "doc-7", name: "Application Form (Duly Signed)", uploadedDate: "02 Nov 2026", fileType: "PDF" },
  ],
  proposer: [
    { id: "doc-8", name: "Tele-MER Report PDF (Dr. Anil Kumar)", uploadedDate: "10 Nov 2026", fileType: "PDF" },
    { id: "doc-9", name: "Application Form (Duly Signed)", uploadedDate: "02 Nov 2026", fileType: "PDF" },
  ],
};

export function TelemerScreen({
  summary,
  applicationNo = "OS90377743",
  taskId = "TSK-10293",
  applicants = DEFAULT_TELEMER_APPLICANTS,
  partyIds,
  onSaveSection,
  groups = TELEMER_GROUPS,
  sections = TELEMER_SECTIONS,
  history,
  historyRecords = DEFAULT_TELEMER_HISTORY,
  documents = DEFAULT_TELEMER_DOCUMENTS,
  onBack,
  onSubmitTask,
  onNavigateInbox,
}: Readonly<TelemerScreenProps>) {
  const [activeApplicantKey, setActiveApplicantKey] = useState<string>(
    applicants[0]?.key ?? "lifeAssured1"
  );
  const [isOverallEditing, setIsOverallEditing] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [documentModalOpen, setDocumentModalOpen] = useState<boolean>(false);
  const [savedApplicants, setSavedApplicants] = useState<ReadonlySet<string>>(
    new Set<string>()
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When overall editing is enabled, all Telemer sections are marked alwaysEditable
  const activeSections = useMemo<readonly MedicalSection[]>(() => {
    if (!isOverallEditing) return sections;
    return sections.map((sec) =>
      sec.key === "application_form_medical_lifestyle"
        ? sec
        : { ...sec, alwaysEditable: true }
    );
  }, [sections, isOverallEditing]);

  const activeGroups = useMemo<readonly MedicalGroup[]>(() => {
    if (!isOverallEditing) return groups;
    return groups.map((grp) => ({
      ...grp,
      sections: grp.sections.map((sec) =>
        sec.key === "application_form_medical_lifestyle"
          ? sec
          : { ...sec, alwaysEditable: true }
      ),
    }));
  }, [groups, isOverallEditing]);

  const allApplicantsCompleted = useMemo(() => {
    return applicants.every((applicant) => savedApplicants.has(applicant.key));
  }, [applicants, savedApplicants]);

  const handleApplicantChange = useCallback((key: string) => {
    setActiveApplicantKey(key);
    setIsOverallEditing(false);
  }, []);

  const handleSectionSubmit = useCallback(
    (payload: MedicalSubmitPayload) => {
      setSavedApplicants((prev) => new Set([...prev, payload.applicantKey]));
      setSnackbarMessage(
        `Data for ${
          applicants.find((a) => a.key === payload.applicantKey)?.label ??
          payload.applicantKey
        } saved successfully.`
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setIsOverallEditing(false);
    },
    [applicants]
  );

  const handleToggleOverallEdit = useCallback(() => {
    setIsOverallEditing((prev) => !prev);
  }, []);

  const handleOpenSubmitModal = useCallback(() => {
    setConfirmModalOpen(true);
  }, []);

  const handleCloseSubmitModal = useCallback(() => {
    if (!isSubmitting) {
      setConfirmModalOpen(false);
    }
  }, [isSubmitting]);

  const handleConfirmTaskCompletion = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (onSubmitTask) {
        await onSubmitTask({
          taskId,
          applicationNo,
          completedApplicants: Array.from(savedApplicants),
        });
      }
      setConfirmModalOpen(false);
      setSnackbarMessage("Task submitted and completed successfully. Returning to Inbox.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setTimeout(() => {
        if (onNavigateInbox) {
          onNavigateInbox();
        } else if (onBack) {
          onBack();
        }
      }, 800);
    } catch {
      setSnackbarMessage("Failed to submit task. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    onSubmitTask,
    taskId,
    applicationNo,
    savedApplicants,
    onNavigateInbox,
    onBack,
  ]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Top Controls: History & Edit Telemer Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          px: 2,
          py: 0.75,
          bgcolor: colors.white,
          borderBottom: `1px solid ${colors.borderBrand}`,
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: colors.textMuted, fontSize: "11.5px", mr: "auto" }}>
          Mode:{" "}
          <strong style={{ color: isOverallEditing ? colors.primary : colors.textStrong }}>
            {isOverallEditing ? "Editing All Telemer Sections" : "View"}
          </strong>
        </Typography>

        <CustomButton
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => setDocumentModalOpen(true)}
        >
          View Documents
        </CustomButton>

        <CustomButton
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => setHistoryModalOpen(true)}
        >
          History
        </CustomButton>

        <CustomButton
          variant={isOverallEditing ? "outlined" : "contained"}
          color={isOverallEditing ? "secondary" : "primary"}
          size="small"
          onClick={handleToggleOverallEdit}
        >
          {isOverallEditing ? "Cancel Edit" : "Edit Telemer"}
        </CustomButton>
      </Box>

      {/* Main Medical Module configured with Telemer Sections & Groups */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Medical
          summary={summary}
          applicationNumber={applicationNo}
          partyId={partyIds?.[activeApplicantKey]}
          onSaveSection={onSaveSection}
          applicants={applicants}
          initialApplicantKey={activeApplicantKey}
          groups={activeGroups}
          sections={activeSections}
          catalog={TELEMER_CATALOG}
          history={history}
          onApplicantChange={handleApplicantChange}
          onBack={onBack}
          onSubmit={handleSectionSubmit}
        />
      </Box>

      {/* Sticky Action Footer */}
      <Box
        component="footer"
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          bgcolor: colors.white,
          borderTop: `2px solid ${colors.borderBrand}`,
          boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: colors.textMuted, fontSize: "11.5px" }}>
            Completed Lives:{" "}
            <strong style={{ color: colors.textStrong }}>
              {savedApplicants.size} of {applicants.length}
            </strong>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CustomButton
            variant="contained"
            color="primary"
            size="small"
            disabled={!allApplicantsCompleted || isSubmitting}
            onClick={handleOpenSubmitModal}
          >
            Submit &amp; Complete Task
          </CustomButton>
        </Box>
      </Box>

      {/* Task Confirmation Dialog */}
      <CustomDialog
        open={confirmModalOpen}
        title="Complete Tele-MER Task?"
        onClose={handleCloseSubmitModal}
        actions={
          <>
            <CustomButton
              variant="outlined"
              color="secondary"
              disabled={isSubmitting}
              onClick={handleCloseSubmitModal}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              onClick={handleConfirmTaskCompletion}
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </CustomButton>
          </>
        }
      >
        <Typography variant="body2" sx={{ color: colors.textBody, mt: 1 }}>
          Data entry for all {applicants.length} applicant(s) has been verified and saved.
          Submitting will close task <strong>{taskId}</strong> for Application{" "}
          <strong>{applicationNo}</strong> and return to the Inbox.
        </Typography>
      </CustomDialog>

      {/* Historical Telemer Records Dialog (Read-Only Replica of Telemer Sections) */}
      <CustomDialog
        open={historyModalOpen}
        title={`Historical Tele-MER Records (Read-Only Replica) — ${
          applicants.find((a) => a.key === activeApplicantKey)?.label ?? activeApplicantKey
        }`}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="lg"
        fullWidth
        actions={
          <CustomButton
            variant="outlined"
            color="secondary"
            onClick={() => setHistoryModalOpen(false)}
          >
            Close
          </CustomButton>
        }
      >
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="caption" sx={{ color: colors.textMuted }}>
            Application No: <strong>{applicationNo}</strong> | Total Historical Attempts:{" "}
            <strong>{historyRecords[activeApplicantKey]?.length ?? 0}</strong>
          </Typography>

          {(historyRecords[activeApplicantKey] ?? []).map((attempt) => (
            <Box
              key={attempt.id}
              sx={{
                border: `1px solid ${colors.borderBrand}`,
                borderRadius: "4px",
                p: 1.5,
                bgcolor: colors.background,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {/* Attempt Header & Metadata */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  pb: 0.75,
                  borderBottom: `1px solid ${colors.borderBrand}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.brandRed }}>
                  Attempt #{attempt.attemptNumber}: {attempt.callType} ({attempt.callDate})
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textMuted, fontSize: "11px" }}>
                    Duration: <strong>{attempt.duration}</strong>
                  </Typography>
                </Box>
              </Box>

              {/* Replica Section 2: Tele/Video MER Details */}
              <Box sx={{ bgcolor: colors.white, p: 1.5, borderRadius: "4px", border: `1px solid ${colors.borderBrand}` }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: colors.brandRed, display: "block", mb: 1 }}>
                  2. Tele/Video MER Details
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Examiner Name</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>{attempt.examinerName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Registration ID</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>{attempt.registrationId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Call Type</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>{attempt.callType}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Tele Findings</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>OK / Verified</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Final Remark</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>{attempt.summary}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Replica Section 3: Measurements */}
              <Box sx={{ bgcolor: colors.white, p: 1.5, borderRadius: "4px", border: `1px solid ${colors.borderBrand}` }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: colors.brandRed, display: "block", mb: 1 }}>
                  3. Measurements
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Height (cms)</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>160</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Height (ft)</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>5</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Inches</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>3</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>Weight (kgs)</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 700 }}>60</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.textMuted, display: "block" }}>BMI</Typography>
                    <Typography variant="body2" sx={{ fontSize: "11.5px", fontWeight: 800, color: colors.primary }}>23.44</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Replica Section 6: Key Disclosures / Question Summary */}
              {attempt.disclosures.length > 0 && (
                <Box sx={{ bgcolor: colors.white, p: 1.5, borderRadius: "4px", border: `1px solid ${colors.borderBrand}` }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: colors.brandRed, display: "block", mb: 0.5 }}>
                    6. Recorded Question Disclosures
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, fontSize: "11px", color: colors.textBody }}>
                    {attempt.disclosures.map((disc, idx) => (
                      <li key={idx}>{disc}</li>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </CustomDialog>

      {/* Document Viewer Dialog */}
      <CustomDialog
        open={documentModalOpen}
        title={`Application & Medical Documents — ${
          applicants.find((a) => a.key === activeApplicantKey)?.label ?? activeApplicantKey
        }`}
        onClose={() => setDocumentModalOpen(false)}
        maxWidth="md"
        fullWidth
        actions={
          <CustomButton
            variant="outlined"
            color="secondary"
            onClick={() => setDocumentModalOpen(false)}
          >
            Close
          </CustomButton>
        }
      >
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="caption" sx={{ color: colors.textMuted }}>
            Application No: <strong>{applicationNo}</strong> | Available Documents:{" "}
            <strong>{documents[activeApplicantKey]?.length ?? 0}</strong>
          </Typography>

          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11.5px",
              mt: 1,
              "& th, & td": {
                border: `1px solid ${colors.borderBrand}`,
                p: 1,
                textAlign: "left",
              },
              "& th": { bgcolor: colors.background, fontWeight: 800 },
            }}
          >
            <thead>
              <tr>
                <th style={{ width: "55%" }}>Document Name</th>
                <th style={{ width: "25%" }}>Uploaded Date</th>
                <th style={{ width: "20%", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(documents[activeApplicantKey] ?? []).map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{doc.name}</strong></td>
                  <td>{doc.uploadedDate}</td>
                  <td style={{ textAlign: "center" }}>
                    <CustomButton
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => {
                        setSnackbarMessage(`Opening ${doc.name}...`);
                        setSnackbarSeverity("success");
                        setSnackbarOpen(true);
                      }}
                    >
                      View {doc.fileType}
                    </CustomButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </CustomDialog>

      {/* Snackbar feedback */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
}

export default TelemerScreen;
