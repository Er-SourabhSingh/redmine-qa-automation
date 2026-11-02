import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const CSV_DIR = path.resolve(__dirname, '../testdata/csv-test-data');

/** Minimal RFC-4180 reader (quoted cells, doubled quotes, embedded newlines) — enough for this folder's fixtures. */
export function parseCsv(text: string, sep = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function quote(cell: string, sep: string): string {
  return /["\n\r]/.test(cell) || cell.includes(sep) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function toCsv(rows: string[][], sep = ','): string {
  return rows.map((r) => r.map((c) => quote(c, sep)).join(sep)).join('\n') + '\n';
}

export interface Fixture {
  /** Absolute path of the file to upload (a temp copy when titles were tagged). */
  file: string;
  header: string[];
  /** Data rows only. */
  rows: string[][];
  /** Subject each data row will have after import (tagged), in file order. */
  subjects: string[];
  /** Unique run tag appended to every Title (`~<tag>`); findCreated() matches on it. */
  tag: string;
}

/**
 * Loads a fixture from csv-test-data/ and, for UTF-8 files with a Title column, writes a temp copy whose
 * Titles carry a run-unique suffix — so a re-run never confuses this run's test cases with an earlier run's.
 */
export function loadFixture(name: string, tag: string): Fixture {
  const src = path.join(CSV_DIR, name);
  const raw = fs.readFileSync(src);
  const text = raw.toString('utf8').replace(/^﻿/, '');
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  const data = rows.slice(1);
  const titleIdx = header.findIndex((h) => h.trim().toLowerCase() === 'title');
  if (titleIdx < 0 || raw.length === 0) {
    return { file: src, header, rows: data, subjects: data.map((r) => r[titleIdx] ?? ''), tag };
  }
  const tagged = data.map((r) => r.map((c, i) => (i === titleIdx ? `${c} ~${tag}` : c)));
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'csv-import-')), name);
  fs.writeFileSync(out, toCsv([header, ...tagged]), 'utf8');
  return { file: out, header, rows: tagged, subjects: tagged.map((r) => r[titleIdx]), tag };
}

/** Writes an ad-hoc CSV (for cases that have no fixture in csv-test-data/) and returns it as a Fixture. */
export function writeFixture(name: string, header: string[], data: string[][], tag: string): Fixture {
  const titleIdx = header.indexOf('Title');
  const tagged = data.map((r) => r.map((c, i) => (i === titleIdx ? `${c} ~${tag}` : c)));
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'csv-import-')), name);
  fs.writeFileSync(out, toCsv([header, ...tagged]), 'utf8');
  return { file: out, header, rows: tagged, subjects: tagged.map((r) => r[titleIdx]), tag };
}

export interface StepPair { step: string; expected: string }

const norm = (h: string) => h.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * What the import is documented to save for one CSV row: Step N / Expected Result N pairs (plain
 * `Steps` / `Expected` count as pair 1), ordered by N, a pair with either half blank skipped, survivors
 * renumbered contiguously (TC-TCM-022, -025, -027).
 */
export function expectedSteps(header: string[], row: string[]): StepPair[] {
  const pairs = new Map<number, Partial<StepPair>>();
  header.forEach((h, i) => {
    const k = norm(h);
    let m: RegExpMatchArray | null;
    if (k === 'steps') (pairs.get(1) ?? pairs.set(1, {}).get(1)!).step ??= row[i] ?? '';
    else if (k === 'expected') (pairs.get(1) ?? pairs.set(1, {}).get(1)!).expected ??= row[i] ?? '';
    else if ((m = k.match(/^step (\d+)$/))) { const n = +m[1]; (pairs.get(n) ?? pairs.set(n, {}).get(n)!).step ??= row[i] ?? ''; }
    else if ((m = k.match(/^expected result (\d+)$/))) { const n = +m[1]; (pairs.get(n) ?? pairs.set(n, {}).get(n)!).expected ??= row[i] ?? ''; }
  });
  return [...pairs.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, p]) => ({ step: (p.step ?? '').trim(), expected: (p.expected ?? '').trim() }))
    .filter((p) => p.step !== '' && p.expected !== '');
}

/** Collapses whitespace so a value rendered to HTML can be compared with the raw CSV cell. */
export const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
