/**
 * Discord Components Builder
 * Utilities for building Discord message components and embeds with full v2 support
 */

export const COMPONENT_TYPES = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  TEXT_INPUT: 4,
  USER_SELECT: 5,
  ROLE_SELECT: 6,
  MENTIONABLE_SELECT: 7,
  CHANNEL_SELECT: 8,
  SECTION: 64,
  TEXT_DISPLAY: 65,
  THUMBNAIL: 66,
  MEDIA_GALLERY: 67,
  FILE: 68,
  SEPARATOR: 69,
  CONTAINER: 70,
  LABEL: 71,
  FILE_UPLOAD: 72,
  RADIO_GROUP: 73,
  CHECKBOX_GROUP: 74,
  CHECKBOX: 75,
  UNFURLED_MEDIA_ITEM: 76
};

export const BUTTON_STYLES = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5
};

export const SELECT_TYPES = {
  STRING_SELECT: 3,
  USER_SELECT: 5,
  ROLE_SELECT: 6,
  MENTIONABLE_SELECT: 7,
  CHANNEL_SELECT: 8
};

export const TEXT_INPUT_STYLES = {
  SHORT: 1,
  PARAGRAPH: 2
};

export class EmbedBuilder {
  constructor() {
    this.embed = {
      color: '#5865f2',
      fields: []
    };
  }

  setTitle(title) {
    this.embed.title = title;
    return this;
  }

  setDescription(description) {
    this.embed.description = description;
    return this;
  }

  setColor(color) {
    this.embed.color = color;
    return this;
  }

  setAuthor(name, iconUrl = null) {
    this.embed.author = { name, icon_url: iconUrl };
    return this;
  }

  setFooter(text, iconUrl = null) {
    this.embed.footer = { text, icon_url: iconUrl };
    return this;
  }

  setImage(url) {
    this.embed.image = { url };
    return this;
  }

  setThumbnail(url) {
    this.embed.thumbnail = { url };
    return this;
  }

  addField(name, value, inline = false) {
    this.embed.fields.push({ name, value, inline });
    return this;
  }

  build() {
    return this.embed;
  }
}

export class ButtonBuilder {
  constructor() {
    this.button = {
      type: 2,
      style: BUTTON_STYLES.PRIMARY,
      label: 'Button',
      custom_id: 'button_' + Math.random().toString(36).substr(2, 9)
    };
  }

  setLabel(label) {
    this.button.label = label;
    return this;
  }

  setStyle(style) {
    this.button.style = style;
    return this;
  }

  setCustomId(id) {
    this.button.custom_id = id;
    return this;
  }

  setUrl(url) {
    this.button.url = url;
    this.button.style = BUTTON_STYLES.LINK;
    delete this.button.custom_id;
    return this;
  }

  setEmoji(name, id = null) {
    this.button.emoji = { name, id };
    return this;
  }

  setDisabled(disabled = true) {
    this.button.disabled = disabled;
    return this;
  }

  build() {
    return this.button;
  }
}

export class SelectMenuBuilder {
  constructor(type = SELECT_TYPES.STRING_SELECT) {
    this.menu = {
      type,
      options: [],
      custom_id: 'select_' + Math.random().toString(36).substr(2, 9)
    };
  }

  setPlaceholder(placeholder) {
    this.menu.placeholder = placeholder;
    return this;
  }

  setCustomId(id) {
    this.menu.custom_id = id;
    return this;
  }

  setMinValues(min) {
    this.menu.min_values = min;
    return this;
  }

  setMaxValues(max) {
    this.menu.max_values = max;
    return this;
  }

  addOption(label, value, description = null, emoji = null) {
    const option = { label, value };
    if (description) option.description = description;
    if (emoji) option.emoji = emoji;
    this.menu.options.push(option);
    return this;
  }

  setDisabled(disabled = true) {
    this.menu.disabled = disabled;
    return this;
  }

  build() {
    return this.menu;
  }
}

export class ActionRowBuilder {
  constructor() {
    this.row = {
      type: 1,
      components: []
    };
  }

