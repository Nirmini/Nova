export function build(form) {
  return { type: 64, components: [] };
}

export function render(component) {
  return `<div class="discord-section">${(component.components||[]).map(c=>c.html||'').join('')}</div>`;
}
// COMPONENT ID: 9