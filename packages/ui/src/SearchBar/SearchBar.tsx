import { useState, type ChangeEvent } from "react";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
//import IconButton from "@mui/material/IconButton";
//import { SearchIcon } from "../../../icons/Icons";

type SearchInputProps = {
  onSearch: (val: string) => void;
  placeholder?: string;
  width?: number | string;
  focusColor?: string;
  value?: string;
};

const paperStyles = (width: number | string, focusColor: string = "#9A2529") => ({
  display: "flex",
  alignItems: "center",
  width,
  borderRadius: "10px",
  px: 1,
  border: "2px solid #e0e0e0",

  "&:hover": {
    borderColor: focusColor,
  },

  "&:focus-within": {
    borderColor: focusColor,
  },
});

const inputStyles = {
  flex: 1,
  fontSize: "12px",
  ml: 1,
  py: 0.5,
  fontStyle: "italic",
};

export default function SearchBar({
  onSearch,
  placeholder = "Search by application number...",
  width = 200,
  focusColor = "#EA7617",
}: SearchInputProps) {
  const [value, setValue] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    onSearch(val.trim());
  };

  return (
    <Paper elevation={0} sx={paperStyles(width, focusColor)}>
      <InputBase
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        sx={inputStyles}
        inputProps={{ "aria-label": "search input" }}
      />

      {/* <IconButton size="small" aria-label="search">
        <SearchIcon />
      </IconButton> */}
    </Paper>
  );
}