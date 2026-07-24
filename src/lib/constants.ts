export const POPULAR_GAMES = [
  "Super Smash Bros. Ultimate",
  "Mario Kart 8 Deluxe",
  "Street Fighter 6",
  "Tekken 8",
  "Rocket League",
  "Valorant",
  "Counter-Strike 2",
  "Stardew Valley",
  "Animal Crossing: New Horizons",
  "Balatro",
  "Hades II",
  "Mario Party Superstars",
  "Overcooked 2",
  "Halo Infinite",
  "Apex Legends",
  "EA Sports FC 25",
  "Guilty Gear Strive",
  "Minecraft",
  "Fortnite",
  "Super Mario World",
  "GoldenEye 007",
  "Celeste",
];

export const PLATFORMS = [
  "Switch",
  "PC",
  "PS5",
  "Xbox",
  "Steam Deck",
  "GameCube",
  "SNES",
  "Genesis",
  "Arcade",
  "Mobile",
];

export const PLAY_STYLES = [
  "Casual",
  "Competitive",
  "Social",
  "Cozy",
  "Learning",
  "Team player",
  "Collector",
  "Explorer",
];

export const AVAILABILITY = [
  "Weeknights",
  "Weekends",
  "Weekday afternoons",
  "Late nights",
];

export const GOALS = [
  "Make friends",
  "Find a squad",
  "Improve skills",
  "Try new games",
  "Host events",
  "Build community",
];

export const EVENT_TYPES = [
  { value: "gaming_party", label: "Gaming party" },
  { value: "board_game", label: "Board game night" },
  { value: "watch_party", label: "Watch party" },
  { value: "club", label: "Club meetup" },
] as const;

// Includes legacy labels for rows that predate the type cleanup.
export const EVENT_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label])),
  casual: "Meetup",
  lan: "Gaming party",
  tournament: "Gaming party",
};

// Watch parties are about content, not games — shows, movies, esports, etc.
export const WATCH_SUGGESTIONS = [
  "Movie marathon",
  "TV series binge",
  "Season premiere",
  "Esports finals",
  "Speedrun marathon (GDQ)",
  "Anime night",
  "Live sports",
  "Awards show",
  "Horror night",
  "The Game Awards",
];

// Board game nights are tabletop — popular titles plus a bring-your-own option.
export const BOARD_GAME_SUGGESTIONS = [
  "Catan",
  "Wingspan",
  "Ticket to Ride",
  "Codenames",
  "Carcassonne",
  "Azul",
  "Dungeons & Dragons",
  "Pandemic",
  "Root",
  "Bring your own",
];

/** Type-aware copy so the wizard and event page speak the right language. */
export function eventContentCopy(eventType: string) {
  if (eventType === "watch_party") {
    return {
      stepLabel: "Watching",
      question: "What are we watching?",
      addPlaceholder: "Add a show, movie, or event…",
      sectionTitle: "What we're watching",
      suggestions: WATCH_SUGGESTIONS,
      showPlatforms: false,
    };
  }
  if (eventType === "board_game") {
    return {
      stepLabel: "Games",
      question: "Which board games?",
      addPlaceholder: "Add a board game…",
      sectionTitle: "What we're playing",
      suggestions: BOARD_GAME_SUGGESTIONS,
      showPlatforms: false,
    };
  }
  return {
    stepLabel: "Games",
    question: "What are you playing?",
    addPlaceholder: "Add another game…",
    sectionTitle: "What we're playing",
    suggestions: POPULAR_GAMES.slice(0, 14),
    showPlatforms: true,
  };
}

export const REVIEW_TAGS = [
  "Friendly",
  "Organized",
  "Great setup",
  "Beginner friendly",
  "Good communication",
  "Fun crowd",
];

export const DEFAULT_EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&q=80",
  "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=1200&q=80",
];

export function badgesFor(stats: {
  eventsHosted: number;
  eventsAttended: number;
}) {
  const badges: { emoji: string; label: string }[] = [];
  if (stats.eventsHosted >= 1) badges.push({ emoji: "🌱", label: "First Host" });
  if (stats.eventsHosted >= 5)
    badges.push({ emoji: "🎮", label: "Community Builder" });
  if (stats.eventsHosted >= 10)
    badges.push({ emoji: "🏆", label: "Tournament Organizer" });
  if (stats.eventsAttended >= 3)
    badges.push({ emoji: "🔥", label: "Regular Player" });
  return badges;
}
