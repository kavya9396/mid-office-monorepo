import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CustomButton, CustomDialog } from "@insurance-poc/ui";
import { ApplicantBanner, type BannerRow } from "@insurance-poc/common/applicant-banner";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import { fetchGuwDrs, type GuwDrsRecord } from "../../services/guwService";
import {
  fetchReferralMembers,
  referralConfigForRoleType,
  referralDecisionTone,
  type ReferralDecisionTone,
  type ReferralMember,
} from "../../services/referralUwService";
import eyeIconSrc from "../../assets/eye.svg";
import { ReferralDecisionSection } from "./ReferralDecisionSection";

/* Decision pill colours (prototype `Mge`). */
const PILL_STYLE: Record<ReferralDecisionTone, { border: string; bg: string; color: string }> = {
  decline: { border: "#F2C4C7", bg: "#FDEBEC", color: "#B3262E" },
  standard: { border: "#B8DCC0", bg: "#EEF8F1", color: "#28743C" },
  refer: { border: "#F1C97C", bg: "#FFF3E0", color: "#9A6200" },
  default: { border: "#DED9D6", bg: "#F4F3F2", color: "#665D58" },
};

/* Life pill colours (prototype `o0`). */
const LIFE_PILL_STYLE = [
  { border: "#F2C9B5", bg: "#FFF0E8", color: "#B54A00" },
  { border: "#D9CCF2", bg: "#F4F0FF", color: "#6C4AA0" },
  { border: "#BEDBEA", bg: "#EAF5FB", color: "#2F668F" },
];

/* Application-level strip under the banner (same rows as the GUW member screen). */
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

/**
 * Member selection for the HOD and Sr UW tasks — same layout as the GUW member screen (no profile
 * photo in the banner). Clicking a member opens the referral DRS for that member
 * (`/referral/drs?roleType=…&memberId=…`). The role decision card sits below the list.
 */
