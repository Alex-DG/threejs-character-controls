export const hideLoader = () => {
  // Hide loader
  const loadingContainer = document.getElementById('loading-container')
  loadingContainer?.remove()

  // Show panel
  const panel = document.getElementById('panel-controls')
  if (panel) {
    panel.style.display = 'block'
  }
}
