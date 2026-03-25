export function build(form){ return { type:75, label: form.label || '', value: form.value || '' }; }
export function render(component){ return `<div class="discord-checkbox-item"><div class="discord-checkbox"></div><span>${escapeHtml(component.label||'')}</span></div>`; }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// COMPONENT ID: 23