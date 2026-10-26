import { useNavigate, useSearchParams } from "react-router-dom";
import { appTheme, CustomButton, KeyRightArrowIcon } from "@insurance-poc/ui";
import { PreviousPolicy } from "@insurance-poc/common/previous-policy";

const { primary, background, text, divider } = appTheme.palette;

export function RetailPreviousPolicyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";

  const handleBack = () => {
    if (applicationNo) {
      navigate(`/drs?applicationNo=${encodeURIComponent(applicationNo)}`);
    } else {
      navigate("/drs");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: background.default }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: background.default,
          borderBottom: `1px solid ${divider}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CustomButton
            variant="outlined"
            aria-label="Back to DRS"
            title="Back to DRS"
            onClick={handleBack}
            sx={{ transform: "rotate(180deg)", p: 0.5, borderRadius: "4px" }}
          >
            <KeyRightArrowIcon width={16} height={16} />
          </CustomButton>
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: text.primary,
            }}
          >
            Previous Policies
          </h1>
        </div>

        {applicationNo && (
          <span style={{ fontSize: 12, fontWeight: 600, color: text.secondary }}>
            Application No:{" "}
            <span style={{ color: primary.main, fontWeight: 700 }}>
              {applicationNo}
            </span>
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1536, margin: "0 auto", padding: 24 }}>
        <PreviousPolicy />
      </div>
    </div>
  );
}

export default RetailPreviousPolicyPage;
