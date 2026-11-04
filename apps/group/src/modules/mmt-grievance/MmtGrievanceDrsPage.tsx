import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApplicantBanner, type BannerRow } from "@insurance-poc/common/applicant-banner";
import { GrievanceHistory } from "@insurance-poc/common/grievance-history";
import { CustomBox } from "@insurance-poc/ui";
import { MmtGrievanceDecision } from "./MmtGrievanceDecision";
import {
  fetchMmtGrievanceDrs,
  type MmtGrievanceDrsData,
} from "../../services/mmtGrievanceService";

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: MmtGrievanceDrsData };

/**
 * Group MMT Grievance DRS. The Group layout header supplies back and logout.
 * Submit is validation-only until the submit API is built.
 */
export function MmtGrievanceDrsPage() {
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const [state, setState] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  useEffect(() => {
    if (!applicationNo) {
      setState({ kind: "missing-id" });
      return;
    }

    let active = true;
    setState({ kind: "loading" });
    fetchMmtGrievanceDrs(applicationNo)
      .then((data) => {
        if (!active) return;
        setState(data ? { kind: "ready", data } : { kind: "not-found" });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState({
          kind: "error",
          message:
            reason instanceof Error
              ? reason.message
              : "Unable to load the grievance details.",
        });
      });

    return () => {
      active = false;
    };
  }, [applicationNo]);

  return (
    <CustomBox
      component="main"
      data-testid="group-mmt-grievance-drs-main"
      sx={{ minHeight: "100%", background: "#fff8f3" }}
    >
      {state.kind === "ready" ? (
        <>
          <ApplicantBanner
            name={state.data.record.applicantName}
            applicationNo={state.data.record.applicationNo}
            rows={state.data.record.lines.map<BannerRow>((line, index) => ({
              id: String(index),
              fields: [{ id: String(index), value: line.text }],
            }))}
          />
          <CustomBox sx={{ px: 0.5, pb: 1.5, display: "grid", gap: 1.25 }}>
            <GrievanceHistory rows={state.data.record.grievanceHistory} />
            <MmtGrievanceDecision rows={state.data.record.grievanceDecision} />
          </CustomBox>
        </>
      ) : null}
      {state.kind === "missing-id" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          Application number is missing.
        </CustomBox>
      ) : null}
      {state.kind === "not-found" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          No MMT grievance record was found for application {applicationNo}.
        </CustomBox>
      ) : null}
      {state.kind === "error" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          {state.message}
        </CustomBox>
      ) : null}
    </CustomBox>
  );
}
