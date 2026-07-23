import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { badgesFor } from "@/lib/constants";
import type { GamingProfile, Profile, Review } from "@/lib/types";
import { MapPin, Star } from "lucide-react";

export type ProfileViewData = {
  profile: Profile;
  gamingProfile: GamingProfile | null;
  eventsHosted: number;
  eventsAttended: number;
  followers: number;
  avgRating: number;
  reviews: (Review & { reviewer: Profile })[];
};

export function ProfileView({
  data,
  actions,
}: {
  data: ProfileViewData;
  actions?: React.ReactNode;
}) {
  const { profile, gamingProfile: gp } = data;
  const name = profile.display_name ?? profile.username;
  const badges = badgesFor({
    eventsHosted: data.eventsHosted,
    eventsAttended: data.eventsAttended,
  });

  return (
    <div className="space-y-4">
      {/* identity */}
      <Card className="p-6 text-center">
        <Avatar
          src={profile.avatar_url}
          name={name}
          size="xl"
          className="mx-auto"
        />
        <h1 className="mt-3 font-display text-2xl font-black">{name}</h1>
        <p className="text-sm text-soil-800/50">@{profile.username}</p>
        {profile.location && (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-soil-800/60">
            <MapPin className="size-4" /> {profile.location}
          </p>
        )}
        {profile.bio && (
          <p className="mx-auto mt-3 max-w-sm text-soil-800/80">
            {profile.bio}
          </p>
        )}

        <div className="mt-4 flex justify-center gap-6 text-center">
          <Stat label="Attended" value={data.eventsAttended} />
          <Stat label="Hosted" value={data.eventsHosted} />
          <Stat label="Followers" value={data.followers} />
          {data.reviews.length > 0 && (
            <div>
              <p className="flex items-center gap-1 font-display text-xl font-black">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {data.avgRating.toFixed(1)}
              </p>
              <p className="text-xs font-semibold text-soil-800/50">Rating</p>
            </div>
          )}
        </div>

        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {badges.map((b) => (
              <Badge key={b.label}>
                {b.emoji} {b.label}
              </Badge>
            ))}
          </div>
        )}

        {actions && <div className="mt-5">{actions}</div>}
      </Card>

      {/* gaming identity */}
      {gp && (
        <Card className="space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold">
            Gaming identity
          </h2>
          {gp.favorite_games.length > 0 && (
            <IdentityRow label="Plays" items={gp.favorite_games} />
          )}
          {gp.platforms.length > 0 && (
            <IdentityRow label="On" items={gp.platforms} />
          )}
          {gp.play_styles.length > 0 && (
            <IdentityRow label="Style" items={gp.play_styles} />
          )}
          {gp.availability.length > 0 && (
            <IdentityRow label="Around" items={gp.availability} />
          )}
        </Card>
      )}

      {/* reviews */}
      {data.reviews.length > 0 && (
        <Card className="space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold">
            Reviews ({data.reviews.length})
          </h2>
          {data.reviews.map((r) => (
            <div
              key={r.id}
              className="border-b border-soil-800/5 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2 text-sm">
                <Avatar
                  src={r.reviewer?.avatar_url}
                  name={r.reviewer?.display_name ?? "Player"}
                  size="sm"
                />
                <span className="font-semibold">
                  {r.reviewer?.display_name ?? r.reviewer?.username}
                </span>
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {r.rating}
                </span>
              </div>
              {r.comment && (
                <p className="mt-1.5 text-sm text-soil-800/70">{r.comment}</p>
              )}
              {r.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-xl font-black">{value}</p>
      <p className="text-xs font-semibold text-soil-800/50">{label}</p>
    </div>
  );
}

function IdentityRow({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-soil-800/50">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <Badge key={i}>{i}</Badge>
        ))}
      </div>
    </div>
  );
}
