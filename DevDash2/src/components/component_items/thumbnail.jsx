export function build(form){
  return { type: 66, url: form.imageUrl || '' };
}

export function render(component){
  return `<div class="discord-thumbnail"><img src="${component.url||''}" alt="thumbnail"/></div>`;
}
// COMPONENT ID: 11