import * as migration_20260910_221524_initial from './20260910_221524_initial';
import * as migration_20260911_clear_header_tagline from './20260911_clear_header_tagline';
import * as migration_20260912_085532_typography_settings from './20260912_085532_typography_settings';

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
    name: '20260912_085532_typography_settings'
  },
];
