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

function buildMarketTable() {
  const headers = ["应用", "平台", "离线支持", "价格模型", "主要优势", "主要不足"];
  const data = [
    ["系统备忘录", "iOS", "是", "免费", "深度系统集成、iCloud 同步", "功能有限、不支持 Markdown"],
    ["Notability", "iOS", "是", "付费/订阅", "手写笔记体验优秀", "应用体积大、价格较高"],
    ["GoodNotes", "iOS", "是", "付费", "PDF 标注功能强大", "文本编辑较弱"],
    ["Bear", "iOS/Mac", "部分", "订阅制", "Markdown 支持、界面美观", "免费版功能受限"],
    ["Evernote", "跨平台", "部分", "订阅制", "功能全面、跨平台", "免费版限制多、启动慢"],
  ];

  const colWidths = [1300, 900, 700, 900, 2300, 2300];

  const rows = [headers, ...data].map((row, ri) => {
    const cells = row.map((text, ci) => {
      const isHeader = ri === 0;
      return new TableCell({
        borders: cellBorders,
        width: { size: colWidths[ci], type: WidthType.DXA },
        shading: isHeader ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({
          spacing: { after: 0, line: 280 },
          children: [new TextRun({ text, font: FONT_BODY, size: SIZE_SMALL, bold: isHeader })],
        })],
      });
    });
    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows,
  });
}

function buildChapter1() {
  return [
    heading1("一、项目来源及意义"),

    heading2("1.1 移动互联网与智能手机应用发展概述"),
    bodyPara("随着移动通信技术的飞速发展，智能手机已成为人们日常生活中不可或缺的工具。根据 Statista 统计数据，全球智能手机用户数量持续增长，移动应用市场呈现蓬勃发展态势。iOS 作为全球主流移动操作系统之一，其 App Store 生态系统拥有数以百万计的应用，涵盖了社交、娱乐、办公、教育等各个领域。移动应用已经深刻改变了人们获取信息、沟通交流和完成工作的方式。"),
    bodyPara("在这一背景下，移动应用开发技术成为计算机科学与技术相关专业的重要课程内容。学习移动应用开发不仅需要理解操作系统的基本原理，还需要掌握 UI 框架、数据管理、架构设计等多方面的知识与技能。通过实际项目开发，将理论知识转化为实践能力，是学习移动应用开发最为有效的途径。"),

    heading2("1.2 移动应用开发技术演进"),
    bodyPara("iOS 开发技术栈自 2008 年 iPhone SDK 发布以来，经历了从 Objective-C 到 Swift 的编程语言迁移，从 UIKit 到 SwiftUI 的 UI 框架演进，以及从手动内存管理到 ARC（自动引用计数）的内存管理变革。在架构模式方面，从最初的 MVC（Model-View-Controller）逐步发展出 MVVM（Model-View-ViewModel）、VIPER、Clean Architecture 等多种架构模式，以满足日益复杂的应用开发需求。"),
    bodyPara("尽管 SwiftUI 和 Combine 等现代框架已逐渐成为主流，但 UIKit 凭借其成熟稳定的 API、丰富的第三方生态和大量的存量项目，仍然是 iOS 开发中的重要技术基础。掌握 UIKit 的纯代码布局、Auto Layout 约束系统以及 Core Data 持久化框架，对于理解 iOS 平台的底层机制具有重要意义。本项目选择 UIKit + Core Data 作为技术基础，正是为了深入学习这些核心技术。"),

    heading2("1.3 笔记类应用市场调研"),
    bodyPara("笔记类应用是移动应用市场中一个重要且成熟的品类。从系统自带的备忘录应用到功能丰富的第三方笔记工具，用户面临着多样的选择。为了明确 SwiftNote 的定位和设计方向，我们对市场上几款主流笔记应用进行了调研和对比分析。"),

    buildMarketTable(),

    bodyPara("通过对比分析可以发现，市面上的笔记应用虽然功能丰富，但也存在一些共性问题：部分应用功能过于臃肿，启动速度慢；部分应用依赖云服务，存在数据隐私顾虑；多数应用采用订阅制定价，免费版功能受限较大。这些痛点为 SwiftNote 的设计提供了方向指引。"),

    heading2("1.4 项目选题依据"),
    bodyPara("《移动应用开发技术》课程的期末考核要求学生完成一个功能完整的移动应用项目，综合运用 UI 控件使用、页面导航与数据传递、数据持久化技术、多媒体处理以及项目文档撰写等多方面知识。经过对课程考核要求的系统分析，我们选择了笔记应用作为项目选题，理由如下："),
    bodyPara("第一，笔记应用的功能需求清晰直观，无需过多的领域知识即可理解和设计。第二，笔记应用的技术覆盖面广泛，能够满足课程的考核要求——使用 UITableView/UICollectionView 展示列表数据，使用 UITabBarController 和 UINavigationController 组织页面导航，使用 Core Data 实现数据持久化，使用 UIImagePickerController 处理多媒体，使用 UserDefaults 管理用户偏好。第三，笔记应用具有较高的实用价值，开发完成后可作为日常使用工具。"),

    heading2("1.5 项目定位与目标用户"),
    bodyPara("SwiftNote 定位为一款轻量级、离线可用的个人笔记与任务管理工具。目标用户是需要快速记录信息、注重数据隐私、偏好简洁界面的普通用户。与市面上功能庞杂的笔记应用不同，SwiftNote 追求简洁高效——仅提供笔记创建、编辑、搜索、分类管理和简单个性化设置等核心功能，不依赖网络连接，不收集用户数据，不使用第三方 SDK，确保用户数据的完全本地化和隐私安全。"),
  ];
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
    {
      properties: defaultPageConfig,
      children: [...buildChapter1()],
    },
  ],
});

const outputPath = path.join(__dirname, "..", "《移动应用开发技术》课程期末报告-SwiftNote.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("文档已生成:", outputPath);
});
