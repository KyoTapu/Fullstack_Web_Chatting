import SectionHeading from "../../ui/SectionHeading";
import Input from "../../ui/Input";
import Textarea from "../../ui/Textarea";
import { User, Briefcase, MapPin, Mail, Phone, Globe } from "lucide-react";

function OverallSection({ form, update, errors,user }) {
  return (
    <>
      <SectionHeading title="Basic Info" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full Name"    value={form.full_name || ""} onChange={(e) => update("full_name", e.target.value)} icon={<User className="w-4 h-4" />} />
        <Input label="Job Title"    value={form.title} onChange={(e) => update("title", e.target.value)} icon={<Briefcase className="w-4 h-4" />} />
      </div>
      <Input label="Display Name (Username)" value={user.username} disabled={true} icon={<User className="w-4 h-4"  />}  />
      <Input label="Location" value={form.location} onChange={(e) => update("location", e.target.value)} icon={<MapPin className="w-4 h-4" />} />
      <Textarea label="Bio" value={form.bio} onChange={(e) => update("bio", e.target.value)} />

      <SectionHeading title="Contact" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Email"   value={user.email}  disabled={true} error={errors.email}   onChange={(e) => update("email",   e.target.value)} icon={<Mail className="w-4 h-4" />} />
        <Input label="Phone"   value={form.phone}   error={errors.phone}   onChange={(e) => update("phone",   e.target.value)} icon={<Phone className="w-4 h-4" />} />
      </div>
      <Input label="Website" value={form.website || ""} onChange={(e) => update("website", e.target.value)} icon={<Globe className="w-4 h-4" />} />
    </>
  );
}

export default OverallSection;