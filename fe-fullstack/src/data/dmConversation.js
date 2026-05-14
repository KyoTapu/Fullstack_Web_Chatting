/**
 * Mock 1-on-1 conversation data for Direct Message view.
 * Message shape matches channel messages: id, userId, content, time, dateLabel?
 */

export const mockDmMessages = [
  {
    id: "dm-m0",
    userId: "system",
    content: "",
    time: "",
    dateLabel: "MONDAY, JUNE 12TH",
  },
  {
    id: "dm-m1",
    userId: "u1",
    content: "Hey! Do you have a few minutes to chat about the new brand assets?",
    time: "10:15 AM",
  },
  {
    id: "dm-m2",
    userId: "me",
    content: "Sure, I just wrapped up the morning standup. What do you need?",
    time: "10:18 AM",
  },
  {
    id: "dm-m3",
    userId: "u1",
    content:
      "I wanted to get your eyes on the updated color palette before we hand off to dev. The earth tones we picked are looking really good in context.",
    time: "10:22 AM",
  },
  {
    id: "dm-m4",
    userId: "me",
    content:
      "Sounds good — send over the link when it’s ready and I’ll leave comments. Should we sync with James on the product side too?",
    time: "10:28 AM",
  },
  {
    id: "dm-m5",
    userId: "u1",
    content: "Yes, that’d be great. I’ll set up a short call for tomorrow.",
    time: "10:31 AM",
  },
];
