import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CustomDialog } from "@insurance-poc/ui";
import { ApplicantBanner, type BannerRow } from "@insurance-poc/common/applicant-banner";
import { CaseUwDecision } from "@insurance-poc/common/case-uw-decision";
import {
  fetchCaseDecisionOptions,
  fetchGuwDrs,
  type DropdownOption,
  type GuwDrsRecord,
} from "../../services/guwService";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

type DecisionTone = "refer" | "decline" | "standard" | "default";

type MemberDetail = { label: string; value: string };

export type GuwMember = {
  /** e.g. "Life Assured 1" */
  memberType: string;
  /** display index starting from 1 — controls pill colour tone */
  toneIndex: number;
  name: string;
  /** e.g. "31 yrs / Male / Graduate / PROF / CHENNAI" */
  demographics: string;
  /** Short decision label shown in the pill */
  uwDecision: string;
  /** Tone class drives the pill colour */
  tone: DecisionTone;
  /** Key-value rows shown in the eye-icon dialog */
  details: MemberDetail[];
};

/* ------------------------------------------------------------------ */
/* Decision pill colours (matching prototype)                          */
/* ------------------------------------------------------------------ */
const PILL_STYLE: Record<DecisionTone, { border: string; bg: string; color: string }> = {
  refer: { border: "#f1c97c", bg: "#fff3e0", color: "#9a6200" },
  decline: { border: "#f2c4c7", bg: "#fdebec", color: "#b3262e" },
  standard: { border: "#b8dcc0", bg: "#eef7f1", color: "#28743c" },
  default: { border: "#e1d8d2", bg: "#f7f5f4", color: "#302a27" },
};

const TONE_PILL_STYLE: Record<number, { border: string; bg: string; color: string }> = {
  1: { border: "#f2c9b5", bg: "#fff0e8", color: "#b54a00" },
  2: { border: "#d9ccf2", bg: "#f4f0ff", color: "#6c4aa0" },
};

