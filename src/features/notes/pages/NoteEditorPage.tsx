import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  ListTree,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  RotateCcw,
  Smile,
  Star,
} from "lucide-react";
import { EditorContent, type Content } from "@tiptap/react";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import {
  LinkBubbleMenu,
  SelectionBubbleMenu,
  useMinimalTiptapEditor,
} from "@components/ui/minimal-tiptap";
import PageLoader from "@components/feedback/PageLoader";
import { useDebouncedSave, type SaveStatus } from "@lib/hooks/useDebouncedSave";
import { getErrorMessage } from "@lib/api/errors";
import { cn } from "@lib/utils";
import { useUploadApi } from "@features/media/api/upload-api";
import { useMediaLogs } from "@features/media/hooks/useMediaLogs";
import { useTodos } from "@features/todos/hooks/useTodos";
import { useRoutines } from "@features/workouts/hooks/useWorkouts";
import { useNote, useNoteActions, useNoteIndex, useNoteTags } from "../hooks/useNotes";
import { dayKey, shiftDay, titleOf } from "../note-tree";
import { coverBackground } from "../note-decor";
import { countWords, describeLength } from "../note-utils";
import { downloadNoteAsMarkdown } from "../export-markdown";
import { createNoteExtensions } from "../editor/note-extensions";
import type { MentionSources } from "../editor/item-mention";
import type { SlashActions } from "../editor/slash-command";
import TableBubbleMenu from "../editor/TableBubbleMenu";
import TagInput from "../components/TagInput";
import { CoverPicker, NoteIcon } from "../components/PageDecor";
import { IconPicker } from "@components/ui/icon-picker";
import MoveToDialog from "../components/MoveToDialog";
import VersionHistoryDialog from "../components/VersionHistoryDialog";
import BacklinksPanel from "../components/BacklinksPanel";
import OutlinePanel from "../components/OutlinePanel";
import type { Note, NoteFontFamily, NoteIndexEntry, UpdateNotePayload } from "../types/note-types";
import "@components/ui/minimal-tiptap/styles/index.css";
import "../editor/note-editor.css";

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  switch (status) {
    case "pending":
    case "saving":
      return <span>Saving…</span>;
    case "saved":
      return (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      );
    case "error":
      return (
        <button
          type="button"
          onClick={onRetry}
          title="Your changes are kept and retried automatically"
          className="flex items-center gap-1 text-destructive hover:underline"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Not saved · retry
        </button>
      );
    default:
      return null;
  }
}

function IconButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Ancestors as links: Notes / Parent / Child. */
function Breadcrumb({ path, current }: { path: NoteIndexEntry[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
      <Link to="/notes" className="shrink-0 hover:text-foreground">
        Notes
      </Link>
      {path.map((entry) => (
        <Fragment key={entry._id}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to={`/notes/${entry._id}`} className="flex min-w-0 items-center gap-1 hover:text-foreground">
            <NoteIcon icon={entry.icon} className="h-3.5 w-3.5" />
            <span className="truncate">{titleOf(entry)}</span>
          </Link>
        </Fragment>
      ))}
      <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
      <span className="hidden truncate text-soft sm:block">{current || "Untitled"}</span>
    </nav>
  );
}

/** Grows with its content, like Notion's title. */
function TitleField({
  value,
  readOnly,
  onChange,
  onEnter,
}: {
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value.replace(/\n/g, " "))}
      onKeyDown={(event) => {
        if (event.key === "Enter" || (event.key === "ArrowDown" && event.currentTarget.selectionStart === value.length)) {
          event.preventDefault();
          onEnter();
        }
      }}
      placeholder="Untitled"
      aria-label="Page title"
      className="w-full resize-none overflow-hidden border-none bg-transparent font-serif text-[2.25rem] font-normal leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-[2.75rem]"
    />
  );
}

interface EditorProps {
  note: Note;
  save: (payload: UpdateNotePayload) => Promise<unknown>;
  onRestored: () => void;
  /** The page changed elsewhere (Claude, another device): show the new copy. */
  onExternalChange: () => void;
}

