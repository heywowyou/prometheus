import { useClerk, useUser } from "@clerk/clerk-react";
import { Download, LogOut, UserCog } from "lucide-react";
import { Button } from "@components/ui/button";
import PageLoader from "@components/feedback/PageLoader";
import { useDataExport } from "@app/useDataExport";
import { MEDIA_TYPE_CONFIGS } from "@features/media/media-config";
import { useProfile } from "../hooks/useProfile";
import TopPicksRow from "../components/TopPicksRow";

/**
 * Who you are and what you love: the Clerk name and avatar, then the five
 * favorites of each media category. Also the home of the account actions the
 * avatar menu used to hold.
 */
function ProfilePage() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const downloadBackup = useDataExport();
  const { profile, loading, setPicks } = useProfile();

  const name = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "You";
  const since = user?.createdAt
    ? user.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-12 sm:gap-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        {user?.imageUrl && (
          <img
            src={user.imageUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full border border-border object-cover sm:h-28 sm:w-28"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-3">Profile{since ? ` · since ${since}` : ""}</p>
          <h1 className="page-title truncate">{name}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => openUserProfile()}>
              <UserCog className="h-3.5 w-3.5" />
              Manage account
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void downloadBackup()}>
              <Download className="h-3.5 w-3.5" />
              Download backup
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => void signOut({ redirectUrl: "/" })}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {loading || !profile ? (
        <PageLoader />
      ) : (
        MEDIA_TYPE_CONFIGS.map((config) => (
          <TopPicksRow
            key={config.type}
            config={config}
            picks={profile.topPicks[config.type] ?? []}
            onChange={(picks) => setPicks(config.type, picks)}
          />
        ))
      )}
    </div>
  );
}

export default ProfilePage;
