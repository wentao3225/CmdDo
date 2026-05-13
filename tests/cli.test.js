import { describe, it, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CLI = path.resolve("bin/cmddo.js");
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "cmddo-cli-"));

function cmddo(...args) {
  try {
    return execFileSync("node", [CLI, ...args], {
      encoding: "utf-8",
      env: { ...process.env, USERPROFILE: HOME, HOME },
    });
  } catch (e) {
    return e.stdout || e.stderr || "";
  }
}

describe("CLI", () => {
  after(() => fs.rmSync(HOME, { recursive: true, force: true }));

  beforeEach(() => {
    fs.rmSync(HOME, { recursive: true, force: true });
    fs.mkdirSync(HOME, { recursive: true });
  });

  it("add", () => {
    const out = cmddo("add", "test task");
    assert.ok(out.includes("已添加"));
  });

  it("add with priority and tag", () => {
    cmddo("add", "work task", "-p", "high", "-t", "work");
    const out = cmddo("list");
    assert.ok(out.includes("work task"));
    assert.ok(out.includes("work"));
  });

  it("list empty", () => {
    const out = cmddo("list");
    assert.ok(out.includes("暂无任务"));
  });

  it("list with tasks", () => {
    cmddo("add", "task 1");
    cmddo("add", "task 2");
    const out = cmddo("list");
    assert.ok(out.includes("task 1"));
    assert.ok(out.includes("task 2"));
  });

  it("done", () => {
    cmddo("add", "to complete");
    const listOut = cmddo("list");
    const id = listOut.match(/\d{6}/)[0];
    const out = cmddo("done", id);
    assert.ok(out.includes("已完成"));
  });

  it("done nonexistent", () => {
    const out = cmddo("done", "999999");
    assert.ok(out.includes("不存在"));
  });

  it("remove", () => {
    cmddo("add", "to remove");
    const listOut = cmddo("list");
    const id = listOut.match(/\d{6}/)[0];
    const out = cmddo("remove", id);
    assert.ok(out.includes("已删除"));
  });

  it("remove nonexistent", () => {
    const out = cmddo("remove", "999999");
    assert.ok(out.includes("不存在"));
  });

  it("export markdown", () => {
    cmddo("add", "export test");
    const out = cmddo("export");
    assert.ok(out.includes("| ID |"));
    assert.ok(out.includes("export test"));
  });

  it("export csv", () => {
    cmddo("add", "csv test");
    const out = cmddo("export", "-f", "csv");
    assert.ok(out.includes("id,priority,content"));
    assert.ok(out.includes("csv test"));
  });

  it("export empty", () => {
    const out = cmddo("export");
    assert.ok(out.includes("暂无任务"));
  });

  it("export to file", () => {
    cmddo("add", "file export");
    const outfile = path.join(HOME, "out.md");
    cmddo("export", "-o", outfile);
    const content = fs.readFileSync(outfile, "utf-8");
    assert.ok(content.includes("file export"));
  });

  it("stats empty", () => {
    const out = cmddo("stats");
    assert.ok(out.includes("暂无任务"));
  });

  it("stats with tasks", () => {
    cmddo("add", "task 1", "-p", "high");
    cmddo("add", "task 2", "-p", "low");
    const listOut = cmddo("list");
    const id = listOut.match(/\d{6}/)[0];
    cmddo("done", id);
    const out = cmddo("stats");
    assert.ok(out.includes("任务总数"));
    assert.ok(out.includes("已完成"));
  });

  it("config show", () => {
    const out = cmddo("config");
    assert.ok(out.includes("storage_path"));
    assert.ok(out.includes("theme"));
  });

  it("config set", () => {
    cmddo("config", "theme.priority_high", "magenta");
    const out = cmddo("config");
    assert.ok(out.includes("magenta"));
  });

  it("export csv escapes commas", () => {
    cmddo("add", "task, with comma");
    const out = cmddo("export", "-f", "csv");
    assert.ok(out.includes('"task, with comma"'));
  });
});
