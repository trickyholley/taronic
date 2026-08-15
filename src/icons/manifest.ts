import { LUCIDE_ICONS } from "./generated/lucide";
import type { IconDef } from "../types";

/** Icon sets baked in at build time via `pnpm icons:lucide` (scripts/build-icons.mjs).
 * Anything imported at runtime through the "Import icons" button lives only in
 * memory for the session — see importIcons.ts. */
export const builtInIconSets: IconDef[] = [...LUCIDE_ICONS];
