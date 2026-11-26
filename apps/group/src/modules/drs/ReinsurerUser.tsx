import { useParams, useNavigate } from "react-router-dom";
import { ReinsurerDrsScreen } from "@insurance-poc/common/reinsurer";
import { clearDrsTaskIds } from "@insurance-poc/utils";
import {
  fetchGroupReinsurerDrs,
  submitGroupReinsurerBackToGuw,
  submitGroupReinsurerDecision,
} from "../../services/reinsurerService";

/** Group DRS for `roleType` `REINSURER_TASK`. */
const ReinsurerUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const navigate = useNavigate();

  return (
    <ReinsurerDrsScreen
      applicationNo={applicationNoParam?.trim() ?? ""}
      fetchRecord={fetchGroupReinsurerDrs}
      submitBackToUw={submitGroupReinsurerBackToGuw}
      submitSaveClose={submitGroupReinsurerDecision}
      backToLabel="Back TO GUW"
      onExit={() => {
        clearDrsTaskIds();
        void navigate("/inbox", { replace: true });
      }}
    />
  );
};

export default ReinsurerUser;
