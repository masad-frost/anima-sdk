import type { GetFileResponse, Node } from "@figma/rest-api-spec";
import { FigmaRestApi } from "@animaapp/http-client-figma";
import { wrapFigmaApiError, type FigmaApiError } from "./figmaError";

export type FigmaNode = Node;
export type GetFileParams = {
  fileKey: string;
  authToken?: string;
  figmaRestApi?: FigmaRestApi;
};

export type FigmaPage = { id: string; name: string };
export type GetFilePagesParams = {
  fileKey: string;
  authToken?: string;
  figmaRestApi?: FigmaRestApi;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};
export type GetFilePagesResult = FigmaPage[] | undefined;
export type GetFileNodesParams = {
  fileKey: string;
  authToken?: string;
  nodeIds: string[];
  figmaRestApi?: FigmaRestApi;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
};

export const getFigmaFile = async ({
  fileKey,
  authToken,
  figmaRestApi = new FigmaRestApi(),
  params = {},
  signal,
}: GetFilePagesParams): Promise<GetFileResponse> => {
  if (authToken) {
    figmaRestApi.token = authToken;
  }

  try {
    const rootFile = await figmaRestApi
      .withOptions({
        abortSignal: signal,
      })
      .files.get({
        fileKey,
        params,
      });

    return rootFile;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    console.error(error);
    throw wrapFigmaApiError(error as FigmaApiError, fileKey);
  }
};

export const getFileNodes = async ({
  fileKey,
  authToken,
  nodeIds,
  figmaRestApi = new FigmaRestApi(),
  params = {},
  signal,
}: GetFileNodesParams) => {
  if (authToken) {
    figmaRestApi.token = authToken;
  }

  try {
    const data = await figmaRestApi
      .withOptions({
        abortSignal: signal,
      })
      .nodes.get({
        fileKey,
        nodeIds,
        params: {
          ...params,
        },
      });

    return data.nodes;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw wrapFigmaApiError(error as FigmaApiError, fileKey);
  }
};

export const findChildrenNode = (
  node: FigmaNode,
  targetNodeId: string,
): FigmaNode | null => {
  if (node.id === targetNodeId) {
    return node;
  }

  if ("children" in node) {
    for (const child of node.children) {
      const found = findChildrenNode(child, targetNodeId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};
