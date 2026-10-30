import { createContext, useContext } from "react";
import { formatMoney, niceDate } from "@/lib/planner";
export const PlannerLocaleContext = createContext("");
export function usePlannerFormatting() {
  const locale = useContext(PlannerLocaleContext);
  return {
    formatMoney: (value: number, currency: string) =>
      formatMoney(value, currency, locale || undefined),
    niceDate: (value: string) => niceDate(value, locale || undefined),
  };
}
