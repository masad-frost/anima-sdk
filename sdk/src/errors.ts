// TODO: `CodegenErrorReason` should be imported from `anima-public-api`
export type CodegenErrorReason =
  | "The selected node is not a frame"
  | "There is no node with the given id"
  | "Invalid Figma token"
  | "Figma token expired"
  | "No files found"
  | "Connection closed before the 'done' message"
  | "Unknown"
  | "Response body is null";

export class CodegenError extends Error {
  status?: number;

  constructor({ name, reason, status }: { name: string; reason: CodegenErrorReason; status?: number }) {
    super();
    this.name = `[Codegen Error] ${name}`;
    this.message = reason;
    this.status = status;
  }
}
