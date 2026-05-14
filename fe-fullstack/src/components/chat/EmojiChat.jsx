import EmojiPicker from "emoji-picker-react";
import { Smile } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const EmojiChat = ({ handleEmojiClick, disabled = false }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={emojiRef}>
      <button
        type="button"
        onClick={() => !disabled && setShowEmoji((prev) => !prev)}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-textMuted transition hover:bg-hover hover:text-textPrimary disabled:opacity-50"
      >
        <Smile className="h-4 w-4" />
      </button>

      {showEmoji && !disabled && (
        <div className="absolute bottom-12 left-0 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default EmojiChat;
