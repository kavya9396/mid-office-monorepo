import { Pagination, type PaginationProps } from "@mui/material";

type CustomPaginationProps = Omit<PaginationProps, "onChange"> & {
  onChange: (page: number) => void;
};

/**
 * Rounded, small pager. Styles copied from the MMT Grievance prototype
 * (item colour #555555, selected page white on #E45F14).
 */
const CustomPagination = ({
  onChange,
  sx,
  ...rest
}: CustomPaginationProps) => (
  <Pagination
    shape="rounded"
    size="small"
    onChange={(_event, page) => onChange(page)}
    sx={{
      "& .MuiPaginationItem-root": { color: "#555555" },
      "& .MuiPaginationItem-root.Mui-selected": {
        color: "#ffffff",
        bgcolor: "#E45F14",
        "&:hover": { bgcolor: "#E45F14" },
      },
      ...sx,
    }}
    {...rest}
  />
);

export default CustomPagination;
