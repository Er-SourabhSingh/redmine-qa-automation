#!/usr/bin/env node
/**
 * Generate a single-bug PDF from a bug MD file, using pdfkit's built-in
 * (non-embedded) Base-14 fonts (Helvetica/Helvetica-Bold/Courier).
 *
 * Workaround for a redmineflux MCP issue where a raw screenshot embedded inline into
 * a production issue's Description renders as a blank/gray block instead of the image.
 * A PDF flattens evidence into the file itself, so it attaches reliably as a normal
 * file attachment instead of relying on inline image embedding.
 *
 * Switched 2026-09-11 from a Playwright/Chromium HTML-to-PDF renderer to this
 * pdfkit-based plain-text renderer: Chromium's PDF export always embeds a subsetted
 * font file per distinct family/weight/style actually used (regular+bold+italic+
 * monospace = 4 separate embedded fonts), inflating even a 3-page text-only bug
 * report to 70-100KB. The redmineflux MCP `upload_file` tool requires the entire
 * file as a literal base64 string in the tool call, which has a practical size
 * ceiling well under that (observed reliable ceiling: well under 20KB raw). Base-14
 * fonts (Helvetica/Helvetica-Bold/Courier) are referenced by name in the PDF spec
 * and never need embedding, so a pdfkit-rendered bug report stays a few KB even
 * with a full multi-section report. Screenshots are intentionally not embedded by
 * this script (see REDMINEFLUX-MCP-SETUP.md §4.3a) — most rake-task/server-side
 * bugs have none, and image embedding would reintroduce the same size problem.
 *
 * Usage:
 *   node scripts/gen_bug_pdf.js <bug-md-path> <out-pdf-path>
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const PDFDocument = require('pdfkit');

const BODY_SIZE = 10;
const CODE_SIZE = 8.5;
const MARGIN = 50;

function renderTokens(doc, tokens) {
  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const sizeBySize = { 1: 18, 2: 14, 3: 12 };
        doc.font('Helvetica-Bold')
          .fontSize(sizeBySize[token.depth] || 11)
          .moveDown(0.6)
          .text(token.text, { continued: false });
        doc.moveDown(0.2);
        break;
      }
      case 'paragraph':
        doc.font('Helvetica').fontSize(BODY_SIZE).text(stripInline(token.text), {
          align: 'left',
        });
        doc.moveDown(0.4);
        break;
      case 'list':
        doc.font('Helvetica').fontSize(BODY_SIZE);
        token.items.forEach((item, i) => {
          const bullet = token.ordered ? `${i + 1}. ` : '- ';
          doc.text(bullet + stripInline(item.text), { indent: 10 });
        });
        doc.moveDown(0.4);
        break;
      case 'code':
        doc.font('Courier').fontSize(CODE_SIZE);
        doc.text(token.text, { align: 'left' });
        doc.font('Helvetica').fontSize(BODY_SIZE);
        doc.moveDown(0.4);
        break;
      case 'blockquote':
        doc.font('Helvetica').fontSize(BODY_SIZE).fillColor('#555');
        (token.tokens || []).forEach((t) => {
          if (t.text) doc.text(stripInline(t.text));
        });
        doc.fillColor('#000');
        doc.moveDown(0.4);
        break;
      case 'hr':
        doc.moveDown(0.3);
        doc
          .strokeColor('#ccc')
          .moveTo(doc.x, doc.y)
          .lineTo(doc.page.width - MARGIN, doc.y)
          .stroke();
        doc.strokeColor('#000');
        doc.moveDown(0.3);
        break;
      case 'table': {
        doc.font('Helvetica-Bold').fontSize(BODY_SIZE - 1);
        doc.text(token.header.map((h) => h.text).join(' | '));
        doc.font('Helvetica').fontSize(BODY_SIZE - 1);
        token.rows.forEach((row) => {
          doc.text(row.map((c) => c.text).join(' | '));
        });
        doc.moveDown(0.4);
        break;
      }
      case 'space':
        break;
      default:
        if (token.tokens) renderTokens(doc, token.tokens);
        else if (token.text) {
          doc.font('Helvetica').fontSize(BODY_SIZE).text(stripInline(token.text));
        }
    }
  }
}

function stripInline(text) {
  // Drop markdown image/link syntax and bold/italic markers; keep the plain text.
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '[image: $1]')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

async function main() {
  const [, , mdArg, outArg] = process.argv;
  if (!mdArg || !outArg) {
    console.error('Usage: node gen_bug_pdf.js <bug-md-path> <out-pdf-path>');
    process.exit(1);
  }

  const absMdPath = path.resolve(mdArg);
  const absOutPath = path.resolve(outArg);

  if (!fs.existsSync(absMdPath)) {
    console.error(`Bug MD file not found: ${absMdPath}`);
    process.exit(1);
  }

  const rawMd = fs.readFileSync(absMdPath, 'utf8');
  const tokens = marked.lexer(rawMd);

  fs.mkdirSync(path.dirname(absOutPath), { recursive: true });

  const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: true });
  const stream = fs.createWriteStream(absOutPath);
  doc.pipe(stream);

  renderTokens(doc, tokens);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log(`PDF written to ${absOutPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
