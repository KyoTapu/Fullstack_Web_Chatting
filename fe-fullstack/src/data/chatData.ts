export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  title?: string;
  isMe?: boolean;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  time: string;
  dateLabel?: string;
}

export interface Channel {
  id: string;
  name: string;
  unread?: boolean;
  isActive?: boolean;
}

export interface DirectMessage {
  id: string;
  userId: string;
  isActive?: boolean;
}

export const users: User[] = [
  {
    id: "u1",
    name: "Sarah Miller",
    avatarUrl:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&w=80",
    title: "Brand Designer",
  },
  {
    id: "u2",
    name: "James Wilson",
    avatarUrl:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&w=80",
    title: "Product Lead",
  },
  {
    id: "u3",
    name: "Alex Chen",
    avatarUrl:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&w=80",
    title: "Marketing",
  },
  {
    id: "me",
    name: "Me",
    avatarUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&w=80",
    title: "You",
    isMe: true,
  },
];

export const messages: Message[] = [
  {
    id: "m0",
    userId: "system",
    content: "",
    time: "",
    dateLabel: "MONDAY, JUNE 12TH",
  },
  {
    id: "m1",
    userId: "u1",
    content:
      "Good morning team! Has everyone had a chance to review the new design mockups for the dashboard? I've uploaded the latest version to Figma.",
    time: "10:24 AM",
  },
  {
    id: "m2",
    userId: "u2",
    content:
      "Just saw them Sarah, they look incredible. The use of the accent brown really ties it back to our brand identity perfectly.",
    time: "10:28 AM",
  },
  {
    id: "m3",
    userId: "u3",
    content:
      "Q3 marketing brief is ready as well. I'll drop the PDF in this channel in a bit so everyone can review before our sync tomorrow.",
    time: "11:15 AM",
  },
  {
    id: "m4",
    userId: "me",
    content:
      'I\'ll be reviewing the PDF now. Will provide feedback by EOD. Can we also schedule a quick sync for tomorrow morning to discuss the "rooms" feature?',
    time: "11:42 AM",
  },
];

export const channels: Channel[] = [
  { id: "c1", name: "general", isActive: true },
  { id: "c2", name: "design-team" },
  { id: "c3", name: "marketing" },
  { id: "c4", name: "development" },
];

export const directMessages: DirectMessage[] = [
  { id: "dm1", userId: "u1" },
  { id: "dm2", userId: "u2" },
  { id: "dm3", userId: "u3" },
  { id: "dm4", userId: "me", isActive: false },
];

