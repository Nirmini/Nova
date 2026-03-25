export function build(form) {
  const comp = { type: 2 };
  comp.label = form.label || 'Button';
  comp.custom_id = form.customId || 'btn_' + Date.now();
  comp.style = form.style;
  if (form.style === 5 && form.url) {
    comp.url = form.url;
    delete comp.custom_id;
  }
  if (form.disabled) comp.disabled = true;
  if (form.emoji) comp.emoji = form.emoji;
  return comp;
}

export function render(component) {
  const style = component.style || 1;
  const label = component.label || 'Button';
  const url = component.url || '#';
  const disabled = component.disabled ? 'disabled' : '';
  const styleClass = {1:'primary',2:'secondary',3:'success',4:'danger',5:'link'}[style] || 'primary';
  if (style === 5) return `<a href="${url}" target="_blank" class="discord-button ${styleClass} ${disabled}">${label}</a>`;
  return `<button class="discord-button ${styleClass}" ${disabled}>${label}</button>`;
}
// COMPONENT ID: 2