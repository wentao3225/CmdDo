import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomInt } from "node:crypto";

const DATA_DIR = path.join(os.homedir(), ".cmddo");
const DEFAULT_FILE = path.join(DATA_DIR, "tasks.json");

export class TaskStore {
  constructor(filepath) {
    this.filepath = filepath || DEFAULT_FILE;
    fs.mkdirSync(path.dirname(this.filepath), { recursive: true });
    if (!fs.existsSync(this.filepath)) {
      this._write([]);
    }
  }

  _read() {
    return JSON.parse(fs.readFileSync(this.filepath, "utf-8"));
  }

  _write(tasks) {
    const tmp = this.filepath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(tasks, null, 2), "utf-8");
    fs.renameSync(tmp, this.filepath);
  }

  add(task) {
    const tasks = this._read();
    const ids = new Set(tasks.map((t) => t.id));
    while (ids.has(task.id)) {
      task.id = String(randomInt(100000, 999999));
    }
    tasks.push(task);
    this._write(tasks);
    return task;
  }

  list(statusFilter) {
    let tasks = this._read();
    if (statusFilter) {
      tasks = tasks.filter((t) => t.status === statusFilter);
    }
    return tasks;
  }

  get(id) {
    return this._read().find((t) => t.id === id) || null;
  }

  resolveId(prefix) {
    const matches = this._read()
      .map((t) => t.id)
      .filter((id) => id.startsWith(prefix));
    return matches.length === 1 ? matches[0] : null;
  }

  resolveIdVerbose(prefix) {
    const tasks = this._read();
    const exact = tasks.find((t) => t.id === prefix);
    if (exact) return { id: prefix, ambiguous: false };
    const matches = tasks.map((t) => t.id).filter((id) => id.startsWith(prefix));
    if (matches.length === 1) return { id: matches[0], ambiguous: false };
    if (matches.length > 1) return { id: null, ambiguous: true, matches };
    return { id: null, ambiguous: false };
  }

  done(id) {
    const resolved = this.resolveId(id) || id;
    const tasks = this._read();
    const task = tasks.find((t) => t.id === resolved);
    if (!task) return null;
    task.status = "done";
    task.completed_at = new Date().toISOString().slice(0, 19);
    this._write(tasks);
    return task;
  }

  remove(id) {
    const resolved = this.resolveId(id) || id;
    const tasks = this._read();
    const filtered = tasks.filter((t) => t.id !== resolved);
    if (filtered.length === tasks.length) return false;
    this._write(filtered);
    return true;
  }
}
