/**
 * Hide loader overlay
 */
export const hideLoader = () => {
  const loadingContainer = document.getElementById('loading-container')
  loadingContainer?.remove()
}
