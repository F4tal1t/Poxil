import { useEffect } from "react";
import { Check, Cross, Info } from "akar-icons";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check size={16} className="text-green-400" />,
    error: <Cross size={16} className="text-red-400" />,
    info: <Info size={16} className="text-blue-400" />
  };

  const borders = {
    success: "border-green-500/20",
    error: "border-red-500/20",
    info: "border-blue-500/20"
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-[#1f1c21] border ${borders[type]} px-4 py-3 rounded-lg shadow-xl animate-slideUp`}>
      <div className={`p-1 rounded-full bg-white/5`}>
        {icons[type]}
      </div>
      <span className="text-sm font-medium text-gray-200">{message}</span>
    </div>
  );
}
