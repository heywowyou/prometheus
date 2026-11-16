import { useState } from "react";
import { useCommandPalette } from "@app/command-palette";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import NotesSidebar from "../components/NotesSidebar";
import type { NotesOutletContext } from "../notes-layout-context";


/** The notes app: page sidebar (a sheet on phones), Ctrl/Cmd+K switcher, and the routed page. */
export default function NotesLayout() {
  const { pathname } = useLocation();
  const match = useMatch("/notes/:id");
  const activeId = match?.params.id;
  const palette = useCommandPalette();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPath, setSheetPath] = useState(pathname);

  // A route change closes the phone sheet.
  if (sheetPath !== pathname) {
    setSheetPath(pathname);
    setSheetOpen(false);
  }

  const context: NotesOutletContext = {
    openSwitcher: () => palette.open(),
    openSidebar: () => setSheetOpen(true),
  };

  return (
    <div className="flex gap-10">
      <aside
        data-app-chrome
        className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-64 shrink-0 overflow-y-auto pb-6 pr-1 lg:block"
      >
        <NotesSidebar activeId={activeId} onOpenSwitcher={() => palette.open()} />
      </aside>

      <div className="min-w-0 flex-1">
        <div data-app-chrome className="mb-4 flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm text-soft"
          >
            <PanelLeft className="h-4 w-4" /> Pages
          </button>
        </div>
        <Outlet context={context} />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="gap-2">
          <SheetTitle className="sr-only">Pages</SheetTitle>
          <SheetDescription className="sr-only">Every page, the journal and templates</SheetDescription>
          <NotesSidebar
            className="min-h-0 overflow-y-auto px-1 pb-2"
            activeId={activeId}
            onNavigate={() => setSheetOpen(false)}
            onOpenSwitcher={() => {
              setSheetOpen(false);
              palette.open();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
