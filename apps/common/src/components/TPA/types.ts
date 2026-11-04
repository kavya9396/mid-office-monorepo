export type MedicalTpaDetails = Record<string, string>;

export type MedicalTpaDrsRecord = {
  applicationNo: string;
  failureReason: string;
  failureDetail: string;
  details: MedicalTpaDetails;
  serviceProviderOptions: string[];
  defaultServiceProvider?: string;
  reasonOptions: string[];
};

export type MedicalTpaSubmitPayload = {
  applicationNo: string;
  taskId?: string;
  instanceId?: string;
  serviceProvider: string;
  reason: string;
  remarks: string;
};
