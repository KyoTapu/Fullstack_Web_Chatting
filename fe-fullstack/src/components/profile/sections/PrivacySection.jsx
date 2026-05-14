import SectionHeading from "../../ui/SectionHeading";
import { User, Globe, Shield } from "lucide-react";
import { InfoBtn } from "../InfoBtn";

const PRIVACY_OPTIONS = [
  { value: "public", label: "Public", icon: Globe },
  { value: "friends", label: "Friends", icon: User },
  { value: "private", label: "Private", icon: Shield },
];

function PrivacySection({ form, update }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <SectionHeading title="Profile Privacy" />
        <InfoBtn tip="Control who can see your profile information." />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {PRIVACY_OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = form.privacy === value;

          return (
            <button
              key={value}
              onClick={() => update("privacy", value)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 text-xs font-medium transition-all
                ${
                  active
                    ? "border-accent bg-accent/5 text-accent ring-1 ring-accent"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default PrivacySection;
