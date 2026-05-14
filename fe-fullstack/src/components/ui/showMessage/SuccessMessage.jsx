const SuccessMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">{message}</div>
  );
};

export default SuccessMessage;
