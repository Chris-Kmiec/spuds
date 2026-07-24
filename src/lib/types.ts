export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  onboarded: boolean;
  created_at: string;
};

export type GamingProfile = {
  id: string;
  user_id: string;
  favorite_games: string[];
  platforms: string[];
  play_styles: string[];
  availability: string[];
  goals: string[];
};

export type EventRow = {
  id: string;
  host_id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  event_type: "gaming_party" | "board_game" | "watch_party" | "club";
  games: string[];
  platforms: string[];
  start_time: string;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  price: number;
  skill_level: "all" | "beginner" | "intermediate" | "competitive";
  equipment: string | null;
  rules: string | null;
  featured: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
  created_at: string;
};

export type EventWithHost = EventRow & {
  host: Profile;
  attendees: { count: number }[];
};

export type Attendee = {
  id: string;
  event_id: string;
  user_id: string;
  status: "going" | "waitlist" | "cancelled";
  guests: number;
  message: string | null;
  joined_at: string;
  profile?: Profile;
};

export type Community = {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  privacy: "public" | "private";
  games: string[];
  location: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
};

export type Review = {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  event_id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  created_at: string;
  reviewer?: Profile;
};
