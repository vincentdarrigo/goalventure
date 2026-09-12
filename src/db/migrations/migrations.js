// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_high_reavers.sql';
import m0001 from './0001_fine_otto_octavius.sql';
import m0002 from './0002_far_typhoid_mary.sql';
import m0003 from './0003_rainy_anthem.sql';
import m0004 from './0004_glossy_radioactive_man.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004
    }
  }
  