import React, { useState, useCallback, useEffect } from 'react';
import { discordMarkdownToHtml, renderDiscordMessage } from '../utils/discordMarkdown';
import {
  EmbedBuilder,
  BUTTON_STYLES,
  TEXT_INPUT_STYLES,
  COMPONENT_TYPES,
  validateMessage
} from '../utils/discordComponents';
import builders from './component_items/builders';
import '../styles/discord.css';
import './dependancies/compstyle.css';
import './dependancies/embedstyle.css';
import './dependancies/markdown.css';
import './dependancies/messagestyle.css';

const API_BASE = 'http://localhost:65522';

// Component type list for UI
const COMP_TYPE_LIST = [
  // Standard Components
  { value: 'button', label: '🔘 Button' },
  { value: 'stringselect', label: '📋 String Select' },
  { value: 'userselect', label: '👤 User Select' },
  { value: 'roleselect', label: '⭐ Role Select' },
  { value: 'mentionable', label: '@ Mentionable Select' },
  { value: 'channelselect', label: '#️⃣ Channel Select' },
  { value: 'textinput', label: '📝 Text Input' },
  { value: 'radiogroup', label: '🔘 Radio Group' },
  { value: 'checkboxgroup', label: '✅ Checkbox Group' },
  // V2 Components
  { value: 'section', label: '📦 Section' },
  { value: 'container', label: '🎁 Container' },
  { value: 'textdisplay', label: '📄 Text Display' },
  { value: 'label', label: '🏷️ Label' },
  { value: 'thumbnail', label: '🖼️ Thumbnail' },
  { value: 'mediagallery', label: '🎨 Media Gallery' },
  { value: 'file', label: '📄 File' },
  { value: 'fileupload', label: '📤 File Upload' },
  { value: 'separator', label: '➖ Separator' },
  { value: 'unfurledmedia', label: '🔗 Unfurled Media' }
];

