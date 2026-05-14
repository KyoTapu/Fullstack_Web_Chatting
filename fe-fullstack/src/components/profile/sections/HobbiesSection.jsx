import SectionHeading from "../../ui/SectionHeading";
import Textarea from "../../ui/Textarea";
import { InfoBtn } from "../InfoBtn";
function HobbiesSection({ hobbiesInput, setHobbiesInput }) {
  return (
    <>
      <SectionHeading title={<span className="flex items-center gap-1.5">Hobbies & Interests <InfoBtn tip="Enter hobbies separated by commas." /></span>} />
      <Textarea
        label="Hobbies (comma separated)"
        value={hobbiesInput}
        onChange={(e) => setHobbiesInput(e.target.value)}
        placeholder="Photography, Hiking, Reading..."
      />
      <small className='text-gray-500 text-xs mb-0'>it's look like this</small>
      {hobbiesInput && (
        <div className="flex flex-wrap gap-2 pt-1 mt-0">
          {hobbiesInput.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
            <span key={s} className="px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-medium border border-pink-100">{s}</span>
          ))}
        </div>
      )}
    </>
  );
}

export default HobbiesSection;