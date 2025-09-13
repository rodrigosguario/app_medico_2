// Captura erros globais e exibe informações detalhadas no console
window.addEventListener("error", (ev) => {
  console.error("[GLOBAL onerror]", {
    message: ev.message,
    filename: ev.filename,
    lineno: ev.lineno,
    colno: ev.colno,
    error: ev.error,
    stack: ev.error?.stack,
  });
});

window.addEventListener("unhandledrejection", (ev) => {
  console.error("[GLOBAL unhandledrejection]", {
    reason: ev.reason,
    message: ev.reason?.message,
    stack: ev.reason?.stack,
  });
});
