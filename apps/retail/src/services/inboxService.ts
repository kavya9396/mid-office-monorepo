import inboxMock from "../../../../mock/inbox/inbox.json";
import { getSessionUser } from "@insurance-poc/util";

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

export async function fetchRetailInbox(): Promise<InboxData> {
  await wait(300);

  const poolData: Record<string, InboxTask[]> = {};

  for (const [category, tasks] of Object.entries(inboxMock.poolData)) {
    poolData[category] = tasks
      .filter((task) => task.businessType === "RETAIL")
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
  }

  return {
    userId: getSessionUser()?.userId ?? "Unknown",
    poolData,
  };
}
