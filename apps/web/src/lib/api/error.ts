export function getApiErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return fallback;

  const candidate = error as {
    message?: unknown;
    error?: unknown;
    response?: { data?: { message?: unknown; error?: unknown } };
  };

  const directMessage = candidate.message;
  if (Array.isArray(directMessage)) return directMessage.join(', ');
  if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;

  const directError = candidate.error;
  if (typeof directError === 'string' && directError.trim()) return directError;

  const responseMessage = candidate.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;

  const responseError = candidate.response?.data?.error;
  if (typeof responseError === 'string' && responseError.trim()) return responseError;

  return fallback;
}
