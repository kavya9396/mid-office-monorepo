import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Box, Typography } from "@mui/material";
import { CustomDialog, CustomSnackbar } from "@insurance-poc/ui";
import { BreCard, type BreStatusChip, type BreStatusTone } from "@insurance-poc/common/bre-card";
import { DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import {
  ApplicantBanner,
  type BannerRow,
} from "@insurance-poc/common/applicant-banner";
import { RiskCards } from "@insurance-poc/common/risk-cards";
import { useGetGroupDrsQuery } from "../../services/drsApi";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildBreRows, splitDiscrepancies } from "./breFormat";

const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.guw;

// Same status list / order as the prototype's Requirement Management chips.
const REQUIREMENT_STATUSES: ReadonlyArray<{ label: string; tone: BreStatusTone }> = [
  { label: "All", tone: "default" },
  { label: "Pending", tone: "pending" },
  { label: "Received", tone: "received" },
  { label: "Accept", tone: "accept" },
  { label: "Cancelled", tone: "cancelled" },
  { label: "Reject", tone: "reject" },
  { label: "Waived", tone: "waived" },
];

// Placeholder profile image (inline SVG). Replace with the applicant's real photo URL once available.
const PROFILE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#302a27"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7z"/></svg>',
)}`;

// Static values copied from the GUW Formal DRS prototype banner.
const textRow = (id: string, text: string, label?: string): BannerRow => ({
  id,
  label,
  fields: [{ id, value: text }],
});

const BANNER_ROWS: BannerRow[] = [
  textRow(
    "life-assured",
    "Life Assured 1 / Married / Male / 40 / Pune, Maharashtra / Indian / India / Emp ID - / Designation - / Annual Income -",
  ),
  textRow(
    "product",
    "Call ID - / Policy no. - / Client name - / Re insurer name - / Cover requested - / Cover provided - / Free cover limit - / Cover above FCL -",
  ),
  textRow(
    "riders",
    "WOP - SA ₹15,00,000 / BTBB - SA ₹25,00,000 / TI Rider - SA ₹25,00,000 / ADBR - SA ₹25,00,000 / CI Rider - SA ₹25,00,000",
    "Riders",
  ),
  textRow(
    "previous",
    "TI Rider - SA ₹25,00,000 / ADBR SA - ₹25,00,000 / CI Rider SA - ₹25,00,000 / Previous sum assured - ₹10,00,000 / Previous UW Decision & Date - Standard, 12 Aug 2024 / Reason for cover enhancement - Income enhancement",
  ),
];

const GuwUser = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const drs = useGetGroupDrsQuery(applicationNo);

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  const [breDetailOpen, setBreDetailOpen] = useState(false);

  const breDecision = drs.data?.breDecision;
  const latestBreDecision = drs.data?.latestBreDecision;
  const requirements = drs.data?.requirements ?? [];

  const initialCodes = splitDiscrepancies(breDecision?.discrepancy ?? "");
  const initialCodeSet = new Set(initialCodes.map((code) => code.toUpperCase()));
  const finalOnlyCodes = splitDiscrepancies(latestBreDecision?.discrepancy ?? "").filter(
    (code) => !initialCodeSet.has(code.toUpperCase()),
  );

  const statusChips: BreStatusChip[] = REQUIREMENT_STATUSES.map(({ label, tone }) => ({
    key: label,
    label,
    tone,
    count:
      label === "All"
        ? requirements.length
        : requirements.filter((row) => row.status.toLowerCase() === label.toLowerCase()).length,
  }));

  return (
    <Box sx={{ position: "relative", minHeight: "100%", pb: 8 }}>
      <ApplicantBanner
        name="Rudra Prakash Sangha"
        photoUrl={PROFILE_IMAGE_URL}
        applicationNo={applicationNo || "OB90377122"}
        rows={BANNER_ROWS}
      />

      {drs.data && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 3fr) minmax(245px, 1fr)" },
            gap: 1,
            alignItems: "stretch",
            px: 2,
            pt: 1,
          }}
        >
          <RiskCards cards={drs.data.riskCards} />
          <BreCard
            decision={latestBreDecision?.decision ?? ""}
            initialDiscrepancies={initialCodes}
            finalDiscrepancies={finalOnlyCodes}
            statusChips={statusChips}
            onViewDetail={() => setBreDetailOpen(true)}
            onRefresh={() => console.log("BRE Retrigger clicked")}
          />
        </Box>
      )}

      <QuickLinksModule
        items={quickLinksConfig.items}
        applicationNo={applicationNo}
        roleType={params.get("role")?.trim() || quickLinksConfig.defaultRoleType}
        onNavigate={(path) => navigate(path)}
        onNotify={(message) => setSnackbarMessage(message)}
        dialogItemIds={["applicant-profile"]}
        onDialogItemClick={() => setApplicantProfileOpen(true)}
        title="Quick Links"
      />

      <ApplicantProfile
        open={applicantProfileOpen}
        onClose={() => setApplicantProfileOpen(false)}
      />

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      {breDecision && latestBreDecision && (
        <CustomDialog
          open={breDetailOpen}
          onClose={() => setBreDetailOpen(false)}
          title={
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
              BRE Decision
            </Typography>
          }
          maxWidth="lg"
          contentSx={{ p: { xs: 1, sm: 1.5 } }}
        >
          <DecisionComparisonTable
            headers={{ label: "BRE", initial: "Initial BRE", final: "Final BRE" }}
            rows={buildBreRows(breDecision, latestBreDecision)}
          />
        </CustomDialog>
      )}
    </Box>
  );
};

export default GuwUser;
