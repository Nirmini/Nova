export function build(form){ return { type: 71, label: form.label || '', description: form.description || '' }; }
export function render(component){ return `<div class="discord-label"><div class="discord-label-title">${escapeHtml(component.label||'')}</div><div class="discord-label-description">${escapeHtml(component.description||'')}</div></div>`; }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// COMPONENT ID: 18