const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Drizzle's expo-sqlite migrator imports raw .sql migration files at build time.
config.resolver.sourceExts.push("sql");
// expo-sqlite's web implementation loads a WASM binary (wa-sqlite).
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./global.css" });
