/**
 * Injected into the studio's HTML: readable type sizes and the hub's fonts.
 * The studio ships many 7-11px labels; nothing here goes below 12px.
 */
export const STUDIO_THEME = `
<script>try{localStorage.setItem("better-auth-studio-theme","dark");document.documentElement.dataset.theme="dark";}catch(e){}</script>
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
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] { background: #141414 !important; backdrop-filter: none !important; border-left-color: #2e2e2e !important; }
button[title="Collapse panel"], button[title="Expand widgets panel"] { background: #141414 !important; border-color: #3a3a3a !important; color: #d4d4d4 !important; }
button[title="Collapse panel"]:hover, button[title="Expand widgets panel"]:hover { background: #262626 !important; color: #fff !important; }
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] div[draggable="true"] { background: #1b1b1b !important; }
/* The widget picker previews are made-up sample rows (Alice Chen, Acme Corp...): show names only. */
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] div[draggable="true"] > :not([class*="px-2.5"][class*="py-1.5"]) { display: none !important; }
div[class*="backdrop-blur-md"][class*="z-30"][class*="right-0"] div[draggable="true"] > [class*="px-2.5"][class*="py-1.5"] { border-bottom: 0 !important; padding-top: 12px !important; padding-bottom: 12px !important; }
/* The studio's own header bar: the hub's top bar carries search, refresh, share and the profile. */
div.h-screen > div[class*="bg-black/70"][class*="shrink-0"]:first-child { display: none !important; }
/* Studio tab bar: edge to edge, tabs share the width, no scrollbar. */
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 { padding-left: 0 !important; padding-right: 0 !important; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav { scrollbar-width: none !important; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav::-webkit-scrollbar { display: none !important; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav > div { flex: 1 1 0 !important; min-width: max-content; }
div[class*="bg-black/50"][class*="shrink-0"] > div.px-6 > nav > div > a { flex: 1 1 auto !important; justify-content: center !important; padding-left: 20px !important; padding-right: 20px !important; }
/* Thin, quiet scrollbars. */
* { scrollbar-width: thin !important; scrollbar-color: #3f3f46 transparent !important; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #52525b; }
</style>`;
