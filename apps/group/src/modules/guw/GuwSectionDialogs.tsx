import { useState } from "react";
import { ClaimAudit } from "@insurance-poc/common/claim-audit";
import { GrievanceHistory } from "@insurance-poc/common/grievance-history";
import { SpecialRemarks } from "@insurance-poc/common/special-remarks";
import { UwGuidelines, type UwGuidelineRow } from "@insurance-poc/common/uw-guidelines";
import { CustomBox, CustomDialog } from "@insurance-poc/ui";
import type { GuwDialogSections } from "../../services/guwService";

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
}: Readonly<GuwSectionDialogsProps>) {
  // Guidelines saved by the user; falls back to the API rows until then.
  const [savedGuidelines, setSavedGuidelines] = useState<UwGuidelineRow[] | null>(null);
  const variant = editable ? "editable" : "readonly";
  const { grievanceHistory, claimAudit, specialRemarks, uwGuidelines } = sections;

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
          rows={grievanceHistory.rows}
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
            onValidate={(row) => notify(`Claim ${row.policyNo} validated successfully`)}
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
            onValidate={() => notify("Special remark validated successfully")}
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
              onClose();
              notify("Guidelines updated successfully");
            }}
          />
        </CustomBox>
      </CustomDialog>
    </>
  );
}
