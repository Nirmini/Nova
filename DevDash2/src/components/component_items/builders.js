// Central builders map that delegates creation to per-component modules
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

export const builders = {
  button: Button.build,
  stringselect: StringSelect.build,
  textinput: TextInput.build,
  section: Section.build,
  container: Container.build,
  textdisplay: TextDisplay.build,
  thumbnail: Thumbnail.build,
  mediagallery: MediaGallery.build,
  file: FileComp.build,
  separator: Separator.build,
  label: Label.build,
  fileupload: FileUpload.build,
  radiogroup: RadioGroup.build,
  checkboxgroup: CheckboxGroup.build,
  checkbox: Checkbox.build,
  channelselect: ChannelSelect.build,
  userselect: UserSelect.build,
  roleselect: RoleSelect.build,
  mentionable: MentionableSelect.build
};

export default builders;
