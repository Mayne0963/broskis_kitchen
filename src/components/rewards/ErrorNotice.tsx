"use client";
import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorNoticeProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
}

export default function ErrorNotice({
  error,
  onRetry,
  title = "Something went wrong",
  showDetails = process.env.NODE_ENV === "development"
}: ErrorNoticeProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const errorMessage = typeof error === "string" ? error : error?.message || "An unexpected error occurred";

  return (
    <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
      <div className="flex items-center gap-3 text-red-400">
        <AlertTriangle className="w-8 h-8" />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      
      <p className="text-slate-400 max-w-md">
        {errorMessage}
      </p>
      
      {showDetails && error && typeof error !== "string" && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors">
            Error Details
          </summary>
          <pre className="mt-2 p-4 bg-slate-800 rounded-lg text-sm text-red-300 overflow-auto max-w-lg">
            {error.stack || error.toString()}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Retrying..." : "Try Again"}
        </button>
      )}
    </div>
  );
}