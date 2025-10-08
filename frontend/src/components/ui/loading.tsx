
"use client";

import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export default function Loading() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFetching || isMutating) {
        setShowLoading(true);
      }
    }, 1000); // 1-second delay

    return () => clearTimeout(timer);
  }, [isFetching, isMutating]);

  if (!showLoading && !isFetching && !isMutating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
}
