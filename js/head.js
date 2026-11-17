/* Runs before first paint: marks that scripts are on, and stops the browser restoring an old scroll position. */
document.documentElement.classList.add("js");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
// GoatCounter: count pages without their query string, so links shared with tracking or cache-busting
// parameters still add up under one page. Event names (CV download, email) pass through unchanged.
window.goatcounter = { path: function (p) { return String(p).split("?")[0] || "/"; } };
