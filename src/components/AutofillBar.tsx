import React from 'react';
import { Zap, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { ATSType } from '../types';

interface AutofillBarProps {
  atsType: ATSType;
  onAutofill: () => void;
  isAutofilling: boolean;
  statusMessage: string | null;
  statusType: 'success' | 'error' | 'idle';
  isSupportedATS: boolean;
}

export const AutofillBar: React.FC<AutofillBarProps> = ({
  atsType,
  onAutofill,
  isAutofilling,
  statusMessage,
  statusType,
  isSupportedATS,
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onAutofill}
        disabled={isAutofilling || !isSupportedATS}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all shadow-sm ${
          isSupportedATS
            ? 'bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-500 hover:to-amber-500 text-white shadow-brand-500/20 active:scale-[0.98]'
            : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed'
        }`}
      >
        {isAutofilling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Autofilling Form Fields...</span>
          </>
        ) : (
          <>
            <Zap className={`w-4 h-4 ${isSupportedATS ? 'text-amber-200 fill-amber-200' : 'text-stone-400'}`} />
            <span>
              {isSupportedATS
                ? `1-Click Autofill Form (${atsType.toUpperCase()})`
                : 'Autofill Form (ATS Not Detected)'}
            </span>
          </>
        )}
      </button>

      {/* Status Toast / Inline Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all animate-in fade-in slide-in-from-top-1 ${
            statusType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40'
          }`}
        >
          {statusType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
