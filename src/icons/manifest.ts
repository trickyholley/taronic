import { GAME_ICONS_ICONS } from "./generated/game-icons";
import type { IconDef } from "../types";

/** Icon sets baked in at build time via `pnpm icons:game-icons` (scripts/build-icons.mjs).
 * Anything imported at runtime through the "Import icons" button lives only in
 * memory for the session — see importIcons.ts. */
export const builtInIconSets: IconDef[] = [...GAME_ICONS_ICONS];
