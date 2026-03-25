export function build(form){
  return { type: 68, id: 'file_' + Date.now(), name: form.fileName || 'file', size: form.fileSize || 0 };
}

export function render(component){
  const ext = (component.name||'file').split('.').pop();
  return `<div class="discord-file"><div class="discord-file-icon">${ext.toUpperCase()}</div><div class="discord-file-name">${component.name||'file'}</div><div class="discord-file-size">${component.size||0}</div></div>`;
}
// COMPONENT ID: 13