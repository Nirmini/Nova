export function build(form){ return { type:72, custom_id: form.customId || 'file_upload_' + Date.now(), label: form.label || 'Upload File' }; }
export function render(component){ return `<button class="discord-button primary">📤 ${escapeHtml(component.label||'Upload File')}</button>`; }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// COMPONENT ID: 19