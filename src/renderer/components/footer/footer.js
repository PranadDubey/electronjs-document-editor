(() => {
  const pageCounter = document.getElementById("page-counter");
  const wordCounter = document.getElementById("word-counter");

  //importing page counter and integrating into renderer
  if (pageCounter) {
    window.EventBus.on("page-update", (state) => {
      pageCounter.innerText = `Page ${state.currentPage} of ${state.totalPages}`;
    });
  }

  //importing word counter and integrating into renderer
  if (wordCounter) {
    window.EventBus.on("page-update", (state) => {
      wordCounter.innerText = `${state.wordCount} Word(s)`;
    });
  }
})();