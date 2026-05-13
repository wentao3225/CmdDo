import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TaskStore } from "../src/storage.js";

function tmpStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cmddo-"));
  const store = new TaskStore(path.join(dir, "tasks.json"));
  store._tmpDir = dir;
  return store;
}

function makeTask(overrides = {}) {
  return {
    id: "123456",
    content: "test",
    priority: "med",
    tag: null,
    created_at: "2026-01-01T00:00:00",
    completed_at: null,
    status: "pending",
    ...overrides,
  };
}

describe("TaskStore", () => {
  let store;
  beforeEach(() => { store = tmpStore(); });
  afterEach(() => {
    if (store?._tmpDir) fs.rmSync(store._tmpDir, { recursive: true, force: true });
  });

  it("add and list", () => {
    store.add(makeTask());
    assert.equal(store.list().length, 1);
    assert.equal(store.list()[0].content, "test");
  });

  it("list filter by status", () => {
    store.add(makeTask({ id: "1", status: "pending" }));
    store.add(makeTask({ id: "2", status: "done" }));
    assert.equal(store.list("done").length, 1);
    assert.equal(store.list("pending").length, 1);
  });

  it("get by id", () => {
    store.add(makeTask({ id: "999999" }));
    assert.ok(store.get("999999"));
    assert.equal(store.get("000000"), null);
  });

  it("resolveId prefix", () => {
    store.add(makeTask({ id: "123456" }));
    assert.equal(store.resolveId("123"), "123456");
    assert.equal(store.resolveId("999"), null);
  });

  it("resolveId ambiguous returns null", () => {
    store.add(makeTask({ id: "123456" }));
    store.add(makeTask({ id: "123789" }));
    assert.equal(store.resolveId("123"), null);
  });

  it("done marks task complete", () => {
    store.add(makeTask({ id: "111111" }));
    const task = store.done("111111");
    assert.equal(task.status, "done");
    assert.ok(task.completed_at);
  });

  it("done nonexistent returns null", () => {
    assert.equal(store.done("999999"), null);
  });

  it("remove deletes task", () => {
    store.add(makeTask({ id: "111111" }));
    assert.ok(store.remove("111111"));
    assert.equal(store.list().length, 0);
  });

  it("remove nonexistent returns false", () => {
    assert.equal(store.remove("999999"), false);
  });

  it("add regenerates on collision", () => {
    store.add(makeTask({ id: "100000" }));
    store.add(makeTask({ id: "100000" }));
    assert.equal(store.list().length, 2);
    assert.notEqual(store.list()[0].id, store.list()[1].id);
  });

  it("resolveIdVerbose exact match", () => {
    store.add(makeTask({ id: "123456" }));
    const r = store.resolveIdVerbose("123456");
    assert.equal(r.id, "123456");
    assert.equal(r.ambiguous, false);
  });

  it("resolveIdVerbose prefix single match", () => {
    store.add(makeTask({ id: "123456" }));
    const r = store.resolveIdVerbose("123");
    assert.equal(r.id, "123456");
    assert.equal(r.ambiguous, false);
  });

  it("resolveIdVerbose ambiguous", () => {
    store.add(makeTask({ id: "123456" }));
    store.add(makeTask({ id: "123789" }));
    const r = store.resolveIdVerbose("123");
    assert.equal(r.id, null);
    assert.equal(r.ambiguous, true);
    assert.deepEqual(r.matches, ["123456", "123789"]);
  });

  it("resolveIdVerbose no match", () => {
    const r = store.resolveIdVerbose("999");
    assert.equal(r.id, null);
    assert.equal(r.ambiguous, false);
  });
});
