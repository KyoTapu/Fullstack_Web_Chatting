import { useCallContext } from "../context/CallProvider";

export const useCall = () => {
  const context = useCallContext();
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }
  return context;
};
