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

function buildTechTable() {
  const headers = ["技术领域", "候选方案", "选择", "理由"];
  const data = [
    ["UI 框架", "UIKit / SwiftUI", "UIKit", "iOS 11+ 兼容，SwiftUI 当时未发布"],
    ["布局方式", "Storyboard / 纯代码", "纯代码", "版本控制友好，合并冲突少，布局显式可控"],
    ["数据持久化", "Core Data / Realm / SQLite", "Core Data", "苹果原生支持，无需第三方依赖"],
    ["图片缓存", "NSCache / SDWebImage", "NSCache", "内置 API，零依赖，满足当前需求"],
    ["网络请求", "URLSession / Alamofire", "无需", "应用完全离线运行，无网络请求"],
  ];

  const colWidths = [1500, 2000, 1500, 3306];

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

function buildChapter2() {
  return [
    heading1("二、项目开发平台及技术简要说明"),

    heading2("2.1 硬件与操作系统环境"),
    bodyPara("本项目开发使用的硬件平台为 Mac 计算机，操作系统为 macOS。集成开发环境为 Xcode 9.4.1，该版本支持 Swift 4.0 编程语言，兼容 iOS 11.0 及以上系统版本。Xcode 提供了完整的 iOS 开发工具链，包括 Interface Builder 界面构建器、Core Data 模型编辑器、Instruments 性能分析工具以及 iOS 模拟器等。"),
    bodyPara("项目最低部署目标设定为 iOS 11.0。iOS 11 引入了 Safe Area 安全区域布局指南、改进的导航栏大标题样式等新特性，同时保持着对 iPhone 5s 及以上设备的广泛兼容性。选择 iOS 11.0 作为最低版本要求，能够覆盖绝大多数活跃 iOS 设备，同时可以充分利用系统提供的现代 API。"),

    heading2("2.2 开发语言：Swift 4.0"),
    bodyPara("Swift 是 Apple 于 2014 年发布的现代化编程语言，具有类型安全、内存安全、协议导向等核心特性。Swift 4.0 版本于 2017 年发布，是 Swift 语言发展过程中的重要里程碑版本，引入了 Codable 协议、改进的字符串处理 API、更强大的 KeyPath 等功能。本项目中广泛运用的 Swift 语言特性包括："),
    bodyPara("（1）类型安全与类型推断：Swift 的强类型系统能够在编译期捕获大量类型错误，同时通过类型推断减少冗余的类型声明，使代码简洁而安全。"),
    bodyPara("（2）Optional 可选型：Swift 通过 Optional 类型显式处理值的缺失，配合 if-let、guard-let 等安全解包语法，有效避免了空指针异常。"),
    bodyPara("（3）值类型与引用类型：Swift 中的 struct 和 enum 为值类型，class 为引用类型。本项目中的 NoteModel 使用 struct 定义，保证了数据在传递过程中的不可变性；而 ViewModel 和 Service 使用 class 定义，适合需要共享状态和生命周期管理的场景。"),
    bodyPara("（4）Protocol Extension 协议扩展：Swift 的协议扩展允许为协议提供默认实现，是实现面向协议编程（POP）的核心机制。"),
    bodyPara("（5）Closure 闭包与内存管理：闭包是 Swift 中的一等公民，广泛用于异步回调。本项目在所有闭包中使用 [weak self] 捕获列表，避免循环引用导致的内存泄漏。"),

    heading2("2.3 架构模式：MVVM"),
    bodyPara("MVVM（Model-View-ViewModel）是微软 WPF 团队于 2005 年提出的架构模式，其核心思想是在 View 和 Model 之间引入 ViewModel 中间层，负责将 Model 数据转换为 View 可直接展示的格式，并处理 View 的用户交互逻辑。与传统的 MVC 模式相比，MVVM 通过数据绑定机制实现了 View 与业务逻辑的解耦。"),
    bodyPara("在 iOS 开发中，传统的 MVC 模式常常导致 ViewController 承载过多的职责——既要管理 UI 生命周期，又要处理业务逻辑和数据转换，形成所谓的 Massive ViewController 问题。MVVM 通过将业务逻辑抽离到 ViewModel 中，使 ViewController 仅专注于 UI 的展示和用户交互的传递，从而有效解决了这一问题。"),
    bodyPara("本项目严格遵循 MVVM 架构的五层职责划分：View 层（ViewController + UIView）负责界面展示与用户交互；ViewModel 层负责业务逻辑、数据格式转换和线程调度；Model 层（NoteModel 值类型结构体）作为纯数据结构在 UI 层间传递；Service 层提供数据持久化、图片加载和偏好存取等基础设施服务；Data 层为 Core Data 框架下的 NSManagedObject 原始托管对象。各层之间通过定义良好的接口通信，上层不直接依赖下层的实现细节。"),

    heading2("2.4 核心技术选型与理由"),
    bodyPara("下表列出了项目主要技术选型及其候选方案的对比和选择理由："),
    buildTechTable(),

    heading2("2.5 项目目录结构与文件清单"),
    bodyPara("项目采用按职责分层的目录结构，共包含 17 个 Swift 源文件，总计约 1,129 行代码。各目录和文件的组织方式如下："),
    bodyParaNoIndent("App/ — 应用入口层，包含 AppDelegate.swift（41 行），负责应用启动、窗口创建和全局配置。"),
    bodyParaNoIndent("Models/ — 数据模型层，包含 NoteModel.swift（37 行），定义了笔记的值类型表示和 Core Data 托管对象的映射方法。"),
    bodyParaNoIndent("Services/ — 服务层，包含 CoreDataManager.swift（141 行）、ImageLoader.swift（43 行）和 UserDefaultsManager.swift（49 行），以单例模式提供核心服务。"),
    bodyParaNoIndent("ViewModels/ — 视图模型层，包含 DashboardViewModel.swift（49 行）、NoteListViewModel.swift（74 行）、NoteEditViewModel.swift（111 行）和 SettingsViewModel.swift（91 行），每个 ViewModel 对应一个页面。"),
    bodyParaNoIndent("Views/ — 视图层，按功能模块分为 Dashboard/、NoteList/、NoteEdit/、Settings/ 四个子目录，加上 MainTabBarController.swift（56 行），共 8 个视图文件（493 行）。"),
  ];
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
    {
      properties: defaultPageConfig,
      children: [...buildChapter2()],
    },
  ],
});

const outputPath = path.join(__dirname, "..", "《移动应用开发技术》课程期末报告-SwiftNote.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("文档已生成:", outputPath);
});
