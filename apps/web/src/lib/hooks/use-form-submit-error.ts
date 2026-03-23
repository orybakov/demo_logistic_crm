'use client';

import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api/error';

export function useFormSubmitError(fallbackMessage: string) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  const setSubmitErrorFromUnknown = useCallback(
    (error: unknown) => setSubmitError(getApiErrorMessage(error, fallbackMessage)),
    [fallbackMessage]
  );

  return {
    submitError,
    clearSubmitError,
    setSubmitErrorFromUnknown,
  };
}
