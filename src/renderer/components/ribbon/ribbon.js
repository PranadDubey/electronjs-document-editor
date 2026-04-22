const tabs = document.querySelectorAll(".ribbon-tab");
const panelsContainer = document.getElementById("ribbon-panels");

const loadedPanels = {};

function loadPanel(tabName) {
  if (!loadedPanels[tabName]) {
    const html = window.uiComponents.loadHTML(`components/ribbon/panels/${tabName}/${tabName}.html`);
    
    const panelDiv = document.createElement("div");
    panelDiv.id = `panel-${tabName}`;
    panelDiv.className = "ribbon-panel";
    panelDiv.innerHTML = html;
    
    panelsContainer.appendChild(panelDiv);
    loadedPanels[tabName] = panelDiv;

    const script = document.createElement("script");
    script.src = `./components/ribbon/panels/${tabName}/${tabName}.js`;
    document.body.appendChild(script);
  }

  Object.values(loadedPanels).forEach((panel) => {
    panel.classList.remove("is-active");
  });

  loadedPanels[tabName].classList.add("is-active");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const tabName = tab.getAttribute("data-tab");
    loadPanel(tabName);
  });
});

loadPanel("home");