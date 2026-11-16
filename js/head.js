/* Runs before first paint: marks that scripts are on, and stops the browser restoring an old scroll position. */
document.documentElement.classList.add("js");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
