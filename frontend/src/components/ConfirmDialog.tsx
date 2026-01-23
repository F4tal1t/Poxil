interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1f1c21] p-6 rounded-xl border border-[#2a2630] shadow-2xl w-96 transform transition-all scale-100">
        <h2 className={`text-xl font-bold mb-2 ${isDangerous ? 'text-red-500' : 'text-white'}`}>
          {title}
        </h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded text-sm font-medium transition-colors shadow-lg ${
              isDangerous 
                ? "bg-red-600 hover:bg-red-700 shadow-red-900/20" 
                : "bg-[#df4c16] hover:bg-[#c94514] shadow-[#df4c16]/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
