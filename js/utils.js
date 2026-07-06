// js/utils.js

// ---- Toast Notification ----
export function showToast(message, type = 'success', duration = 3000) {
  // Remove any existing toast
  const existing = document.querySelector('.toast-container');
  if (existing) existing.remove();

  // Create container
  const container = document.createElement('div');
  container.className = 'toast-container';
  container.innerHTML = `
    <div class="toast toast-${type}">
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    </div>
  `;
  document.body.appendChild(container);

  // Auto-dismiss
  const timeout = setTimeout(() => {
    container.remove();
  }, duration);

  // Close button
  container.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timeout);
    container.remove();
  });

  return container;
}

// ---- Loading Spinner ----
export function showLoading(containerId, message = 'Loading...') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

export function hideLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Remove only the loading spinner, not other content
  const spinner = container.querySelector('.loading-spinner');
  if (spinner) spinner.remove();
}

// ---- Format date helper ----
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---- Format time helper ----
export function formatTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}