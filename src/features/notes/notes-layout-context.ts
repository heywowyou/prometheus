import { useOutletContext } from "react-router-dom";

export interface NotesOutletContext {
  openSwitcher: () => void;
  openSidebar: () => void;
}

/** Handles from the notes layout, for pages rendered inside it. */
export const useNotesLayout = () => useOutletContext<NotesOutletContext>();
