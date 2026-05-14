import SectionHeading from "../../ui/SectionHeading";
import Input from "../../ui/Input";
import { Trash2, Plus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { InfoBtn } from "../InfoBtn";

const EDUCATION_STATUS_OPTIONS = [
  { value: "Studying", label: "Studying" },
  { value: "Graduated", label: "Graduated" },
];

function Select({ label, value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const selected = options?.find((o) => o.value === value);

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setOpen(false);
  };

  return (
    <div className="space-y-1.5 relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm transition-all
          ${open ? "border-accent ring-2 ring-accent/20 bg-white" : "border-gray-200 hover:border-gray-300"}
          ${selected ? "text-gray-800" : "text-gray-400"}`}
      >
        <span>{selected ? selected.label : "Select status..."}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden py-1">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors
                  ${opt.value === value ? "bg-orange-50 text-accent font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {opt.label}
                {opt.value === value && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EducationSection({ form, updateEducation, addEducation, removeEducation, educationError }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <SectionHeading
          title={
            <span className="flex items-center gap-1.5">
              Education <InfoBtn tip="Add all your academic qualifications here." />
            </span>
          }
        />
        <button
          type="button"
          onClick={addEducation}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <div className="space-y-4">
        {form.education.map((edu, idx) => (
          <div id={`education-entry-${idx}`} key={idx} className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <button
              type="button"
              onClick={() => removeEducation(idx)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Entry {idx + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Degree"
                value={edu.degree}
                onChange={(e) => updateEducation(idx, "degree", e.target.value)}
              />
              <Input
                label="School"
                value={edu.school}
                onChange={(e) => updateEducation(idx, "school", e.target.value)}
              />
              <Input label="Year" value={edu.year} onChange={(e) => updateEducation(idx, "year", e.target.value)} />
              <Select
                label="Status"
                value={edu.status}
                onChange={(e) => updateEducation(idx, "status", e.target.value)}
                options={EDUCATION_STATUS_OPTIONS}
              />
            </div>
          </div>
        ))}
        {form.education.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No education added yet. Click "Add" to get started.</p>
        )}
      </div>

      {educationError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{educationError}</p>
      )}
    </>
  );
}

export default EducationSection;