  addComponent(component) {
    if (this.row.components.length < 5) {
      this.row.components.push(component);
    }
    return this;
  }

  addButton(button) {
    return this.addComponent(button);
  }

  addSelectMenu(menu) {
    return this.addComponent(menu);
  }

  addTextInput(input) {
    return this.addComponent(input);
  }

  build() {
    return this.row;
  }
}

export class TextInputBuilder {
  constructor() {
    this.input = {
      type: 4,
      style: TEXT_INPUT_STYLES.SHORT,
      custom_id: 'input_' + Math.random().toString(36).substr(2, 9)
    };
  }

  setLabel(label) {
    this.input.label = label;
    return this;
  }

  setCustomId(id) {
    this.input.custom_id = id;
    return this;
  }

  setPlaceholder(placeholder) {
    this.input.placeholder = placeholder;
    return this;
  }

  setStyle(style) {
    this.input.style = style;
    return this;
  }

  setMinLength(min) {
    this.input.min_length = min;
    return this;
  }

  setMaxLength(max) {
    this.input.max_length = max;
    return this;
  }

  setRequired(required = true) {
    this.input.required = required;
    return this;
  }

  setValue(value) {
    this.input.value = value;
    return this;
  }

  build() {
    return this.input;
  }
}

export class ModalBuilder {
  constructor() {
    this.modal = {
      custom_id: 'modal_' + Math.random().toString(36).substr(2, 9),
      title: 'Modal',
      components: []
    };
  }

  setCustomId(id) {
    this.modal.custom_id = id;
    return this;
  }

  setTitle(title) {
    this.modal.title = title;
    return this;
  }

  addComponent(component) {
    this.modal.components.push(component);
    return this;
  }

  build() {
    return this.modal;
  }
}

// V2 Component Builders

export class SectionBuilder {
  constructor() {
    this.section = {
      type: COMPONENT_TYPES.SECTION,
      components: []
    };
  }

  addComponent(component) {
    this.section.components.push(component);
    return this;
  }

  build() {
    return this.section;
  }
}

export class TextDisplayBuilder {
  constructor() {
    this.textDisplay = {
      type: COMPONENT_TYPES.TEXT_DISPLAY,
      text: ''
    };
  }

  setText(text) {
    this.textDisplay.text = text;
    return this;
  }

  build() {
    return this.textDisplay;
  }
}

export class ThumbnailBuilder {
  constructor() {
    this.thumbnail = {
      type: COMPONENT_TYPES.THUMBNAIL,
      url: ''
    };
  }

  setUrl(url) {
    this.thumbnail.url = url;
    return this;
  }

  build() {
    return this.thumbnail;
  }
}

export class MediaGalleryBuilder {
  constructor() {
    this.gallery = {
      type: COMPONENT_TYPES.MEDIA_GALLERY,
      items: []
    };
  }

  addItem(url, altText = '') {
    this.gallery.items.push({ url, alt_text: altText });
    return this;
  }

  build() {
    return this.gallery;
  }
}

export class FileBuilder {
  constructor() {
    this.file = {
      type: COMPONENT_TYPES.FILE,
      id: 'file_' + Math.random().toString(36).substr(2, 9),
      name: '',
      size: 0
    };
  }

  setName(name) {
    this.file.name = name;
    return this;
  }

  setSize(size) {
    this.file.size = size;
    return this;
  }

  build() {
    return this.file;
  }
}

export class SeparatorBuilder {
  constructor() {
    this.separator = {
      type: COMPONENT_TYPES.SEPARATOR
    };
  }

  build() {
    return this.separator;
  }
}

export class ContainerBuilder {
  constructor() {
    this.container = {
      type: COMPONENT_TYPES.CONTAINER,
      components: []
    };
  }

  addComponent(component) {
    this.container.components.push(component);
    return this;
  }

  build() {
    return this.container;
  }
}

export class LabelBuilder {
  constructor() {
    this.label = {
      type: COMPONENT_TYPES.LABEL,
      label: '',
      description: ''
    };
  }

  setLabel(label) {
    this.label.label = label;
    return this;
  }

