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

// 默认页脚（正文页使用）
const defaultFooter = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "— ", size: SIZE_SMALL }),
      new TextRun({ children: [PageNumber.CURRENT], size: SIZE_SMALL }),
      new TextRun({ text: " —", size: SIZE_SMALL }),
    ],
  })],
});

// 无页脚的页面配置（封面、评分表）
const noFooterPageConfig = {
  page: {
    size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
    margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
  },
};

// 有页脚的页面配置（目录、正文、附录）
const defaultPageConfig = {
  page: {
    size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
    margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
  },
  footers: { default: defaultFooter },
};

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

function buildCover() {
  const children = [];
  // 空行推到中部
  for (let i = 0; i < 6; i++) children.push(emptyPara());

  // 报告标题
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "《移动应用开发技术》", font: FONT_HEADING, size: 44, bold: true })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "课程报告", font: FONT_HEADING, size: 44, bold: true })],
  }));

  // 空行
  for (let i = 0; i < 4; i++) children.push(emptyPara());

  // 项目信息
  const infoLines = [
    "项 目 名 称：SwiftNote（Swift 个人笔记应用）",
    "班       级：__________________",
    "学       号：__________________",
    "项目设计人：__________________",
  ];
  infoLines.forEach(text => {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 400 },
      children: [new TextRun({ text, font: FONT_BODY, size: SIZE_BODY })],
    }));
  });

  // 空行
  for (let i = 0; i < 6; i++) children.push(emptyPara());

  // 学校信息
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "集美大学 计算机工程学院", font: FONT_BODY, size: SIZE_BODY })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "______年______月", font: FONT_BODY, size: SIZE_BODY })],
  }));

  return children;
}

function buildScoringTable() {
  const children = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [new TextRun({ text: "项目评分情况一览表", font: FONT_HEADING, size: SIZE_H1, bold: true })],
  }));

  children.push(bodyParaNoIndent("班级：__________________    学号：__________________    姓名：__________________"));

  children.push(emptyPara());

  // 评分表数据
  const headerRow = ["评分项目", "评分说明", "得分"];
  const rows = [
    headerRow,
    ["1．项目选题", "项目的实用程度及意义", ""],
    [
      "2．项目实现",
      "依照以下内容综合评分：\n① 项目功能设计及实现完整度\n② 控件（基础控件及高级控件）应用及数量\n③ 页面的导航跳转组织及页面间数据信息的传递\n④ 数据持久化技术使用\n⑤ 页面数量、页面布局及表现力",
      "",
    ],
    ["3．项目文档", "项目文档规范程度", ""],
    ["4．项目答辩", "项目答辩时自述及回答问题的情况", ""],
  ];

  const colWidths = [2000, 5006, 1300];

  const tableRows = rows.map((row, ri) => {
    const cells = row.map((text, ci) => {
      const isHeader = ri === 0;
      const textRun = new TextRun({
        text,
        font: FONT_BODY,
        size: SIZE_BODY,
        bold: isHeader,
      });
      return new TableCell({
        borders: cellBorders,
        width: { size: colWidths[ci], type: WidthType.DXA },
        shading: isHeader ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        verticalAlign: "center",
        children: [new Paragraph({ spacing: { after: 0, line: 320 }, children: [textRun] })],
      });
    });
    return new TableRow({ children: cells });
  });

  children.push(new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: tableRows,
  }));

  children.push(emptyPara());

  // 问题记录等
  children.push(bodyParaNoIndent("问题记录：___________________________________________________________________________"));
  children.push(emptyPara());
  children.push(bodyParaNoIndent("总计得分：__________________"));
  children.push(emptyPara());
  children.push(bodyParaNoIndent("总评：_______________________________________________________________________________"));
  children.push(emptyPara());
  children.push(bodyParaNoIndent("评价教师：__________________"));

  return children;
}

// ---- 组装文档 ----
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT_BODY, size: SIZE_BODY } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: SIZE_H1, bold: true, font: FONT_HEADING },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: SIZE_H2, bold: true, font: FONT_HEADING },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: noFooterPageConfig,
      children: [...buildCover()],
    },
    {
      properties: noFooterPageConfig,
      children: [...buildScoringTable()],
    },
    {
      properties: defaultPageConfig,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [new TextRun({ text: "目    录", font: FONT_HEADING, size: SIZE_H1, bold: true })],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "（目录需按小节生成）", font: FONT_BODY, size: SIZE_SMALL, italics: true })],
        }),
        emptyPara(),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-2" }),
      ],
    },
  ],
});

const outputPath = path.join(__dirname, "..", "《移动应用开发技术》课程期末报告-SwiftNote.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("文档已生成:", outputPath);
});
