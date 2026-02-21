export function initTheme(themeBtn) {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme, themeBtn);
}

export function toggleTheme(themeBtn) {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next, themeBtn);
}

export function applyTheme(theme, themeBtn) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeBtn) themeBtn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}
