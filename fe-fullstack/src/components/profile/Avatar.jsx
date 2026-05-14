import { useState } from "react";
import { Camera } from "lucide-react";

export default function Avatar({
  avatar,
  isEditable,
  onUpload,
  sizeClass = "h-28 w-28 md:h-32 md:w-32",
  ringClass = "border-white",
}) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // validate
    if (!file.type.startsWith("image/")) return alert("Only images allowed");

    // preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setLoading(true);
      await onUpload(file);
    } catch {
      setPreview(null);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative group">
      <img
        src={preview || avatar || "/ezicon.png"}
        alt="Profile avatar"
        className={`${sizeClass} rounded-full object-cover border-4 ${ringClass} shadow-lg`}
      />

      {isEditable && (
        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
          <Camera className="w-6 h-6 text-white" />
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
          {loading && (
            <div className="absolute bottom-0 text-xs text-white bg-black/60 px-2 py-1 rounded">Uploading...</div>
          )}
        </label>
      )}
    </div>
  );
}
