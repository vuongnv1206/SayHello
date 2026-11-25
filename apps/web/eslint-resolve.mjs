import { createRequire } from "node:module";
import path from "node:path";

const localModules = path.resolve(import.meta.dirname, "node_modules");
const current = process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [];
if (!current.includes(localModules)) {
  process.env.NODE_PATH = [localModules, ...current].join(path.delimiter);
  createRequire(import.meta.url)("node:module").Module._initPaths();
}
