const { execSync } = require('child_process');

// We have typescript installed via npx cache
// Let's find ts executable in npx cache
const fs = require('fs');
const path = require('path');

// Let's run various tsc flag combinations and count error lines
const configs = [
  '--allowJs --checkJs --noEmit js/db.js',
  '--allowJs --checkJs --noEmit --strictNullChecks false js/db.js',
  '--allowJs --checkJs --noEmit --noImplicitAny false --strictNullChecks false js/db.js',
  '--allowJs --checkJs --noEmit --target es6 js/db.js',
  '--allowJs --checkJs --noEmit --target es2020 js/db.js',
  '--allowJs --checkJs --noEmit --target es2022 js/db.js',
  '--allowJs --checkJs --noEmit --lib es2020,dom js/db.js',
  '--allowJs --checkJs --noEmit --lib es2022,dom js/db.js',
  '--allowJs --checkJs --noEmit --lib esnext,dom js/db.js',
  '--allowJs --checkJs --noEmit --strict false js/db.js',
  '--allowJs --checkJs --noEmit --strict false --lib es2020,dom js/db.js',
  '--allowJs --checkJs --noEmit --strict false --target es2020 js/db.js'
];

configs.forEach(cfg => {
  try {
    execSync('cmd /c npx --yes typescript ' + cfg, { stdio: 'pipe' });
    console.log(cfg, ': 0 errors');
  } catch (err) {
    const out = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    const count = (out.match(/error TS/g) || []).length;
    console.log(cfg, '=>', count, 'errors');
  }
});

