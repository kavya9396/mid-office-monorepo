import { useState, useEffect } from "react";
import { ClaimAudit } from "@insurance-poc/common/claim-audit";
import { GrievanceHistory } from "@insurance-poc/common/grievance-history";
import { SpecialRemarks } from "@insurance-poc/common/special-remarks";
import { UwGuidelines, type UwGuidelineRow } from "@insurance-poc/common/uw-guidelines";
import { CustomBox, CustomDialog } from "@insurance-poc/ui";
import type { GuwDialogSections } from "../../services/drsService";
import {
  loadGuwSubmittedDecision,
  loadValidatedRowIds,
  markRowValidated,
  saveGuwSubmittedDecision,
} from "../../services/drsService";
import { useLazyGetMmtGrievancesQuery } from "../../services/mmtGrievanceApi";
import type { MmtGrievanceMemberContext } from "../../services/mmtGrievanceService";

export type GuwSectionDialogKey =
  | "grievanceHistory"
  | "claimAudit"
  | "uwGuidelines"
  | "specialRemarks";

export interface GuwSectionDialogsProps {
  /** `GuwDrsRecord.sections`; every table, header and choice list comes from here. */
  sections: GuwDialogSections;
  /** Dialog currently shown, or null when all are closed. */
  open: GuwSectionDialogKey | null;
  onClose: () => void;
  /** Shows a message (snackbar) owned by the page. */
  notify: (message: string) => void;
  /** Claim Audit / Special Remarks / UW Guidelines can be validated or edited. Default true. */
  editable?: boolean;
  /**
   * Key (application / member) under which Claim Audit and Special Remarks "Validate" clicks are kept for the
   * logged-in user. Must match the key the UW panel checks on Submit.
   */
  validationKey?: string;
  /** Context sent to `VITE_MMT_GRIEVANCE_FETCH_API` when fetching grievance history. */
  grievanceContext?: MmtGrievanceMemberContext;
}

/**
 * Grievance History, Claim Audit, UW Guidelines and Special Remarks dialogs shared by every GUW-family
 * DRS page (GUW, GUW member, HOD, Sr UW). Pages only pass the mapped `sections`.
 */
