import type {
  BackToCuwValues,
  ReinsurerDecisionValues,
  ReinsurerDrsRecord,
} from "@insurance-poc/common/reinsurer";
import { useMock } from "@insurance-poc/utils";
import reinsurerDrsMock from "../../../../mock/drs/retail-reinsurer-drs.json";

/**
 * Retail Reinsurer service. Only the mock is wired: the Reinsurer endpoints are not specified yet
 * (see docs/spec/screens/retail-reinsurer.md, "Open questions"), so live mode fails explicitly.
 */

const NOT_CONFIGURED = "Reinsurer API is not configured. Use mock mode (VITE_USE_MOCK).";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** `null` = not found; never falls back to another record. */
export async function fetchRetailReinsurerDrs(applicationNo: string): Promise<ReinsurerDrsRecord | null> {
  if (!useMock) throw new Error(NOT_CONFIGURED);
  await wait(250);
  const record: ReinsurerDrsRecord | undefined = reinsurerDrsMock.records.find(
    (item) => item.applicationNo === applicationNo,
  );
  return record ?? null;
}

export async function submitRetailReinsurerBackToCuw(
  _applicationNo: string,
  _values: BackToCuwValues,
): Promise<string> {
  if (!useMock) throw new Error(NOT_CONFIGURED);
  await wait(200);
  return "Back TO CUW details submitted successfully.";
}

export async function submitRetailReinsurerDecision(
  _applicationNo: string,
  _values: ReinsurerDecisionValues[],
): Promise<string> {
  if (!useMock) throw new Error(NOT_CONFIGURED);
  await wait(200);
  return "Reinsurer details saved successfully.";
}
