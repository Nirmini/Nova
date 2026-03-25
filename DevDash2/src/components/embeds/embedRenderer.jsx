// Embed renderer module (uses simple markdown-to-html for embed text to avoid circular imports)
export function renderEmbedModule(embed) {
  const color = embed.color || '#5865f2';
  const rgb = hexToRgb(color);

  let html = `<div class="discord-embed" style="border-left-color: ${color}; background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08);">`;

  if (embed.author) {
    html += `<div class="embed-author">`;
    if (embed.author.icon_url) html += `<img src="${embed.author.icon_url}" alt="author" class="embed-author-icon"/>`;
    html += `<span>${escapeHtml(embed.author.name || '')}</span></div>`;
  }

  if (embed.title) html += `<div class="embed-title">${mdToHtml(embed.title)}</div>`;
  if (embed.description) html += `<div class="embed-description">${mdToHtml(embed.description)}</div>`;

  if (embed.fields && embed.fields.length > 0) {
    html += '<div class="embed-fields">';
    embed.fields.forEach(field => {
      const inline = field.inline ? 'inline' : '';
      html += `
        <div class="embed-field ${inline}">
          <div class="embed-field-name">${mdToHtml(field.name)}</div>
          <div class="embed-field-value">${mdToHtml(field.value)}</div>
        </div>
      `;
    });
    html += '</div>';
  }

  if (embed.image) html += `<img src="${embed.image.url}" class="embed-image"/>`;
  if (embed.thumbnail) html += `<img src="${embed.thumbnail.url}" class="embed-thumbnail"/>`;

  if (embed.footer) {
    html += `<div class="embed-footer">`;
    if (embed.footer.icon_url) html += `<img src="${embed.footer.icon_url}" class="embed-footer-icon"/>`;
    html += `<span>${escapeHtml(embed.footer.text || '')}</span></div>`;
  }

  html += `</div>`;
  return html;
}

function mdToHtml(text) {
  if (!text) return '';
  // very small subset of markdown: inline code and links and basic escaping
  const escaped = escapeHtml(text);
  return escaped.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}

function escapeHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex||'');
  return result ? { r: parseInt(result[1],16), g: parseInt(result[2],16), b: parseInt(result[3],16) } : { r: 88, g: 101, b: 242 };
}

