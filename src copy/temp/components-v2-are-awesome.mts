/* Commented out so type checking doesn't run.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  FileBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from 'discord.js';

const self = await readFile(fileURLToPath(import.meta.url), 'utf8');

const container = new ContainerBuilder();

const text1 = new TextDisplayBuilder().setContent(
  [
    '# `discord.js` @ `14.19.0` has been released <:CAPV2:1342549467731333172> ',
    '-# We were almost on time <a:yippee:1108974025704747009>',
    '*Alongside several other packages: read more on the [releases page](<https://github.com/discordjs/discord.js/releases>)*',
    '-# @everyone',
    '## Notable Changes',
  ].join('\n'),
);

container.addTextDisplayComponents(text1);

const text2 = new TextDisplayBuilder().setContent(
  [
    //
    '### `discord.js`',
    '- Components v2!',
    '- Soundboards',
  ].join('\n'),
);

const changelogButton1 = new ButtonBuilder()
  .setLabel('Changelog')
  .setStyle(ButtonStyle.Link)
  .setURL('https://github.com/discordjs/discord.js/releases/tag/14.19.0');

const section2 = new SectionBuilder().addTextDisplayComponents(text2).setButtonAccessory(changelogButton1);

container.addSectionComponents(section2);

container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

const text3 = new TextDisplayBuilder().setContent(
  [
    //
    '### `@discordjs/builders`',
    '- Components v2!',
  ].join('\n'),
);

const changelogButton2 = new ButtonBuilder()
  .setLabel('Changelog')
  .setStyle(ButtonStyle.Link)
  .setURL('https://github.com/discordjs/discord.js/releases/tag/%40discordjs%2Fbuilders%401.11.1');

const section3 = new SectionBuilder().addTextDisplayComponents(text3).setButtonAccessory(changelogButton2);

container.addSectionComponents(section3);

container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

const text4 = new TextDisplayBuilder().setContent(
  ['As always, if any issues come up, open an issue with a reproduction sample! <:Prayge:1133992904839405628>'].join(
    '\n',
  ),
);

container.addTextDisplayComponents(text4);

const openIssueButton = new ButtonBuilder()
  .setLabel('Open an issue')
  .setStyle(ButtonStyle.Link)
  .setURL('https://github.com/discordjs/discord.js/issues/new/choose');

container.addActionRowComponents(row => row.addComponents(openIssueButton));

const hintText = new TextDisplayBuilder().setContent(
  "-# And if you're curious how this message was built, check out the source code!",
);

container.addTextDisplayComponents(hintText);

const file = new FileBuilder().setURL('attachment://components-v2-are-awesome.mts');

container.addFileComponents(file);

await channel.send({
  components: [container],
  files: [new AttachmentBuilder(Buffer.from(self), { name: 'components-v2-are-awesome.mts' })],
  flags: MessageFlags.IsComponentsV2,
});
*/