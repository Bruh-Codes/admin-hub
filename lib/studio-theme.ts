/**
 * Injected into the studio's HTML: readable type sizes and the hub's fonts.
 * The studio ships many 7-11px labels; nothing here goes below 12px.
 */
export const STUDIO_THEME = `
<script>try{var t=localStorage.getItem("admin-hub-theme")==="light"?"light":"dark";localStorage.setItem("better-auth-studio-theme",t);var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;d.classList.remove("light","dark");d.classList.add(t);}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style id="hub-theme">
html { font-size: 16px; }
body, button, input, select, textarea { font-family: "Geist", ui-sans-serif, system-ui, sans-serif !important; }
.font-mono, code, pre, kbd { font-family: "Geist Mono", ui-monospace, monospace !important; }
.text-\\[0\\.35rem\\], .text-\\[0\\.4rem\\], .text-\\[0\\.55rem\\], .text-\\[7px\\], .text-\\[8px\\], .text-\\[9px\\] { font-size: 13px !important; line-height: 1.4 !important; }
.text-\\[10px\\], .text-\\[11px\\] { font-size: 14px !important; line-height: 1.4 !important; }
.text-xs { font-size: 0.875rem !important; line-height: 1.3rem !important; }
.text-sm { font-size: 1rem !important; line-height: 1.5rem !important; }
/* The dashboard draws a wide fixed canvas and shrinks it with transform: scale(),
   which made its text tiny. Lay it out at real size instead. */
div[style*="transform-origin: left top"][style*="scale("], div[style*="transform-origin: top left"][style*="scale("] { transform: none !important; width: 100% !important; }
div:has(> div[style*="transform-origin: left top"][style*="scale("]), div:has(> div[style*="transform-origin: top left"][style*="scale("]) { width: 100% !important; height: auto !important; overflow: visible !important; }
/* That canvas sat in a fixed-height, overflow-hidden box: let it scroll. */
div.w-full:has(> div > div[style*="scale("]) { height: auto !important; }
div:has(> div.w-full > div > div[style*="scale("]) { overflow-y: auto !important; }
/* Widgets panel: its own solid surface, and a toggle that stays opaque on hover
   (it overlaps the tab bar, so a see-through hover showed the tabs behind it). */
html { --hub-panel: #141414; --hub-panel-line: #2e2e2e; --hub-btn-line: #3a3a3a; --hub-btn-text: #d4d4d4; --hub-btn-hover: #262626; --hub-btn-hover-text: #fff; --hub-item: #1b1b1b; --hub-thumb: #3f3f46; --hub-thumb-hover: #52525b; }
html[data-theme="light"] { --hub-panel: #ffffff; --hub-panel-line: #e5e5e5; --hub-btn-line: #d4d4d4; --hub-btn-text: #404040; --hub-btn-hover: #f0f0f0; --hub-btn-hover-text: #0a0a0a; --hub-item: #f7f7f7; --hub-thumb: #c4c4c4; --hub-thumb-hover: #a3a3a3; }
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] { background: var(--hub-panel) !important; backdrop-filter: none !important; border-left-color: var(--hub-panel-line) !important; }
button[title="Collapse panel"], button[title="Expand widgets panel"] { background: var(--hub-panel) !important; border-color: var(--hub-btn-line) !important; color: var(--hub-btn-text) !important; }
button[title="Collapse panel"]:hover, button[title="Expand widgets panel"]:hover { background: var(--hub-btn-hover) !important; color: var(--hub-btn-hover-text) !important; }
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] div[draggable="true"] { background: var(--hub-item) !important; }
/* The widget picker previews are made-up sample rows (Alice Chen, Acme Corp...): show names only. */
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] div[draggable="true"] > :not([class*="px-2.5"][class*="py-1.5"]) { display: none !important; }
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] div[draggable="true"] > [class*="px-2.5"][class*="py-1.5"] { border-bottom: 0 !important; padding-top: 12px !important; padding-bottom: 12px !important; }
/* The studio's own header bar: the hub's top bar carries search, share, the theme switch and the profile. */
div.h-screen > div[class*="bg-black/70"][class*="shrink-0"]:first-child,
div.min-h-screen > div[class*="bg-black/70"][class*="shrink-0"]:first-child { display: none !important; }
/* Studio tab bar: edge to edge, tabs share the width, no scrollbar. */
@media (min-width: 768px) {
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"]:has(> div[class*="min-w-fit"]) { flex-wrap: nowrap !important; gap: 16px !important; justify-content: space-between !important; }
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"] > div[class*="min-w-fit"] { min-width: 0 !important; flex: 0 1 auto; }
}
@media (min-width: 768px) and (max-width: 1279px) {
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"] > div[class*="min-w-fit"] > div:first-child,
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"] > div[class*="w-[1px]"] { display: none !important; }
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"] > div[class*="min-w-fit"] > div:last-child { flex-wrap: wrap; row-gap: 2px; }
}
@media (max-width: 767px) {
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"]:has(> div[class*="min-w-fit"]) { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 14px 12px !important; }
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"] > div[class*="min-w-fit"] { min-width: 0 !important; }
  div[class*="md:flex-row"][class*="md:flex-wrap"][class*="overflow-x-auto"] > div[class*="min-w-fit"] > div:last-child { flex-wrap: wrap; row-gap: 2px; }
}
div[class*="bg-black/50"][class*="shrink-0"][class*="hidden"][class*="md:block"] { display: block !important; }
@media (max-width: 767px) { div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav > div > a { padding: 12px 14px !important; white-space: nowrap; } }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 { padding-left: 0 !important; padding-right: 0 !important; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav { scrollbar-width: none !important; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav::-webkit-scrollbar { display: none !important; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav > div { flex: 1 1 0 !important; min-width: max-content; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav > div > a { flex: 1 1 auto !important; justify-content: center !important; padding-left: 20px !important; padding-right: 20px !important; }
/* Thin, quiet scrollbars. */
* { scrollbar-width: thin !important; scrollbar-color: var(--hub-thumb) transparent !important; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--hub-thumb); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--hub-thumb-hover); }
</style>`;
