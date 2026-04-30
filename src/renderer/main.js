//On load
window.addEventListener("DOMContentLoaded", () => {

  //loading header UI
  const headerHTML = window.uiComponents.loadHTML("components/header/header.html")
  document.getElementById("header-root").innerHTML = headerHTML

  //integrating header scripts
  const headerScript = document.createElement("script")
  headerScript.src = "./components/header/header.js"
  document.body.appendChild(headerScript)


  //loading ribbon UI
  const ribbonHtml = window.uiComponents.loadHTML("components/ribbon/ribbon.html")
  document.getElementById("ribbon-root").innerHTML = ribbonHtml

  //integrating ribbon scripts
  const ribbonScript = document.createElement("script")
  ribbonScript.src = "./components/ribbon/ribbon.js"
  document.body.appendChild(ribbonScript)

  //loading document UI
  const documentHtml = window.uiComponents.loadHTML("components/document/document.html")
  document.getElementById("document-root").innerHTML = documentHtml

  //integrating document scripts
  const docScript = document.createElement("script")
  docScript.src = "./components/document/document.js"
  document.body.appendChild(docScript)

  //loading footer UI
  const footerHtml = window.uiComponents.loadHTML("components/footer/footer.html")
  document.getElementById("footer-root").innerHTML = footerHtml

  //integrating footer scripts
  const footerScript = document.createElement("script")
  footerScript.src = "./components/footer/footer.js"
  document.body.appendChild(footerScript)
})
