import type {
  AnimaSDKResult,
  GetCodeParams,
  StreamCodgenMessage,
} from "@animaapp/anima-sdk";
import { convertCodegenFilesToAnimaFiles } from "@animaapp/anima-sdk";
import { EventSource } from "eventsource";
import { useImmer } from "use-immer";

type Status = "idle" | "pending" | "success" | "aborted" | "error";

type TaskStatus = "pending" | "running" | "finished";

type CodegenStatus = {
  status: Status;
  error: Error | null;
  result: AnimaSDKResult | null;
  tasks: {
    fetchDesign: { status: TaskStatus };
    codeGeneration: { status: TaskStatus; progress: number };
    uploadAssets: { status: TaskStatus };
  };
};

const defaultProgress: CodegenStatus = {
  status: "idle",
  error: null,
  result: null,
  tasks: {
    fetchDesign: { status: "pending" },
    codeGeneration: { status: "pending", progress: 0 },
    uploadAssets: { status: "pending" },
  },
};

type StreamMessageByType<T extends StreamCodgenMessage['type']> = Extract<StreamCodgenMessage, { type: T }>;

export const useAnimaCodegen = ({
  url,
  method = "POST",
}: {
  url: string;
  method?: string;
}) => {
  const [status, updateStatus] = useImmer<CodegenStatus>(defaultProgress);

  const getCode = async <T = GetCodeParams>(params: T) => {
    updateStatus((draft) => {
      draft.status = "pending";
      draft.error = null;
      draft.result = null;
      draft.tasks = defaultProgress.tasks;
    });

    const es = new EventSource(url, {
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          method,
          body: JSON.stringify(params),
        }),
    });

    const promise = new Promise<{
      result: AnimaSDKResult | null;
      error: Error | null;
    }>((resolve) => {

      const result: Partial<AnimaSDKResult> = {};

      // Add specific event listeners
      es.addEventListener('start', (event) => {
        const message = JSON.parse(event.data) as StreamMessageByType<'start'>;
        result.sessionId = message.sessionId;

        updateStatus((draft) => {
          draft.tasks.fetchDesign.status = "running";
        });
      });

      es.addEventListener('pre_codegen', (event) => {
        const message = JSON.parse(event.data) as StreamMessageByType<'pre_codegen'>;
        if (message.message === "Anima model built") {
          updateStatus((draft) => {
            draft.tasks.fetchDesign.status = "finished";
            draft.tasks.codeGeneration.status = "running";
            draft.tasks.uploadAssets.status = "running";
          });
        }
      });

      es.addEventListener('figma_metadata', (e) => {
        const message = JSON.parse(e.data) as StreamMessageByType<'figma_metadata'>;
        result.figmaFileName = message.figmaFileName;
        result.figmaSelectedFrameName = message.figmaSelectedFrameName;
      });

      es.addEventListener('aborted', (e) => {
        updateStatus((draft) => {
          draft.status = "aborted";
        });
        resolve({
          result: null,
          error: new Error("The request was aborted"),
        });
      });

      es.addEventListener('generating_code', (e) => {
        const message = JSON.parse(e.data) as StreamMessageByType<'generating_code'>;
        if (message.payload.status === "success") {
          const codegenFiles = message.payload.files as Record<
            string,
            { code: string; type: "code" }
          >;

          result.files = convertCodegenFilesToAnimaFiles(codegenFiles);
        }

        updateStatus((draft) => {
          draft.tasks.codeGeneration.progress = message.payload.progress;
        });
      });

      es.addEventListener('codegen_completed', (e) => {
        updateStatus((draft) => {
          draft.tasks.codeGeneration.status = "finished";
        });
      });

      es.addEventListener('assets_uploaded', (e) => {
        updateStatus((draft) => {
          draft.tasks.uploadAssets.status = "finished";
        });
      });

      es.addEventListener('error', (e: ErrorEvent | MessageEvent) => {
        // Differentiate between an error message from the server and an error event from the EventSource
        if (e instanceof MessageEvent) {
          const message = JSON.parse(e.data) as StreamMessageByType<'error'>;
          updateStatus((draft) => {
            draft.status = "error";
            draft.error = new Error(message.payload.message);
          });

          resolve({
            result: null,
            error: new Error(message.payload.message),
          });
        } else {
          // It's an EventSource error (e.g. HTTP error)
          console.error('EventSource error:', e);

          updateStatus((draft) => {
            draft.status = "error";
            draft.error = new Error("HTTP error: " + e.message);
          });

          resolve({
            result: null,
            error: new Error("HTTP error: " + e.message),
          });
        }
      });

      es.addEventListener('done', (event) => {
        updateStatus((draft) => {
          draft.status = "success";
          draft.result = result as AnimaSDKResult;
        });

        resolve({ result: result as AnimaSDKResult, error: null });
      });
    });

    try {
      const { result, error } = await promise;

      if (error) {
        return { result: null, error };
      }

      if (Object.keys(result?.files ?? {}).length === 0) {
        return {
          result: null,
          error: new Error("No files received"),
        };
      }

      return { result, error };
    } finally {
      es.close();
    }
  };

  return {
    getCode,
    status: status.status,
    tasks: status.tasks,
    error: status.error,
    result: status.result,
  };
};
