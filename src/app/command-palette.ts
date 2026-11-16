import { createContext, useContext } from "react";

export interface CommandPaletteApi {
  open: (initialQuery?: string) => void;
}

export const CommandPaletteContext = createContext<CommandPaletteApi>({ open: () => undefined });

/** Opens the app-wide search and quick-add palette (also Ctrl/Cmd+K). */
export const useCommandPalette = () => useContext(CommandPaletteContext);