  setDescription(description) {
    this.label.description = description;
    return this;
  }

  build() {
    return this.label;
  }
}

export class FileUploadBuilder {
  constructor() {
    this.fileUpload = {
      type: COMPONENT_TYPES.FILE_UPLOAD,
      custom_id: 'file_upload_' + Math.random().toString(36).substr(2, 9),
      label: 'Upload File'
    };
  }

  setLabel(label) {
    this.fileUpload.label = label;
    return this;
  }

  setCustomId(id) {
    this.fileUpload.custom_id = id;
    return this;
  }

  build() {
    return this.fileUpload;
  }
}

export class RadioGroupBuilder {
  constructor() {
    this.radioGroup = {
      type: COMPONENT_TYPES.RADIO_GROUP,
      custom_id: 'radio_' + Math.random().toString(36).substr(2, 9),
      options: []
    };
  }

  setCustomId(id) {
    this.radioGroup.custom_id = id;
    return this;
  }

  addOption(label, value, description = '') {
    this.radioGroup.options.push({ label, value, description });
    return this;
  }

  build() {
    return this.radioGroup;
  }
}

export class CheckboxGroupBuilder {
  constructor() {
    this.checkboxGroup = {
      type: COMPONENT_TYPES.CHECKBOX_GROUP,
      custom_id: 'checkbox_' + Math.random().toString(36).substr(2, 9),
      options: []
    };
  }

  setCustomId(id) {
    this.checkboxGroup.custom_id = id;
    return this;
  }

  addOption(label, value, description = '') {
    this.checkboxGroup.options.push({ label, value, description });
    return this;
  }

  build() {
    return this.checkboxGroup;
  }
}

export class CheckboxBuilder {
  constructor() {
    this.checkbox = {
      type: COMPONENT_TYPES.CHECKBOX,
      label: '',
      value: ''
    };
  }

  setLabel(label) {
    this.checkbox.label = label;
    return this;
  }

  setValue(value) {
    this.checkbox.value = value;
    return this;
  }

  build() {
    return this.checkbox;
  }
}

export class UnfurledMediaItemBuilder {
  constructor() {
    this.mediaItem = {
      type: COMPONENT_TYPES.UNFURLED_MEDIA_ITEM,
      url: '',
      title: '',
      description: ''
    };
  }

  setUrl(url) {
    this.mediaItem.url = url;
    return this;
  }

  setTitle(title) {
    this.mediaItem.title = title;
    return this;
  }

  setDescription(description) {
    this.mediaItem.description = description;
    return this;
  }

  build() {
    return this.mediaItem;
  }
}

export function createMessagePayload(content, embeds = [], components = []) {
  return {
    content: content || undefined,
    embeds: embeds.length > 0 ? embeds : undefined,
    components: components.length > 0 ? components : undefined
  };
}

export function validateEmbed(embed) {
  const errors = [];

  if (embed.title && embed.title.length > 256) {
    errors.push('Title cannot exceed 256 characters');
  }

  if (embed.description && embed.description.length > 4096) {
    errors.push('Description cannot exceed 4096 characters');
  }

  if (embed.fields && embed.fields.length > 25) {
    errors.push('Maximum 25 fields per embed');
  }

  if (embed.fields) {
    let charCount = 0;
    embed.fields.forEach(field => {
      charCount += (field.name?.length || 0) + (field.value?.length || 0);
    });
    if (charCount > 6000) {
      errors.push('Total field characters cannot exceed 6000');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateMessage(content, embeds, components) {
  const errors = [];

  if (!content && (!embeds || embeds.length === 0) && (!components || components.length === 0)) {
    errors.push('Message must have content, embeds, or components');
  }

  if (content && content.length > 2000) {
    errors.push('Content cannot exceed 2000 characters');
  }

  if (embeds) {
    if (embeds.length > 10) {
      errors.push('Maximum 10 embeds per message');
    }
    embeds.forEach((embed, idx) => {
      const validation = validateEmbed(embed);
      if (!validation.valid) {
        errors.push(`Embed ${idx}: ${validation.errors.join(', ')}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
