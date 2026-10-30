import { createFileRoute } from "@tanstack/react-router";
import { Kivora } from "@/components/planner/app";

export const Route = createFileRoute("/")({ component: Kivora });