export default function DiscordMessageBuilder() {
  const [content, setContent] = useState('');
  const [embeds, setEmbeds] = useState([]);
  const [components, setComponents] = useState([]);
  const [errors, setErrors] = useState([]);
  
  // API state for guild/channel selection
  const [guilds, setGuilds] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messageType, setMessageType] = useState('channel');
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [userId, setUserId] = useState('');

  // Embed form state
  const [embedForm, setEmbedForm] = useState({
    title: '',
    description: '',
    color: '#5865f2',
    author: '',
    footer: '',
    image: '',
    thumbnail: '',
    fields: []
  });

  // Component form state - comprehensive for all types
  const [componentForm, setComponentForm] = useState({
    type: 'button',
    label: '',
    customId: '',
    url: '',
    style: BUTTON_STYLES.PRIMARY,
    options: [{ label: 'Option 1', value: 'opt_1', description: '' }],
    placeholder: '',
    minValues: 1,
    maxValues: 1,
    textStyle: TEXT_INPUT_STYLES.SHORT,
    minLength: 0,
    maxLength: 100,
    required: false,
    text: '',
    imageUrl: '',
    galleryItems: [{ url: '', alt: '' }],
    fileName: '',
    fileSize: 0,
    description: '',
    radioOptions: [{ label: 'Option 1', value: 'opt_1' }],
    checkboxOptions: [{ label: 'Option 1', value: 'opt_1' }],
    // Container/Section color
    containerColor: '#5865f2'
  });
  // Target for adding component: 'top' or index of existing container
  const [componentTarget, setComponentTarget] = useState('top');

  // Load guilds on mount
  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/guilds`);
      const data = await res.json();
      setGuilds(data || []);
      if (data?.length > 0) {
        setSelectedGuild(data[0].id);
        loadChannels(data[0].id);
      }
    } catch (err) {
      setErrors(prev => [...prev, `Failed to load guilds: ${err.message}`]);
    }
  };

  const loadChannels = async (guildId) => {
    try {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/channels`);
      const data = await res.json();
      const textChans = (data || []).filter(c => c.type === 0);
      setChannels(textChans);
      if (textChans?.length > 0) {
        setSelectedChannel(textChans[0].id);
      }
    } catch (err) {
      setErrors(prev => [...prev, `Failed to load channels: ${err.message}`]);
    }
  };

  const addEmbed = useCallback(() => {
    if (!embedForm.title && !embedForm.description) {
      setErrors(['Embed must have at least a title or description']);
      return;
    }

    const embed = {};
    if (embedForm.title) embed.title = embedForm.title;
    if (embedForm.description) embed.description = embedForm.description;
    if (embedForm.color) embed.color = embedForm.color;
    if (embedForm.author) embed.author = { name: embedForm.author };
    if (embedForm.footer) embed.footer = { text: embedForm.footer };
    if (embedForm.image) embed.image = { url: embedForm.image };
    if (embedForm.thumbnail) embed.thumbnail = { url: embedForm.thumbnail };
    if (embedForm.fields.length > 0) embed.fields = embedForm.fields;

    setEmbeds([...embeds, embed]);
    setEmbedForm({
      title: '',
      description: '',
      color: '#5865f2',
      author: '',
      footer: '',
      image: '',
      thumbnail: '',
      fields: []
    });
    setErrors([]);
  }, [embedForm, embeds]);

  const removeEmbed = useCallback((index) => {
    setEmbeds(embeds.filter((_, i) => i !== index));
  }, [embeds]);

  const addField = useCallback(() => {
    setEmbedForm({
      ...embedForm,
      fields: [...embedForm.fields, { name: '', value: '', inline: false }]
    });
  }, [embedForm]);

  const updateField = useCallback((index, field, value) => {
    const newFields = [...embedForm.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setEmbedForm({ ...embedForm, fields: newFields });
  }, [embedForm]);

  const removeField = useCallback((index) => {
    setEmbedForm({
      ...embedForm,
      fields: embedForm.fields.filter((_, i) => i !== index)
    });
  }, [embedForm]);

  const buildComponent = useCallback(() => {
    // prefer per-component builder if available
    const builder = builders[componentForm.type];
    if (builder && typeof builder === 'function') return builder(componentForm);

    // fallback simple mapping for unknown types
    return { type: componentForm.type };
  }, [componentForm]);



  const addComponent = useCallback(() => {
    const comp = buildComponent();
    if (!comp) return;

    // If user chose to add into an existing container/section
    if (componentTarget !== 'top') {
      const idx = parseInt(componentTarget, 10);
      if (!isNaN(idx) && components[idx]) {
        const newComps = components.map((c, i) => {
          if (i === idx) {
            // ensure the target has a components array
            const target = { ...c };
            if (!Array.isArray(target.components)) target.components = [];
            target.components = [...target.components, comp];
            return target;
          }
          return c;
        });
        setComponents(newComps);
        setErrors([]);
        // reset form
        setComponentForm({
          type: 'button',
          label: '',
          customId: '',
          url: '',
          style: BUTTON_STYLES.PRIMARY,
          options: [{ label: 'Option 1', value: 'opt_1', description: '' }],
          placeholder: '',
          minValues: 1,
          maxValues: 1,
          textStyle: TEXT_INPUT_STYLES.SHORT,
          minLength: 0,
          maxLength: 100,
          required: false,
          text: '',
          imageUrl: '',
          galleryItems: [{ url: '', alt: '' }],
          fileName: '',
          fileSize: 0,
          description: '',
          radioOptions: [{ label: 'Option 1', value: 'opt_1' }],
          checkboxOptions: [{ label: 'Option 1', value: 'opt_1' }]
        });
      }
      return;
    }

    // Top-level add
    // Containers and sections are top-level V2 components (they carry their own children)
    if (comp.type === 'container' || comp.type === 'section') {
      setComponents([...components, comp]);
    } else {
      // Buttons/selects must be placed inside an Action Row (type 1)
      const last = components[components.length - 1];
      if (last && last.type === 1 && Array.isArray(last.components)) {
        // If last action row has space (<=4 children), append
        if (last.components.length < 5) {
          const newComponents = [...components];
          newComponents[newComponents.length - 1] = { ...last, components: [...last.components, comp] };
          setComponents(newComponents);
        } else {
          // create new action row
          const actionRow = { type: 1, components: [comp] };
          setComponents([...components, actionRow]);
        }
      } else {
        // create new action row
        const actionRow = { type: 1, components: [comp] };
        setComponents([...components, actionRow]);
      }

      setComponentForm({
        type: 'button',
        label: '',
        customId: '',
        url: '',
        style: BUTTON_STYLES.PRIMARY,
        options: [{ label: 'Option 1', value: 'opt_1', description: '' }],
        placeholder: '',
        minValues: 1,
        maxValues: 1,
        textStyle: TEXT_INPUT_STYLES.SHORT,
        minLength: 0,
        maxLength: 100,
        required: false,
        text: '',
        imageUrl: '',
        galleryItems: [{ url: '', alt: '' }],
        fileName: '',
        fileSize: 0,
        description: '',
        radioOptions: [{ label: 'Option 1', value: 'opt_1' }],
        checkboxOptions: [{ label: 'Option 1', value: 'opt_1' }]
      });
      setErrors([]);
    }
  }, [buildComponent, components, componentTarget]);
  
  const buildPayload = useCallback(() => {
    const payload = {
      type: messageType,
      devUserId: '600464355917692952'
    };

    if (messageType === 'dm') {
      payload.userId = userId.trim();
    } else {
      payload.guildId = selectedGuild;
      payload.channelId = selectedChannel;
    }

    if (content) {
      payload.messageType = 'text';
      payload.content = content;
    }

    if (embeds.length > 0) {
      payload.messageType = 'embed';
      const firstEmbed = embeds[0];
      payload.embed = {
        title: firstEmbed.title || '',
        description: firstEmbed.description || '',
        color: firstEmbed.color || '#5865f2'
      };
      if (content) payload.content = content;
    }

    if (components.length > 0) {
      payload.messageType = 'componentsv2';
      payload.components = components;
    }

    return payload;
  }, [messageType, userId, selectedGuild, selectedChannel, content, embeds, components]);

  const validateAndSend = useCallback(async () => {
    const payload = buildPayload();

    if (!payload.content && !payload.embed && !payload.components) {
      setErrors(['Message must have content, embed, or components']);
      return;
    }

    if (messageType === 'dm' && !userId.trim()) {
      setErrors(['Please enter a user ID for DM']);
      return;
    }

    setErrors([]);
    console.log('Sending payload:', payload);

    try {
      const res = await fetch(`${API_BASE}/api/sendmsg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Message sent successfully!\n\n' + JSON.stringify(data, null, 2));
      } else {
        setErrors([`Error: ${data.error || 'Unknown error'}`]);
        alert('❌ Error sending message:\n\n' + JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setErrors([...errors, `Failed to send: ${err.message}`]);
      alert('❌ Failed to send message: ' + err.message);
    }
  }, [buildPayload, messageType, userId]);

  const previewHtml = renderDiscordMessage(content, embeds, components);

  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '8px',
    background: '#2c2f33',
    color: '#dbdee1',
    border: '2px solid #5865f2',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const buttonStyle = (bg, color = '#fff') => ({
    background: bg,
    color: color,
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '8px',
    transition: 'all 0.2s',
    fontWeight: bg === '#57f287' ? 'bold' : 'normal'
  });

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100vh', background: '#202225' }}>
      {/* Editor Pane */}
      <div style={{
        width: '480px',
        background: '#2f3136',
        borderRight: '3px solid #5865f2',
        overflow: 'auto',
        padding: '16px',
        boxShadow: '-4px 0 12px rgba(88, 101, 242, 0.1)'
      }}>
        <h2 style={{ color: '#fff', marginTop: 0, borderBottom: '2px solid #5865f2', paddingBottom: '8px' }}>
          💜 Discord Message Builder
        </h2>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{
            background: '#ed4245',
            color: '#fff',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '13px',
            borderLeft: '4px solid #ff6b6b'
          }}>
            {errors.map((err, i) => <div key={i}>• {err}</div>)}
          </div>
        )}

        {/* Destination Selector */}
        <div style={{ marginBottom: '20px', padding: '12px', background: '#1e1f22', borderRadius: '4px', border: '2px solid #5865f2' }}>
          <h3 style={{ color: '#fff', borderBottom: '2px solid #5865f2', paddingBottom: '4px', marginTop: 0 }}>📍 Send To</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', gap: '16px', color: '#dbdee1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="radio" name="msgType" value="channel" checked={messageType === 'channel'} onChange={(e) => setMessageType(e.target.value)} />
                Channel
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="radio" name="msgType" value="dm" checked={messageType === 'dm'} onChange={(e) => setMessageType(e.target.value)} />
                DM
              </label>
            </label>
          </div>
          
          {messageType === 'channel' ? (
            <>
              <select value={selectedGuild} onChange={(e) => { setSelectedGuild(e.target.value); loadChannels(e.target.value); }} style={inputStyle}>
                {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} style={inputStyle}>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </>
          ) : (
            <input type="text" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} style={inputStyle} />
          )}
        </div>

        {/* Message Content */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', borderBottom: '2px solid #5865f2', paddingBottom: '4px' }}>📝 Message Content</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here... Supports Discord markdown!"
            style={{...inputStyle, height: '100px', resize: 'vertical'}}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
            <select value={componentTarget} onChange={(e) => setComponentTarget(e.target.value)} style={{...inputStyle, width: '160px'}}>
              <option value="top">Top-level</option>
              {components.map((c, i) => {
                // list only containers/sections as possible parents
                if (c.type === 'container' || c.type === 'section') {
                  return <option key={i} value={i}>Parent: {c.label || c.type + ' ' + i}</option>;
                }
                return null;
              })}
            </select>
            <button style={buttonStyle('#5865f2')}>+ Add Embed</button>
            <button style={buttonStyle('#57f287', '#000')} onClick={addComponent}>+ Add Component</button>
          </div>
        </div>

        {/* Embed Builder */}
        <details style={{marginBottom: '16px'}}>
          <summary style={{
            color: '#fff',
            borderBottom: '2px solid #5865f2',
            paddingBottom: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>📦 Embed Builder</summary>
          <div style={{paddingTop: '12px', background: '#1e1f22', padding: '12px', borderRadius: '4px'}}>
            <input type="text" placeholder="Title" value={embedForm.title} onChange={(e) => setEmbedForm({...embedForm, title: e.target.value})} style={inputStyle} />
            <textarea placeholder="Description" value={embedForm.description} onChange={(e) => setEmbedForm({...embedForm, description: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
              <input type="color" value={embedForm.color} onChange={(e) => setEmbedForm({...embedForm, color: e.target.value})} style={{width: '50px', height: '40px', cursor: 'pointer', border: '2px solid #5865f2', borderRadius: '4px'}} />
              <input type="text" placeholder="#5865f2" value={embedForm.color} onChange={(e) => setEmbedForm({...embedForm, color: e.target.value})} style={{...inputStyle, marginBottom: 0}} />
            </div>
            <button style={buttonStyle('#5865f2')} onClick={addEmbed}>Add Embed</button>
          </div>
        </details>

        {/* Component Builder */}
        <details open style={{marginBottom: '16px'}}>
          <summary style={{
            color: '#fff',
            borderBottom: '2px solid #5865f2',
            paddingBottom: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>🎮 Component Builder</summary>
          <div style={{paddingTop: '12px', background: '#1e1f22', padding: '12px', borderRadius: '4px'}}>
            <select value={componentForm.type} onChange={(e) => setComponentForm({...componentForm, type: e.target.value})} style={inputStyle}>
              {COMP_TYPE_LIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {/* Button Fields */}
            {componentForm.type === 'button' && (
              <>
                <input type="text" placeholder="Button Label" value={componentForm.label} onChange={(e) => setComponentForm({...componentForm, label: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Custom ID" value={componentForm.customId} onChange={(e) => setComponentForm({...componentForm, customId: e.target.value})} style={inputStyle} />
                <select value={componentForm.style} onChange={(e) => setComponentForm({...componentForm, style: parseInt(e.target.value)})} style={inputStyle}>
                  <option value={BUTTON_STYLES.PRIMARY}>Primary (Blurple)</option>
                  <option value={BUTTON_STYLES.SECONDARY}>Secondary (Grey)</option>
                  <option value={BUTTON_STYLES.SUCCESS}>Success (Green)</option>
                  <option value={BUTTON_STYLES.DANGER}>Danger (Red)</option>
                  <option value={BUTTON_STYLES.LINK}>Link</option>
                </select>
                {componentForm.style === BUTTON_STYLES.LINK && (
                  <input type="url" placeholder="https://example.com" value={componentForm.url} onChange={(e) => setComponentForm({...componentForm, url: e.target.value})} style={inputStyle} />
                )}
              </>
            )}

            {/* Select Fields */}
            {['stringselect', 'userselect', 'roleselect', 'mentionable', 'channelselect'].includes(componentForm.type) && (
              <>
                <input type="text" placeholder="Placeholder" value={componentForm.placeholder} onChange={(e) => setComponentForm({...componentForm, placeholder: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Custom ID" value={componentForm.customId} onChange={(e) => setComponentForm({...componentForm, customId: e.target.value})} style={inputStyle} />
                <input type="number" min="1" max="25" placeholder="Min Values" value={componentForm.minValues} onChange={(e) => setComponentForm({...componentForm, minValues: parseInt(e.target.value)})} style={inputStyle} />
                <input type="number" min="1" max="25" placeholder="Max Values" value={componentForm.maxValues} onChange={(e) => setComponentForm({...componentForm, maxValues: parseInt(e.target.value)})} style={inputStyle} />
                
                {componentForm.type === 'stringselect' && (
                  <>
                    {componentForm.options.map((opt, idx) => (
                      <div key={idx} style={{marginBottom: '8px', padding: '8px', background: '#2c2f33', borderLeft: '3px solid #5865f2', borderRadius: '3px'}}>
                        <input type="text" placeholder="Label" value={opt.label} onChange={(e) => updateOption('options', idx, 'label', e.target.value)} style={inputStyle} />
                        <input type="text" placeholder="Value" value={opt.value} onChange={(e) => updateOption('options', idx, 'value', e.target.value)} style={inputStyle} />
                        <button onClick={() => removeOption('options', idx)} style={buttonStyle('#ed4245')}>Remove</button>
                      </div>
                    ))}
                    <button onClick={() => addOption('options')} style={buttonStyle('#2c2f33', '#dbdee1')} onMouseEnter={(e) => e.target.style.background = '#3c3f43'}>+ Add Option</button>
                  </>
                )}
              </>
            )}

            {/* Text Input Fields */}
            {componentForm.type === 'textinput' && (
              <>
                <input type="text" placeholder="Label" value={componentForm.label} onChange={(e) => setComponentForm({...componentForm, label: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Custom ID" value={componentForm.customId} onChange={(e) => setComponentForm({...componentForm, customId: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Placeholder" value={componentForm.placeholder} onChange={(e) => setComponentForm({...componentForm, placeholder: e.target.value})} style={inputStyle} />
                <select value={componentForm.textStyle} onChange={(e) => setComponentForm({...componentForm, textStyle: parseInt(e.target.value)})} style={inputStyle}>
                  <option value={TEXT_INPUT_STYLES.SHORT}>Short</option>
                  <option value={TEXT_INPUT_STYLES.PARAGRAPH}>Paragraph</option>
                </select>
                <label style={{color: '#dbdee1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                  <input type="checkbox" checked={componentForm.required} onChange={(e) => setComponentForm({...componentForm, required: e.target.checked})} />
                  Required
                </label>
              </>
            )}

            {/* Radio/Checkbox Fields */}
            {['radiogroup', 'checkboxgroup'].includes(componentForm.type) && (
              <>
                <input type="text" placeholder="Custom ID" value={componentForm.customId} onChange={(e) => setComponentForm({...componentForm, customId: e.target.value})} style={inputStyle} />
                {componentForm[componentForm.type === 'radiogroup' ? 'radioOptions' : 'checkboxOptions'].map((opt, idx) => (
                  <div key={idx} style={{marginBottom: '8px', padding: '8px', background: '#2c2f33', borderLeft: '3px solid #5865f2'}}>
                    <input type="text" placeholder="Label" value={opt.label} onChange={(e) => updateOption(componentForm.type === 'radiogroup' ? 'radioOptions' : 'checkboxOptions', idx, 'label', e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Value" value={opt.value} onChange={(e) => updateOption(componentForm.type === 'radiogroup' ? 'radioOptions' : 'checkboxOptions', idx, 'value', e.target.value)} style={inputStyle} />
                    <button onClick={() => removeOption(componentForm.type === 'radiogroup' ? 'radioOptions' : 'checkboxOptions', idx)} style={buttonStyle('#ed4245')}>Remove</button>
                  </div>
                ))}
                <button onClick={() => addOption(componentForm.type === 'radiogroup' ? 'radioOptions' : 'checkboxOptions')} style={buttonStyle('#2c2f33', '#dbdee1')}>+ Add Option</button>
              </>
            )}

            {/* Text Display */}
            {componentForm.type === 'textdisplay' && (
              <textarea placeholder="Display Text" value={componentForm.text} onChange={(e) => setComponentForm({...componentForm, text: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            )}

            {/* Label */}
            {componentForm.type === 'label' && (
              <>
                <input type="text" placeholder="Label" value={componentForm.label} onChange={(e) => setComponentForm({...componentForm, label: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Description" value={componentForm.description} onChange={(e) => setComponentForm({...componentForm, description: e.target.value})} style={inputStyle} />
              </>
            )}

            {/* Thumbnail */}
            {componentForm.type === 'thumbnail' && (
              <input type="url" placeholder="Image URL" value={componentForm.imageUrl} onChange={(e) => setComponentForm({...componentForm, imageUrl: e.target.value})} style={inputStyle} />
            )}

            {/* Media Gallery */}
            {componentForm.type === 'mediagallery' && (
              <>
                {componentForm.galleryItems.map((item, idx) => (
                  <div key={idx} style={{marginBottom: '8px', padding: '8px', background: '#2c2f33', borderLeft: '3px solid #5865f2'}}>
                    <input type="url" placeholder="Image URL" value={item.url} onChange={(e) => {const items = [...componentForm.galleryItems]; items[idx].url = e.target.value; setComponentForm({...componentForm, galleryItems: items});}} style={inputStyle} />
                    <button onClick={() => {const items = componentForm.galleryItems.filter((_, i) => i !== idx); setComponentForm({...componentForm, galleryItems: items});}} style={buttonStyle('#ed4245')}>Remove</button>
                  </div>
                ))}
                <button onClick={() => setComponentForm({...componentForm, galleryItems: [...componentForm.galleryItems, {url: '', alt: ''}]})} style={buttonStyle('#2c2f33', '#dbdee1')}>+ Add Image</button>
              </>
            )}

            {/* File */}
            {componentForm.type === 'file' && (
              <>
                <input type="text" placeholder="File Name" value={componentForm.fileName} onChange={(e) => setComponentForm({...componentForm, fileName: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="File Size (bytes)" value={componentForm.fileSize} onChange={(e) => setComponentForm({...componentForm, fileSize: parseInt(e.target.value)})} style={inputStyle} />
              </>
            )}

            {/* File Upload */}
            {componentForm.type === 'fileupload' && (
              <>
                <input type="text" placeholder="Label" value={componentForm.label} onChange={(e) => setComponentForm({...componentForm, label: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Custom ID" value={componentForm.customId} onChange={(e) => setComponentForm({...componentForm, customId: e.target.value})} style={inputStyle} />
              </>
            )}

            {/* Unfurled Media */}
            {componentForm.type === 'unfurledmedia' && (
              <>
                <input type="url" placeholder="URL" value={componentForm.url} onChange={(e) => setComponentForm({...componentForm, url: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Title" value={componentForm.label} onChange={(e) => setComponentForm({...componentForm, label: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Description" value={componentForm.description} onChange={(e) => setComponentForm({...componentForm, description: e.target.value})} style={inputStyle} />
              </>
            )}

            {/* Container/Section Color */}
            {['container', 'section'].includes(componentForm.type) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="color" value={componentForm.containerColor} onChange={(e) => setComponentForm({...componentForm, containerColor: e.target.value})} style={{width: '50px', height: '40px', cursor: 'pointer', border: '2px solid #5865f2', borderRadius: '4px'}} />
                <input type="text" placeholder="#5865f2" value={componentForm.containerColor} onChange={(e) => setComponentForm({...componentForm, containerColor: e.target.value})} style={{...inputStyle, marginBottom: 0}} />
              </div>
            )}

            <button onClick={addComponent} style={buttonStyle('#57f287', '#000')}>🎮 Add Component</button>
          </div>
        </details>

        {/* Components List */}
        {components.length > 0 && (
          <div style={{marginBottom: '16px'}}>
            <h3 style={{color: '#57f287', borderBottom: '2px solid #57f287', paddingBottom: '4px'}}>✅ Components ({components.length})</h3>
            {components.map((_, idx) => (
              <div key={idx} style={{padding: '8px', background: '#1e1f22', borderLeft: '3px solid #57f287', borderRadius: '3px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#dbdee1'}}>Component {idx + 1}</span>
                <button onClick={() => removeComponent(idx)} style={{background: '#ed4245', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px'}}>✕ Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* Send Button */}
        <button onClick={validateAndSend} style={{
          width: '100%',
          background: '#5865f2',
          color: '#fff',
          border: '2px solid #5865f2',
          padding: '12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px',
          boxShadow: '0 0 12px rgba(88, 101, 242, 0.4)',
          transition: 'all 0.2s'
        }}>
          ✨ Preview Message
        </button>
      </div>

      {/* Preview Pane */}
      <div style={{
        flex: 1,
        background: '#36393f',
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '3px solid #5865f2'
      }}>
        <h2 style={{color: '#fff', marginTop: 0, borderBottom: '2px solid #5865f2', paddingBottom: '8px'}}>👁️ Live Preview</h2>
        <div
          dangerouslySetInnerHTML={{__html: previewHtml}}
          style={{
            flex: 1,
            borderRadius: '4px',
            padding: '16px',
            background: '#36393f',
            overflow: 'auto'
          }}
        />
      </div>
    </div>
  );
}
