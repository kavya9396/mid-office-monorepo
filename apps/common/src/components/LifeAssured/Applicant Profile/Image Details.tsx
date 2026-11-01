import { CustomTable, type Column } from "@insurance-poc/ui";
import { displayValue } from "./Fields";

export type ImageDetailRecord = {
  imageType?: string;
  document?: string;
  faceMatchScore?: string;
  imageQuality?: string;
  remarks?: string;
};

type ImageDetailRow = Record<keyof ImageDetailRecord, string>;

const COLUMNS: Column<ImageDetailRow>[] = [
  { key: "imageType", header: "Image Type" },
  { key: "document", header: "Document" },
  { key: "faceMatchScore", header: "Face Match Score" },
  { key: "imageQuality", header: "Image Quality" },
  { key: "remarks", header: "Remarks" },
];

export function ImageDetails({ records }: Readonly<{ records: ImageDetailRecord[] }>) {
  const rows: ImageDetailRow[] = records.map((record) => ({
    imageType: displayValue(record.imageType),
    document: displayValue(record.document),
    faceMatchScore: displayValue(record.faceMatchScore),
    imageQuality: displayValue(record.imageQuality),
    remarks: displayValue(record.remarks),
  }));

  return (
    <CustomTable<ImageDetailRow>
      columns={COLUMNS}
      data={rows}
      getRowId={(row) => `${row.imageType}|${row.document}|${row.remarks}`}
    />
  );
}
