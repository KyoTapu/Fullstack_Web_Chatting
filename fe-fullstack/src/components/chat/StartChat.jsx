import React from "react";
import { MessageCircleMore } from "lucide-react";
const StartChat = () => {
  return (
    <div className="flex flex-col text-textMuted">
      <MessageCircleMore className="mx-auto h-8 w-8 text-primary" />
      <p className="mt-2 text-sm">Start your conversation and have fun!</p>
    </div>
  );
};

export default StartChat;