export function ReferralMemberSelection() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const roleType = params.get("roleType")?.trim() ?? "";
  const role = params.get("role")?.trim() ?? "";
  const config = referralConfigForRoleType(roleType);

  const [members, setMembers] = useState<ReferralMember[]>([]);
  const [record, setRecord] = useState<GuwDrsRecord | null>(null);
  const [detailMember, setDetailMember] = useState<ReferralMember | null>(null);

  useEffect(() => {
    if (!applicationNo) return;
    let active = true;
    void fetchReferralMembers(applicationNo).then((list) => {
      if (active) setMembers(list);
    });
    void fetchGuwDrs(applicationNo).then((r) => {
      if (active) setRecord(r);
    });
    return () => {
      active = false;
    };
  }, [applicationNo]);

  const drsQuery = (member: ReferralMember): string => {
    const q = new URLSearchParams({
      applicationNo,
      roleType,
      memberId: member.memberType,
      memberCount: String(members.length),
    });
    if (role) q.set("role", role);
    return q.toString();
  };

  /** If only one member, skip selection and go straight to the DRS. */
  useEffect(() => {
    const [only] = members;
    if (members.length === 1 && only) {
      const q = new URLSearchParams({ applicationNo, roleType, memberId: only.memberType, memberCount: "1" });
      if (role) q.set("role", role);
      navigate(`/referral/drs?${q.toString()}`, { replace: true });
    }
  }, [members, applicationNo, roleType, role, navigate]);

  const openMember = (member: ReferralMember) => {
    navigate(`/referral/drs?${drsQuery(member)}`);
  };

  return (
    <Box sx={{ minHeight: "100%", background: "#fff8f3", pb: 8 }}>
      {/* ApplicantBanner — no photoUrl prop → only the data strip is shown */}
      <ApplicantBanner
        name={record?.applicantName ?? "GANESH CHAVAN"}
        applicationNo={applicationNo || "OB90311125"}
        rows={BANNER_ROWS}
      />

      {/* Member selection card */}
      <Box sx={{ mx: "4px", mt: "6px" }}>
        <Box
          sx={{
            overflow: "hidden",
            border: "1px solid #E4DEDA",
            borderRadius: "12px",
            background: "#FFFFFF",
            boxShadow: "0 4px 16px rgba(54, 45, 40, 0.06)",
          }}
        >
          <Box sx={{ px: "14px", py: "8.8px", borderBottom: "1px solid #EAE4E1" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#292421" }}>Select Member</Typography>
            <Typography sx={{ mt: "1.5px", fontSize: 9.5, color: "#817773" }}>
              {members.length} members are available in this application
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "grid" },
              gridTemplateColumns: "150px 220px minmax(0,1fr) 150px 34px",
              gap: "8px",
              px: "14px",
              py: "6px",
              background: "#F7F5F4",
              color: "#8A817C",
            }}
          >
            {["Life", "Name", "Details", "UW Decision", ""].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {h}
              </Typography>
            ))}
          </Box>

          {members.map((member, index) => {
            const lifePill = LIFE_PILL_STYLE[index % LIFE_PILL_STYLE.length] ?? LIFE_PILL_STYLE[0];
            const decisionPill = PILL_STYLE[referralDecisionTone(member.uwDecision)];
            return (
              <Box
                key={member.memberType}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "minmax(0,1fr) 34px", md: "minmax(0,1fr) 150px 34px" },
                  gap: "8px",
                  alignItems: "center",
                  px: "14px",
                  py: "8px",
                  borderBottom: index < members.length - 1 ? "1px solid #EEE9E6" : 0,
                  "&:hover": { background: "#FFF9F5" },
                }}
              >
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
                    gridTemplateColumns: { xs: "1fr", md: "150px 220px minmax(0,1fr)" },
                    gridColumn: { xs: "1 / -1", md: "auto" },
                    gap: "8px",
                    alignItems: "center",
                    minWidth: 0,
                    cursor: "pointer",
                    borderRadius: "4px",
                    "&:focus-visible": { outline: "2px solid #e45f14", outlineOffset: 2 },
                  }}
                >
                  <Box
                    sx={{
                      width: "fit-content",
                      minWidth: { xs: 112, md: 120 },
                      textAlign: "center",
                      px: "8px",
                      py: "3.6px",
                      border: `1px solid ${lifePill.border}`,
                      borderRadius: "16px",
                      background: lifePill.bg,
                      color: lifePill.color,
                      fontSize: 9,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.memberType}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
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
                    <Typography sx={{ display: { md: "none" }, mt: "2px", color: "#756D69", fontSize: 9 }}>
                      {member.demographics || "Details unavailable"}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      display: { xs: "none", md: "block" },
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 9.5,
                      color: "#5C514C",
                    }}
                  >
                    {member.demographics || "Details unavailable"}
                  </Typography>
                </Box>

                <Box
                  title={member.uwDecision}
                  sx={{
                    width: "fit-content",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
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

                <Box sx={{ display: "grid", placeItems: "center" }}>
                  <CustomButton
                    variant="outlined"
                    aria-label={`View UW decision details for ${member.memberType} ${member.name}`}
                    title="View UW decision details"
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
            border: "1px solid #E5E0DD",
            background: "#FCFAF9",
          }}
        >
          {[
            ["Financial Decision", record?.sdtRow.financialDecision],
            ["Medical Decision", record?.sdtRow.medicalDecision],
          ].map(([label, value], index) => (
            <Box key={label} sx={{ p: "10px 16px", borderLeft: index > 0 ? "1px solid #E5E0DD" : "none" }}>
              <Typography
                component="dt"
                sx={{ mb: "6px", color: "#938883", fontSize: 12, fontWeight: 700, letterSpacing: ".3px" }}
              >
                {label}
              </Typography>
              <Typography component="dd" sx={{ m: 0, color: "#37312E", fontSize: 12, fontWeight: 600 }}>
                {value || "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Role decision card (separate file) — final submit goes to the inbox */}
      {config && members.length > 1 ? (
        <Box sx={{ m: "8px 12px 0" }}>
          <ReferralDecisionSection
            roleLabel={config.label}
            decisionOptions={config.decisionOptions}
            onSubmit={() => {
              // Submit API handler to be wired
              replaceUrl(groupPaths.inbox);
            }}
          />
        </Box>
      ) : null}

      {/* UW decision details of the selected member */}
      <CustomDialog
        open={detailMember !== null}
        onClose={() => setDetailMember(null)}
        title=" "
        maxWidth="sm"
        fullWidth
      >
        {detailMember ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography
              sx={{ bgcolor: "#E45F14", color: "#FFFFFF", p: 1, borderRadius: 1, fontSize: 13, fontWeight: 800 }}
            >
              UW Decision – {detailMember.memberType}
            </Typography>
            <Typography sx={{ color: "#5C514C", fontSize: 12 }}>{detailMember.name}</Typography>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                p: 1.5,
                border: "1px solid #E5E0DD",
                borderRadius: "8px",
                bgcolor: "#FBF8F6",
              }}
            >
              {detailMember.details.map((d) => (
                <Box
                  key={d.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "minmax(110px, 0.8fr) minmax(0, 1.2fr)",
                      sm: "minmax(160px, 0.8fr) minmax(0, 1.2fr)",
                    },
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: "#827671" }}>{d.label}</Typography>
                  <Typography sx={{ fontSize: 13, color: "#292421", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {d.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </CustomDialog>
    </Box>
  );
}

export default ReferralMemberSelection;
