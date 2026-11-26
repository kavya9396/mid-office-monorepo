import { clearDrsTaskIds, readApiErrorMessage } from "@insurance-poc/utils";
import type { DecisionSubmitPayload } from "@insurance-poc/common/decision-section";
import { useCompleteRetailTaskMutation } from "../../services/completeTaskApi";

/**
 * HOD / Sr UW final submit: calls the complete-task API (same call as DVT). Resolves true when the task is
 * completed, false when it failed (the reason is shown through `notify`).
 */
export function useReferralCompleteTask(
  applicationNo: string,
  notify: (message: string) => void,
) {
  const [completeRetailTask, completeRetailTaskState] = useCompleteRetailTaskMutation();

  const submit = async (payload: DecisionSubmitPayload): Promise<boolean> => {
    const appNo = applicationNo.trim();
    if (appNo.length === 0) {
      notify("Application number is missing.");
      return false;
    }
    try {
      await completeRetailTask({
        appNo,
        decision: payload.decision,
        remarks: payload.remarks,
      }).unwrap();
      clearDrsTaskIds();
      return true;
    } catch (reason: unknown) {
      const message = readApiErrorMessage(reason);
      notify(message.length > 0 ? message : "Unable to complete the task.");
      return false;
    }
  };

  return { submit, isSubmitting: completeRetailTaskState.isLoading };
}