export function GuwSectionDialogs({
  sections,
  open,
  onClose,
  notify,
  editable = true,
  validationKey = "",
  grievanceContext,
}: Readonly<GuwSectionDialogsProps>) {
  const [fetchGrievances, fetchGrievanceState] = useLazyGetMmtGrievancesQuery();
  const [validatedClaimIds, setValidatedClaimIds] = useState<string[]>(() =>
    loadValidatedRowIds(validationKey, "claimAudit"),
  );
  const [validatedRemarkIds, setValidatedRemarkIds] = useState<string[]>(() =>
    loadValidatedRowIds(validationKey, "specialRemarks"),
  );
  const { grievanceHistory, claimAudit, specialRemarks, uwGuidelines } = sections;

  useEffect(() => {
    if (open === "grievanceHistory" && grievanceContext?.applicationNo) {
      void fetchGrievances(grievanceContext);
    }
  }, [open, grievanceContext, fetchGrievances]);

  // Guidelines saved by the user; falls back to the API rows until then.
  const [savedGuidelines, setSavedGuidelines] = useState<UwGuidelineRow[] | null>(() => {
    if (!validationKey) return null;
    const sessionDecision = loadGuwSubmittedDecision(validationKey);
    if (sessionDecision?.validationRows && sessionDecision.validationRows.length > 0) {
      return sessionDecision.validationRows.map((v) => ({
        reason: v.reason,
        remark: v.remark,
        systemAction: v.systemAction,
        justificationReason: v.selectedReasonCode || "",
        justificationRemark: v.justificationRemark || "",
      }));
    }
    return uwGuidelines.rows.length > 0 ? uwGuidelines.rows : null;
  });

  useEffect(() => {
    if (open === "uwGuidelines" && validationKey) {
      const sessionDecision = loadGuwSubmittedDecision(validationKey);
      if (sessionDecision?.validationRows && sessionDecision.validationRows.length > 0) {
        setSavedGuidelines(
          sessionDecision.validationRows.map((v) => ({
            reason: v.reason,
            remark: v.remark,
            systemAction: v.systemAction,
            justificationReason: v.selectedReasonCode || "",
            justificationRemark: v.justificationRemark || "",
          })),
        );
      } else if (uwGuidelines.rows.length > 0) {
        setSavedGuidelines(uwGuidelines.rows);
      }
    }
  }, [open, validationKey, uwGuidelines.rows]);

  const variant = editable ? "editable" : "readonly";

  return (
    <>
      <CustomDialog
        open={open === "grievanceHistory"}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
      >
        <GrievanceHistory
          title={grievanceHistory.title}
          columns={grievanceHistory.columns}
          rows={fetchGrievanceState.data?.grievanceHistory ?? grievanceHistory.rows}
          paginationDisabled
        />
      </CustomDialog>

      <CustomDialog
        open={open === "claimAudit"}
        onClose={onClose}
        title={claimAudit.title}
        maxWidth="lg"
        fullWidth
      >
        <CustomBox sx={{ p: 2 }}>
          <ClaimAudit
            variant={variant}
            rows={claimAudit.rows}
            columnHeaders={claimAudit.columnHeaders}
            validatedIds={validatedClaimIds}
            onValidate={(row) => {
              setValidatedClaimIds(markRowValidated(validationKey, "claimAudit", row.id));
              notify(`Claim ${row.policyNo} validated successfully`);
            }}
          />
        </CustomBox>
      </CustomDialog>

      <CustomDialog
        open={open === "specialRemarks"}
        onClose={onClose}
        title={specialRemarks.title}
        maxWidth="md"
        fullWidth
      >
        <CustomBox sx={{ p: 2 }}>
          <SpecialRemarks
            variant={variant}
            rows={specialRemarks.rows}
            columnHeaders={specialRemarks.columnHeaders}
            validatedIds={validatedRemarkIds}
            onValidate={(row) => {
              setValidatedRemarkIds(markRowValidated(validationKey, "specialRemarks", row.id));
              notify("Special remark validated successfully");
            }}
          />
        </CustomBox>
      </CustomDialog>

      <CustomDialog
        open={open === "uwGuidelines"}
        onClose={onClose}
        title={uwGuidelines.title}
        maxWidth="lg"
        fullWidth
      >
        <CustomBox sx={{ p: 2 }}>
          <UwGuidelines
            variant={variant}
            rows={savedGuidelines ?? uwGuidelines.rows}
            justificationReasons={uwGuidelines.justificationReasons}
            onClose={onClose}
            onValidationError={notify}
            onSubmit={(updated) => {
              setSavedGuidelines(updated);
              if (validationKey) {
                const prev = loadGuwSubmittedDecision(validationKey);
                if (prev) {
                  const updatedValidationRows = (prev.validationRows ?? []).map((v) => {
                    const match = updated.find((u) => u.reason === v.reason);
                    return match
                      ? {
                          ...v,
                          selectedReasonCode: match.justificationReason,
                          justificationRemark: match.justificationRemark,
                        }
                      : v;
                  });
                  saveGuwSubmittedDecision(validationKey, {
                    ...prev,
                    validationRows:
                      updatedValidationRows.length > 0
                        ? updatedValidationRows
                        : updated.map((u, i) => ({
                            validationId: String(i + 1),
                            category: "justification" as const,
                            reason: u.reason,
                            remark: u.remark,
                            systemAction: u.systemAction,
                            selectedReasonCode: u.justificationReason,
                            justificationRemark: u.justificationRemark,
                            justificationOptions: (uwGuidelines.justificationReasons ?? []).map((t) => ({
                              code: t,
                              text: t,
                            })),
                          })),
                  });
                }
              }
              onClose();
              notify("Guidelines updated successfully");
            }}
          />
        </CustomBox>
      </CustomDialog>
    </>
  );
}