/* ------------------------------------------------------------------ */
/* Eye icon SVG                                                         */
/* ------------------------------------------------------------------ */
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Mock members derived from guw-informal-drs.json summary[0]          */
/* ------------------------------------------------------------------ */
const MOCK_MEMBERS: GuwMember[] = [
  {
    memberType: "Life Assured 1",
    toneIndex: 1,
    name: "GANESH CHAVAN",
    demographics: "31 yrs / Male / Graduate / PROF / CHENNAI",
    uwDecision: "Refer to HOD",
    tone: "refer",
    details: [
      { label: "Case UW Decision", value: "Refer to HOD" },
      { label: "Outlier", value: "Medical history requires senior underwriting review" },
      { label: "BRE Decision", value: "ST" },
      { label: "Decision Type", value: "Counter Sign" },
      { label: "1st UW Decision", value: "Standard" },
      { label: "1st UW Decision Code", value: "STD" },
      { label: "1st UW Smoker Status", value: "Non Smoker" },
    ],
  },
  {
    memberType: "Life Assured 2",
    toneIndex: 2,
    name: "PRIYA CHAVAN",
    demographics: "29 yrs / Female / Graduate / SPVT / CHENNAI",
    uwDecision: "Standard",
    tone: "standard",
    details: [
      { label: "Case UW Decision", value: "Standard" },
      { label: "Outlier", value: "-" },
      { label: "BRE Decision", value: "STP" },
      { label: "1st UW Decision", value: "Standard" },
      { label: "1st UW Decision Code", value: "STD" },
      { label: "1st UW Smoker Status", value: "Non Smoker" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Banner rows (application-level strip, no photo)                     */
/* ------------------------------------------------------------------ */
const BANNER_ROWS: BannerRow[] = [
  {
    id: "product",
    fields: [{ id: "product", value: "Product: ICICI Pru GIFT Assure - E40 / Channel: OB / SA - ₹50,00,000" }],
  },
  {
    id: "riders",
    fields: [{ id: "riders", value: "Riders: WOP - SA ₹15,00,000 / BTBB - SA ₹25,00,000 / TI Rider - SA ₹25,00,000" }],
  },
  {
    id: "risk",
    fields: [{ id: "risk", value: "Sum at Risk: TSA - ₹50,00,000 / TRSA - ₹50,00,000 / Total Premium - ₹5,00,000" }],
  },
];

/* ------------------------------------------------------------------ */
/* GuwMemberSelection                                                   */
/* ------------------------------------------------------------------ */
export function GuwMemberSelection() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const roleType = params.get("roleType")?.trim() ?? "";
  const role = params.get("role")?.trim() ?? "";

  const [detailMember, setDetailMember] = useState<GuwMember | null>(null);
  const [record, setRecord] = useState<GuwDrsRecord | null>(null);
  const [decisionOptions, setDecisionOptions] = useState<DropdownOption[]>([]);
  const [caseDecision, setCaseDecision] = useState("");

  useEffect(() => {
    let active = true;
    void fetchCaseDecisionOptions().then((opts) => {
      if (active) setDecisionOptions(opts);
    });
    if (applicationNo) {
      void fetchGuwDrs(applicationNo).then((r) => {
        if (active) setRecord(r);
      });
    }
    return () => { active = false; };
  }, [applicationNo]);

  /** Build DRS query params, preserving the role display label for the header. */
  const makeDrsQuery = (memberId: string, memberCount: number): string => {
    const q = new URLSearchParams({ applicationNo, roleType, memberId, memberCount: String(memberCount) });
    if (role) q.set("role", role);
    return q.toString();
  };

  /** If only one member, skip selection and go straight to DRS. */
  useEffect(() => {
    if (MOCK_MEMBERS.length === 1) {
      const q = new URLSearchParams({ applicationNo, roleType, memberId: MOCK_MEMBERS[0].memberType, memberCount: "1" });
      if (role) q.set("role", role);
      navigate(`/guw/drs?${q.toString()}`, { replace: true });
    }
  }, [applicationNo, roleType, role, navigate]);

  /** Navigate to GuwUser DRS for the selected member. */
  const openMember = (member: GuwMember) => {
    navigate(`/guw/drs?${makeDrsQuery(member.memberType, MOCK_MEMBERS.length)}`);
  };

  return (
    <Box sx={{ minHeight: "100%", background: "#fff8f3", pb: 8 }}>

      {/* ApplicantBanner — no photoUrl prop → only data strip is shown */}
      <ApplicantBanner
        name="GANESH CHAVAN"
        applicationNo={applicationNo || "OB90311125"}
        rows={BANNER_ROWS}
      />

      {/* Member selection card */}
      <Box sx={{ mx: "4px", mt: "6px" }}>
        <Box
          sx={{
            overflow: "hidden",
            border: "1px solid #e4deda",
            borderRadius: "12px",
            background: "#fff",
            boxShadow: "0 4px 16px rgba(54,45,40,.06)",
          }}
        >
          {/* Card title area */}
          <Box sx={{ px: "14px", py: "8.8px", borderBottom: "1px solid #eae4e1" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#292421" }}>
              Select Member
            </Typography>
            <Typography sx={{ mt: "1.5px", fontSize: 9.5, color: "#817773" }}>
              {MOCK_MEMBERS.length} members are available in this application
            </Typography>
          </Box>

          {/* Column header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "150px 220px minmax(0,1fr) 150px 34px",
              gap: "8px",
              px: "14px",
              py: "6px",
              background: "#f7f5f4",
              color: "#8a817c",
            }}
          >
            {["Life", "Name", "Details", "UW Decision", ""].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 8, fontWeight: 900, letterSpacing: 0.4 }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Member rows */}
          {MOCK_MEMBERS.map((member) => {
            const tonePill = TONE_PILL_STYLE[member.toneIndex] ?? TONE_PILL_STYLE[1];
            const decisionPill = PILL_STYLE[member.tone] ?? PILL_STYLE.default;

            return (
              <Box
                key={member.memberType}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) 150px 34px",
                  gap: "8px",
                  alignItems: "center",
                  px: "14px",
                  py: "8px",
                  borderTop: "1px solid #eee9e6",
                  "&:hover": { background: "#fff9f5" },
                }}
              >
                {/* Clickable member open area */}
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${member.memberType} ${member.name}`}
                  onClick={() => openMember(member)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openMember(member);
                    }
                  }}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "150px 220px minmax(0,1fr)",
                    gap: "8px",
                    alignItems: "center",
                    cursor: "pointer",
                    borderRadius: "4px",
                    "&:focus-visible": { outline: "2px solid #e45f14", outlineOffset: 2 },
                  }}
                >
                  {/* Life type pill */}
                  <Box
                    sx={{
                      width: "fit-content",
                      minWidth: 120,
                      textAlign: "center",
                      px: "8px",
                      py: "3.6px",
                      border: `1px solid ${tonePill.border}`,
                      borderRadius: "16px",
                      background: tonePill.bg,
                      color: tonePill.color,
                      fontSize: 9,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.memberType}
                  </Box>

                  {/* Name */}
                  <Box>
                    <Typography
                      title={member.name}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#292421",
                      }}
                    >
                      {member.name}
                    </Typography>
                  </Box>

                  {/* Demographics */}
                  <Typography
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 9.5,
                      color: "#5c514c",
                    }}
                  >
                    {member.demographics}
                  </Typography>
                </Box>

                {/* UW Decision pill */}
                <Box
                  title={member.uwDecision}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "fit-content",
                    maxWidth: "100%",
                    px: "8px",
                    py: "3.6px",
                    border: `1px solid ${decisionPill.border}`,
                    borderRadius: "16px",
                    background: decisionPill.bg,
                    color: decisionPill.color,
                    fontSize: 9,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.uwDecision}
                </Box>

                {/* Eye button */}
                <Box
                  component="button"
                  onClick={(e) => { e.stopPropagation(); setDetailMember(member); }}
                  aria-label={`View UW decision details for ${member.memberType} ${member.name}`}
                  sx={{
                    width: 34,
                    height: 34,
                    p: "5px",
                    display: "grid",
                    placeItems: "center",
                    border: 0,
                    borderRadius: "50%",
                    background: "transparent",
                    color: "#a92129",
                    cursor: "pointer",
                    "&:hover": { background: "#ffead7" },
                  }}
                >
                  <EyeIcon />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Financial Decision, Medical Decision and Case UW Decision on one row */}
      <CaseUwDecision
        financialDecision={record?.sdtRow.financialDecision}
        medicalDecision={record?.sdtRow.medicalDecision}
        options={decisionOptions}
        value={caseDecision}
        onChange={setCaseDecision}
      />

      {/* UW Decision detail dialog */}
      <CustomDialog
        open={detailMember !== null}
        onClose={() => setDetailMember(null)}
        title={
          <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
            {detailMember?.memberType ?? ""} — UW Decision Details
          </Typography>
        }
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          {detailMember?.details.map((d) => (
            <Box
              key={d.label}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                py: "4px",
                borderBottom: "1px solid #f0ebe8",
                fontSize: 11,
                color: "#302a27",
              }}
            >
              <Typography component="span" sx={{ fontSize: 11, color: "#7b716c", mr: 1 }}>
                {d.label}
              </Typography>
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 700 }}>
                {d.value || "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      </CustomDialog>

    </Box>
  );
}
