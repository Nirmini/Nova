// Central renderer for component items (V2 and legacy)
import * as Button from './button';
import * as StringSelect from './string_select';
import * as TextInput from './text_input';
import * as Section from './section';
import * as Container from './container';
import * as TextDisplay from './text_display';
import * as Thumbnail from './thumbnail';
import * as MediaGallery from './media_gallery';
import * as FileComp from './file';
import * as Separator from './separator';
import * as Label from './label';
import * as FileUpload from './file_upload';
import * as RadioGroup from './radio_group';
import * as CheckboxGroup from './checkbox_group';
import * as Checkbox from './checkbox';
import * as ChannelSelect from './channel_select';
import * as UserSelect from './user_select';
import * as RoleSelect from './role_select';
import * as MentionableSelect from './mentionable_select';

export function renderComponentItem(component) {
  if (!component) return '';
  // action row
  if (component.type === 1) return `<div class="discord-action-row">${(component.components||[]).map(renderComponentItem).join('')}</div>`;
  if (component.type === 2) return Button.render(component);
  if ([3,5,6,7,8].includes(component.type)) {
    // route to correct select renderer
    if (component.type === 3) return StringSelect.render(component);
    if (component.type === 5) return UserSelect.render(component);
    if (component.type === 6) return RoleSelect.render(component);
    if (component.type === 7) return MentionableSelect.render(component);
    if (component.type === 8) return ChannelSelect.render(component);
  }
  if (component.type === 4) return TextInput.render(component);
  if (component.type === 64) return Section.render(component);
  if (component.type === 65) return TextDisplay.render(component);
  if (component.type === 66) return Thumbnail.render(component);
  if (component.type === 67) return MediaGallery.render(component);
  if (component.type === 68) return FileComp.render(component);
  if (component.type === 69) return Separator.render(component);
  if (component.type === 70) return Container.render(component);
  if (component.type === 71) return Label.render(component);
  if (component.type === 72) return FileUpload.render(component);
  if (component.type === 73) return RadioGroup.render(component);
  if (component.type === 74) return CheckboxGroup.render(component);
  if (component.type === 75) return Checkbox.render(component);
  if (component.type === 76) return `<div class="discord-section"><div class="discord-section-title">${escapeHtml(component.title||'Media')}</div><a href="${component.url||'#'}" target="_blank" class="dm-link">${component.url||'Open Link'}</a>${component.description?`<div style="font-size:13px;margin-top:8px;">${escapeHtml(component.description)}</div>`:''}</div>`;
  return '';
}

function escapeHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export function formatFileSize(bytes){ if(bytes===0) return '0 B'; const k=1024; const sizes=['B','KB','MB','GB']; const i=Math.floor(Math.log(bytes)/Math.log(k)); return Math.round(bytes/Math.pow(k,i)*100)/100+' '+sizes[i]; }

