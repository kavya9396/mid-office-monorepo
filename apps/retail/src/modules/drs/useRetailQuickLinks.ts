/**
 * DRS `membersDetails[].subSections` for the Quick Link pages.
 * CUW / HOD / Sr UW read the CUW DRS; CVT and other Retail roles keep their built-in page data.
 * `data` is `undefined` until loaded, so a page keeps its built-in data meanwhile.
 */
export { useCuwQuickLinks as useRetailQuickLinks } from "./cuwQuickLinks";
