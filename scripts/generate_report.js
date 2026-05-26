const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, PageBreak, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, WidthType, TableOfContents, LevelFormat,
  TabStopType, TabStopPosition,
} = require("docx");

// ---- 常量 ----
const FONT_BODY = "SimSun";       // 宋体
const FONT_HEADING = "SimHei";    // 黑体
const FONT_CODE = "Consolas";
const SIZE_BODY = 24;             // 12pt = 24 half-points
const SIZE_H1 = 32;               // 16pt
const SIZE_H2 = 28;               // 14pt
const SIZE_CODE = 20;             // 10pt
const SIZE_SMALL = 20;            // 10pt

// A4 页面尺寸 (DXA: 1440 = 1 inch)
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN_TOP = 1440;     // 2.54cm ≈ 1 inch
const MARGIN_BOTTOM = 1440;
const MARGIN_LEFT = 1800;    // 3.18cm ≈ 1.25 inch
const MARGIN_RIGHT = 1800;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 8306 DXA

// 表格通用边框
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// 工具函数
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 240 },
    children: [new TextRun({ text, font: FONT_HEADING, size: SIZE_H1, bold: true })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 180 },
    children: [new TextRun({ text, font: FONT_HEADING, size: SIZE_H2, bold: true })],
  });
}

function bodyPara(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    indent: { firstLine: 480 }, // 首行缩进2字符
    ...options,
    children: [new TextRun({ text, font: FONT_BODY, size: SIZE_BODY })],
  });
}

function bodyParaNoIndent(text) {
  return bodyPara(text, { indent: { firstLine: 0 } });
}

function emptyPara() {
  return new Paragraph({ spacing: { after: 0 }, children: [] });
}

console.log("脚本骨架就绪，常量和工具函数已定义");
