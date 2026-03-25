# Discord Message Builder - DevDash2

A comprehensive Discord message builder tool built with React and Vite, providing a powerful interface for creating rich Discord messages with embeds and interactive components.

## Features

### Message Content
- **Full Discord Markdown Support**
  - Headings (# ## ###)
  - Text formatting (bold, italic, underline, strikethrough)
  - Inline code and code blocks with syntax highlighting
  - Block quotes (single and multi-line)
  - Lists (ordered and unordered)
  - Spoilers
  - User, role, and channel mentions
  - Emoji support
  - Links with proper formatting

### Embeds
- Rich embed creation with:
  - Title and description
  - Custom color selection with hex input
  - Author information
  - Footer text
  - Images and thumbnails
  - Multiple fields with inline support
  - Full markdown support in all text fields

### Components
- **Buttons**
  - Primary, Secondary, Success, Danger, and Link styles
  - Custom IDs and labels
  - URL support for link buttons

- **Select Menus**
  - String selects with custom options
  - User selects
  - Role selects
  - Mentionable selects
  - Channel selects
  - Configurable min/max values

- **Text Inputs**
  - Short and paragraph styles
  - Custom placeholders
  - Min/max length constraints

### Live Preview
- Real-time preview of messages as you build them
- Accurate Discord UI styling using official color scheme
- Responsive layout matching Discord's design

## Project Structure

```
src/
├── components/
│   └── DiscordMessageBuilder.jsx    # Main builder component
├── utils/
│   ├── discordMarkdown.js           # Markdown parser and renderer
│   └── discordComponents.js         # Component builders and validators
├── styles/
│   └── discord.css                  # Discord-themed styling
├── App.jsx                          # App root component
├── main.jsx                         # React entry point
└── index.css                        # Global styles
```

## Usage

### Starting the Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Technology Stack

- **React 19.2.0** - UI library
- **Vite 7.3.1** - Build tool and dev server
- **JavaScript (ES Modules)** - Modern JavaScript

## Discord Markdown Features

### Text Formatting
- `**bold**` → **bold**
- `*italic*` → *italic*
- `__underline__` → <u>underline</u>
- `~~strikethrough~~` → ~~strikethrough~~
- `***bold italic***` → ***bold italic***

### Headings
- `# Heading 1`
- `## Heading 2`
- `### Heading 3`

### Code
- `` `inline code` ``
- ` ```language\ncode block\n``` `

### Quotes
- `> Single line quote`
- `>>> Multi-line\nquote\nblock`

### Lists
- `- Item 1\n- Item 2`
- `1. Numbered item 1\n2. Numbered item 2`

### Mentions
- `<@userid>` - User mention
- `<@&roleid>` - Role mention
- `<#channelid>` - Channel mention

### Spoilers
- `||spoiler text||` → Hidden until hovered/clicked

## Validation

The builder includes comprehensive validation:
- Content max length: 2000 characters
- Embed titles: max 256 characters
- Embed descriptions: max 4096 characters
- Max embeds per message: 10
- Embed fields: max 25 per embed
- Component validation

## Future Enhancements

Potential additions:
- Message send functionality integration
- Template saving and loading
- Component pagination
- Slash command builder
- Webhook message copying
- Modal builder
- Custom emoji picker
- Message history

## Styling

The application uses Discord's official color scheme:
- Dark theme with proper contrast
- Smooth transitions and hover effects
- Responsive design
- Custom scrollbars matching Discord UI

## Performance Considerations

- Efficient React rendering with proper memoization
- Light CSS-in-JS approach using inline styles for dynamic content
- Fast markdown parsing
- Responsive preview updates

## Browser Support

Modern browsers supporting:
- ES2020+
- CSS Grid and Flexbox
- Local Storage (for future persistence)

## License

Part of the Nova/NovaBot ecosystem.
