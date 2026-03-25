/**
 * Discord Markdown to HTML Converter
 * Handles all Discord markdown syntax with proper escaping and formatting
 */

import { renderEmbedModule } from '../components/embeds/embedRenderer';
import { renderComponentItem } from '../components/component_items/renderers';

export function discordMarkdownToHtml(text) {
  if (!text) return '';

  let html = text;

  // Escape HTML special characters first (but preserve our markdown markers)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings (must be at start of line)
  html = html.replace(/^### (.*?)$/gm, '<h3 class="dm-heading-3">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="dm-heading-2">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="dm-heading-1">$1</h1>');

  // Small text
  html = html.replace(/-# (.*?)$/gm, '<p class="dm-small-text">$1</p>');

  // Code blocks (triple backticks with optional language)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'plaintext';
    return `<pre class="dm-code-block" data-lang="${language}"><code>${code.trim()}</code></pre>`;
  });

  // Inline code (backticks)
  html = html.replace(/`([^`\n]+)`/g, '<code class="dm-inline-code">$1</code>');

  // Bold, italic, underline, strikethrough
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // Spoilers
  html = html.replace(/\|\|(.*?)\|\|/g, '<span class="dm-spoiler">$1</span>');

  // Block quotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="dm-blockquote">$1</blockquote>');
  html = html.replace(/^&gt;&gt;&gt; ([\s\S]*?)(?=\n\n|$)/gm, '<blockquote class="dm-blockquote dm-blockquote-multi">$1</blockquote>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="dm-link">$1</a>');

  // User mentions
  html = html.replace(/&lt;@!?(\d+)&gt;/g, '<span class="dm-mention">@User</span>');

  // Role mentions
  html = html.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="dm-mention dm-role-mention">@Role</span>');

  // Channel mentions
  html = html.replace(/&lt;#(\d+)&gt;/g, '<span class="dm-mention dm-channel-mention">#channel</span>');

  // Custom emoji
  html = html.replace(/&lt;:([^:]+):(\d+)&gt;/g, '<span class="dm-emoji">:$1:</span>');
  html = html.replace(/&lt;a:([^:]+):(\d+)&gt;/g, '<span class="dm-emoji dm-emoji-animated">:$1:</span>');

  // Unordered lists
  html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="dm-list">$1</ul>');

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  // Clean up multiple line breaks
  html = html.replace(/(<br\/>){3,}/g, '<br/><br/>');

  return html;
}

export function renderDiscordMessage(content, embeds = [], components = []) {
  let html = `
    <div class="discord-message-container">
      <div class="discord-message">
        <div class="discord-avatar">
          <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Avatar" />
        </div>
        <div class="discord-content">
          <div class="discord-header">
            <span class="discord-username">Nova</span>
            <span class="discord-tag">APP</span>
            <span class="discord-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="discord-message-text">
            ${content ? discordMarkdownToHtml(content) : ''}
          </div>
  `;

  // Render embeds
  if (embeds && embeds.length > 0) {
    embeds.forEach(embed => {
      html += renderEmbed(embed);
    });
  }

  // Render components
  if (components && components.length > 0) {
    html += '<div class="discord-components">';
    components.forEach(component => {
      html += renderComponent(component);
    });
    html += '</div>';
  }

  html += `
        </div>
      </div>
    </div>
  `;

  return html;
}
function renderEmbed(embed) {
  return renderEmbedModule(embed);
}

function renderComponent(component) {
  return renderComponentItem(component);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 88, g: 101, b: 242 };
}
