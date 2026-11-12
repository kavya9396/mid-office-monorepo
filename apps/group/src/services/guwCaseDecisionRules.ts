/**
 * Derives the case-level "Case UW Decision" (member selection / summary page) from the individual
 * member decisions.
 *
 * This file is the single place for that logic. To move to an API later, replace the body of
 * `deriveCaseUwDecision` with the service call; the signature (async, members in, decision code out)
 * and its only caller (`GuwMemberSelection`) stay as they are.
 *
 * The business grid is data (`DECISION_GRID`). The grid combines two decisions; for any number of
 * members the decisions are folded left to right (LA1 + LA2 -> result, result + LA3 -> result, ...),
 * so adding members needs no code change.
 */

/** One member's decision as saved on the member DRS page. `decisionCode` is "" when none is saved yet. */
export interface GuwMemberDecisionInput {
  memberId: string;
  /** Case UW Decision code, e.g. STD, BOR_STD, REJ, DC, POSTP, CO, EP */
  decisionCode: string;
}

/** Decision groups used by the grid. */
type DecisionGroup = "STD" | "BSTD" | "DECLINE_POSTPONE" | "CO" | "XRT";

/** Case UW Decision codes the grid can return (same codes as the Case UW Decision dropdown). */
type FinalDecisionCode = "STD" | "BOR_STD" | "REJ" | "CO" | "EP";

/** Decision code (member decision or grid result) -> grid group. Codes not listed cannot be derived. */
const GROUP_OF_CODE: Readonly<Record<string, DecisionGroup>> = {
  STD: "STD",
  BOR_STD: "BSTD",
  REJ: "DECLINE_POSTPONE",
  DC: "DECLINE_POSTPONE",
  POSTP: "DECLINE_POSTPONE",
  CO: "CO",
  EP: "XRT",
};

/** Grid row: [first decision (LA1 / running result), next decision (LA2 / Proposer with WOP), final decision]. */
type GridRow = readonly [DecisionGroup, DecisionGroup, FinalDecisionCode];

const DECISION_GRID: readonly GridRow[] = [
  ["STD", "STD", "STD"],
  ["STD", "BSTD", "BOR_STD"],
  ["STD", "DECLINE_POSTPONE", "REJ"],
  ["STD", "CO", "CO"],
  ["STD", "XRT", "EP"],

  ["DECLINE_POSTPONE", "STD", "REJ"],
  ["DECLINE_POSTPONE", "BSTD", "REJ"],
  ["DECLINE_POSTPONE", "DECLINE_POSTPONE", "REJ"],
  ["DECLINE_POSTPONE", "CO", "REJ"],
  ["DECLINE_POSTPONE", "XRT", "REJ"],

  ["CO", "STD", "CO"],
  ["CO", "BSTD", "CO"],
  ["CO", "DECLINE_POSTPONE", "REJ"],
  ["CO", "CO", "CO"],
  ["CO", "XRT", "EP"],

  ["XRT", "STD", "EP"],
  ["XRT", "BSTD", "EP"],
  ["XRT", "DECLINE_POSTPONE", "REJ"],
  ["XRT", "CO", "EP"],
  ["XRT", "XRT", "EP"],

  ["BSTD", "STD", "BOR_STD"],
  ["BSTD", "BSTD", "BOR_STD"],
  ["BSTD", "DECLINE_POSTPONE", "REJ"],
  ["BSTD", "CO", "CO"],
  ["BSTD", "XRT", "EP"],
];

/**
 * When true, no case decision is derived until every member has a decision.
 * Set to false if the grid should also work on partial member decisions.
 */
const REQUIRE_ALL_MEMBERS_DECIDED = true;

function lookup(first: DecisionGroup, next: DecisionGroup): FinalDecisionCode | "" {
  return DECISION_GRID.find(([a, b]) => a === first && b === next)?.[2] ?? "";
}

/**
 * Case UW Decision code for the given member decisions, or "" when none can be derived
 * (no members, a member still undecided, a decision the grid does not cover, e.g. Referral / Hold).
 * Members are taken in the given order (LA1 first).
 */
export async function deriveCaseUwDecision(
  members: readonly GuwMemberDecisionInput[],
): Promise<string> {
  if (members.length === 0) return "";
  const decided = members.filter((m) => m.decisionCode);
  if (decided.length === 0) return "";
  if (REQUIRE_ALL_MEMBERS_DECIDED && decided.length !== members.length) return "";

  const groups: DecisionGroup[] = [];
  for (const m of decided) {
    const group = GROUP_OF_CODE[m.decisionCode];
    if (!group) return "";
    groups.push(group);
  }

  // A single member combines with itself (grid diagonal); more members fold left to right
  let result = lookup(groups[0], groups[0]);
  for (let i = 1; i < groups.length && result; i += 1) {
    const running = GROUP_OF_CODE[result];
    result = running ? lookup(running, groups[i]) : "";
  }
  return result;
}
