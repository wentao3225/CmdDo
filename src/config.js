import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

const CONFIG_DIR = path.join(os.homedir(), ".cmddo");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.yaml");

const DEFAULTS = {
  storage_path: path.join(CONFIG_DIR, "tasks.json"),
  theme: {
    priority_high: "red",
    priority_med: "yellow",
    priority_low: "green",
    done: "green",
    pending: "yellow",
  },
};

export class Config {
  constructor(filepath) {
    this.filepath = filepath || CONFIG_FILE;
    fs.mkdirSync(path.dirname(this.filepath), { recursive: true });
    if (!fs.existsSync(this.filepath)) {
      this._write(DEFAULTS);
    }
  }

  _read() {
    return yaml.load(fs.readFileSync(this.filepath, "utf-8")) || {};
  }

  _write(data) {
    fs.writeFileSync(this.filepath, yaml.dump(data, { lineWidth: -1 }), "utf-8");
  }

  get(key, fallback) {
    const data = this._read();
    return data[key] ?? fallback;
  }

  set(dotKey, value) {
    const data = this._read();
    const keys = dotKey.split(".");
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = obj[keys[i]] || {};
      obj = obj[keys[i]];
    }
    obj[keys.at(-1)] = value;
    this._write(data);
  }

  show() {
    return this._read();
  }
}
