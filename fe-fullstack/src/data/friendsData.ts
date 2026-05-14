export type Presence = "online" | "busy" | "offline";

export interface Friend {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  presence: Presence;
  statusLabel: string;
  statusColor: "green" | "orange" | "purple";
}

export interface PendingRequest {
  id: string;
  name: string;
  subtitle: string;
  avatarUrl: string;
}

export const friends: Friend[] = [
  {
    id: "962fbb4c-9bb5-4152-a7d0-08883041e3d7",
    name: "alice01",
    role: "Backend Developer",
    avatarUrl: "https://avatar.example.com/alice01.png",
    presence: "online",
    statusLabel: "Available",
    statusColor: "green",
  },
  {
    id: "41e176ec-ddb0-411c-832c-331c9b75e3c0",
    name: "bob02",
    role: "Frontend Developer",
    avatarUrl: "https://avatar.example.com/bob02.png",
    presence: "online",
    statusLabel: "In a meeting",
    statusColor: "orange",
  },
  {
    id: "a3e176ec-ddb0-411c-832c-331c9b75e3c1",
    name: "charlie03",
    role: "DevOps Engineer",
    avatarUrl: "https://avatar.example.com/charlie03.png",
    presence: "offline",
    statusLabel: "Last seen 2h ago",
    statusColor: "green",
  },
  {
    id: "b4e176ec-ddb0-411c-832c-331c9b75e3c2",
    name: "david04",
    role: "Product Manager",
    avatarUrl: "https://avatar.example.com/david04.png",
    presence: "busy",
    statusLabel: "Do not disturb",
    statusColor: "orange",
  },
  {
    id: "c5e176ec-ddb0-411c-832c-331c9b75e3c3",
    name: "emma05",
    role: "UI/UX Designer",
    avatarUrl: "https://avatar.example.com/emma05.png",
    presence: "online",
    statusLabel: "Available",
    statusColor: "green",
  },
  {
    id: "d6e176ec-ddb0-411c-832c-331c9b75e3c4",
    name: "frank06",
    role: "Fullstack Developer",
    avatarUrl: "https://avatar.example.com/frank06.png",
    presence: "busy",
    statusLabel: "Traveling",
    statusColor: "purple",
  },
];

export const pendingRequests: PendingRequest[] = [
  {
    id: "p1",
    name: "grace07",
    subtitle: "Mutual friend with alice01",
    avatarUrl: "https://avatar.example.com/grace07.png",
  },
  {
    id: "p2",
    name: "henry08",
    subtitle: "From Backend Team",
    avatarUrl: "https://avatar.example.com/henry08.png",
  },
];
