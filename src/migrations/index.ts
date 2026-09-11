import * as migration_20260910_221524_initial from './20260910_221524_initial';
import * as migration_20260911_clear_header_tagline from './20260911_clear_header_tagline';

export const migrations = [
  {
    up: migration_20260910_221524_initial.up,
    down: migration_20260910_221524_initial.down,
    name: '20260910_221524_initial'
  },
  {
    up: migration_20260911_clear_header_tagline.up,
    down: migration_20260911_clear_header_tagline.down,
    name: '20260911_clear_header_tagline'
  },
];
