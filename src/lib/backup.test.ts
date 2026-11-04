import { describe, expect, it } from "vitest";
import { isPrivateSetting, LAST_BACKUP_KEY } from "./backup";

describe("isPrivateSetting", () => {
  it("keeps secrets and the last backup date out of backups", () => {
    expect(isPrivateSetting("notion.secret")).toBe(true);
    expect(isPrivateSetting(LAST_BACKUP_KEY)).toBe(true);
    expect(isPrivateSetting("notion.map")).toBe(false);
    expect(isPrivateSetting("healthAutoImport")).toBe(false);
  });
});
