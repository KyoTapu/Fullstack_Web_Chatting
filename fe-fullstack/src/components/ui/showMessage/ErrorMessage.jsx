import { AlertCircle } from "lucide-react";
const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="rounded-lg border flex  border-red-200 bg-red-50 px-3 gap-3 py-2 text-sm text-red-500">
      <AlertCircle />
      {message}
    </div>
  );
};

export default ErrorMessage;
