import {
  CustomBox,
  CustomButton,
  CustomTooltip,
  CustomTypography,
  DangerIcon,
  InfoIcon,
} from "@insurance-poc/ui";

type TpaApiFailureStripProps = {
  reason: string;
  detail: string;
};

export function TpaApiFailureStrip({
  reason,
  detail,
}: Readonly<TpaApiFailureStripProps>) {
  return (
    <CustomBox
      aria-label="TPA API Failure Reason"
      sx={{
        position: "relative",
        minWidth: 0,
        minHeight: 26,
        py: 0.5,
        pl: 1.25,
        pr: 0.75,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        border: "1px solid #efb7aa",
        borderRadius: "13px",
        color: "#8f241f",
        bgcolor: "#fff4f1",
        boxShadow: "0 1px 2px rgba(116, 31, 25, .08)",
        fontSize: "10px",
        lineHeight: 1,
      }}
    >
      <CustomBox
        sx={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "inherit",
          lineHeight: 0,
          pl: 0.25,
          pr: 0.125,
        }}
      >
        <DangerIcon width={14} height={14} />
      </CustomBox>
      <CustomTypography
        component="span"
        sx={{
          color: "#704f4a",
          fontWeight: 600,
          fontSize: "10px",
          display: { xs: "none", sm: "inline" },
        }}
      >
        TPA API Failure Reason
      </CustomTypography>
      <CustomTypography
        component="span"
        noWrap
        sx={{
          maxWidth: { xs: 145, sm: 250 },
          color: "#a3201a",
          fontWeight: 700,
          fontSize: "10px",
        }}
      >
        {reason}
      </CustomTypography>
      {detail ? (
        <CustomTooltip title={detail} placement="bottom-end">
          <CustomButton
            aria-label="View TPA API failure details"
            variant="text"
            sx={{
              minWidth: 22,
              width: 22,
              height: 22,
              flex: "0 0 22px",
              p: 0,
              borderRadius: "50%",
              color: "#a3201a",
              "&:hover": { bgcolor: "#fbded7" },
            }}
          >
            <InfoIcon width={15} height={15} />
          </CustomButton>
        </CustomTooltip>
      ) : null}
    </CustomBox>
  );
}
