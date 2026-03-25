export function build(form){ return { type:74, custom_id: form.customId || 'checkbox_' + Date.now(), options: form.checkboxOptions || [] }; }
export function render(component){ return `<div class="discord-checkbox-group">${(component.options||[]).map(o=>`<div class="discord-checkbox-item"><div class="discord-checkbox"></div><span>${escapeHtml(o.label)}</span></div>`).join('')}</div>`; }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// COMPONENT ID: 22