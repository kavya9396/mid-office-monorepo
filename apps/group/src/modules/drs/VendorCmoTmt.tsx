import { CmoDrsScreen } from "./CmoDrsScreen";

/** Vendor CMO TMT. Role and screen type come from `drsTaskConfig`. */
export function VendorCmoTmt() {
  return <CmoDrsScreen testId="vendor-cmo-tmt-drs-main" />;
}

export default VendorCmoTmt;
