import type { InboxCase } from "./inboxApi";

export function landingCases(): InboxCase[] {
  return [
    {
      rowId: "CVT-1",
      poolName: "CVT_POOL",
      applicationNo: "RET-CVT-001",
      fields: {
        applicationNo: "RET-CVT-001",
        channel: "Agency",
        product: "iProtect",
        dueDate: "2020-01-01T10:00:00Z",
        atRiskTime: "2020-01-01T10:00:00Z",
      },
    },
    {
      rowId: "GUW-1",
      poolName: "GUW",
      applicationNo: "RET-GUW-001",
      fields: {
        applicationNo: "RET-GUW-001",
        channel: "Corporate",
        product: "Group Term Life",
        productCode: "GTL-01",
        masterPlanNo: "MP-7782",
        productType: "Group Term",
        typeOfGroupBusiness: "Employer-Employee",
        caseReceivedDate: "2026-10-29",
        sumAssured: 10000000,
        clientType: "Corporate",
        caseType: "Fresh",
        dueDate: "2099-01-01T10:00:00Z",
        atRiskTime: "2020-01-01T10:00:00Z",
      },
    },
    {
      rowId: "DVT-1",
      poolName: "DVT_FORMAL",
      applicationNo: "RET-DVTF-001",
      fields: {
        applicationNo: "RET-DVTF-001",
        channel: "Corporate",
        product: "Group Health",
        policyNo: "POL-800001",
        memberName: "Neel Kapoor",
        dueDate: "2099-01-01T10:00:00Z",
        atRiskTime: "2099-01-01T10:00:00Z",
      },
    },
  ];
}
