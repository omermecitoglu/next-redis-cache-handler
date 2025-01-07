import { describe, expect, it } from "@jest/globals";
import { exampleFunction } from "./index";

describe("exampleFunction", () => {
  it("should be a function", () => {
    expect(typeof exampleFunction).toBe("function");
  });
});
