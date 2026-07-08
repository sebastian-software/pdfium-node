import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ErrorCodes, PdfiumNodeError } from "./errors.js";

const workerPath = fileURLToPath(new URL("./worker-child.js", import.meta.url));

export function renderInWorker(pdf, options) {
  return new Promise((resolve, reject) => {
    const child = fork(workerPath, {
      serialization: "advanced",
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });

    let settled = false;

    const timeout = setTimeout(() => {
      settle(
        reject,
        new PdfiumNodeError(
          ErrorCodes.RenderTimeout,
          `PDF render timed out after ${options.timeoutMs}ms.`,
          { timeoutMs: options.timeoutMs }
        )
      );
      child.kill("SIGKILL");
    }, options.timeoutMs);

    child.on("message", (message) => {
      if (message?.type === "success") {
        settle(resolve, message.result);
        return;
      }

      if (message?.type === "error") {
        settle(reject, rehydrateError(message.error));
      }
    });

    child.on("error", (error) => {
      settle(
        reject,
        new PdfiumNodeError(ErrorCodes.WorkerCrashed, "Render worker failed to start.", {
          cause: error.code,
        })
      );
    });

    child.on("exit", (code, signal) => {
      if (settled) {
        return;
      }

      settle(
        reject,
        new PdfiumNodeError(ErrorCodes.WorkerCrashed, "Render worker exited before completing.", {
          code,
          signal,
        })
      );
    });

    child.send({
      type: "render",
      pdf,
      options,
    });

    function settle(callback, value) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      if (child.connected) {
        child.disconnect();
      }
      callback(value);
    }
  });
}

function rehydrateError(error) {
  if (error?.code) {
    return new PdfiumNodeError(error.code, error.message ?? "PDFium worker error.", {
      ...error.metadata,
    });
  }

  return new PdfiumNodeError(ErrorCodes.WorkerCrashed, "Render worker failed.");
}
