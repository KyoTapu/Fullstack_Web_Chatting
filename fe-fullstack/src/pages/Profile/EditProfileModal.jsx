import { useState, useEffect } from "react";
import { User, BookOpen, Layers, Heart, Lock, X } from "lucide-react";
import EducationSection from "../../components/profile/sections/EducationSection";
import OverallSection from "../../components/profile/sections/OverallSection";
import SkillsSection from "../../components/profile/sections/SkillsSection";
import HobbiesSection from "../../components/profile/sections/HobbiesSection";
import PrivacySection from "../../components/profile/sections/PrivacySection";
const NAV_SECTIONS = [
  { id: "overall", label: "Overall", icon: User },
  { id: "education", label: "Education", icon: BookOpen },
  { id: "skills", label: "Skills", icon: Layers },
  { id: "hobbies", label: "Hobbies", icon: Heart },
  { id: "privacy", label: "Privacy", icon: Lock },
];

const EMPTY_EDU = { degree: "", school: "", year: "", status: "" };
const isEducationComplete = (edu = {}) =>
  Boolean(edu.degree?.trim() && edu.school?.trim() && edu.year?.trim() && edu.status?.trim());
const scrollToEducationEntry = (index) => {
  requestAnimationFrame(() => {
    const el = document.getElementById(`education-entry-${index}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

function EditProfileModal({ profile, onClose, onSave, user }) {
  const [activeSection, setActiveSection] = useState("overall");
  const [form, setForm] = useState({
    ...profile,
    education: profile.education ? [...profile.education] : [],
    hobbies: profile.hobbies ? [...profile.hobbies] : [],
  });
  const [skillsInput, setSkillsInput] = useState(profile.skills ? profile.skills.join(", ") : "");
  const [hobbiesInput, setHobbiesInput] = useState(profile.hobbies ? profile.hobbies.join(", ") : "");
  const [errors, setErrors] = useState({});
  const [educationError, setEducationError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setAnimate(true));
  }, []);

  const update = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    validate(key, value);
  };

  const validate = (key, value) => {
    let error = "";
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email";
    if (key === "phone" && !/^0\d{9,10}$/.test(value)) error = "Invalid phone";
    setErrors((e) => ({ ...e, [key]: error }));
  };

  const updateEducation = (index, key, value) => {
    setEducationError("");
    setForm((p) => {
      const updated = p.education.map((edu, i) => (i === index ? { ...edu, [key]: value } : edu));
      return { ...p, education: updated };
    });
  };
  const addEducation = () =>
    setForm((p) => {
      const last = p.education[p.education.length - 1];
      if (last && !isEducationComplete(last)) {
        setEducationError("Please complete the current education entry before adding a new one.");
        setActiveSection("education");
        scrollToEducationEntry(p.education.length - 1);
        return p;
      }

      setEducationError("");
      return { ...p, education: [...p.education, { ...EMPTY_EDU }] };
    });
  const removeEducation = (i) => {
    setEducationError("");
    setForm((p) => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    const invalidEducationIndex = form.education.findIndex((edu) => !isEducationComplete(edu));
    if (invalidEducationIndex !== -1) {
      setEducationError(`Education entry ${invalidEducationIndex + 1} is incomplete. Please fill all fields.`);
      setActiveSection("education");
      scrollToEducationEntry(invalidEducationIndex);
      return;
    }

    setEducationError("");
    setSaving(true);
    try {
      const skillsArray = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const hobbiesArray = hobbiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSave({ ...form, skills: skillsArray, hobbies: hobbiesArray });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div
        className={`w-[800px] h-[560px] flex flex-col rounded-3xl bg-white shadow-2xl transition-opacity duration-300
          ${animate ? "opacity-100" : "opacity-0"}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 py-4 rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
            <p className="text-xs text-gray-500">Update your public information</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body: left nav + right content ── */}
        <div className="flex flex-1 min-h-0">
          {/* Left Nav */}
          <nav className="w-44 shrink-0 border-r border-gray-100 bg-gray-50/70 rounded-bl-3xl py-4 flex flex-col gap-1 px-2">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${
                    activeSection === id
                      ? "bg-white text-accent shadow-md  border-2 border-gray-300"
                      : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${activeSection === id ? "text-accent" : "text-gray-400"}`} />
                {label}
              </button>
            ))}
          </nav>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-hide">
            {activeSection === "overall" && <OverallSection form={form} update={update} errors={errors} user={user} />}
            {activeSection === "education" && (
              <EducationSection
                form={form}
                updateEducation={updateEducation}
                addEducation={addEducation}
                removeEducation={removeEducation}
                educationError={educationError}
              />
            )}
            {activeSection === "skills" && <SkillsSection skillsInput={skillsInput} setSkillsInput={setSkillsInput} />}
            {activeSection === "hobbies" && (
              <HobbiesSection hobbiesInput={hobbiesInput} setHobbiesInput={setHobbiesInput} />
            )}
            {activeSection === "privacy" && <PrivacySection form={form} update={update} />}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={hasErrors || saving}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
