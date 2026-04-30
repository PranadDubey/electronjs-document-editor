(() => {
  const minBtn = document.getElementById("min-btn");
  const maxBtn = document.getElementById("max-btn");
  const closeBtn = document.getElementById("close-btn");
  const fileMenuBtn = document.querySelector(".file-menu-btn");
  const fileMenuDropdown = document.querySelector(".file-menu-dropdown");
  const fileMenuItems = document.querySelectorAll(".file-menu-item");


  if (minBtn) {
    minBtn.addEventListener("click", () => window.windowControls.minimize());
  }

  if (maxBtn) {
    maxBtn.addEventListener("click", () => window.windowControls.maximize());
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => window.windowControls.close());
  }

  const fileButtons = document.querySelectorAll(".file-menu-btn[data-action]");
  fileButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      window.dispatchEvent(new CustomEvent("header:file-action", { detail: { action } }));
    });
  });

  if (fileMenuBtn && fileMenuDropdown) {
    fileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !fileMenuDropdown.hidden;
      fileMenuDropdown.hidden = isOpen;
      fileMenuBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".file-menu-wrap")) {
        fileMenuDropdown.hidden = true;
        fileMenuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  fileMenuItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      window.dispatchEvent(new CustomEvent("header:file-action", { detail: { action } }));
      fileMenuDropdown.hidden = true;
      if (fileMenuBtn) fileMenuBtn.setAttribute("aria-expanded", "false");
    });
  });
  
})();