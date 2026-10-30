import masBannerMock from "../../../../mock/drs/mas-banner.json";

export interface MasBannerLine {
  text: string;
  emphasis?: boolean;
}

export interface MasBannerRecord {
  applicationNo: string;
  applicantName: string;
  applicationLabel: string;
  lines: MasBannerLine[];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchMasBanner(
  applicationNo: string,
): Promise<MasBannerRecord | null> {
  await wait(250);

  return (
    masBannerMock.records.find(
      (record) => record.applicationNo === applicationNo,
    ) ?? null
  );
}
