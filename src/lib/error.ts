export function handleError(e: unknown) {
  console.error(e);
  return { success: false, error: 'Internal server error' };
}

export function handleApiError(e: unknown, customMessage?: string) {
  console.error(e);
  return {
    success: false,
    error: customMessage || 'Internal server error'
  };
}

export function createErrorResponse(error: unknown, status: number = 500, customMessage?: string) {
  console.error(error);
  return {
    success: false,
    error: customMessage || 'Internal server error'
  };
}