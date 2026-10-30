import { type ReactNode } from "react";
import { PlannerLocaleContext } from "@/hooks/use-planner-formatting";
export function FormattingProvider({ locale, children }: { locale: string; children: ReactNode }) {
  return <PlannerLocaleContext.Provider value={locale}>{children}</PlannerLocaleContext.Provider>;
}
