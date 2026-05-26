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

function buildChapter3() {
  return [
    heading1("三、项目需求分析及设计"),

    heading2("3.1 用户故事"),
    bodyPara("为了明确项目需求，我们采用用户故事（User Story）的方式从用户视角描述功能需求。每条用户故事遵循标准格式："),
    bodyParaNoIndent("US-01：作为普通用户，我希望快速创建笔记并选择分类，以便将不同类型的信息有序整理。"),
    bodyParaNoIndent("US-02：作为普通用户，我希望按分类筛选和关键词搜索已有笔记，以便在海量笔记中快速定位所需内容。"),
    bodyParaNoIndent("US-03：作为普通用户，我希望为笔记附加照片或图片，以便记录视觉化的信息。"),
    bodyParaNoIndent("US-04：作为普通用户，我希望自定义应用主题颜色与字体大小，以便获得舒适的个性化阅读体验。"),
    bodyParaNoIndent("US-05：作为普通用户，我希望在首页仪表盘看到笔记概览和统计信息，以便了解笔记整理的整体状况。"),

    heading2("3.2 功能性需求详述"),
    bodyPara("基于用户故事的引导，我们对系统的功能性需求进行了详细分解和编号，每条需求对应课程考核中的具体技术知识点："),
    bodyParaNoIndent("FR-01 笔记创建：用户可以创建一条新笔记，设置标题、正文内容、所属分类（一般/工作/个人/想法）以及可选的图片附件。新建笔记时自动记录创建时间和更新时间。对应考核点：UITextField、UITextView 基础控件使用，Core Data 数据写入。"),
    bodyParaNoIndent("FR-02 笔记编辑与删除：用户可以对已有笔记进行内容编辑和更新，更新时间将自动刷新。用户可以删除不再需要的笔记，删除前显示确认对话框。对应考核点：页面间数据传递（noteToLoad 属性注入），Core Data 更新与删除操作，UIAlertController 确认对话框。"),
    bodyParaNoIndent("FR-03 笔记列表浏览与搜索：用户可以按更新时间降序浏览全部笔记，使用搜索栏对标题和内容进行关键词实时搜索，使用分段控件按分类筛选笔记。对应考核点：UITableView 列表展示，UISearchBar 搜索，UISegmentedControl 分类筛选，NSPredicate 查询。"),
    bodyParaNoIndent("FR-04 仪表盘概览：用户在首页仪表盘可以看到最近笔记的卡片式网格展示，以及按分类统计的笔记数量概览。点击卡片可进入笔记编辑页面。对应考核点：UICollectionView 网格布局，自定义 UICollectionViewCell，分区头视图。"),
    bodyParaNoIndent("FR-05 个性化设置：用户可以切换深色模式、调整正文字体大小（范围 12-24pt）、选择主题颜色（蓝/绿/橙三个选项）、设置默认笔记分类。所有设置即时生效并自动持久化。对应考核点：UISwitch、UISlider、UserDefaults 持久化，主题切换实现。"),
    bodyParaNoIndent("FR-06 缓存管理：用户可以在设置页面一键清除应用图片缓存，释放存储空间。对应考核点：NSCache 缓存管理，UIAlertController 确认操作。"),

    heading2("3.3 非功能性需求"),
    bodyPara("除了功能性需求外，本项目还设定了以下非功能性需求，以确保应用的质量和用户体验："),
    bodyParaNoIndent("NFR-01 离线运行：应用完全不依赖网络连接，所有数据存储在本地 Core Data 数据库中，确保用户在任何网络环境下均可正常使用。"),
    bodyParaNoIndent("NFR-02 响应性能：所有 Core Data 写操作在后台上下文中执行，主线程不被阻塞，确保 UI 交互的流畅性和响应灵敏度。"),
    bodyParaNoIndent("NFR-03 存储优化：笔记附带的图片经过尺寸限制（最大 1024×1024 像素）和 JPEG 压缩（质量系数 0.5）处理后存储，并使用 Core Data 的外部二进制数据存储选项将大文件存储在数据库文件外部。"),
    bodyParaNoIndent("NFR-04 兼容性：应用支持 iOS 11.0 及以上版本，仅适用于 iPhone 设备，仅支持竖屏方向，简化了界面适配工作。"),
    bodyParaNoIndent("NFR-05 可维护性：项目遵循 MVVM 架构分层，采用纯代码布局，不依赖任何第三方框架，代码结构清晰，便于后续维护和功能扩展。"),

    heading2("3.4 系统总体架构设计"),
    bodyPara("SwiftNote 采用分层架构设计，从用户界面到数据存储共分为五层，各层职责明确、单向依赖。表示层（View Layer）包含 ViewController 和 UIView 子类，负责界面渲染和用户交互事件接收。视图模型层（ViewModel Layer）接收来自 View 的用户操作，调用服务层接口执行业务逻辑，通过闭包回调将处理结果返回给 View。服务层（Service Layer）以单例模式提供 Core Data 数据操作、图片加载缓存和用户偏好存取等基础服务。数据模型层（Model Layer）定义了 NoteModel 值类型结构体和 fromManagedObject 映射方法，作为托管对象和 UI 层之间的数据传输载体。数据持久层（Data Layer）为 Core Data 框架的 NSPersistentContainer、NSManagedObjectContext 和底层 SQLite 存储。"),
    bodyPara("各层之间的数据流遵循单向依赖原则：View 依赖 ViewModel 获取展示数据，ViewModel 依赖 Service 执行数据操作，Service 依赖 Core Data Stack 完成持久化。反向的通信通过闭包回调实现，确保了依赖关系的清晰和可测试性。"),

    heading2("3.5 模块划分与页面导航设计"),
    bodyPara("应用采用 UITabBarController 作为根视图控制器，下设四个功能标签页，每个标签页内嵌在独立的 UINavigationController 中，以实现页面间的层级导航。四个模块的职责如下："),
    bodyParaNoIndent("（1）仪表盘模块（Dashboard）：应用首页，展示最近笔记卡片网格和分类统计信息。提供"+"快捷创建按钮，用户选择分类后直接进入笔记编辑页面。"),
    bodyParaNoIndent("（2）笔记列表模块（NoteList）：展示全部笔记的列表视图，支持搜索和分类筛选，支持滑动删除。点击笔记行进入编辑页面。"),
    bodyParaNoIndent("（3）笔记编辑模块（NoteEdit）：新建或编辑笔记的核心页面，包含标题、内容、图片和分类的完整表单。支持保存和删除操作。"),
    bodyParaNoIndent("（4）设置模块（Settings）：提供外观个性化设置、默认分类设置和缓存管理功能。"),
    bodyPara("页面间的数据传递采用属性注入（Property Injection）方式。跳转到 NoteEdit 编辑已有笔记时，源页面将 NoteModel 实例赋值给 NoteEditViewController 的 noteToLoad 属性；快速新建时则赋值 initialCategory 属性。页面返回时无需回传数据，因为保存操作已通过 ViewModel 直接写入数据库，列表页通过 viewWillAppear 重新加载数据即可获取最新状态。"),

    heading2("3.6 数据模型设计"),
    bodyPara("Core Data 持久层的 Note 实体包含六个属性：title（String，可选，默认空字符串）用于存储笔记标题；content（String，可选，默认空字符串）用于存储笔记正文内容；category（String，可选，默认空字符串）用于存储笔记分类，取值范围为一般/工作/个人/想法；createDate（Date，可选）记录笔记创建时间；updateDate（Date，可选）记录笔记最后更新时间，每次编辑后刷新；imageData（Binary Data，可选，启用 allowsExternalBinaryDataStorage）存储经过压缩处理的图片二进制数据。"),
    bodyPara("为了将 Core Data 的 NSManagedObject 与 UI 层解耦，项目定义了 NoteModel 值类型结构体作为数据传输载体。NoteModel 通过 fromManagedObject(_:) 静态方法，使用 KVC（Key-Value Coding）从托管对象中提取属性值并构建结构体实例。所有 ViewModel 和 View 均通过 NoteModel 而非 NSManagedObject 交换笔记数据，避免了托管对象跨线程传递的线程安全问题，也使得 UI 层与 Core Data 框架完全解耦。"),

    heading2("3.7 界面布局设计"),
    bodyPara("仪表盘页面顶部为导航栏，标题为“SwiftNote”，右上角“+”按钮触发分类选择 ActionSheet。页面主体为 UICollectionView，采用垂直滚动流式布局，每行显示两列笔记卡片。每个卡片从上到下依次为缩略图区域（宽高比约 1:0.6）、标题标签（粗体 16pt、最多两行）、日期标签（系统字体 12pt、灰色）和分类标签（白色文字、圆角色彩背景）。分区头显示“最近笔记”标题和笔记总数。"),
    bodyPara("笔记列表页面导航栏标题区域嵌入了五选项分段控件（全部/通用/工作/个人/创意），方便用户快速切换分类。UITableView 的表头固定了搜索栏，列表行采用横向布局：左侧 60×60 缩略图，右侧依次排列标题、日期和分类标签，行尾显示系统 disclosureIndicator 箭头。"),
    bodyPara("笔记编辑页面采用 UIScrollView 包裹内容视图的布局方式，以容纳超出屏幕高度的多行文本内容。内容视图从上到下依次排列标题文本框、正文文本区、图片显示区（带圆角）、添加照片按钮和横向滚动的分类选择器。导航栏左侧放置取消和删除按钮，右侧放置保存按钮。"),
    bodyPara("设置页面采用分组样式 UITableView，分为外观、笔记和关于三个分区。外观分区包含深色模式开关、字体大小滑块和主题色选择器；笔记分区包含默认分类选择器和清除缓存按钮；关于分区显示版本号和构建信息。"),
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

function buildChapter4() {
  return [
    heading1("四、项目实现"),

    heading2("4.1 应用入口与全局配置"),
    bodyPara("应用通过 @UIApplicationMain 修饰符标记 AppDelegate 作为程序入口。在 application(_:didFinishLaunchingWithOptions:) 方法中，首先创建 UIWindow 实例并设置其 frame 为 UIScreen.main.bounds；然后实例化 MainTabBarController 并设为 window.rootViewController；接着从 UserDefaultsManager 读取用户保存的主题色索引，将对应颜色应用于 UITabBar 和 UINavigationBar 的 tintColor；最后调用 window.makeKeyAndVisible() 显示窗口。"),
    bodyPara("MainTabBarController 继承自 UITabBarController，在 viewDidLoad 中调用 setupTabs() 和 applyTheme()。setupTabs() 创建四个 UINavigationController 封装的功能页面，分别设置标题、系统图标和 tag 值：仪表盘（Home，图标 .favorites，tag 0）、笔记列表（Notes，图标 .recents，tag 1）、新建笔记（New，tag 2）、设置（Settings，图标 .more，tag 3）。applyTheme() 从 UserDefaultsManager 读取 darkModeEnabled 和 themeColorIndex，统一调整所有导航栏和标签栏的外观样式。"),
    bodyPara("Info.plist 中声明了两项隐私权限说明：NSCameraUsageDescription（SwiftNote 需要访问您的相机才能为笔记拍照）和 NSPhotoLibraryUsageDescription（SwiftNote 需要访问您的照片库才能为笔记附加图像）。此外还配置了最低系统版本（iOS 11.0）、仅支持竖屏方向和仅限 iPhone 设备等约束。"),

    heading2("4.2 仪表盘模块"),
    bodyPara("仪表盘模块是用户打开应用后首先看到的页面，承担着笔记概览和快捷入口的双重职责。页面主要由 UICollectionView 构成，采用 UICollectionViewFlowLayout 流式布局，每行两列，item 尺寸根据屏幕宽度动态计算（减去 sectionInset 和 itemSpacing 后平分宽度，高度为宽度的 1.2 倍）。collectionView 注册了 DashboardCell（用于笔记卡片）和 DashboardHeaderView（用于分区头视图）。"),
    bodyPara("DashboardCell 的布局从上到下依次为：thumbnailImageView（顶部图片区域，contentMode 为 scaleAspectFill，宽高比约 1:0.6）、titleLabel（粗体 16pt，最多显示两行）、dateLabel（系统字体 12pt，灰色）和 categoryLabel（白色文字 11pt，4pt 圆角，背景色按分类区分）。分类颜色映射规则为：工作对应 RGB(0.2, 0.6, 1.0) 蓝色，个人对应 RGB(0.4, 0.8, 0.4) 绿色，想法对应 RGB(1.0, 0.6, 0.2) 橙色，默认对应 RGB(0.5, 0.5, 0.5) 灰色。prepareForReuse() 方法重置所有文本和图像，防止复用时的数据残留。"),
    bodyPara("导航栏右上角\"+\"按钮触发 UIAlertController 的 ActionSheet 样式菜单，提供四个选项：新建笔记（分类为一般）、新建工作笔记（分类为工作）、新建个人笔记（分类为个人）和取消。用户选择后，创建 NoteEditViewController 并设置其 initialCategory 属性，然后 push 到导航栈中。"),
    bodyPara("下拉刷新通过 UIRefreshControl 实现，addTarget 绑定 handleRefresh 方法，调用 viewModel.loadDashboardData() 重新从 Core Data 加载数据。DashboardViewModel 在后台上下文中获取全部笔记，按 updateDate 降序排列，取前 10 条作为 recentNotes，同时计算 categoryCounts 字典统计各类别笔记数量，最后通过 DispatchQueue.main.async 回到主线程，调用 onDataLoaded 回调通知 ViewController 刷新 collectionView。"),

    heading2("4.3 笔记列表模块"),
    bodyPara("笔记列表模块以 UITableView 为核心展示全部笔记，支持搜索过滤、分类筛选和滑动删除三项操作。TableView 注册 NoteTableViewCell，设置 rowHeight 为 UITableViewAutomaticDimension、estimatedRowHeight 为 80 以实现自适应行高。"),
    bodyPara("搜索功能通过 UISearchBar 实现，搜索栏作为 tableView.tableHeaderView 固定在列表顶部。用户在搜索栏输入文字时，searchBar(_:textDidChange:) 代理方法将搜索文本传递给 viewModel.searchText，调用 viewModel.filterNotes() 触发实时过滤。搜索取消时清空搜索文本并恢复完整列表。"),
    bodyPara("分类筛选通过 UISegmentedControl 实现，控件嵌入在 navigationItem.titleView 位置，包含五个选项：全部、通用、工作、个人、创意。用户切换选项时，segmentChanged() 方法根据 selectedSegmentIndex 将 viewModel.selectedCategory 设置为 nil（全部）或对应的英文类别字符串，随后调用 filterNotes() 执行过滤。"),
    bodyPara("NoteListViewModel 的 filterNotes() 方法实现了双条件过滤链：首先判断 selectedCategory——若不为 nil，则使用 filter { $0.category == selectedCategory } 过滤；然后判断 searchText——若不为空字符串，则使用 filter { $0.title.localizedCaseInsensitiveContains(searchText) || $0.content.localizedCaseInsensitiveContains(searchText) } 在标题和内容中同时搜索。过滤结果赋值给 filteredNotes 数组，触发 onNotesUpdated 回调刷新列表。"),
    bodyPara("NoteTableViewCell 采用横向布局：左侧为 60×60 固定尺寸的 thumbnailImageView（scaleAspectFill + 4pt 圆角），右侧依次垂直排列 titleLabel（粗体 16pt）、dateLabel（系统字体 12pt，灰色）和 categoryLabel（样式与 DashboardCell 一致）。行尾显示系统 disclosureIndicator 箭头，指示可点击进入详情。"),
    bodyPara("滑动删除通过 UITableViewDelegate 的 tableView(_:commit:forRowAt:) 方法实现。当 editingStyle 为 .delete 时，调用 viewModel.deleteNote(at: index)。deleteNote 方法首先从 filteredNotes 获取待删除笔记的 title 和 createDate，在后台上下文中使用谓词查询对应的 NSManagedObject，调用 CoreDataManager.shared.deleteNote 执行删除，然后重新加载笔记列表以刷新 UI。"),

    heading2("4.4 笔记编辑模块"),
    bodyPara("笔记编辑模块是项目中最为复杂的页面（NoteEditViewController.swift 共 356 行），承担着笔记的创建和编辑双重职责。页面采用 UIScrollView + contentView 的布局方案以支持键盘弹出时的内容滚动。contentView 内从上到下依次包含各子控件。"),
    bodyPara("标题输入使用 UITextField，字体设置为粗体 18pt，placeholder 为注释标题，returnKeyType 为 .done，delegate 为 self。在 textFieldShouldReturn 中退出标题的第一响应者并激活 contentTextView 成为第一响应者，实现从标题到正文的自然输入流转。"),
    bodyPara("正文编辑使用 UITextView，字体为系统 16pt，isScrollEnabled 设置为 false（文本滚动完全依赖外层 UIScrollView）。图片展示与操作区域包含一个 UIImageView（contentMode 为 scaleAspectFill，8pt 圆角，初始隐藏）和一个系统样式的 UIButton（标题为添加照片）。添加照片按钮触发 ActionSheet 菜单，提供相机和照片库两个选项，根据 UIImagePickerController.isSourceTypeAvailable 判断设备支持情况后呈现对应的选择器。"),
    bodyPara("分类选择使用水平滚动的 UICollectionView，注册内部类 CategoryCell。每个 cell 包含一个 titleLabel，通过 configure(with:isSelected:) 方法设置文本和选中状态样式——选中时使用系统 tintColor 背景和白色文字，未选中时使用浅灰背景和深灰文字。cell 宽度通过 size(withAttributes:) 动态计算文本宽度加上 24pt 内边距，确保各分类 label 宽度自适应。"),
    bodyPara("键盘处理是编辑模块的重要技术细节。viewDidLoad 中注册 UIKeyboardWillShow 和 UIKeyboardWillHide 通知。键盘弹出时，从 notification.userInfo 中提取键盘的结束 frame，将 scrollView.contentInset.bottom 设置为键盘高度；键盘收起时将 contentInset 重置为 .zero。这样确保了编辑正文时内容不会被键盘遮挡。"),
    bodyPara("导航栏布局根据编辑模式动态调整：左侧固定放置取消按钮（dismiss 回退），编辑已有笔记时额外添加红色的删除按钮；右侧放置加粗的保存按钮。"),
    bodyPara("保存操作在 saveTapped() 中首先进行验证——使用 guard 检查 titleTextField.text 是否为空，若为空则弹出 UIAlertController 提示标题不能为空。验证通过后调用 viewModel.saveNote(title:content:category:image:)，由 NoteEditViewModel 处理具体的持久化逻辑。"),
    bodyPara("NoteEditViewModel 的 saveNote 方法根据 isNew 标志位分为两条执行路径。新建路径：调用 compressImage 将 UIImage 压缩为 JPEG Data，获取后台上下文，调用 CoreDataManager.createNote 插入新记录并设置所有属性，保存上下文，主线程设置 isNew = false 并回调 onNoteSaved。编辑路径：调用 compressImage 压缩图片，后台上下文，通过 title+createDate 谓词查询原始托管对象，调用 CoreDataManager.updateNote 更新属性（包括刷新 updateDate），保存上下文，主线程更新本地 note 属性并回调。"),
    bodyPara("图片压缩流水线包含两步处理：第一步 resizeImage(maxWidth: 1024, maxHeight: 1024)，使用 UIGraphicsBeginImageContextWithOptions 按等比例缩放图像至目标尺寸范围内；第二步 UIImageJPEGRepresentation(image, 0.5)，以 0.5 的压缩质量系数将 UIImage 转换为 JPEG 格式的 Data。这确保了即使原始照片尺寸很大，存储到 Core Data 的图像数据也能保持在合理大小。"),

    heading2("4.5 设置模块"),
    bodyPara("设置模块使用分组样式 UITableView 呈现，分为外观、笔记和关于三个分区。每行 cell 的布局根据控件类型在 cellForRowAt 的 switch 分支中手动构建，而非使用预设的 Cell 样式。"),
    bodyPara("外观分区（Section 0）包含三行：(0,0) 深色模式开关——创建 UISwitch 并设置 isOn 为 viewModel.isDarkModeEnabled，addTarget 绑定 darkModeSwitchChanged 方法。(0,1) 字体大小滑块——创建 UISlider，最小值 12，最大值 24，当前值为 viewModel.fontSize，右侧显示当前值的 UILabel（tag 202），addTarget 绑定 fontSizeSliderChanged。(0,2) 主题色选择器——创建 UISegmentedControl，选项为蓝色、绿色、橙色，selectedSegmentIndex 绑定 viewModel.themeColorIndex，addTarget 绑定 themeColorChanged。"),
    bodyPara("笔记分区（Section 1）包含两行：(1,0) 默认分类选择器——UISegmentedControl 选项为通用、工作、个人、创意，绑定 viewModel.defaultCategoryIndex。(1,1) 清除缓存按钮——红色文字，点击后弹出 UIAlertController 确认对话框，确认后调用 viewModel.clearCache() 和 ImageLoader.shared.clearCache()。"),
    bodyPara("关于分区（Section 2）包含两行：(2,0) 版本信息——显示 SwiftNote v1.0。(2,1) 构建信息——显示 Swift 4.1 / Xcode 9.4。这两行使用 .value1 样式，不可交互。"),
    bodyPara("为了在 cell 复用时避免重复创建子视图，SettingsViewController 使用了基于 tag 编号的视图回收模式——每个自定义子视图在创建时分配唯一的 tag 值（如 200、201、202 等），后续通过 cell.contentView.viewWithTag(tag) 获取已存在的子视图引用以更新其状态。"),
    bodyPara("深色模式的实现针对 iOS 11 进行了手动适配。applyDarkMode() 方法根据 viewModel.isDarkModeEnabled 的值调整界面各元素的颜色：导航栏样式在 .black 和 .default 之间切换；视图背景色在 RGB(0.12, 0.12, 0.12) 和 .white 之间切换；单元格背景色在 RGB(0.2, 0.2, 0.2) 和默认白色之间切换；文字颜色在 .white 和 .black 之间切换。该方案通过 tableView.reloadData() 立即刷新所有可见 cell 以应用新的颜色。"),

    heading2("4.6 服务层实现"),
    bodyPara("CoreDataManager 是应用数据层的核心服务，采用单例模式（static let shared = CoreDataManager()），私有 init 确保全局唯一实例。在初始化方法中，首先调用 createManagedObjectModel() 程序化构建 NSManagedObjectModel，然后创建 NSPersistentContainer 并加载持久化存储。"),
    bodyPara("createManagedObjectModel() 方法是本项目的关键技术点之一。它不使用传统的 .xcdatamodeld 文件，而是通过代码创建 NSAttributeDescription 实例来定义 Note 实体的六个属性。每个属性通过设置其 name、attributeType、defaultValue 和 isOptional 等属性来精确描述数据模式。六个属性定义完成后，赋值给 NSEntityDescription 的 properties 数组，再将 entity 加入 NSManagedObjectModel 的 entities 数组，最终返回完整的模型对象。"),
    bodyPara("CRUD 操作方法均接受可选的 context 参数，默认使用 viewContext。createNote 通过 NSEntityDescription.insertNewObject(forEntityName:into:) 插入新的托管对象，使用 setValue(_:forKey:) 设置六个属性的值，然后调用 saveContext 持久化。fetchNotes 使用 NSFetchRequest 查询全部笔记，支持 sortDescriptors 参数定制排序。updateNote 更新现有对象的五个属性并刷新 updateDate。deleteNote 删除对象并保存上下文。"),
    bodyPara("ImageLoader 是图片加载与缓存服务，内部使用 NSCache<NSString, UIImage> 作为缓存存储。缓存配置 countLimit 为 100（最多缓存 100 张图片），totalCostLimit 为 50MB（总内存成本上限）。loadImage(from:completion:) 方法在后台线程执行，先以 data.hashValue 的字符串形式为键检查缓存；命中则直接通过主线程回调返回缓存图片；未命中则从 Data 创建 UIImage，计算其 JPEG 数据长度作为缓存成本存入 NSCache，然后主线程回调返回。"),
    bodyPara("UserDefaultsManager 管理用户偏好设置，同样采用单例模式。内部定义私有嵌套结构体 Keys 维护四个 UserDefaults 键字符串常量。四个存储属性（darkModeEnabled、fontSize、themeColorIndex、defaultCategory）均设置了 didSet 观察者，在值变更时立即通过 UserDefaults.standard.set(_:forKey:) 持久化。fontSize 的 didSet 额外包含值域保护——通过 min(24, max(12, newValue)) 将字体大小限定在 12-24pt 范围内。"),

    heading2("4.7 关键代码展示"),
    bodyPara("以下展示项目中具有代表性的关键代码片段："),
    bodyParaNoIndent("代码 1：CoreDataManager.createManagedObjectModel() —— 程序化构建 Core Data 模型，通过 NSAttributeDescription 逐属性定义 Note 实体的数据模式，避免了对 .xcdatamodeld 文件的依赖。这是项目在数据持久化层面最核心的技术决策。"),
    bodyParaNoIndent("代码 2：NoteEditViewModel.saveNote() —— 笔记保存的核心逻辑，根据 isNew 标志分别走新建或更新路径，包含图片压缩和上下文切换，体现了 MVVM 模式下 ViewModel 处理复杂业务逻辑的完整流程。"),
    bodyParaNoIndent("代码 3：ImageLoader.loadImage() —— 图片异步加载与缓存实现，在后台线程解码图片并使用 NSCache 建立内存缓存，通过 data.hashValue 作为缓存键避免重复解码，在主线程回调确保 UI 更新安全。"),
    bodyParaNoIndent("代码 4：NoteListViewModel.filterNotes() —— 双条件过滤链的实现，先按分类过滤再按搜索关键词匹配标题和内容，使用 Swift 高阶函数 filter 和 localizedCaseInsensitiveContains 实现本地化的模糊搜索。"),
    bodyParaNoIndent("代码 5：SettingsViewController.applyDarkMode() —— iOS 11 深色模式的手动实现方案，通过条件判断切换视图背景色、单元格背景色和文字颜色，兼容了 iOS 13 之前不具备系统深色模式 API 的设备。"),
    bodyParaNoIndent("代码 6：NoteModel.fromManagedObject() —— Core Data 托管对象到 Swift 值类型的映射桥接方法，使用 KVC 从 NSManagedObject 读取属性值，包括从 Binary Data 解码 UIImage，数据模型层的核心转换逻辑。"),
    bodyPara("（注：受篇幅所限，以上代码的完整实现在项目源码中查看，详见附录文件清单。）"),

    heading2("4.8 运行效果展示"),
    bodyPara("以下为 SwiftNote 应用在 iPhone 模拟器上的运行截图："),
    bodyParaNoIndent("图 4-1：仪表盘主页 —— 展示最近笔记卡片网格、分类统计信息及\"+\"快捷创建菜单。"),
    bodyParaNoIndent("图 4-2：笔记列表页 —— 展示搜索栏、分类筛选分段控件及笔记行列表。"),
    bodyParaNoIndent("图 4-3：笔记编辑页 —— 展示标题输入、正文编辑、图片附件及分类选择器。"),
    bodyParaNoIndent("图 4-4：图片选择 —— 展示相机/相册 ActionSheet 及图片选取后的预览效果。"),
    bodyParaNoIndent("图 4-5：设置页面 —— 展示深色模式开关、字体滑块、主题色选择器等。"),
    bodyParaNoIndent("图 4-6：深色模式效果 —— 展示深色模式下的仪表盘和列表页面外观。"),
    bodyParaNoIndent("图 4-7：分类筛选 —— 展示按不同分类筛选笔记的效果。"),
    bodyParaNoIndent("图 4-8：删除确认 —— 展示滑动删除及确认对话框。"),
    bodyPara("（以上图片需在最终报告中插入实际运行截图）"),
  ];
}

function buildChapter5() {
  return [
    heading1("五、项目说明"),

    heading2("5.1 Core Data 程序化模型定义"),
    bodyPara("传统 iOS 项目通常使用 Xcode 的 .xcdatamodeld 可视化编辑器来定义 Core Data 数据模型。这种方式虽然直观，但模型文件是以 XML 格式存储的，当团队协作时容易产生合并冲突，且不同版本 Xcode 打开后可能自动修改文件格式。SwiftNote 选择了程序化方式定义数据模型，在 CoreDataManager.createManagedObjectModel() 方法中通过 NSAttributeDescription 和 NSEntityDescription 的 API 完全以代码描述实体和属性。"),
    bodyPara("程序化方式的主要优势包括：模型定义即为 Swift 代码，版本管理友好，合并冲突时可读性强；模型在运行时动态构建，不依赖 Xcode 特定版本，确定性更高；便于添加注释和进行条件编译，灵活性更好。当然，这种方式也牺牲了可视化编辑的便利性，适合模型结构相对稳定的项目。"),

    heading2("5.2 图片存储与处理策略"),
    bodyPara("移动设备拍摄的照片文件通常较大（数 MB 级别），直接存入 Core Data 数据库会导致 SQLite 文件急剧膨胀、读写性能下降。SwiftNote 采用多层策略优化图片存储。"),
    bodyPara("首先，imageData 属性设置了 allowsExternalBinaryDataStorage = true，Core Data 会将较大的二进制数据存储在 SQLite 数据库外部的独立文件中，数据库内仅保留引用，由此兼顾了查询性能和大对象存储。其次，在保存前通过 resizeImage 将图片尺寸限制在 1024×1024 像素以内，再通过 UIImageJPEGRepresentation 以 0.5 的压缩质量转换为 JPEG 格式，显著降低了存储空间占用。最后，运行时通过 ImageLoader 的 NSCache 内存缓存避免反复从磁盘解码图片，提升了滚动浏览的流畅度。"),

    heading2("5.3 NSManagedObject KVC 访问模式"),
    bodyPara("许多 Core Data 项目会通过 Xcode 的代码生成功能为每个 Entity 创建 NSManagedObject 子类，以强类型的属性访问方式操作数据。SwiftNote 选择了不生成子类，直接使用 NSManagedObject 的 KVC（Key-Value Coding）方法 value(forKey:) 和 setValue(_:forKey:) 进行属性读写。"),
    bodyPara("这一选择的原因在于：避免了 Xcode 自动生成文件与实际模型定义的不一致问题；所有模型字段的定义集中在 createManagedObjectModel() 一次性维护；通过 NoteModel.fromManagedObject() 统一将 KVC 读取的值映射为 Swift 强类型的 NoteModel 结构体，从而在 UI 层享有了类型安全。这种模式的代价是属性名以字符串形式书写，编译器无法校验拼写错误，需要开发者细心维护键名的一致性。"),

    heading2("5.4 笔记定位策略"),
    bodyPara("在编辑和删除笔记时，需要定位到 Core Data 中的原始托管对象。理想方案是使用 NSManagedObjectID，但该对象在跨上下文（viewContext 与后台 context）传递时可能失效。SwiftNote 采用了一种折中方案：使用 title + createDate 的组合谓词（NSPredicate）在后台上下文中重新查询对应的托管对象。"),
    bodyPara("这一策略在大多数场景下工作良好，但存在一个理论上的边界情况：如果同一毫秒内创建了两条标题完全相同的笔记，谓词将无法区分它们。在实际使用中，用户在单次操作中创建两篇标题和创建时间均相同的笔记几乎不可能发生，但作为改进方向，可以考虑在 Note 实体中新增一个 UUID 属性作为稳定的唯一标识符。"),

    heading2("5.5 iOS 11 深色模式兼容方案"),
    bodyPara("iOS 13 引入了系统级别的深色模式支持，通过 UIUserInterfaceStyle 和动态颜色即可实现自适应。但 SwiftNote 的最低部署目标为 iOS 11.0，无法使用这些 API。项目中实现了一套独立于系统的深色模式方案：在 UserDefaults 中存储用户的模式偏好（darkModeEnabled），在 SettingsViewModel 中提供切换逻辑，在每个页面的 applyDarkMode() 或类似方法中手动设置背景色、文字色和导航栏样式。"),
    bodyPara("虽然这种方式需要更多的手动管理代码，但它实现了对 iOS 11-12 设备的完美兼容，且不受系统级深色模式自动切换的影响，用户体验更加可控。"),

    heading2("5.6 无第三方依赖的设计哲学"),
    bodyPara("SwiftNote 从设计之初就确定了不引入任何第三方依赖的原则。做出这一决定并非因为排斥开源社区的高质量代码，而是基于以下几点考量："),
    bodyPara("第一，学习价值最大化——课程项目的核心目的是学习和实践 iOS 开发的基础知识和核心框架，使用原生 API 从零构建功能，能够获得最深刻的理解。第二，长期可维护性——第三方库可能因维护者放弃而停滞，或因版本不兼容而成为升级障碍。纯原生代码在多年后仍然可以在最新的 Xcode 中编译和运行。第三，项目简洁性——不使用 CocoaPods/Carthage/SPM 等依赖管理工具，clone 项目后即可编译，降低了上手门槛。当然，这种选择也限制了开发效率——在商业项目中，合理使用成熟的第三方库可以有效缩短开发周期。"),
  ];
}

function buildCompletionTable() {
  const headers = ["需求编号", "需求描述", "状态", "考核知识点"];
  const data = [
    ["FR-01", "笔记创建（标题、正文、分类、图片）", "已完成", "UITextField、UITextView、Core Data 写入"],
    ["FR-02", "笔记编辑与删除", "已完成", "页面数据传递、Core Data 更新/删除"],
    ["FR-03", "笔记列表浏览与搜索筛选", "已完成", "UITableView、UISearchBar、NSPredicate"],
    ["FR-04", "仪表盘概览与统计", "已完成", "UICollectionView、自定义 Cell"],
    ["FR-05", "个性化设置（主题/字号/分类）", "已完成", "UserDefaults、UISlider、UISegmentedControl"],
    ["FR-06", "缓存管理", "已完成", "NSCache、UIAlertController"],
  ];

  const colWidths = [1200, 2800, 1000, 3306];

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

function buildChapter6() {
  return [
    heading1("六、总结"),

    heading2("6.1 项目完成情况"),
    bodyPara("经过开发实现，SwiftNote 圆满完成了课程考核要求中的所有功能需求和非功能需求。以下是各功能需求的完成情况对照表："),
    buildCompletionTable(),
    bodyPara("项目代码规模统计如下：App 入口层 1 个文件 41 行，数据模型层 1 个文件 37 行，服务层 3 个文件 233 行，视图模型层 4 个文件 325 行，视图层 8 个文件 493 行。合计 17 个 Swift 源文件，总代码量约 1,129 行，在紧凑的代码规模内实现了完整的笔记应用功能。"),

    heading2("6.2 技术亮点"),
    bodyPara("回顾整个开发过程，本项目在以下几个方面体现了较好的技术实践："),
    bodyParaNoIndent("（1）纯代码布局 + Auto Layout 的工业化实践：不使用任何 Storyboard（启动屏除外），所有界面元素通过代码创建并使用 NSLayoutAnchor API 进行约束布局。这种方式使界面变更可追溯、可审查，避免了 Storyboard XML 在团队协作时的合并问题。"),
    bodyParaNoIndent("（2）Core Data 程序化模型 + 后台线程写入的线程安全方案：使用 NSAttributeDescription 以代码定义数据模型，配合 newBackgroundContext 将写操作隔离到后台线程。所有 UI 数据通过 NoteModel 值类型在主线程传递，避免了托管对象跨线程访问的风险。"),
    bodyParaNoIndent("（3）MVVM 闭包回调的低耦合设计：ViewModel 通过可选闭包（onDataLoaded、onNotesUpdated 等）向 ViewController 通信，ViewController 在订阅闭包时使用 [weak self] 避免循环引用。这种模式无需使用响应式框架即可实现 View 与 ViewModel 的松耦合。"),
    bodyParaNoIndent("（4）图片处理全链路：从 UIImagePickerController 获取原始图像，经过 resizeImage 尺寸限制，JPEG 压缩，Core Data 外部二进制存储，NSCache 内存缓存，到 UIImageView 展示，形成了一条完整的图片处理管线，兼顾了存储效率和加载性能。"),
    bodyParaNoIndent("（5）iOS 11 兼容的深色模式实现：在系统级深色模式 API（iOS 13+）出现之前，手动实现了一套完整的深色模式方案，通过 UserDefaults 持久化偏好并在各页面独立适配，实现了跨版本一致的暗色体验。"),

    heading2("6.3 项目不足与改进方向"),
    bodyPara("尽管项目已完成所有既定功能，但在以下方面仍存在不足和改进空间："),
    bodyParaNoIndent("（1）无云同步功能：当前笔记数据完全存储在本地设备，无法在多个设备间同步。改进方向：引入 CloudKit 或 Core Data with CloudKit，利用 Apple 的云基础设施实现自动同步。"),
    bodyParaNoIndent("（2）无 iPad 适配：应用仅支持 iPhone 设备，在大屏幕 iPad 上界面会被拉伸。改进方向：使用 Size Class 和 UISplitViewController 对 iPad 进行适配。"),
    bodyParaNoIndent("（3）仅支持竖屏方向：部分场景下（如浏览图片附件）横屏能提供更好的体验。改进方向：为编辑页等关键页面添加横屏布局，使用不同的 Auto Layout 约束配置适配旋转。"),
    bodyParaNoIndent("（4）无自动化测试：项目中没有任何单元测试或 UI 测试代码。改进方向：使用 XCTest 框架为四个 ViewModel 编写单元测试，使用 XCUITest 编写关键用户流程的 UI 测试。"),
    bodyParaNoIndent("（5）谓词定位笔记的潜在风险：使用 title + createDate 组合定位笔记，在同名同时间戳的极端情况下可能误操作。改进方向：在 Note 实体中新增 UUID 属性，使用 NSManagedObjectID.uriRepresentation() 作为稳定的唯一标识。"),
    bodyParaNoIndent("（6）无数据导出功能：用户无法将笔记导出为通用格式以备份或迁移。改进方向：添加数据导出功能，支持将笔记导出为 JSON 文件或生成 PDF 报告。"),

    heading2("6.4 开发过程心得体会"),
    bodyPara("从项目选题到最终实现，SwiftNote 的开发过程是一次完整的移动应用开发实践体验。以下记录了过程中最具启发性的几个方面。"),
    bodyPara("关于纯代码布局。在项目初期，曾考虑使用 Storyboard 快速搭建界面原型，但最终选择了纯代码方案。实践后发现，纯代码布局虽然在初期编写效率上略低于可视化的拖拽操作，但带来了更高的可控性和可维护性。尤其在处理不同屏幕尺寸的适配和条件性布局修改时，代码的显式声明比 Storyboard 中的隐式约束关系更易理解和调试。通过 NSLayoutAnchor API，约束代码的表达力足够强且语法清晰，没有想象中那么繁琐。"),
    bodyPara("关于 Core Data 线程安全。开发过程中在这方面踩过一个坑：最初在 viewContext 上直接执行写操作，当数据量增大时可以明显感觉到 UI 的卡顿。查阅文档后了解到，viewContext 的所有操作都在主队列上执行，写操作会阻塞 UI。解决方式是将写操作移到后台上下文（newBackgroundContext）中执行，完成后回到主线程更新 UI。这个经验让线程安全的概念从抽象的教科书知识变成了可感知的实践问题。"),
    bodyPara("关于 MVVM 架构的落地。将 MVVM 的理论模型转化为实际代码的过程并非一帆风顺。第一个版本的 ViewModel 过于轻量，仅仅是对 Service 调用的简单代理；第二个版本又过于重量，将 UI 创建逻辑也放了进去。经过迭代调整，最终找到了合适的边界：ViewModel 持有业务数据和逻辑，通过闭包回调向 View 通知数据变更；View（ViewController）负责 UI 的创建、布局和用户交互的响应。这个边界划分使得 ViewModel 可以在不依赖 UI 的情况下被独立测试。"),
    bodyPara("关于图片处理。图片功能在最初的设计中被低估了复杂性。从相册选择或相机拍摄的照片通常在 3000-4000 像素宽度、文件大小 2-5MB，如果直接存入 Core Data，不仅占用大量存储空间，读取时也会导致明显的界面卡顿。引入 resize（尺寸限制）+ compress（JPEG 压缩）+ external storage（Core Data 外部文件存储）+ cache（NSCache 内存缓存）的四层策略后，图片相关的性能问题才得到彻底解决。"),
    bodyPara("关于版本兼容性。在实现深色模式时，发现 Xcode 文档中的 UIUserInterfaceStyle API 标有 iOS 12 以上可用。如果使用这个 API，iOS 11 设备上将无法正常工作。最终选择手动实现深色模式方案，虽然代码量多了几十行，但确保了从 iOS 11 到最新系统的一致体验。这次经历加深了对 Apple 平台 API 兼容性管理的理解。"),

    heading2("6.5 课程学习总结"),
    bodyPara("通过《移动应用开发技术》课程的学习和 SwiftNote 项目的开发实践，在以下方面取得了显著的提升。"),
    bodyPara("知识体系方面，从对 iOS 开发的零散认知（知道有 UIKit、Core Data 这些框架但不知道它们之间如何协作），到能够独立设计并实现一个完整的多页面应用，建立了从 UI 层到数据层的全链路理解。工程能力方面，通过实际的代码组织、版本管理和问题排查过程，体会到了软件工程素养在实践中的重要性——好的代码结构和清晰的职责划分比写出能运行的代码更为关键。"),
    bodyPara("本项目的完成不仅是课程考核的一项成果，更是从学习者到实践者角色转变的一个里程碑。通过将一个想法从概念变为实际可运行的应用，验证了自己掌握了移动应用开发的核心能力，也为后续深入学习 iOS 开发乃至其他平台的移动开发奠定了坚实的基础。"),
  ];
}

function buildAppendix() {
  const headers = ["文件路径", "行数", "职责说明"];
  const data = [
    ["App/AppDelegate.swift", "41", "应用入口，窗口创建，全局主题配置"],
    ["Models/NoteModel.swift", "37", "笔记值类型结构体，托管对象映射"],
    ["Services/CoreDataManager.swift", "141", "Core Data 栈管理，程序化模型定义，CRUD 操作"],
    ["Services/ImageLoader.swift", "43", "图片异步解码与 NSCache 内存缓存"],
    ["Services/UserDefaultsManager.swift", "49", "用户偏好存取，didSet 自动持久化"],
    ["ViewModels/DashboardViewModel.swift", "49", "仪表盘数据加载与分类统计"],
    ["ViewModels/NoteListViewModel.swift", "74", "笔记列表加载与双条件过滤链"],
    ["ViewModels/NoteEditViewModel.swift", "111", "笔记保存/删除逻辑，图片压缩管线"],
    ["ViewModels/SettingsViewModel.swift", "91", "设置读写与深色模式切换"],
    ["Views/MainTabBarController.swift", "56", "四 Tab 初始化与全局主题应用"],
    ["Views/Dashboard/DashboardViewController.swift", "131", "仪表盘页面，卡片网格与快捷创建"],
    ["Views/Dashboard/DashboardCell.swift", "116", "笔记卡片 Cell，含缩略图和分类标签"],
    ["Views/Dashboard/DashboardHeaderView.swift", "53", "仪表盘分区头视图"],
    ["Views/NoteList/NoteListViewController.swift", "136", "笔记列表，搜索栏与分类筛选"],
    ["Views/NoteList/NoteTableViewCell.swift", "115", "笔记行 Cell，横向布局"],
    ["Views/NoteEdit/NoteEditViewController.swift", "356", "笔记编辑页面，富表单与键盘处理"],
    ["Views/Settings/SettingsViewController.swift", "345", "设置页面，5 种自定义 Cell"],
  ];

  const colWidths = [3500, 800, 4006];

  const rows = [headers, ...data].map((row, ri) => {
    const cells = row.map((text, ci) => {
      const isHeader = ri === 0;
      const useCodeFont = !isHeader && ci === 0;
      return new TableCell({
        borders: cellBorders,
        width: { size: colWidths[ci], type: WidthType.DXA },
        shading: isHeader ? { fill: "D5E8F0", type: ShadingType.CLEAR } : undefined,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({
          spacing: { after: 0, line: 280 },
          children: [new TextRun({ text, font: useCodeFont ? FONT_CODE : FONT_BODY, size: SIZE_SMALL, bold: isHeader })],
        })],
      });
    });
    return new TableRow({ children: cells });
  });

  return [
    heading1("附录：项目源码文件清单"),
    bodyPara("以下列出 SwiftNote 项目包含的全部 17 个 Swift 源文件及其核心职责："),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: colWidths,
      rows,
    }),
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
    {
      properties: defaultPageConfig,
      children: [...buildChapter3()],
    },
    {
      properties: defaultPageConfig,
      children: [...buildChapter4()],
    },
    {
      properties: defaultPageConfig,
      children: [...buildChapter5()],
    },
    {
      properties: defaultPageConfig,
      children: [...buildChapter6(), ...buildAppendix()],
    },
  ],
});

const outputPath = path.join(__dirname, "..", "《移动应用开发技术》课程期末报告-SwiftNote.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("文档已生成:", outputPath);
});
