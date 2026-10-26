import Tooltip from "@mui/material/Tooltip";
import type { TooltipProps } from "@mui/material/Tooltip";
import type { ReactNode } from "react";

type CustomTooltipProps = {
  title: ReactNode;
  children: React.ReactElement;
  placement?: TooltipProps["placement"];
  describeChild?: boolean;
  arrow?: boolean;
};

export default function CustomTooltip({
  title,
  children,
  placement = "top",
  describeChild = true,
  arrow = false,
}: Readonly<CustomTooltipProps>) {
  return (
    <Tooltip
      title={title}
      placement={placement}
      describeChild={describeChild}
      arrow={arrow}
    >
      {children}
    </Tooltip>
  );
}