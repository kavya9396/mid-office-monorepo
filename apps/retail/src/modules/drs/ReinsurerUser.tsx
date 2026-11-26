import { useParams, useNavigate } from "react-router-dom";
import { ReinsurerDrsScreen } from "@insurance-poc/common/reinsurer";
import { clearDrsTaskIds } from "@insurance-poc/utils";
import {
  fetchRetailReinsurerDrs,
  submitRetailReinsurerBackToCuw,
  submitRetailReinsurerDecision,
} from "../../services/reinsurerService";

/** Retail DRS for `roleType` `REINSURER_TASK`. */
const ReinsurerUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const navigate = useNavigate();

  return (
    <ReinsurerDrsScreen
      applicationNo={applicationNoParam?.trim() ?? ""}
      fetchRecord={fetchRetailReinsurerDrs}
      submitBackToUw={submitRetailReinsurerBackToCuw}
      submitSaveClose={submitRetailReinsurerDecision}
      backToLabel="Back TO CUW"
      onExit={() => {
        clearDrsTaskIds();
        void navigate("/inbox", { replace: true });
      }}
    />
  );
};

export default ReinsurerUser;
