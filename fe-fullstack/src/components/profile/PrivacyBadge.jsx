import { Globe, User, Shield } from "lucide-react";

const PrivacyBadge = ({ value, small }) => {
  const map = {
    public: {
      style: {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        color: "#047857",
        borderColor: "rgba(16, 185, 129, 0.22)",
      },
      icon: <Globe className="h-3 w-3" />,
      label: "Public",
    },
    friends: {
      style: {
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        color: "#b45309",
        borderColor: "rgba(245, 158, 11, 0.22)",
      },
      icon: <User className="h-3 w-3" />,
      label: "Friends",
    },
    private: {
      style: {
        backgroundColor: "var(--app-hover)",
        color: "var(--app-text-primary, var(--app-text))",
        borderColor: "var(--app-border)",
      },
      icon: <Shield className="h-3 w-3" />,
      label: "Private",
    },
  };

  const config = map[value] || map.public;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
      style={config.style}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default PrivacyBadge;
