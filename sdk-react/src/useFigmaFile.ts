import useSWR from "swr";
import { getFigmaFile } from "@animaapp/anima-sdk";

export const useFigmaFile = ({
  fileKey,
  authToken,
  enabled = true,
  params = {},
}: {
  fileKey: string;
  authToken: string;
  enabled?: boolean;
  params?: {
    depth?: number;
  };
}) => {
  const isEnabled = Boolean(enabled && fileKey && authToken);

  const { data, isLoading, error } = useSWR(
    ["useFigmaFile", fileKey, authToken, params],
    () => {
      if (!isEnabled) {
        return null;
      }

      return getFigmaFile({
        fileKey,
        authToken,
        params,
      });
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data: data ?? null,
    isLoading,
    error,
  };
};
