import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";

export function useApiMutation(apiFunction, options = {}) {
  const { onSuccess, onError, successMessage, errorMessage } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);

        if (successMessage) {
          toast.success(successMessage);
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);

        const message = errorMessage || getApiErrorMessage(err);
        toast.error(message);

        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, successMessage, errorMessage]
  );

  return { mutate, loading, error };
}
