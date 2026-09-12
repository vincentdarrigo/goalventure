// Manual Jest mock for `expo-sqlite`, used only under the "app" test project
// (see jest.config.js). The real package needs a native binding that isn't
// available under plain Node/Jest. `src/db/client.ts` itself is swapped out
// entirely for `src/db/testClient.ts` (better-sqlite3) via moduleNameMapper,
// but `drizzle-orm/expo-sqlite/query.js`'s `useLiveQuery` imports
// `addDatabaseChangeListener` directly from this package regardless of which
// `db` instance it's watching, so it needs a stand-in too.
//
// This stub never actually fires change events (better-sqlite3 has no
// equivalent to SQLite's native update_hook), so useLiveQuery's initial load
// works but does not react to writes made elsewhere during a test. Tests
// should assert against the database directly (e.g. via a repository query)
// rather than relying on the UI to re-render after a write.
function addDatabaseChangeListener() {
  return { remove() {} };
}

module.exports = { addDatabaseChangeListener };
