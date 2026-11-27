import { CustomTable, type Column } from "@insurance-poc/ui";

export type DecisionHistoryRow = {
  date: string;
  userName: string;
  userRole: string;
  remarks: string;
};

export type DecisionHistoryProps = {
  rows: DecisionHistoryRow[];
  /** Table title. */
  title?: string;
};

const COLUMNS: Column<DecisionHistoryRow>[] = [
  { key: "date", header: "Date", width: "18%" },
  { key: "userName", header: "User Name", width: "22%" },
  { key: "userRole", header: "User Role", width: "20%" },
  { key: "remarks", header: "Remarks", width: "40%" },
];

/** "Decision History" table of the Retail CVT DRS: who decided what, and when. */
export function DecisionHistory({ rows, title = "Decision History" }: Readonly<DecisionHistoryProps>) {
  return <CustomTable<DecisionHistoryRow> title={title} columns={COLUMNS} data={rows} />;
}

export default DecisionHistory;
