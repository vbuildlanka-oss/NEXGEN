import * as migration_20260910_221524_initial from './20260910_221524_initial';

export const migrations = [
  {
    up: migration_20260910_221524_initial.up,
    down: migration_20260910_221524_initial.down,
    name: '20260910_221524_initial'
  },
];
