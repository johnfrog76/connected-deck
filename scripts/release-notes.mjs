/* eslint-disable no-console */
// Print the CHANGELOG.md section for one version, as the notes of its release.
//
// Usage:
//   node scripts/release-notes.mjs v0.1.0
//   node scripts/release-notes.mjs 0.1.0
//
// Exits non-zero, naming what is missing, when CHANGELOG.md has no
// "## [<version>]" heading, when that section is empty, or when package.json
// carries a different version, checked in that order. The release workflow runs this on every tag,
// so a release never ships with empty notes or a mismatched version.

import { readFileSync } from 'node:fs';

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node scripts/release-notes.mjs <tag or version>');
  process.exit(2);
}
const version = arg.replace(/^v/, '');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const lines = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8').split('\n');
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const start = lines.findIndex((line) => new RegExp(`^## \\[${escaped}\\]`).test(line));
if (start === -1) {
  fail(`CHANGELOG.md has no section "## [${version}]". Add it before tagging v${version}.`);
}

// The section runs to the next version heading or to the link references.
let end = lines.findIndex((line, i) => i > start && (/^## /.test(line) || /^\[[^\]]+\]: /.test(line)));
if (end === -1) end = lines.length;

const notes = lines.slice(start + 1, end).join('\n').trim();
if (!notes) {
  fail(`CHANGELOG.md has a section "## [${version}]" but nothing under it.`);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (pkg.version !== version) {
  fail(`package.json has version ${pkg.version}, but the tag asks for ${version}.`);
}

console.log(notes);
