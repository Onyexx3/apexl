import type { SavingsPlan } from "@shared/schema";

// Daily savings plans always run for 31 contribution days, regardless of what
// maxContributions holds in the database (older rows stored 62 there).
export const DAILY_PLAN_MAX_CONTRIBUTIONS = 31;

export function getPlanMaxContributions(_plan: SavingsPlan): number {
  return DAILY_PLAN_MAX_CONTRIBUTIONS;
}
