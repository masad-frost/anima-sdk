import { AnimaFiles } from "./types";

export const convertCodegenFilesToAnimaFiles = (
  codegenFiles: Record<string, { code: string; type: "code" }>
): AnimaFiles => {
  return Object.entries(codegenFiles).reduce(
    (acc, [fileName, file]) => {
      acc[fileName] = { content: file.code, isBinary: false };
      return acc;
    },
    {} as AnimaFiles
  );
};