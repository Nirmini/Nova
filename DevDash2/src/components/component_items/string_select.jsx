export function build(form) {
  return {
    type: 3,
    placeholder: form.placeholder || 'Select an option',
    custom_id: form.customId || 'select_' + Date.now(),
    min_values: form.minValues || 1,
    max_values: form.maxValues || 1,
    options: Array.isArray(form.options) ? form.options : (form.options ? form.options.split(',').map((v,i)=>({label:v.trim(), value:`opt_${i}`})) : [])
  };
}

export function render(component){
  const placeholder = component.placeholder || 'Select an option';
  return `
    <div class="discord-select-menu">
      <select ${component.disabled ? 'disabled' : ''}>
        <option disabled selected>${placeholder}</option>
        ${(component.options || []).map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
      </select>
    </div>
  `;
}
// COMPONENT ID: 3