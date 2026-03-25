export function build(form) {
  const c = { type: 70, components: [] };
  if (form.containerColor) c.style = form.containerColor;
  return c;
}

export function render(component){
  const style = component.style ? `style="border-left:4px solid ${component.style};padding:8px;border-radius:6px;"` : '';
  return `<div class="discord-container" ${style}>${(component.components||[]).map(c=>c.html||'').join('')}</div>`;
}
// COMPONENT ID: 17