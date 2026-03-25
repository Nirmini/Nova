export function build(form){ return { type:73, custom_id: form.customId || 'radio_' + Date.now(), options: form.radioOptions || [] }; }
export function render(component){ return `<div class="discord-radio-group">${(component.options||[]).map(o=>`<div class="discord-radio-item"><div class="discord-radio-button"></div><span>${escapeHtml(o.label)}</span></div>`).join('')}</div>`; }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// COMPONENT ID: 21