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
</style>`;