/** Keyed on the note id by the route component, so state seeds from the note. */
function NoteEditor({ note, save, onRestored, onExternalChange }: EditorProps) {
  const navigate = useNavigate();
  const { uploadCover } = useUploadApi();
  const actions = useNoteActions();
  const tagSuggestions = useNoteTags().map(({ tag }) => tag);
  const { entries, tree } = useNoteIndex();
  const { logs } = useMediaLogs();
  const { todos } = useTodos();
  const { routines } = useRoutines();

  const inTrash = Boolean(note.deletedAt);
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [fontFamily, setFontFamily] = useState<NoteFontFamily>(note.fontFamily ?? "sans");
  const [icon, setIcon] = useState(note.icon ?? "");
  const [cover, setCover] = useState(note.cover ?? null);
  const [words, setWords] = useState(() => countWords(note.content ?? ""));
  const [outline, setOutline] = useState<TableOfContentData>([]);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const contentRef = useRef(note.content ?? "");
  const imageInput = useRef<HTMLInputElement>(null);

  // Versions this editor wrote itself: their echo from the server isn't news.
  const ownVersions = useRef(new Set<string | undefined>([note.updatedAt]));
  const saveOwn = useCallback(
    async (payload: UpdateNotePayload) => {
      const saved = (await save(payload)) as Partial<Note> | undefined;
      ownVersions.current.add(saved?.updatedAt);
      return saved;
    },
    [save],
  );
  const { status, schedule, flush } = useDebouncedSave<UpdateNotePayload>({ save: saveOwn });

  // The editor's extensions are built once; they read live data through refs.
  const indexRef = useRef<NoteIndexEntry[]>(entries);
  const sourcesRef = useRef<MentionSources>({ media: logs, todos, routines, notes: entries });
  useEffect(() => {
    indexRef.current = entries;
    sourcesRef.current = { media: logs, todos, routines, notes: entries };
  }, [entries, logs, todos, routines]);

  const createSubPage = useCallback(
    async (pageTitle = "") => {
      await flush();
      const page = await actions.createNote({ parentId: note._id, title: pageTitle });
      return page;
    },
    [actions, flush, note._id],
  );

  const slashRef = useRef<SlashActions>({ createSubPage: async () => null, pickImage: () => undefined });
  useEffect(() => {
    slashRef.current = {
      createSubPage: async () => {
        try {
          const page = await createSubPage();
          toast("Sub-page created", {
            action: { label: "Open", onClick: () => navigate(`/notes/${page._id}`) },
          });
          return { id: page._id, title: page.title };
        } catch (error) {
          toast.error(getErrorMessage(error));
          return null;
        }
      },
      pickImage: () => imageInput.current?.click(),
    };
  }, [createSubPage, navigate]);

  const createLinkedRef = useRef(createSubPage);
  useEffect(() => {
    createLinkedRef.current = createSubPage;
  }, [createSubPage]);

  const extensions = useMemo(
    () =>
      createNoteExtensions({
        currentNoteId: note._id,
        readOnly: inTrash,
        getIndex: () => indexRef.current,
        getMentionSources: () => sourcesRef.current,
        getSlashActions: () => slashRef.current,
        createLinkedPage: async (pageTitle) => (await createLinkedRef.current(pageTitle))._id,
        onOutline: setOutline,
      }),
    // Built once per mounted note (the route keys this component on it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const uploadImage = useCallback(async (file: File): Promise<string> => (await uploadCover(file)).url, [uploadCover]);

  const handleEditorChange = useCallback(
    (value: Content) => {
      const html = String(value ?? "");
      // Loading the body (and the outline tagging headings) emits updates
      // that change nothing; saving them would snapshot a version per visit.
      if (html === contentRef.current) return;
      contentRef.current = html;
      setWords(countWords(html));
      schedule({ content: html });
    },
    [schedule],
  );

  const editor = useMinimalTiptapEditor({
    value: note.content || "",
    onUpdate: handleEditorChange,
    uploader: uploadImage,
    editable: !inTrash,
    output: "html",
    placeholder: "Type / for blocks, [[ to link a page, @ to mention",
    extraExtensions: extensions,
  });

  // Edits made elsewhere (Claude through the connector, another device) reach
  // the cached note when the app refetches; the editor only read the note
  // when it mounted. When the stored copy differs from what's on screen and
  // nothing typed here is waiting to be saved, show the stored copy. While
  // typing in the page, ask first rather than moving the cursor.
  const differsFromScreen =
    (note.content ?? "") !== contentRef.current ||
    note.title !== title ||
    (note.icon ?? "") !== icon ||
    (note.tags ?? []).join("\u0000") !== tags.join("\u0000");
  const idle = status === "idle" || status === "saved";
  const fromElsewhere = !ownVersions.current.has(note.updatedAt);
  useEffect(() => {
    if (!fromElsewhere || !differsFromScreen || !idle || inTrash) return;
    const editing = editor?.isFocused || document.activeElement?.matches("input, textarea");
    if (!editing) {
      onExternalChange();
      return;
    }
    toast("This page changed elsewhere", {
      id: `note-changed-${note._id}`,
      duration: Infinity,
      action: { label: "Show latest", onClick: onExternalChange },
    });
  }, [fromElsewhere, differsFromScreen, idle, inTrash, editor, note._id, note.updatedAt, onExternalChange]);
  useEffect(() => () => void toast.dismiss(`note-changed-${note._id}`), [note._id]);

  // Focus mode hides the app's chrome (header, tab bar, page sidebar).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("focus-mode", focusMode);
    if (!focusMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      root.classList.remove("focus-mode");
    };
  }, [focusMode]);

  // Ctrl/Cmd+Shift+F toggles focus mode.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const entry = tree.byId.get(note._id);
  const pinned = entry?.pinned ?? note.pinned;
  const isTemplate = entry?.isTemplate ?? Boolean(note.isTemplate);
  const isDailyTemplate = entry?.isDailyTemplate ?? Boolean(note.isDailyTemplate);
  const path = tree.pathTo(note._id);
  const children = tree.childrenOf(note._id);
  const today = dayKey(new Date());

  const afterSaving = (action: () => void) => async () => {
    await flush();
    action();
  };

  const exportMarkdown = async () => {
    try {
      await downloadNoteAsMarkdown(title, contentRef.current);
    } catch (error) {
      toast.error(`Export failed: ${getErrorMessage(error)}`);
    }
  };

  const duplicate = async () => {
    await flush();
    try {
      const copy = await actions.duplicateNote(note._id);
      navigate(`/notes/${copy._id}`);
    } catch {
      /* already toasted by the query client */
    }
  };

  const updateNow = (payload: UpdateNotePayload) => {
    void actions.updateNote(note._id, payload).catch(() => undefined);
  };

  const changeIcon = (next: string) => {
    setIcon(next);
    updateNow({ icon: next });
  };

  const changeCover = (next: Note["cover"]) => {
    setCover(next ?? null);
    updateNow({ cover: next ?? null });
  };

  const changeFont = (next: NoteFontFamily) => {
    setFontFamily(next);
    schedule({ fontFamily: next });
  };

  const insertImage = async (file: File) => {
    try {
      const { url } = await uploadCover(file);
      editor?.chain().focus().insertContent({ type: "image", attrs: { src: url } }).run();
    } catch (error) {
      toast.error(`Upload failed: ${getErrorMessage(error)}`);
    }
  };

  const length = describeLength(words);
  const dailyDate = note.dailyDate;

  return (
    <div className={cn("flex gap-10", focusMode && "mx-auto max-w-3xl pt-6")}>
      <article className="min-w-0 flex-1">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className={cn("min-w-0", focusMode && "invisible")}>
            <Breadcrumb path={path} current={title} />
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {length && <span className="mr-2 hidden md:inline">{length}</span>}
            <span className="mr-1 flex min-w-[64px] items-center justify-end gap-1.5">
              <SaveIndicator status={status} onRetry={() => void flush()} />
            </span>
            {!inTrash && (
              <>
                <IconButton
                  label={pinned ? "Remove from favorites" : "Add to favorites"}
                  active={pinned}
                  onClick={() => actions.setPinned(note._id, !pinned)}
                >
                  <Star className={cn("h-4 w-4", pinned && "fill-rating text-rating")} />
                </IconButton>
                <Popover open={outlineOpen} onOpenChange={setOutlineOpen}>
                  <PopoverTrigger asChild>
                    <span className="2xl:hidden">
                      <IconButton label="Outline" active={outlineOpen}>
                        <ListTree className="h-4 w-4" />
                      </IconButton>
                    </span>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-2">
                    <OutlinePanel items={outline} onPick={() => setOutlineOpen(false)} />
                  </PopoverContent>
                </Popover>
                <IconButton
                  label={focusMode ? "Exit focus mode (Esc)" : "Focus mode (Ctrl Shift F)"}
                  active={focusMode}
                  onClick={() => setFocusMode((value) => !value)}
                >
                  {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </IconButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Page actions"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Text</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked={fontFamily === "sans"} onCheckedChange={() => changeFont("sans")}>
                      Sans
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={fontFamily === "serif"}
                      onCheckedChange={() => changeFont("serif")}
                      className="font-serif text-[15px]"
                    >
                      Serif
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setMoving(true)}>Move to…</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void duplicate()}>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={afterSaving(() => setHistoryOpen(true))}>Page history</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void exportMarkdown()}>Export as Markdown</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!dailyDate && (
                      <DropdownMenuItem onClick={() => updateNow({ isTemplate: !isTemplate })}>
                        {isTemplate ? "Turn back into a page" : "Save as template"}
                      </DropdownMenuItem>
                    )}
                    {isTemplate && (
                      <DropdownMenuItem onClick={() => updateNow({ isDailyTemplate: !isDailyTemplate })}>
                        {isDailyTemplate ? "Stop using for daily notes" : "Use for new daily notes"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={afterSaving(() => {
                        if (note.archived) {
                          actions.unarchiveNote(note._id);
                        } else {
                          actions.archiveNote(note._id);
                          navigate("/notes");
                        }
                      })}
                    >
                      {note.archived ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={afterSaving(() => {
                        actions.trashNote(note._id);
                        navigate("/notes");
                      })}
                    >
                      Move to trash
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {inTrash && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
            <span>This page is in the trash and can't be edited.</span>
            <Button size="sm" variant="outline" onClick={() => actions.restoreNote(note._id)}>
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </Button>
          </div>
        )}

        {/* Cover */}
        {cover && (
          <div
            className="group relative mb-2 h-40 overflow-hidden rounded-3xl sm:h-52"
            style={{ background: coverBackground(cover) }}
          >
            {!inTrash && (
              <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 touch:opacity-100">
                <CoverPicker hasCover onChange={changeCover}>
                  <button
                    type="button"
                    className="rounded-full bg-background/80 px-3 py-1.5 text-xs text-foreground backdrop-blur hover:bg-background"
                  >
                    Change cover
                  </button>
                </CoverPicker>
              </div>
            )}
          </div>
        )}

        <div className="mx-auto max-w-3xl">
          {/* Icon and the add-icon / add-cover row */}
          {icon && (
            <IconPicker value={icon} onChange={changeIcon}>
              <button
                type="button"
                disabled={inTrash}
                aria-label="Change icon"
                className={cn(
                  "relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors hover:bg-secondary",
                  cover && "-mt-10 border border-border bg-card",
                )}
              >
                <NoteIcon icon={icon} className="h-10 w-10 text-foreground" />
              </button>
            </IconPicker>
          )}
          {!inTrash && (!icon || !cover) && (
            <div className="mb-1 flex gap-1 text-sm text-muted-foreground">
              {!icon && (
                <IconPicker onChange={changeIcon}>
                  <button type="button" className="flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:bg-secondary hover:text-foreground">
                    <Smile className="h-3.5 w-3.5" /> Add icon
                  </button>
                </IconPicker>
              )}
              {!cover && (
                <CoverPicker hasCover={false} onChange={changeCover}>
                  <button type="button" className="flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:bg-secondary hover:text-foreground">
                    <ImagePlus className="h-3.5 w-3.5" /> Add cover
                  </button>
                </CoverPicker>
              )}
            </div>
          )}

          {dailyDate && (
            <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Link
                to={`/notes/daily/${shiftDay(dailyDate, -1)}`}
                aria-label="Previous day"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="eyebrow">{dailyDate === today ? "Today" : "Journal"}</span>
              <Link
                to={`/notes/daily/${shiftDay(dailyDate, 1)}`}
                aria-label="Next day"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
              {dailyDate !== today && (
                <Link to={`/notes/daily/${today}`} className="rounded-full px-2.5 py-1 hover:bg-secondary hover:text-foreground">
                  Back to today
                </Link>
              )}
            </div>
          )}

          {isTemplate && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-info/30 bg-info/10 px-4 py-2.5 text-sm text-soft">
              <span>
                Template{isDailyTemplate ? " for new daily notes" : ""}. Pages made from it start with this content.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={afterSaving(async () => {
                  const page = await actions.createNote({ templateId: note._id });
                  navigate(`/notes/${page._id}`);
                })}
              >
                Use template
              </Button>
            </div>
          )}

          <TitleField
            value={title}
            readOnly={inTrash}
            onChange={(value) => {
              setTitle(value);
              schedule({ title: value });
            }}
            onEnter={() => editor?.chain().focus("start").run()}
          />

          <div className="mb-6 mt-2">
            <TagInput
              value={tags}
              disabled={inTrash}
              suggestions={tagSuggestions}
              onChange={(next) => {
                setTags(next);
                schedule({ tags: next });
              }}
            />
          </div>

          <div className={cn("note-editor minimal-tiptap-editor", fontFamily === "serif" && "is-serif")}>
            {editor ? (
              <>
                <EditorContent editor={editor} />
                <SelectionBubbleMenu editor={editor} />
                <LinkBubbleMenu editor={editor} />
                <TableBubbleMenu editor={editor} />
              </>
            ) : (
              <div className="h-40" />
            )}
          </div>

          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void insertImage(file);
            }}
          />

          {children.length > 0 && (
            <section className="mt-12" aria-label="Sub-pages">
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Sub-pages</h2>
              <ul className="grid gap-1 sm:grid-cols-2">
                {children.map((child) => (
                  <li key={child._id}>
                    <Link
                      to={`/notes/${child._id}`}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-soft transition-colors hover:bg-card hover:text-foreground"
                    >
                      <NoteIcon icon={child.icon} className="h-4 w-4" />
                      <span className="truncate">{titleOf(child)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <BacklinksPanel noteId={note._id} title={title} />

          {length && <p className="mt-6 text-right text-xs text-muted-foreground md:hidden">{length}</p>}
        </div>
      </article>

      {!focusMode && (
        <aside data-app-chrome className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-52 shrink-0 overflow-y-auto 2xl:block">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">On this page</p>
          <OutlinePanel items={outline} />
        </aside>
      )}

      <MoveToDialog noteId={moving ? note._id : null} onClose={() => setMoving(false)} />
      {!inTrash && (
        <VersionHistoryDialog
          noteId={note._id}
          open={historyOpen}
          serif={fontFamily === "serif"}
          beforeRestore={flush}
          onOpenChange={setHistoryOpen}
          onRestored={onRestored}
        />
      )}
    </div>
  );
}

function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { note, loading, error, save } = useNote(id);
  // Bumped after a version restore, to remount the editor on the restored body.
  const [revision, setRevision] = useState(0);
  const showLatest = useCallback(() => setRevision((value) => value + 1), []);

  // A note that can't be loaded (deleted, or not ours) sends us back.
  useEffect(() => {
    if (error) navigate("/notes", { replace: true });
  }, [error, navigate]);

  if (loading) return <PageLoader label="Loading page…" />;
  if (!note) return null;

  return (
    <NoteEditor
      // Restoring from the trash remounts the editor so it becomes editable.
      key={`${note._id}:${note.deletedAt ? "trash" : "live"}:${revision}`}
      note={note}
      save={save}
      onRestored={() => setRevision((value) => value + 1)}
      onExternalChange={showLatest}
    />
  );
}

export default NoteEditorPage;
