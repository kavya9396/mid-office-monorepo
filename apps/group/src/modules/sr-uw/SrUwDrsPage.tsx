import { ReferralDrsPage } from "../referral-uw/ReferralDrsPage";
import { SR_UW_CONFIG } from "../../services/referralUwService";

/** Sr UW member DRS — same page as HOD, configured with the Sr UW labels and decision options. */
export function SrUwDrsPage() {
  return <ReferralDrsPage config={SR_UW_CONFIG} />;
}

export default SrUwDrsPage;
