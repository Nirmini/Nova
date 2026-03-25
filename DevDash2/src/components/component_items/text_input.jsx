export function build(form) {
  return {
    type: 4,
    label: form.label || 'Input',
    custom_id: form.customId || 'input_' + Date.now(),
    style: form.textStyle,
    placeholder: form.placeholder || '',
    min_length: form.minLength || undefined,
    max_length: form.maxLength || undefined,
    required: !!form.required
  };
}

export function render(component){
  return `
    <input type="text" class="discord-text-input" placeholder="${component.placeholder||''}" ${component.disabled?'disabled':''} ${component.required?'required':''} />
  `;
}
// COMPONENT ID: 4