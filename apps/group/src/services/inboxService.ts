import inboxMock from "../../../../mock/inbox/inbox.json";
import { getSessionUser } from "@insurance-poc/utils";

export interface InboxTask {
  applicationNo: string;
  taskId: string;
  customerName: string;
  productName: string;
  businessType?: string;
  appliedSa?: number | string | null;
  annualPremium?: number | string | null;
  status?: string;
}

export interface InboxData {
  userId: string;
  poolData: Record<string, InboxTask[]>;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchGroupInbox(): Promise<InboxData> {
  await wait(300);

  const poolData: Record<string, InboxTask[]> = {};

  const poolEntries = Object.entries(
    inboxMock.poolData as Record<string, Array<{ businessType?: string; applicationNo: string; taskId: string; customerName: string; productName: string; appliedSa?: number | string | null; annualPremium?: number | string | null; status?: string }>>
  );

  for (const [category, tasks] of poolEntries) {
    const groupTasks = tasks
      .filter((task) => task.businessType === "GROUP")
      .map((task) => ({
        applicationNo: task.applicationNo,
        taskId: task.taskId,
        customerName: task.customerName,
        productName: task.productName,
        businessType: task.businessType,
        appliedSa: task.appliedSa,
        annualPremium: task.annualPremium,
        status: task.status,
      }));

    // Only include categories that have at least one GROUP task
    if (groupTasks.length > 0) {
      poolData[category] = groupTasks;
    }
  }

  return {
    userId: getSessionUser()?.userId ?? "Unknown",
    poolData,
  };
}
