import { ReferralDrsPage } from "../referral-uw/ReferralDrsPage";
import { HOD_CONFIG } from "../../services/referralUwService";

/** HOD member DRS — same page as Sr UW, configured with the HOD labels and decision options. */
export function HodDrsPage() {
  return <ReferralDrsPage config={HOD_CONFIG} />;
}

export default HodDrsPage;
