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
.text-\\[0\\.35rem\\], .text-\\[0\\.4rem\\], .text-\\[0\\.55rem\\], .text-\\[7px\\], .text-\\[8px\\], .text-\\[9px\\] { font-size: 12px !important; }
.text-\\[10px\\], .text-\\[11px\\] { font-size: 13px !important; line-height: 1.4 !important; }
.text-xs { font-size: 0.8125rem !important; line-height: 1.25rem !important; }
.text-sm { font-size: 0.9375rem !important; line-height: 1.4rem !important; }
</style>`;
