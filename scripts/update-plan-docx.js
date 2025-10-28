/*
  Generates LCDA_calendar_plan.docx from recent UI updates.
  - Backs up existing docx to LCDA_calendar_plan.backup.docx if present
  - Reads docs/CHANGELOG.md and composes a simple document
*/

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

function readChangeLog() {
  const p = path.resolve(__dirname, '..', 'docs', 'CHANGELOG.md');
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function mdToParagraphs(md) {
  const lines = md.split(/\r?\n/);
  const paras = [];
  for (const line of lines) {
    if (!line.trim()) {
      paras.push(new Paragraph(''));
      continue;
    }
    if (line.startsWith('# ')) {
      paras.push(new Paragraph({ text: line.replace(/^#\s+/, ''), heading: HeadingLevel.HEADING_1 }));
      continue;
    }
    if (line.startsWith('## ')) {
      paras.push(new Paragraph({ text: line.replace(/^##\s+/, ''), heading: HeadingLevel.HEADING_2 }));
      continue;
    }
    if (line.startsWith('- ')) {
      paras.push(new Paragraph({ text: line.replace(/^-\s+/, ''), bullet: { level: 0 } }));
      continue;
    }
    paras.push(new Paragraph({ children: [new TextRun(line)] }));
  }
  return paras;
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const docxPath = path.join(root, 'LCDA_calendar_plan.docx');
  const backupPath = path.join(root, 'LCDA_calendar_plan.backup.docx');

  // Backup
  if (fs.existsSync(docxPath)) {
    try {
      fs.copyFileSync(docxPath, backupPath);
    } catch (e) {
      console.error('Failed to backup existing DOCX:', e);
    }
  }

  const md = readChangeLog();
  const now = new Date();
  const header = new Paragraph({
    children: [
      new TextRun({ text: 'LCDA Ensemble Planner — Update Plan', bold: true, size: 32 }),
    ],
  });
  const dateLine = new Paragraph({
    children: [new TextRun({ text: `Generated: ${now.toISOString()}`, color: '666666' })],
  });

  const intro = [
    new Paragraph({ text: 'This document summarizes recent UI/UX updates and debugging aids added to the calendar app.' }),
  ];

  const sections = md ? mdToParagraphs(md) : [new Paragraph('No changelog entries found.')];

  const doc = new Document({
    sections: [
      {
        children: [header, dateLine, new Paragraph(''), ...intro, new Paragraph(''), ...sections],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log('Updated', docxPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

