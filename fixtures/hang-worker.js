process.on("message", () => {
  setInterval(() => Date.now(), 1000);
});
