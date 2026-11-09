export type MasterListEntry = {
  code: string;
  description: string;
  value: string | null;
  isActive: string;
};

export type MasterDataPayload = {
  data: Record<string, MasterListEntry[]>;
  unknownTypes: string[];
};
