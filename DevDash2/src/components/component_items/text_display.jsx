export function build(form) {
  return { type: 65, text: form.text || '' };
}

export function render(component){
  return `<div class="discord-text-display">${escapeHtml(component.text||'')}</div>`;
}

function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// COMPONENT ID: 10