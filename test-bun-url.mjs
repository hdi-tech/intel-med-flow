import { pathToFileURL, fileURLToPath } from "url";
// What does toFilePath do for /@vite/env?
// It calls: pathToFileURL("@vite/env") — note: no leading slash
const p = "@vite/env";
try {
  const url = pathToFileURL(p);
  console.log("pathToFileURL(@vite/env) = " + url.href);
} catch(e) {
  console.log("ERROR: " + e.message);
}

// And what does the normalizeModuleId return?
// For "/@vite/env" it returns "/@vite/env" (no change)
// Then pathToFileURL("/@vite/env") = ?
const p2 = "/@vite/env";
try {
  const url2 = pathToFileURL(p2);
  console.log("pathToFileURL(/@vite/env) = " + url2.href);
} catch(e) {
  console.log("ERROR2: " + e.message);
}

// Node.js on Windows should prepend drive letter for /foo paths
// But Bun doesn't. Let's verify with process.cwd():
console.log("process.cwd() = " + process.cwd());
console.log("process.cwd()[0] = " + process.cwd()[0]);
