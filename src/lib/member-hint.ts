/**
 * "A member is signed in on this browser", known before the page paints.
 *
 * Pages are built once, for a visitor. A member's data only arrives after hydration, so without help
 * they would watch the visitor's version (the landing page, the big explainer banners) flash by first.
 * The store keeps a one-character note in localStorage; a script in `<head>` (app/layout) reads it and
 * marks `<html data-member>` before first paint, and CSS (globals.css) hides `[data-landing]` blocks
 * and reveals `[data-member-only]` ones. Once the data is here, AuthSync keeps the mark truthful.
 */
export const MEMBER_KEY = "wwfi:member";
export const MEMBER_ATTR = "data-member";

export const MEMBER_HINT_SCRIPT = `(function(){try{if(localStorage.getItem("${MEMBER_KEY}"))document.documentElement.setAttribute("${MEMBER_ATTR}","")}catch(e){}})()`;
