export function build(form){
  return { type: 67, items: form.galleryItems || [] };
}

export function render(component){
  return `<div class="discord-media-gallery">${(component.items||[]).map(i=>`<div class="discord-media-item"><img src="${i.url}" alt="media"/></div>`).join('')}</div>`;
}
// COMPONENT ID: 12