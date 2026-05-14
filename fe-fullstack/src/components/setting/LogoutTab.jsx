
import SectionCard from "./SectionCard";

export default function LogoutTab({ onLogout }) {
  const handleLogout = async () => {
    const ok = window.confirm("Are you sure you want to log out?");
    if (!ok) return;
    await onLogout?.();
    window.location.href = "/login";
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-red-600">Log out</h2>
      <p className="text-sm text-textMuted">You will be signed out of your account</p>

      <SectionCard>
        <p className="text-sm text-textMuted">
          Are you sure you want to log out? You will need to log in again to access your account.
        </p>

        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-textMuted">
          Your settings are currently managed with React Context and synced to local storage.
        </div>

        <button
          onClick={handleLogout}
          className="
            mt-4
            w-full
            rounded-xl
            border border-red-300
            bg-red-50
            px-4 py-3
            text-sm font-medium
            text-red-600
            transition
            hover:bg-red-100
            hover:border-red-400
          "
        >
          Confirm log out
        </button>
      </SectionCard>
    </>
  );
}