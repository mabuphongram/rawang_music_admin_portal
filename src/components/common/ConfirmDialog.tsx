import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  resourceType?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  resourceType = 'resource',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-md w-full p-6 shadow-2xl relative text-[#ededed]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-9 h-9 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-white">{title}</h3>
            <p className="text-xs text-[#888888] mt-1">{message}</p>
          </div>
        </div>

        {/* Explicit Backend Limitation Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mb-6 text-xs text-amber-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-mono text-[11px]">
            <strong>Backend Note:</strong> The Rawang backend does not automatically delete related tracks, playlist references, or MinIO stored files when an {resourceType} is deleted.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-1.5 rounded text-xs font-mono bg-[#222222] border border-[#333333] text-[#ededed] hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-1.5 rounded text-xs font-mono font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
