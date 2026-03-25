export function build(form){
	return {
		type: 7,
		placeholder: form.placeholder || 'Select an option',
		custom_id: form.customId || 'mentionable_' + Date.now(),
		min_values: form.minValues || 1,
		max_values: form.maxValues || 1
	};
}

export function render(component){
	const placeholder = component.placeholder || 'Select an option';
	return `
		<div class="discord-select-menu">
			<select ${component.disabled ? 'disabled' : ''}>
				<option disabled selected>${placeholder}</option>
			</select>
		</div>
	`;
}
// COMPONENT ID: 7