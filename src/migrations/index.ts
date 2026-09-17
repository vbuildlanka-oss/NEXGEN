import * as migration_20260910_221524_initial from './20260910_221524_initial';
import * as migration_20260911_clear_header_tagline from './20260911_clear_header_tagline';
import * as migration_20260912_085532_typography_settings from './20260912_085532_typography_settings';
import * as migration_20260913_unique_section_images from './20260913_unique_section_images';
import * as migration_20260917_123624_page_wording_globals from './20260917_123624_page_wording_globals';
import * as migration_20260917_repair_community_image from './20260917_repair_community_image';

export const migrations = [
  {
    up: migration_20260910_221524_initial.up,
    down: migration_20260910_221524_initial.down,
    name: '20260910_221524_initial',
  },
  {
    up: migration_20260911_clear_header_tagline.up,
    down: migration_20260911_clear_header_tagline.down,
    name: '20260911_clear_header_tagline',
  },
  {
    up: migration_20260912_085532_typography_settings.up,
    down: migration_20260912_085532_typography_settings.down,
    name: '20260912_085532_typography_settings',
  },
  {
    up: migration_20260913_unique_section_images.up,
    down: migration_20260913_unique_section_images.down,
    name: '20260913_unique_section_images',
  },
  {
    up: migration_20260917_123624_page_wording_globals.up,
    down: migration_20260917_123624_page_wording_globals.down,
    name: '20260917_123624_page_wording_globals',
  },
  {
    up: migration_20260917_repair_community_image.up,
    down: migration_20260917_repair_community_image.down,
    name: '20260917_repair_community_image'
  },
];
