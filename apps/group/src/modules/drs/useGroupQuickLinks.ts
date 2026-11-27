/**
 * DRS `membersDetails[].subSections` for the Quick Link pages.
 * DVT roles read the group DRS; every other Group role (GUW, referral) reads the GUW DRS.
 * `data` is `undefined` until loaded, so a page keeps its built-in data meanwhile.
 */
export { useGuwQuickLinks as useGroupQuickLinks } from "./guwQuickLinks";
