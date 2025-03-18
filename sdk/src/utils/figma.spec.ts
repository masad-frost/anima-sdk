import { describe, expect, it } from "vitest";
import { formatToFigmaLink } from "./figma";

describe("# figma", () => {
  describe(".formatToFigmaLink", () => {
    it("generates a link with file key and node id", () => {
      const url = formatToFigmaLink({
        fileKey: "file-key",
        nodeId: "1:2",
      });

      expect(url.href).toBe(
        "https://www.figma.com/design/file-key?node-id=1-2"
      );
    });

    describe('when the "duplicate" flag is enabled', () => {
      it("generates a link including the '/duplicated' path", () => {
        const url = formatToFigmaLink({
          fileKey: "file-key",
          nodeId: "1:2",
          duplicate: true,
        });

        expect(url.href).toBe(
          "https://www.figma.com/design/file-key/duplicate?node-id=1-2"
        );
      });
    });
  });
});
