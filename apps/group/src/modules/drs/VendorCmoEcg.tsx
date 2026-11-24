import { CmoDrsScreen } from "./CmoDrsScreen";

/** Vendor CMO ECG. Role and screen type come from `drsTaskConfig`. */
export function VendorCmoEcg() {
  return <CmoDrsScreen testId="vendor-cmo-ecg-drs-main" />;
}

export default VendorCmoEcg;
