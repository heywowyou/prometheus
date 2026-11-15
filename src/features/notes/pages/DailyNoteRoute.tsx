import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageLoader from "@components/feedback/PageLoader";
import { getErrorMessage } from "@lib/api/errors";
import { useOpenDaily } from "../hooks/useNotes";
import { dailyTitle, dayKey } from "../note-tree";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** /notes/daily/:date (or "today"): finds or creates that day's note, then opens it. */
export default function DailyNoteRoute() {
  const { date = "today" } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const openDaily = useOpenDaily();
  const started = useRef<string | null>(null);

  useEffect(() => {
    const key = date === "today" ? dayKey(new Date()) : date;
    if (started.current === key) return;
    started.current = key;
    if (!DAY_PATTERN.test(key)) {
      navigate("/notes", { replace: true });
      return;
    }
    openDaily({ date: key, title: dailyTitle(key) })
      .then((note) => navigate(`/notes/${note._id}`, { replace: true }))
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error));
        navigate("/notes", { replace: true });
      });
  }, [date, navigate, openDaily]);

  return <PageLoader label="Opening the journal…" />;
}
