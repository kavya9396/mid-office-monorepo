import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CustomButton } from "@insurance-poc/ui";
import { groupPaths } from "@insurance-poc/routes";
import { ApplicantBanner, type BannerRow } from "@insurance-poc/common/applicant-banner";
import {
  fetchGuwDrs,
  GUW_DECISION_CHANGED_EVENT,
  guwMemberDecisionKey,
  loadGuwSubmittedDecision,
  type GuwDrsRecord,
  type GuwSubmittedDecision,
} from "../../services/guwService";
import { deriveCaseUwDecision } from "../../services/guwCaseDecisionRules";
import eyeIconSrc from "../../assets/eye.svg";
import { GuwDecisionDetailsDialog, GuwUwPanel } from "./GuwUwPanel";

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
/** Pill label + tone of the Case UW Decision selected for a member ("-" until one is selected). */
function memberDecisionPill(saved: GuwSubmittedDecision | null): { label: string; tone: DecisionTone } {
  if (!saved) return { label: "-", tone: "default" };
  const label = saved.fields.find((f) => f.label === "Case UW Decision")?.value || "-";
  if (["STD", "BOR_STD"].includes(saved.decisionCode)) return { label, tone: "standard" };
  if (["REJ", "DC"].includes(saved.decisionCode)) return { label, tone: "decline" };
  if (["REFERRAL", "APPROVER"].includes(saved.decisionCode)) return { label, tone: "refer" };
  return { label, tone: "default" };
}

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

  // Member whose saved decision is shown in the details dialog (same dialog as the Case UW Decision eye icon)
  const [detailMember, setDetailMember] = useState<GuwMember | null>(null);
  // Each member's own saved decision, shown against that member
  const loadMemberDecisions = (): Record<string, GuwSubmittedDecision | null> =>
    Object.fromEntries(
      MOCK_MEMBERS.map((m) => [
        m.memberType,
        loadGuwSubmittedDecision(guwMemberDecisionKey(applicationNo, m.memberType)),
      ]),
    );
  const [memberDecisions, setMemberDecisions] = useState(loadMemberDecisions);
  // Case UW Decision code derived from the member decisions (undefined until first derived)
  const [derivedDecision, setDerivedDecision] = useState<string | undefined>(undefined);
  const [record, setRecord] = useState<GuwDrsRecord | null>(null);
  // Case-level decision is held under its own key so it never overwrites a member's own decision
  const summaryStorageKey = `${applicationNo}:summary`;

  // Refresh member decisions whenever any decision is saved / cleared, or the page is shown again
  useEffect(() => {
    const refresh = () => setMemberDecisions(loadMemberDecisions());
    window.addEventListener(GUW_DECISION_CHANGED_EVENT, refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener(GUW_DECISION_CHANGED_EVENT, refresh);
      window.removeEventListener("pageshow", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMemberDecisions only depends on applicationNo
  }, [applicationNo]);

  // Derive the Case UW Decision from the member decisions (logic lives in guwCaseDecisionRules.ts)
  useEffect(() => {
    let active = true;
    void deriveCaseUwDecision(
      MOCK_MEMBERS.map((m) => ({
        memberId: m.memberType,
        decisionCode: memberDecisions[m.memberType]?.decisionCode ?? "",
      })),
    ).then((code) => {
      if (active) setDerivedDecision(code);
    });
    return () => { active = false; };
  }, [memberDecisions]);

  useEffect(() => {
    let active = true;
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
            {["Life", "Name", "Details", "Case UW Decision", ""].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 8, fontWeight: 900, letterSpacing: 0.4 }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Member rows */}
          {MOCK_MEMBERS.map((member) => {
            const tonePill = TONE_PILL_STYLE[member.toneIndex] ?? TONE_PILL_STYLE[1];
            const saved = memberDecisions[member.memberType] ?? null;
            const pillInfo = memberDecisionPill(saved);
            const decisionPill = PILL_STYLE[pillInfo.tone] ?? PILL_STYLE.default;

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
                  title={pillInfo.label}
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
                  {pillInfo.label}
                </Box>

                {/* Eye button - same as the Case UW Decision eye icon */}
                <Box sx={{ display: "grid", placeItems: "center" }}>
                  <CustomButton
                    variant="outlined"
                    aria-label={`View decision details for ${member.memberType} ${member.name}`}
                    title="View decision details"
                    onClick={() => setDetailMember(member)}
                    sx={{ width: 30, minWidth: 30, minHeight: 28, p: 0.5, borderRadius: "6px", flexShrink: 0 }}
                  >
                    <img src={eyeIconSrc} alt="" width={20} height={20} style={{ display: "block" }} />
                  </CustomButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Financial Decision and Medical Decision (read-only) */}
      <Box sx={{ m: "8px 4px 0", p: "8px 8px 0" }}>
        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            m: 0,
            border: "1px solid #e5e0dd",
            background: "#fcfaf9",
          }}
        >
          {[
            ["Financial Decision", record?.sdtRow.financialDecision],
            ["Medical Decision", record?.sdtRow.medicalDecision],
          ].map(([label, value], index) => (
            <Box
              key={label}
              sx={{ p: "10px 16px", borderLeft: index > 0 ? "1px solid #e5e0dd" : "none" }}
            >
              <Typography
                component="dt"
                sx={{ mb: "6px", color: "#938883", fontSize: 12, fontWeight: 700, letterSpacing: ".3px" }}
              >
                {label}
              </Typography>
              <Typography component="dd" sx={{ m: 0, color: "#37312e", fontSize: 12, fontWeight: 600 }}>
                {value || "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Case UW Decision - same functionality as the member DRS page; final submit goes to the inbox */}
      {record && (
        <GuwUwPanel
          applicationNo={applicationNo}
          storageKey={summaryStorageKey}
          derivedDecision={derivedDecision}
          decisionReadOnly
          redirectUrl={groupPaths.inbox}
          breOverallDecision={record.uwData?.breOverallDecision}
          breOverallRemarks={record.uwData?.breOverallRemarks}
          initialSubmittedDecision={loadGuwSubmittedDecision(summaryStorageKey) ?? undefined}
          onDecisionSubmit={() => {
            // Submit API handler to be wired
          }}
        />
      )}

      {/* Saved decision of the selected member (same modal as the Case UW Decision eye icon) */}
      <GuwDecisionDetailsDialog
        open={detailMember !== null}
        onClose={() => setDetailMember(null)}
        submittedDecision={detailMember ? (memberDecisions[detailMember.memberType] ?? null) : null}
      />

    </Box>
  );
}
