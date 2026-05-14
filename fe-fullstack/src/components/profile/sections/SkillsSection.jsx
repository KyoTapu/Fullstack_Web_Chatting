import SectionHeading from "../../ui/SectionHeading";
import Textarea from "../../ui/Textarea";
import { InfoBtn } from "../InfoBtn";

function SkillsSection({ skillsInput, setSkillsInput }) {
  return (
    <>
      <SectionHeading title={<span className="flex items-center gap-1.5">Skills <InfoBtn tip="Enter skills separated by commas." /></span>} />
      <Textarea
        label="Skills (comma separated)"
        value={skillsInput}
        onChange={(e) => setSkillsInput(e.target.value)}
        placeholder="React, Node.js, Design..."
      />
      {skillsInput && (
        <div className="flex flex-wrap gap-2 pt-1">
          {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
            <span key={s} className="px-3 py-1 rounded-full bg-secondary/10 text-primary text-xs font-medium border border-secondary/20">{s}</span>
          ))}
        </div>
      )}
    </>
  );
}

export default SkillsSection;