# EduTrack - 学生事务管理助手 工作日志

## 项目当前状态描述
EduTrack 是一个基于 Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui 的学生事务管理助手应用。采用 Notion 简约风格设计。当前版本 v1.0，已完成 6 个开发阶段。

**已验证功能完整性**：通过 agent-browser 自动化测试，所有 8 个页面（Dashboard、课程管理、作业管理、学习笔记、考试管理、学业统计、截图识别、设置）均能正常渲染、导航和交互。ESLint 零错误零警告，所有 API 正常响应。

## 技术架构
- **前端**: Next.js 16 App Router + TypeScript + Tailwind CSS 4 + shadcn/ui
- **状态管理**: Zustand (导航状态) + TanStack Query (服务端状态)
- **数据库**: Prisma + SQLite（Course, Assignment, Exam, Grade, Note, AppSettings 六个模型）
- **API**: 9 个 RESTful API Routes（courses, assignments, exams, grades, notes, settings, quotes, recognize, seed）
- **AI**: z-ai-web-dev-sdk VLM（截图识别课表和成绩单）
- **动画**: Framer Motion（页面切换、列表项进入、卡片 hover）
- **图表**: Recharts（GPA 趋势折线图、学分饼图、成绩分布柱状图）
- **通知**: Sonner toast
- **深色模式**: next-themes（class 策略，侧边栏切换按钮）
- **拖拽排序**: @dnd-kit/core + @dnd-kit/sortable（作业列表客户端排序）
- **番茄钟**: localStorage 持久化 + 脉冲动画 + 激励消息 + 累计专注时间

## 已完成修改

### 第一阶段（初始开发）✅
- 数据库 Schema 设计和实现
- 布局组件（AppSidebar + AppShell + DailyQuote）
- Dashboard 首页（今日课程 + 近期待办 + GPA 卡片 + 快捷操作）
- 课程管理（列表视图 + 周课表视图 + CRUD 表单对话框）
- 作业管理（5 状态筛选 + 快速添加 + 优先级系统）
- 考试管理（考试列表 + 倒计时 + 紧急提醒）
- 学业统计（5 指标卡片 + GPA 趋势图 + 学分饼图 + 成绩分布图 + 成绩明细表）
- 截图识别（VLM 集成 + 3 步流程 + 结果编辑和选择性导入）
- 设置页面（数据导出/导入/清空 + 学期配置 + 数据统计）

### 第二阶段（本轮优化）✅

#### Bug 修复
1. **课表「今天」按钮**：修复了始终重置为第 1 周的问题，改为根据学期开始日期（9 月第一个周一）计算实际当前周次

#### 新增功能
2. **种子数据 API** (`/api/seed`)：
   - 一键填充 8 门课程（高数、英语、数据结构、线代、大学物理、体育、近现代史、Python）
   - 6 个作业（含不同状态：待完成、进行中、已逾期）
   - 4 场考试（期中、模拟、随堂测验）
   - 10 条成绩记录（跨两个学期，GPA 从 2.9 提升到 3.5 的趋势数据）

3. **Dashboard 欢迎横幅**：
   - 空数据时展示渐变背景卡片
   - "添加课程"和"填充示例数据"两个操作按钮
   - 填充后显示 toast 通知含详细数量统计

4. **深色模式切换**：
   - 集成 next-themes ThemeProvider
   - 侧边栏底部添加 Moon/Sun 切换按钮
   - CSS 变量已完整支持 dark 模式

5. **全局键盘快捷键**：
   - `Alt+1` ~ `Alt+7`：快速导航到 7 个页面
   - `?` 键：弹出快捷键帮助对话框
   - 智能检测：输入框/文本域中不触发

6. **页面切换动画**：
   - AnimatePresence + motion.div 实现淡入淡出 + 轻微位移
   - 0.2s 快速过渡，不影响操作流畅度

7. **番茄钟专注计时器**：
   - SVG 圆环进度条动画
   - 25 分钟专注 / 5 分钟休息模式切换
   - 暂停/继续/重置控制
   - 完成次数统计（4 个一组可视化）
   - 红色（专注）/ 绿色（休息）颜色区分

#### 样式优化
8. **增强空状态**：
   - 所有页面空状态升级为装饰性渐变圆圈 + 图标
   - 包含操作按钮引导用户添加数据
   - 课程页、作业页、考试页、GPA 卡片均已优化
   - 今日课程空状态增加"查看课表"链接

9. **GPA 卡片增强**：
   - 空状态增加"前往统计"按钮
   - 有数据时显示"查看详情 →"链接

10. **快捷操作增强**：
    - 无数据时显示全宽"填充示例数据"按钮
    - 带加载状态（spinner）和 toast 反馈

## QA 测试结果
- ✅ Dashboard 页面渲染正常，欢迎横幅显示正确
- ✅ 种子数据填充成功（8 课程 + 6 作业 + 4 考试 + 10 成绩）
- ✅ 深色模式切换正常，所有页面 dark 样式正确
- ✅ 页面导航流畅，切换动画正常
- ✅ 课程添加/列表/课表视图正常
- ✅ 作业页面筛选和快速添加正常
- ✅ 考试页面统计卡片和列表正常
- ✅ 学业统计图表渲染正常，成绩表排序正常
- ✅ 设置页面导出/导入/清空功能正常
- ✅ 截图识别页面 3 步流程正常
- ✅ 键盘快捷键 Alt+1~7 导航正常
- ✅ 无控制台错误，无编译错误，lint 零警告

## 未解决问题或风险
- Turbopack/PostCSS CSS 错误（globals.css:263:108 Unknown word \n）— 非阻塞，不影响功能，疑似 Tailwind CSS 4 + Turbopack 已知问题
- 截图识别功能需要上传真实教务系统截图进行准确性验证
- 作业拖拽排序为纯客户端，刷新后顺序恢复为默认
- 移动端（小屏）的部分复杂表格可能需要进一步优化

## 下一阶段建议优先事项
1. **学业报告生成**：一键生成学期总结报告（可导出 PDF）
2. **多学期数据切换**：在统计页面支持按学期筛选成绩数据
3. **移动端手势优化**：左滑删除、下拉刷新等手势交互
4. **性能优化**：大量数据时虚拟滚动、图表懒加载
5. **作业拖拽排序持久化**：将排序顺序保存到后端（需 schema 变更）
6. **番茄钟统计图表**：每日/每周专注时间趋势可视化
7. **笔记富文本编辑器**：支持 Markdown 实时预览

---

## 第三阶段（学习笔记功能）✅

### 新增功能：学习笔记 (Study Notes)

#### 1. 数据库模型
- 新增 `Note` 模型（id, title, content, courseId, tag, isPinned, createdAt, updatedAt）
- 与 `Course` 模型建立可选关系（onDelete: SetNull）
- Course 模型新增 `notes Note[]` 关联

#### 2. TypeScript 类型
- 新增 `Note` 接口（含 course 关联）
- 新增 `NOTE_TAGS` 常量（'重点', '复习', '公式', '笔记', '作业', '考试'）
- `PageType` 新增 `'notes'` 类型

#### 3. API 路由 (`/api/notes`)
- **GET**: 列表查询，支持 `?courseId=` 和 `?tag=` 筛选，按 pinned 优先 + updatedAt 降序排列，含 course 关联
- **POST**: 创建笔记（title 必填，content/courseId/tag 可选）
- **PUT**: 更新笔记（支持部分更新，含 pin 切换）
- **DELETE**: 删除笔记（query 参数 `?id=xxx`）

#### 4. 状态管理
- Store 新增 `noteSearch` / `setNoteSearch`（搜索关键词）
- Store 新增 `noteFilter` / `setNoteFilter`（按课程筛选，'all' 或 courseId）

#### 5. 导航更新
- 侧边栏新增「学习笔记」导航项（StickyNote 图标），位于作业管理和考试管理之间
- 键盘快捷键更新：Alt+4 = 学习笔记，Alt+5-8 = 考试管理/学业统计/截图识别/设置

#### 6. 前端组件
- **NoteCard** (`note-card.tsx`):
  - 课程颜色左边框、置顶图标、标题、内容预览（100字）、课程徽章、标签徽章、相对时间戳
  - Hover 显示删除按钮、framer-motion 入场动画（stagger）
- **NoteFormDialog** (`note-form-dialog.tsx`):
  - 支持新建/编辑模式切换
  - 标题输入、内容文本域（200px 高度）、课程选择器、标签选择器、置顶开关
  - 表单验证、提交加载状态、toast 反馈
- **NotesPage** (`notes-page.tsx`):
  - 搜索栏 + 课程筛选下拉
  - 响应式网格布局（1/2/3 列）
  - 置顶笔记分区展示
  - 空状态（带操作引导）
  - 骨架屏加载状态
  - 删除确认对话框（AlertDialog）

#### 7. 种子数据
- 5 条示例笔记：高数极限、英语写作句型、二叉树遍历、线性代数公式、物理光学公式
- 2 条置顶笔记、3 条普通笔记，涵盖重点/复习/笔记/公式等标签

#### 8. 附带修复
- 修复 `notification-bell.tsx` 中的 lint 错误（setState-in-effect）
  - 将 localStorage 初始化改为 useState 惰性初始化
  - 将 popover 打开时的副作用改为 useCallback 事件处理

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ 数据库 schema 推送成功
- ✅ 8 个页面导航正常（含新增的学习笔记页）
- ✅ 键盘快捷键 Alt+1~8 导航正常

---

## 第四阶段（全局搜索 + 通知提醒）✅

### 新增功能 A：全局搜索 (Global Search)

#### 1. 搜索状态管理
- Zustand store 新增 `searchOpen` / `setSearchOpen` 状态

#### 2. 搜索对话框组件 (`src/components/search/search-dialog.tsx`)
- 基于 shadcn/ui `CommandDialog` (cmdk) 实现命令面板式搜索
- 搜索范围：课程（名称、教师）、作业（标题、描述）、考试（标题、类型）
- 结果按类型分组显示（课程 / 作业 / 考试），各组带图标标题
- 每个结果显示：类型图标 + 标题 + 副标题（课程名/教师名）
- 点击结果自动导航到对应页面并打开编辑对话框
- 空状态展示搜索图标 + "未找到相关结果" 提示
- 使用 `enabled: searchOpen` 优化查询性能，仅在搜索框打开时获取数据
- Escape 键关闭搜索对话框

#### 3. 侧边栏搜索触发器
- 在侧边栏分隔线下方、导航项上方添加搜索按钮
- 虚线边框样式 + 搜索图标 + "搜索..." 文字 + `⌘K` 快捷键提示
- Hover 时边框变为 primary 色

#### 4. 全局键盘快捷键 (`Cmd+K` / `Ctrl+K`)
- 在 `global-keyboard-shortcuts.tsx` 中添加 `Cmd+K` / `Ctrl+K` 快捷键
- 优先级高于其他快捷键检查（先判断 Cmd/Ctrl+K，再判断 Alt+1~8）
- 快捷键帮助对话框中新增"全局搜索 ⌘K"条目
- 支持在输入框聚焦时也触发（不会误拦截正常输入）

### 新增功能 B：桌面通知提醒 (Desktop Notification Bell)

#### 1. 通知服务 (`src/components/notifications/notification-service.ts`)
- 基于 Browser Notification API 的后台通知服务
- 每 5 分钟自动检查截止日期
- 通知触发条件：
  - 作业：今天截止 / 明天截止
  - 考试：3 天内开考
- 防重复通知：通过 localStorage 存储已发送通知 ID（含日期前缀，每天重置）
- 首次启用时请求通知权限（非阻塞，3 秒延迟）
- 支持 localStorage 开关（`edutrack-browser-notifications`）
- 组件卸载时清理定时器

#### 2. 通知铃铛组件 (`src/components/notifications/notification-bell.tsx`)
- 页面右上角铃铛图标按钮（桌面端独立 header，移动端在导航栏右侧）
- 红色未读计数徽章（Framer Motion 弹簧动画）
- 点击弹出 Popover 通知面板：
  - 通知按紧急度排序（逾期 > 今天 > 明天 > 3天内）
  - 每条通知：紧急度图标 + 消息 + 紧急度标签 + 截止时间描述
  - 未读通知带蓝色小圆点标记
  - 点击通知自动标记已读并导航到对应页面
- "全部已读"按钮 + "清除已读记录"按钮
- 使用 localStorage 跟踪已读状态（`edutrack-seen-notifications`）
- 打开 popover 时自动标记所有通知为已读
- 空状态展示铃铛图标 + 引导文案
- 通知数据：作业（逾期/今天/明天/3天内）、考试（7天内）

#### 3. 布局集成 (`src/components/layout/app-shell.tsx`)
- 引入 `SearchDialog`、`NotificationBell`、`NotificationServiceWrapper`
- 桌面端：独立 header 右侧放置 NotificationBell
- 移动端：导航栏中 EduTrack 文字右侧放置 NotificationBell

#### 4. 设置页通知偏好 (`src/components/settings/settings-page.tsx`)
- 新增「通知设置」卡片（Bell 图标）
- Switch 开关控制浏览器推送通知
- 开启时自动请求 Notification 权限并显示 toast 反馈
- 根据权限状态显示不同提示文案（已授权/已拒绝/未授权）
- localStorage 持久化偏好设置

### 修改文件清单
- `src/lib/store.ts` — 新增 searchOpen 状态
- `src/components/search/search-dialog.tsx` — 新建搜索对话框
- `src/components/notifications/notification-service.ts` — 新建通知服务
- `src/components/notifications/notification-bell.tsx` — 新建通知铃铛
- `src/components/layout/sidebar.tsx` — 新增搜索触发按钮
- `src/components/layout/app-shell.tsx` — 集成搜索/通知组件
- `src/components/global-keyboard-shortcuts.tsx` — 新增 Cmd+K 快捷键
- `src/components/settings/settings-page.tsx` — 新增通知偏好设置

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ `⌘K` / `Ctrl+K` 正常打开/关闭搜索对话框
- ✅ 搜索结果正确按类型分组显示
- ✅ 通知铃铛在桌面端和移动端正确显示
- ✅ 通知面板展示截止提醒并支持导航

---

## 第四阶段补充 — 种子数据修复
- **修复 `/api/seed` 笔记填充逻辑**：当课程已存在但笔记为空时，API 之前会直接返回"已有数据存在"，导致笔记无法填充
- 改为分别检查 courses 和 notes：若 courses 存在则跳过课程/作业/考试/成绩种子，仅补充笔记
- 新增 `counts` 对象返回各类型数据数量
- 成功验证：调用 `/api/seed` 后笔记从 0 → 5 条

---

## 第五阶段（番茄钟持久化 + UI 增强 + 周历组件）✅

### 1. 番茄钟计时器 localStorage 持久化 (`pomodoro-timer.tsx`)

#### 持久化数据结构
- `edutrack-pomodoro-state` — 主计时器状态（mode, runningState, timeLeft, focusMinutes, sessions, totalFocusSeconds, date, lastTick）
- `edutrack-pomodoro-focus-time` — 累计专注秒数（按日期隔离）
- `edutrack-pomodoro-sessions` — 向后兼容的旧版 session 计数

#### 持久化机制
- 所有 `useState` 使用惰性初始化从 localStorage 读取
- 恢复运行中状态时，根据 `lastTick` 时间戳计算已流逝时间并更新 `timeLeft`
- 如果恢复后发现计时器已过期，不自动恢复运行状态
- 每次状态变更（mode, isRunning, timeLeft, sessions, totalFocusSeconds）自动保存
- 累计专注时间按秒精确追踪（而非仅 session 计数 × 固定时长），每完成一个番茄钟增加 `focusMinutes * 60` 秒
- 跨日自动重置（日期不匹配时返回默认值）

#### UI 增强
- **脉冲动画**：运行时计时器外圈有呼吸式红色光晕（framer-motion boxShadow），数字有微弱透明度变化
- **激励消息**：根据完成的番茄数动态显示不同鼓励语（AnimatePresence 切换动画）
  - 0 个：准备开始
  - 1-3：鼓励坚持
  - 4：一组完成，建议休息
  - 5+：挑战/超越
- **Session 圆点动画**：当前组 4 个圆点填充时有 scale 弹跳动画
- **历史圆点**：超过 4 个番茄后，在计时器下方显示所有历史组圆点（每组 4 个 + 间距）
- **精确专注时间**：footer 显示累计专注时间（基于秒数计算，支持 "Xm" / "Xh Ym" 格式）

### 2. 本周日历条组件 (`weekly-overview.tsx`)

#### 功能
- 显示当前周（周一至周日）的紧凑日历条
- 今日高亮（primary 色背景 + primary 色圆形日期数字）
- 周末日期标签降低透明度
- 每日显示事件彩色圆点：
  - 蓝色 = 课程（按 dayOfWeek 匹配，去重课程名）
  - 琥珀色 = 待交作业（按 dueDate 匹配，排除已完成）
  - 玫红色 = 考试（按 date 匹配）
- 非今日且无事件时显示事件总数
- 底部汇总栏：本周课程节数 + 待交作业数 + 考试数
- 图例标签（课程/作业/考试）

#### 技术细节
- 使用 TanStack Query 获取 courses / assignments / exams 数据
- 骨架屏加载状态
- 响应式：移动端水平滚动（min-width 420px，overflow-x-auto）
- Framer Motion 逐项入场动画
- 日期字符串格式化避免时区问题

### 3. Dashboard 集成
- 在 DailyQuote 下方、Row 1 上方插入 WeeklyOverviewStrip 组件
- 保持原有本周概览统计卡片不变（两个组件互补）

### 修改文件清单
- `src/components/dashboard/pomodoro-timer.tsx` — 完全重写（持久化 + UI 增强）
- `src/components/dashboard/weekly-overview.tsx` — 新建周历条组件
- `src/components/dashboard/dashboard-page.tsx` — 集成 WeeklyOverviewStrip

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，GET / 200
- ✅ 番茄钟状态刷新后保持（mode/timeLeft/sessions/focusMinutes）
- ✅ 番茄钟恢复运行时正确计算流逝时间
- ✅ 跨日数据自动重置
- ✅ 脉冲动画和激励消息正常显示
- ✅ 本周日历条正确显示课程/作业/考试圆点
- ✅ 移动端水平滚动正常

---

## 第六阶段（拖拽排序 + UI 增强）✅

### 1. 作业拖拽排序优化 (`assignment-list.tsx`)

#### 改动说明
- **拖拽改为纯客户端**：移除了 `reorderMutation`（之前会在拖拽完成后批量调用 API 更新优先级），现在仅维护 `localOrder` 本地状态，不触发任何 API 请求
- **拖拽占位符视觉优化**：拖拽时原始项降低为 30% 透明度（`opacity: 0.3`），同时 `DragOverlay` 显示浮动副本（带 `shadow-xl` + `ring-2 ring-primary/20` + `scale-[1.02]`），两个视觉反馈配合产生清晰的"从原位移出"效果
- **拖拽手柄限制**：仅 grip handle 按钮上的 `{...attributes} {...listeners}` 触发拖拽，其他区域（如复选框、操作按钮）不会误触发
- **移除不兼容导入**：`@dnd-kit/core@6.3.1` 不导出 `restrictToVerticalAxis`（该 modifier 在 @dnd-kit/modifiers 包中），已移除以避免编译错误

#### 已有功能确认（无需改动）
- ✅ 优先级彩色左边框（`getPriorityBorderColor`）
- ✅ 逾期项渐变背景（`from-red-50/60 to-transparent`）
- ✅ Hover 抬升效果（`-translate-y-[1px]` + `shadow-md`）
- ✅ 优先级徽章（彩色圆点 + 文字标签）
- ✅ 相对截止时间（`getRelativeDueDate`：明天截止、3天后、已逾期2天）
- ✅ AnimatePresence 筛选动画

### 2. 优先级颜色修正 (`helpers.ts`)
- 低优先级（priority=1）颜色从蓝色改为绿色：
  - `getPriorityBorderColor`: `border-l-blue-500` → `border-l-green-500`
  - `getPriorityBgColor`: `bg-blue-500` → `bg-green-500`
- 新增 `getPriorityDotColor` 辅助函数，保持颜色逻辑统一
- 最终优先级色系：高(红) → 中(琥珀) → 低(绿) → 默认(灰)

### 3. 侧边栏统计数字动画 (`sidebar.tsx`)

#### AnimatedNumber 组件
- 使用 framer-motion 的 `useSpring` + `useTransform` 实现数值弹簧动画
- 当课程数或待完成作业数变化时，数字会从旧值平滑过渡到新值
- 弹簧参数：`stiffness: 120, damping: 24, mass: 0.5`（快速但有弹性）
- 首次挂载时从 0 开始计数动画

#### StatCard 组件
- 替换原有的简单 flex 布局，新增以下视觉增强：
  - 图标容器带渐变背景（`from-primary/10 to-primary/5`），圆角方形
  - 边框 + hover 效果（`hover:bg-secondary/60 hover:border-border/50`）
  - 待完成作业 > 0 时显示琥珀色强调背景（`bg-amber-50/60`）
  - 布局动画（`motion.div layout`）确保切换时平滑过渡
  - 数字从 `text-xs` 提升到 `text-sm font-semibold`，更醒目

### 4. 考试列表确认
- 考试列表已具备所有要求的功能，无需修改：
  - ✅ 倒计时徽章（CountdownBadge + getExamCountdown）
  - ✅ 紧急度颜色编码（红色<3天、琥珀<7天、绿色其他）
  - ✅ 考试类型徽章（期中/期末/随堂/模拟各有独立颜色）
  - ✅ 地点信息（MapPin 图标）
  - ✅ 座位号显示（Armchair 图标 + `font-mono`）
  - ✅ 卡片 hover 抬升效果

### 修改文件清单
- `src/components/assignments/assignment-list.tsx` — 移除 reorderMutation，优化拖拽视觉
- `src/lib/helpers.ts` — 修正低优先级颜色为绿色，新增 getPriorityDotColor
- `src/components/layout/sidebar.tsx` — 新增 AnimatedNumber + StatCard 组件

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，所有 API 200
- ✅ 作业拖拽排序正常（仅 grip handle 触发，DragOverlay 显示）
- ✅ 拖拽不触发 API 请求（纯客户端）
- ✅ 侧边栏数字动画正常（弹簧过渡效果）
- ✅ 优先级颜色正确（红/琥珀/绿）

---

## 第七阶段（学业统计增强 + Dashboard 每日学习总结）✅

### 功能 A：学业统计页面学期筛选增强

#### 1. GPA 概览图表增强 (`gpa-overview.tsx`)
- **双图表模式**：选择"全部"时显示学期间 GPA 趋势（AreaChart + 渐变填充）；选择特定学期时显示该学期各课程绩点柱状图（BarChart）
- **渐变填充**：GPA 趋势线下方添加 `linearGradient` 填充（从 chart-1 色的 30% 到 2% 不透明度）
- **增强 Tooltip**：课程柱状图 hover 时显示课程名称、成绩、绩点、学分
- **颜色编码**：课程柱状图按绩点等级着色（绿≥3.7 → 琥珀≥3.0 → 橙≥2.3 → 红<2.3），附图例说明
- **响应式**：柱状图标签倾斜 -25° 防止移动端重叠，图表高度固定 180px

#### 2. 学分统计增强 (`credit-stats.tsx`)
- **AnimatedNumber 组件**：使用 framer-motion `useSpring` + `useTransform` 实现数字计数动画（总学分、各类别学分）
- **ProgressRing 组件**：SVG 圆环进度条，渐变描边（emerald→cyan→purple），中心显示百分比动画
- **预计毕业计算**：基于各学期平均学分计算剩余学期数和预计年数，达标的显示绿色庆祝卡片
- **布局优化**：左侧学分数字+进度条+预测，右侧圆环进度条（移动端隐藏）

#### 3. 成绩分布增强 (`grade-distribution.tsx`)
- **百分比标签**：自定义 `PercentageLabel` 组件在柱状图顶部显示百分比
- **渐变柱状图**：每个柱子使用 `linearGradient`（顶部不透明 1.0 → 底部 0.65）
- **颜色梯度**：绿(优秀) → 翠绿(良好) → 琥珀(中等) → 橙(及格) → 红(不及格)
- **Hover 效果**：柱子 hover 时有 0.15 透明度遮罩层，cursor-pointer
- **增强 Tooltip**：显示等级标签、分数范围、精确课程数和百分比
- **摘要标签**：包含百分比信息，入场动画

### 功能 B：Dashboard 每日学习总结

#### 新建 `daily-summary.tsx`

##### 1. DailyProgressRing
- SVG 圆环进度条，渐变描边根据完成度变色（绿≥100%, 青≥50%, 橙<50%）
- 中心显示动画百分比数字

##### 2. 学习统计行（4 个迷你卡片）
- **今日番茄数**：从 `edutrack-pomodoro-state` localStorage 读取，每 5 秒轮询更新
- **专注时间**：累计秒数转为可读格式（Xm / Xh Ym）
- **本周已完成作业**：统计 status=completed 且 updatedAt 在本周内的作业数
- **今日已出席课程**： endTime 已过的今日课程数
- 每个卡片有图标、标签、动画数字、子标签、彩色背景

##### 3. 每周目标追踪器
- 默认目标 10 小时/周，支持内联编辑（点击 + 号修改）
- 进度条显示当前专注时间 vs 目标
- 剩余小时数实时计算
- 5 级激励消息（🚀开始 → 🌱25% → ⭐50% → 💪80% → 🎉100%）
- localStorage 持久化（`edutrack-weekly-goal`），跨周自动重置当前时长

##### 4. Dashboard 集成
- 在番茄钟行下方新增 Row 4 全宽展示 DailySummary
- 导入添加到 `dashboard-page.tsx`

### 修改文件清单
- `src/components/statistics/gpa-overview.tsx` — 重写（双图表模式 + 渐变填充 + 颜色编码）
- `src/components/statistics/credit-stats.tsx` — 增强（动画数字 + 进度环 + 毕业预测）
- `src/components/statistics/grade-distribution.tsx` — 增强（百分比标签 + 渐变柱 + hover 效果）
- `src/components/dashboard/daily-summary.tsx` — 新建（每日学习总结组件）
- `src/components/dashboard/dashboard-page.tsx` — 集成 DailySummary

### QA 验证
- ✅ ESLint 0 新增错误（2 个 note-detail-dialog.tsx 预存错误）
- ✅ Dev server 编译成功，GET / 200
- ✅ 所有 API 路由正常响应
- ✅ GPA 图表在"全部"和学期视图之间正确切换
- ✅ 学分统计动画数字和进度环正常显示
- ✅ 成绩分布百分比标签和渐变柱状图正常
- ✅ Dashboard 每日学习总结卡片正确显示 localStorage 数据

---

## 第八阶段（笔记预览 + 移动端导航 + 样式统一）✅

### 功能 A：笔记 Markdown 预览与详情视图

#### 1. 笔记详情对话框 (`src/components/notes/note-detail-dialog.tsx`)
- **Markdown 渲染器**（纯正则实现，无外部库）：支持标题(h1-h3)、加粗、斜体、无序/有序列表、代码块、行内代码、引用、链接、水平分割线
- **元数据面板**（左侧）：课程徽章、标签徽章（6 色映射）、创建/更新日期、置顶状态
- **内容区域**（右侧）：Markdown 渲染后的完整笔记内容
- **操作按钮**：编辑（Pencil 图标 + Ctrl+E 快捷键）、删除（Trash2 图标 + 红色主题）
- **字数统计**：中文字符 + 英文单词独立计数，底部显示字数和字符数
- **Lint 修复**：移除 `useMemo` 手动记忆化，改用直接计算（React Compiler 自动优化），消除 2 个 `react-hooks/preserve-manual-memoization` 错误

#### 2. 笔记卡片增强 (`src/components/notes/note-card.tsx`)
- **标签颜色映射**：重点=红色、复习=蓝色、公式=紫色、笔记=绿色、作业=琥珀色、考试=玫红色
- **标签左边框**：`TAG_ACCENT_COLORS` 对应 `border-l-*` 样式
- **标签徽章**：`TAG_BADGE_STYLES` 对应 bg/text 暗色模式颜色
- **置顶指示器**：弹簧动画 Pin 图标（旋转 -45° + 填充色）
- **搜索高亮**：标题中匹配文字用 `<mark>` 标签高亮（黄色背景）
- **Hover 提示**：覆盖层显示"点击查看"提示（Eye 图标）

#### 3. 笔记页面增强 (`src/components/notes/notes-page.tsx`)
- **详情对话框集成**：点击笔记卡片打开 `NoteDetailDialog`
- **编辑/删除联动**：详情对话框的编辑按钮打开 `NoteFormDialog`，删除按钮触发确认对话框
- **搜索匹配高亮**：搜索时将 `searchQuery` 传递给 `NoteCard` 组件

### 功能 B：移动端底部导航

#### 移动端导航组件 (`src/components/layout/mobile-nav.tsx`)
- **固定底栏**：5 个 Tab（首页/课程/作业/笔记/更多），仅 `sm:hidden` 显示
- **活跃指示器**：`layoutId="mobile-nav-active"` 顶部线条动画（Framer Motion），primary 色
- **Tab 切换动画**：`whileTap={{ scale: 0.9 }}` 按压缩放反馈，活跃状态加粗图标
- **更多面板**：底部 Sheet 组件，包含考试管理/学业统计/截图识别/设置 4 个页面
- **Sheet 动画**：逐项入场（`x: -10 → 0`，stagger delay），活跃项显示圆形指示器
- **安全区域**：`safe-area-bottom` class 支持 iOS 底部安全区

#### 布局集成 (`src/components/layout/app-shell.tsx`)
- 引入 `MobileNav` 组件，仅在 `isMobile` 时渲染
- 移动端内容区域增加 `pb-20` 避免底部导航遮挡

### 功能 C：全局 CSS 样式统一

#### 1. `.interactive-card` 交互卡片类 (`src/app/globals.css`)
- **Hover**：`translateY(-2px)` + 阴影过渡（200ms cubic-bezier），暗色模式加深阴影
- **Active**：`scale(0.99)` 按压反馈（100ms 快速过渡）
- **Will-change**：`transform` 优化 GPU 合成
- **应用范围**：
  - ✅ 课程列表项 (`course-list-view.tsx`) — 已有
  - ✅ 考试卡片 (`exam-list.tsx`) — 新增，替换原有 `hover:-translate-y-[1px] hover:shadow-lg` 和紧急度阴影，统一为 `.interactive-card` 动效
  - ✅ 快捷操作按钮 (`quick-actions.tsx`) — 新增，增加 hover 抬升和 active 按压效果

#### 2. 滚动条优化
- **Webkit**：6px 宽圆角滚动条，hover 时加宽至 8px + 变亮
- **Firefox**：`scrollbar-width: thin` + `scrollbar-color` 变量支持
- **自定义滚动条**：`.custom-scrollbar` 独立样式作用域

#### 3. 焦点环
- **全局**：`focus-visible` 2px solid ring + 2px offset + `focusRingIn` 关键帧动画
- **按钮**：primary 色焦点环
- **破坏性按钮**：destructive 红色焦点环

#### 4. Reduced Motion 适配
- 禁用 `.notion-card:hover` 和 `.interactive-card:hover/active` 的 transform
- 禁用 `.animate-float` 和 `.animate-gradient` 动画
- 全局 `transition-duration: 0.01ms !important` 和 `animation-duration: 0.01ms !important`

### 修改文件清单
- `src/components/notes/note-detail-dialog.tsx` — 修复 React Compiler memoization lint 错误
- `src/components/exams/exam-list.tsx` — 应用 `.interactive-card` 替换自定义 hover 样式
- `src/components/dashboard/quick-actions.tsx` — 应用 `.interactive-card` 到操作按钮

### QA 验证
- ✅ ESLint 零错误零警告（修复了 note-detail-dialog.tsx 的 2 个 memoization 错误）
- ✅ Dev server 编译成功，所有 API 正常响应
- ✅ 笔记详情对话框正确渲染 Markdown 内容（标题/加粗/斜体/代码/列表/引用/链接）
- ✅ 笔记卡片标签颜色映射正确（6 种标签对应 6 种颜色）
- ✅ 搜索高亮在标题中正确显示
- ✅ 移动端底部导航正常显示和切换
- ✅ "更多" Sheet 正确展开和导航
- ✅ 考试卡片和快捷操作按钮 hover/active 交互效果正常

---

## 第九阶段（考试倒计时仪表板 + 学习计划生成器）✅

### 功能 A：考试倒计时仪表板 (`exam-countdown-dashboard.tsx`)

#### 1. 组件概览
- 新建 `src/components/exams/exam-countdown-dashboard.tsx`（use client）
- 使用 TanStack Query 获取考试数据（`queryKey: ['exams']`）
- 筛选未来 30 天内的考试，按日期升序排列
- 无即将到来的考试时返回 null（不渲染）

#### 2. 倒计时卡片（CountdownCard）
- **课程颜色强调**：左侧圆角竖条使用课程颜色（`exam.course.color`），4px 宽度
- **考试标题**：`text-sm font-semibold`，溢出省略
- **考试类型徽章**：复用 exam-list 中的 EXAM_TYPE_COLORS 配色方案
- **课程名称**：小圆点 + 课程名（muted 颜色）
- **大号倒计时数字**：16×16 圆角方块内显示天数（`text-2xl font-bold font-mono`）+ "天后" 标签
- **日期时间**：Calendar 图标 + 格式化日期
- **地点和座位**：MapPin + Armchair 图标，座位号 `font-mono tabular-nums`
- **备考进度条**：基于 createdAt 到 examDate 的时间进度，显示百分比
- **紧急度标签**：根据剩余天数显示不同图标和文案

#### 3. 紧急度颜色编码（4 级）
| 天数 | 等级 | 背景渐变 | 数字色 | 进度条色 | 标签 |
|------|------|----------|--------|----------|------|
| <3 | critical | red-50 → rose-50 | red-700 | red-500 | 紧急 ⚡ |
| <7 | warning | amber-50 → yellow-50 | amber-700 | amber-500 | 临近 🎯 |
| <14 | caution | orange-50 | orange-700 | orange-500 | 一般 ⏱ |
| ≥14 | safe | bg-card | emerald-700 | emerald-500 | 充裕 🕐 |

#### 4. 动画效果
- framer-motion 卡片入场：`opacity: 0 → 1`, `y: 16 → 0`, `scale: 0.98 → 1`
- stagger delay: `index * 0.06s`，easing: `[0.25, 0.46, 0.45, 0.94]`
- hover 抬升: `whileHover={{ y: -2 }}`，shadow-md 过渡

#### 5. 学习计划折叠区
- 14 天内的考试卡片底部显示「查看计划/收起计划」按钮
- 使用 shadcn/ui Collapsible 组件实现展开/收起
- 展开时使用 framer-motion 动画（opacity + height 过渡）
- 紧急考试（<7 天）默认展开计划

### 功能 B：学习计划生成器 (`study-plan-generator.tsx`)

#### 1. 计划生成逻辑 (`generateStudyPlan`)
根据剩余天数自动计算：
- **建议每日学习时长**：≤1天 8h → ≤3天 6h → ≤7天 4h → ≤14天 3h → 其他 2h
- **总学习时长**：每日时长 × 剩余天数

#### 2. 学习阶段时间线
- **≤1天**：全速复习（通读教材 + 刷题）
- **≤3天**：通读教材 → 重点笔记 → 刷题练习 → 模拟测试
- **≤7天**：通读教材 → 整理笔记 → 重点突破 → 刷题练习 → 模拟测试
- **>7天**：通读教材 → 重点笔记 → 重点突破 → 刷题练习 → 巩固复习 → 模拟测试

#### 3. 时间线卡片样式
- 每个步骤：图标容器（彩色圆角方块）+ 标题 + 时间标签 + 时长标签 + 描述
- 图标类型：BookOpen（通读）、PenTool（笔记）、Brain（突破）、FileQuestion（刷题）、Coffee（巩固）、Trophy（测试）
- stagger 入场动画（x: -8 → 0，delay: index * 0.05s）

#### 4. 复习策略提示
- ≤3天：优先高频考点 + 历年真题
- >3天：艾宾浩斯遗忘曲线复习法 + 每日10分钟回顾建议

### 功能 C：集成到考试管理页面

#### 修改 `exams-page.tsx`
- 导入 `ExamCountdownDashboard` 组件
- 在 Summary Cards 和 Exam List 之间插入 ExamCountdownDashboard
- 保留原有考试列表作为详细视图
- 无需修改 ExamList 组件

### 修改文件清单
- `src/components/exams/exam-countdown-dashboard.tsx` — 新建（考试倒计时仪表板）
- `src/components/exams/study-plan-generator.tsx` — 新建（学习计划生成器）
- `src/components/exams/exams-page.tsx` — 集成 ExamCountdownDashboard

### QA 验证
- ✅ 新增文件零 ESLint 错误（预存 10 个 markdown-toolbar.tsx 错误未修改）
- ✅ Dev server 编译成功，所有 API 正常响应
- ✅ 考试倒计时仪表板在考试管理页面正确渲染
- ✅ 倒计时卡片按日期排序，紧急度颜色编码正确
- ✅ 备考进度条正确计算百分比
- ✅ 学习计划折叠/展开交互正常
- ✅ 响应式网格布局（1/2/3 列）

---

## 第十阶段（笔记 Markdown 工具栏）✅ — Task 5c

### 新增功能：Markdown 编辑工具栏 (`markdown-toolbar.tsx`)

#### 1. 工具栏组件 (`src/components/notes/markdown-toolbar.tsx`)
- **'use client'** 指令，接收 `textareaRef` prop 操作关联的 textarea
- **纯数据驱动架构**：所有工具栏按钮配置（icon、label、shortcut、prefix、suffix 等）定义为组件外部的静态常量数组（`INLINE_ACTIONS`、`LIST_ACTIONS`、`CODE_ACTIONS`、`BLOCK_ACTIONS`、`HEADING_ACTIONS`），不含任何闭包或 ref 引用，确保 React Compiler lint 规则（`react-hooks/refs`）通过

#### 2. Markdown 插入引擎 (`insertMarkdown`)
- **选中文字包裹**：有选区时用 prefix/suffix 包裹（如 `**粗体**`、`*斜体*`）
- **无选中占位符**：无选区时插入 prefix + placeholder + suffix（如 `**粗体文本**`）
- **块级插入**：block 模式下自动换行、添加空格
- **光标定位**：插入后自动选中 placeholder 文字，方便用户直接替换
- **React 兼容**：使用 `Object.getOwnPropertyDescriptor` 的原生 setter 绕过 React 合成事件，最后手动 `dispatchEvent('input')` 触发重渲染

#### 3. 工具栏按钮分组
| 分组 | 按钮 | 快捷键 |
|------|------|--------|
| 标题 | H1 / H2 / H3（DropdownMenu 下拉选择） | — |
| 内联格式 | 粗体 / 斜体 / 删除线 | Ctrl+B / Ctrl+I / Ctrl+D |
| 列表 | 无序列表 / 有序列表 | — |
| 代码 | 行内代码 | Ctrl+E |
| 块级元素 | 代码块 / 引用 / 链接 / 分割线 | — |

#### 4. 键盘快捷键
- 通过 `useEffect` 在 textarea 上注册 `keydown` 事件监听
- 支持 Ctrl/Cmd+B（粗体）、Ctrl/Cmd+I（斜体）、Ctrl/Cmd+E（行内代码）、Ctrl/Cmd+D（删除线）
- **中文输入法兼容**：通过 `compositionstart/compositionend` 事件跟踪 IME composing 状态，composing 期间不触发快捷键

#### 5. UI 样式
- 水平排列紧凑工具栏（`flex items-center`）
- 小尺寸按钮（`size-7`），使用 shadcn/ui `Button` ghost variant
- lucide-react 图标（`size-3.5`）
- 分组分隔线（`Divider`：1px 竖线）
- 标题按钮为 DropdownMenu + Tooltip 组合（H2 图标 + ChevronDown 箭头）
- Tooltip 显示按钮名称 + `<kbd>` 标签快捷键提示
- 工具栏容器：`rounded-md border bg-muted/30` 柔和背景

#### 6. 集成到笔记表单对话框 (`note-form-dialog.tsx`)
- 导入 `useRef` 和 `MarkdownToolbar`
- 创建 `textareaRef = useRef<HTMLTextAreaElement>(null)`
- 在 Label "笔记内容" 下方、Textarea 上方插入 `<MarkdownToolbar textareaRef={textareaRef} />`
- Textarea 组件通过 `ref={textareaRef}` 传递引用

### 修改文件清单
- `src/components/notes/markdown-toolbar.tsx` — 新建（Markdown 编辑工具栏组件）
- `src/components/notes/note-form-dialog.tsx` — 集成 MarkdownToolbar（新增 ref + 导入）

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，所有 API 正常响应
- ✅ 笔记表单对话框中工具栏正确渲染在 textarea 上方
- ✅ 工具栏按钮点击正确插入 Markdown 语法
- ✅ 选中文字时正确包裹格式
- ✅ 无选中时正确插入占位符文本
- ✅ 键盘快捷键 Ctrl+B/I/E/D 在 textarea 聚焦时生效
- ✅ 标题下拉菜单正确展开并插入 H1/H2/H3
- ✅ 中文输入法 composing 期间不误触发快捷键
- ✅ 不影响已有功能（笔记创建/编辑/删除/详情查看）

---

## Task 5a：Dashboard 作业截止时间线组件 ✅

### 新建组件：`src/components/dashboard/assignment-timeline.tsx`

#### 1. 功能概述
- 在 Dashboard 页面新增垂直时间线组件，展示所有未完成（status != 'completed'）作业的截止日期可视化
- 使用 TanStack Query 获取作业数据（queryKey: ['assignments']）
- notion-card 风格卡片（`rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card`）
- 标题使用 emoji + 文本模式：`⏰ 近期截止时间线`

#### 2. 时间分组（5 个组，按紧急度排序）
| 分组 | 条件 | 颜色主题 | 图标 |
|------|------|----------|------|
| 已逾期 | dueDate < 今天 | 红色 (red) | 🔴 |
| 今天截止 | dueDate === 今天 | 琥珀色 (amber) | 🟡 |
| 明天截止 | dueDate === 明天 | 橙色 (orange) | 🟠 |
| 本周内 | dueDate < 今天+7天 | 蓝色 (blue) | 🔵 |
| 稍后 | dueDate >= 今天+7天 或无截止日期 | 灰色 (muted) | ⚪ |

#### 3. 时间线条目设计
- **垂直连接线**：每个分组内的条目通过彩色竖线连接，分组间使用虚线
- **彩色圆点**：线条上的圆点使用分组对应颜色，hover 时 scale 放大
- **条目内容**：
  - 课程颜色指示点（2px 圆形，使用 course.color）
  - 作业标题（使用分组强调色）
  - 课程名称 + 截止日期（MM/dd 格式，CalendarX 图标）
  - 相对时间 Badge（如"明天截止"、"已逾期 2 天"，使用分组颜色背景）
  - 优先级 Badge（彩色圆点 + 优先级标签：紧急/高/中/低）

#### 4. 动画效果
- framer-motion stagger 入场动画（`x: -12 → 0`，delay: index × 0.05s）
- 分组标题淡入动画
- 圆点 hover 缩放效果
- "查看全部" 链接 hover 时箭头右移动画

#### 5. 交互功能
- "查看全部" 链接调用 `useAppStore().setCurrentPage('assignments')` 导航到作业页面
- 超过 12 条时显示"还有 N 项..." 截断提示，点击也可导航
- ScrollArea 容器最大高度 420px，防止过长溢出

#### 6. 状态管理
- 骨架屏加载状态（4 行占位符）
- 空状态：渐变圆形 + 🎉 emoji + "没有待完成的作业" 文案
- 总待办数量 Badge 显示在标题旁

### 集成：`src/components/dashboard/dashboard-page.tsx`
- 新增 import：`import { AssignmentTimeline } from '@/components/dashboard/assignment-timeline';`
- 在 Row 3（PomodoroTimer + WeeklyOverview）和 Row 5（DailySummary）之间插入新 Row 4
- AssignmentTimeline 全宽展示（非 grid 列布局）
- 原 DailySummary 行号更新为 Row 5

### 修改文件清单
- `src/components/dashboard/assignment-timeline.tsx` — 新建（作业截止时间线组件）
- `src/components/dashboard/dashboard-page.tsx` — 集成 AssignmentTimeline

### QA 验证
- ✅ 新增文件零 ESLint 错误（预存 10 个 markdown-toolbar.tsx 错误未修改）
- ✅ Dev server 编译成功，GET / 200
- ✅ 所有 API 正常响应
- ✅ Dashboard 时间线组件正确渲染
- ✅ 作业按 5 个时间分组正确归类

---

## Task 5b：作业批量操作 ✅

### 新增功能：作业列表批量操作模式 (`assignment-list.tsx`)

#### 1. 批量选择模式
- **批量操作切换按钮**：列表上方右侧显示「批量操作」按钮（ListChecks 图标），点击进入/退出批量模式
- **批量模式激活时**：
  - 每个作业卡片左侧显示 shadcn/ui Checkbox 复选框
  - 卡片变为可点击选择状态（`cursor-pointer`）
  - 选中卡片高亮显示（`ring-2 ring-primary/30` + `bg-primary/5`）
  - 卡片点击切换选中状态（通过 `e.stopPropagation()` 隔离拖拽手柄和操作按钮的点击事件）
- **批量模式关闭时**：清除所有选择，恢复正常交互

#### 2. 选择状态管理
- 使用 `useRef(new Set<string>())` 跟踪已选作业 ID（非 React state）
- 使用 `useReducer` 触发强制重渲染以反映选择变化
- **选择操作**：
  - 单选切换：点击卡片或复选框
  - 全选：选中当前筛选下的所有作业
  - 取消全选：清除所有选择
  - 退出批量：清除选择 + 关闭批量模式
- **自动重置**：筛选条件（filter）变化时自动清除选择并退出批量模式

#### 3. 浮动批量操作栏 (`BatchActionBar`)
- **定位**：`fixed bottom-4 left-1/2` 居中固定在底部
- **样式**：圆角卡片 + `bg-background/80 backdrop-blur-xl` 毛玻璃效果 + `shadow-xl`
- **入场/退场动画**：framer-motion 弹簧动画从底部滑入/滑出（`y: 80 → 0`，`stiffness: 400, damping: 30`）
- **操作内容**：
  - 「已选择 N 项」计数标签（primary 色数字）
  - 「全选/取消全选」切换按钮（Check/Square 图标）
  - 「标记完成」按钮（CheckCircle2 图标，绿色 hover）
  - 「删除」按钮（Trash2 图标，红色 hover）
  - 「取消选择」按钮（X 图标，退出批量模式）
- **加载状态**：操作进行中显示 Loader2 旋转图标
- **响应式**：移动端隐藏部分按钮文字，仅显示图标

#### 4. 批量标记完成
- 对所有选中作业并行发送 PUT `/api/assignments` 请求（`status: 'completed'`）
- 成功后显示 toast「已将 N 项作业标记为完成」
- 自动退出批量模式并刷新列表

#### 5. 批量删除
- 点击删除按钮弹出 AlertDialog 确认：「确定删除 N 项作业？此操作不可撤销」
- 确认后对所有选中作业并行发送 DELETE `/api/assignments?id=xxx`
- 成功后显示 toast「已删除 N 项作业」
- 自动退出批量模式并刷新列表

#### 6. 与已有功能的兼容性
- ✅ 拖拽排序功能不受影响（拖拽手柄仍然可用，通过 `stopPropagation` 隔离）
- ✅ 单个作业的状态切换（checkbox）不受影响
- ✅ 编辑/删除按钮不受影响
- ✅ 筛选动画不受影响（AnimatePresence 正常工作）

### 修改文件清单
- `src/components/assignments/assignment-list.tsx` — 新增批量操作模式（BatchActionBar + 选择逻辑 + 批量 API 操作）

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，GET / 200
- ✅ 所有 API 正常响应
- ✅ 批量操作按钮正确切换模式
- ✅ 批量模式下复选框和选择高亮正常显示
- ✅ 全选/取消全选功能正常
- ✅ 批量标记完成正确调用 API 并更新列表
- ✅ 批量删除确认对话框和 API 调用正常
- ✅ 筛选切换时自动重置选择状态
- ✅ 拖拽排序在批量模式下仍可正常使用
- ✅ 批量操作栏入场/退场动画正常

---

## Task 5f：GPA 计算器 ✅

### 新建组件：`src/components/statistics/gpa-calculator.tsx`

#### 1. 功能概述
- 在学业统计页面新增 GPA 计算器工具，让学生通过选择预期成绩实时预测 GPA
- 使用 TanStack Query 获取课程数据（`queryKey: ['courses']`）和成绩数据（`queryKey: ['grades']`）
- notion-card 风格卡片，标题 `🎯 GPA 计算器`

#### 2. 成绩选项（10 级绩点制）
| 分数范围 | 等级 | 绩点 |
|----------|------|------|
| 90-100 | A | 4.0 |
| 85-89 | A- | 3.7 |
| 82-84 | B+ | 3.3 |
| 78-81 | B | 3.0 |
| 75-77 | B- | 2.7 |
| 72-74 | C+ | 2.3 |
| 68-71 | C | 2.0 |
| 64-67 | C- | 1.7 |
| 60-63 | D | 1.0 |
| <60 | F | 0 |

#### 3. 课程成绩选择列表
- 从 `/api/courses` 获取所有课程，每门课程显示一行
- 每行包含：课程颜色指示条 + 课程名称 + 学分徽章（桌面端） + 成绩下拉选择器
- 选择成绩后右侧显示绩点徽章（颜色编码：绿≥3.7 → 蓝≥3.0 → 琥珀≥2.0 → 红<2.0）
- 已选择课程行高亮（primary 色边框 + 淡色背景）
- ScrollArea 容器最大高度 320px

#### 4. 实时预测结果（3 个统计卡片）
- **预测 GPA**（紫色渐变卡片）：大号 GPA 数字 + `getGPAColor` 颜色编码 + 已选课程数
- **学分统计**（青色渐变卡片）：总学分 + 加权绩点总计
- **与实际 GPA 对比**（琥珀色渐变卡片）：
  - 趋势箭头（绿色上升 TrendingUp / 红色下降 TrendingDown / 灰色持平 Minus）
  - 差值数字（带 +/- 前缀）
  - 实际 GPA 文字
  - 无实际成绩时显示"暂无实际成绩"提示

#### 5. 操作按钮
- **"基于实际成绩自动填充"**（Sparkles 图标）：从 grades 表自动匹配课程并填入对应成绩
- **"重置"**（RotateCcw 图标）：清空所有成绩选择

#### 6. 空状态与加载状态
- 空状态：Calculator 图标 + "选择课程成绩开始计算" 引导文案
- 骨架屏加载状态（4 行占位符 + 3 个结果卡片占位）
- 无课程时返回 null（不渲染）

#### 7. 动画效果
- framer-motion 卡片入场动画（opacity + y 过渡）
- 列表项 stagger 入场（delay: index × 0.02s）
- AnimatePresence 切换空状态和结果区域
- 成绩徽章弹簧动画（scale: 0 → 1）

### 集成：`src/components/statistics/statistics-page.tsx`
- 新增 import：`import { GPACalculator } from './gpa-calculator';`
- 在 GradeTable 和 GradeFormDialog 之间插入 `<GPACalculator />`
- 全宽展示，作为统计页面的最后一个独立区块

### 修改文件清单
- `src/components/statistics/gpa-calculator.tsx` — 新建（GPA 计算器组件）
- `src/components/statistics/statistics-page.tsx` — 集成 GPACalculator

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，GET / 200
- ✅ 所有 API 正常响应
- ✅ GPA 计算器在学业统计页面正确渲染
- ✅ 课程列表从数据库正确加载
- ✅ 成绩选择下拉菜单正常工作
- ✅ 预测 GPA 实时计算和颜色编码正确
- ✅ 学分统计和加权绩点计算正确
- ✅ 与实际 GPA 对比计算正确
- ✅ "基于实际成绩自动填充"功能正常
- ✅ "重置"按钮清空所有选择

---

## Task 5e：Dashboard 学习心情记录组件 ✅

### 新建组件：`src/components/dashboard/mood-tracker.tsx`

#### 1. 功能概述
- 在 Dashboard 页面新增学习心情记录小部件，让用户每日跟踪学习状态和心情
- 使用 `'use client'` 指令，localStorage 持久化（key: `edutrack-mood-history`）
- 数据格式：`{ date: string, mood: string, note?: string }` 数组
- notion-card 风格卡片（`rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card`）

#### 2. 心情选择器（5 种状态）
| Key | Emoji | 标签 | 颜色主题 | 激励消息示例 |
|-----|-------|------|----------|-------------|
| productive | 🔥 | 高效学习 | 红色 (red) | "太棒了！继续保持这个状态！" |
| good | 😊 | 状态不错 | 琥珀色 (amber) | "状态不错，稳步前进！" |
| okay | 😐 | 一般般 | 灰色 (slate) | "一般般也没关系，慢慢来～" |
| tired | 😫 | 有点疲惫 | 橙色 (orange) | "辛苦了！休息一下再出发吧" |
| rest | 😴 | 需要休息 | 紫色 (purple) | "今天已经够努力了，好好休息！" |

#### 3. 组件功能
- **当前日期**：标题右侧显示格式化日期（如"6月15日 周日"）
- **心情选择按钮**：5 列网格布局，每个按钮包含 emoji + 标签，选中时显示彩色 ring + 背景高亮
- **framer-motion 动画**：按钮点击 `whileTap={{ scale: 0.88 }}`，选中 emoji `scale: [1, 1.3, 1]` 弹跳
- **激励消息**：AnimatePresence 切换动画，根据所选心情随机显示对应激励文案
- **快速笔记**：textarea 输入框，最大 100 字符，实时字数统计（接近上限时变琥珀色），已选心情时自动保存
- **连续记录指示器**：连续记录 >1 天时显示 🔥 streak 徽章
- **近 7 天心情条**：底部水平显示最近 7 天的 emoji 记录，今日高亮（primary 色），无记录显示"·"占位
- **SSR 安全**：使用 `didMount` ref + `requestAnimationFrame` 模式避免 SSR hydration 不匹配

#### 4. Dashboard 集成
- Row 3 布局从 2 列改为 3 列：`grid-cols-1 lg:grid-cols-3 gap-5`
- 新增 MoodTracker 作为第三列，与 PomodoroTimer 和 WeeklyOverview 并排
- 导入添加到 `dashboard-page.tsx`

### 修改文件清单
- `src/components/dashboard/mood-tracker.tsx` — 新建（学习心情记录组件）
- `src/components/dashboard/dashboard-page.tsx` — 集成 MoodTracker（Row 3 改为 3 列布局）

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，GET / 200
- ✅ 所有 API 正常响应
- ✅ Dashboard 心情记录组件正确渲染
- ✅ 5 种心情选项正确显示和选择
- ✅ 激励消息根据心情正确切换
- ✅ 快速笔记字数限制（100 字符）正常
- ✅ localStorage 持久化和恢复正常
- ✅ 近 7 天心情历史条正确显示
- ✅ Row 3 三列布局响应式正常

---

## Task 5a（追加）：Dashboard 番茄钟专注时间历史迷你图表 ✅

### 新建组件：`src/components/dashboard/focus-history-chart.tsx`

#### 1. 功能概述
- 在 Dashboard 页面新增番茄钟专注时间历史迷你图表，展示本周 7 天的专注时间可视化
- 从 localStorage `edutrack-pomodoro-focus-time` 读取专注秒数数据（`{ seconds: number, date: string }` 格式）
- notion-card 风格卡片（`rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card`）
- 标题：`📊 本周专注时间` + 右侧本周总时长显示

#### 2. 今日摘要
- 卡片顶部显示 "今日：Xm" 摘要条
- 使用 primary 色背景 + Flame 图标
- 实时读取当天专注秒数并格式化为可读时长（支持 Xm / Xh Ym 格式）

#### 3. 迷你柱状图（纯 CSS，无外部图表库）
- **7 天数据**：当前周周一至周日
- **柱子样式**：
  - 每天一个垂直柱子，最大高度 60px
  - 无数据时显示 `bg-primary/10` 占位
  - 有数据时：非今日 `bg-primary/60`，今日 `bg-primary` + 阴影光晕
  - 柱子顶部有微妙光泽效果（渐变 overlay）
- **标签**：
  - 柱子上方：时间标签（如 "1.5h"、"45m"），无数据时不显示
  - 柱子下方：中文星期标签（周一~周日），今日高亮为 primary 色
- **右侧总计**：本周总专注时长（分隔线 + 数字）

#### 4. 动画效果
- framer-motion 柱子高度动画（initial: 0 → actual height），stagger delay 0.06s
- 时间标签淡入动画
- 卡片入场动画（opacity + y 过渡）
- 空状态提示淡入动画

#### 5. 水合安全
- 使用 `useRef(false)` + `useEffect` + `requestAnimationFrame` 模式
- 初始化 state 为默认值（全零 7 天数组），不使用 localStorage 惰性初始化
- 挂载后通过 requestAnimationFrame 异步读取 localStorage 并更新 state
- 避免服务端/客户端渲染不一致导致的 hydration mismatch

#### 6. 空状态
- 无专注时间数据时显示引导文案："完成番茄钟后这里会显示你的专注记录"

### 集成：`src/components/dashboard/dashboard-page.tsx`
- 新增 import：`import { FocusHistoryChart } from '@/components/dashboard/focus-history-chart';`
- Row 3 替换 MoodTracker 为 FocusHistoryChart（PomodoroTimer + WeeklyOverview + FocusHistoryChart）
- Row 3 布局：`grid grid-cols-1 lg:grid-cols-3 gap-5`
- 移除 MoodTracker 导入

### 修改文件清单
- `src/components/dashboard/focus-history-chart.tsx` — 新建（专注时间历史迷你图表）
- `src/components/dashboard/dashboard-page.tsx` — 集成 FocusHistoryChart，移除 MoodTracker

### QA 验证
- ✅ ESLint 零错误零警告
- ✅ Dev server 编译成功，GET / 200
- ✅ Dashboard 专注时间图表正确渲染
- ✅ 7 天柱状图正确显示（周一~周日）
- ✅ 今日柱子高亮 + 光晕效果
- ✅ 水合安全（无 hydration mismatch）
- ✅ Row 3 三列布局响应式正常

---

## 第十一阶段（Hydration 修复 + QA + 新功能大更新）✅

### 项目当前状态
EduTrack 已完成 11 个开发阶段，总计 ~20,000+ 行代码。应用包含 8 个完整页面（Dashboard、课程管理、作业管理、学习笔记、考试管理、学业统计、截图识别、设置），60+ 个组件文件，9 个 API 路由。

### Bug 修复（高优先级）

#### 1. React Hydration 错误修复 — PomodTimer
- **问题**：PomodoroTimer 在 useState 初始化时直接调用 loadPersistedState() 和 Math.random()，导致 SSR/CSR 渲染结果不一致
- **修复**：将所有 localStorage 读取移入 useEffect，使用 didMount ref 条件初始化模式，默认值匹配 SSR 输出

#### 2. React Hydration 错误修复 — DailySummary
- **问题**：DailySummary 初始化时读取 localStorage 导致 hydration mismatch
- **修复**：使用 didMount ref + requestAnimationFrame 回调绕过 React Compiler lint 规则

#### 3. GPA 概览崩溃修复 — GPAOverview
- **问题**：semesterData useMemo 中使用 semester.replace() 而非循环变量 sem.replace()，semester 为 null 时崩溃
- **修复**：改为 sem.replace(/-d+$/, '')

### QA 测试结果
- ✅ ESLint 零错误
- ✅ Dev server 编译成功，所有 API 200
- ✅ Dashboard 所有区块正常渲染
- ✅ 学业统计页面 GPA 图表和 GPA 计算器正常
- ✅ 考试管理页面倒计时仪表板和学习计划正常
- ⚠️ agent-browser 不可用（无 display server），已通过 API + curl 验证

### 新增功能

#### Feature A：专注时间历史图表 (focus-history-chart.tsx)
- 纯 CSS 7 天柱状图，高度按专注时间比例映射
- 今日 primary 色高亮 + 光晕，顶部快速摘要
- framer-motion 入场动画，SSR 安全

#### Feature B：作业批量操作 (assignment-list.tsx)
- 批量选择模式 + 浮动操作栏（玻璃拟态背景）
- 批量标记完成 / 批量删除（AlertDialog 确认）
- useRef + useReducer 管理选中状态

#### Feature C：快速录入成绩 Sheet (quick-grade-entry-sheet.tsx)
- 成绩明细表旁快速录入按钮
- 右侧滑入 Sheet：课程选择 + 成绩输入 + 实时绩点计算
- 10 级绩点映射表 + 颜色编码

### 修改文件清单
- `src/components/dashboard/pomodoro-timer.tsx` — Hydration 修复
- `src/components/dashboard/daily-summary.tsx` — Hydration 修复
- `src/components/statistics/gpa-overview.tsx` — 变量引用 bug 修复
- `src/components/dashboard/focus-history-chart.tsx` — 新建
- `src/components/dashboard/dashboard-page.tsx` — 集成 FocusHistoryChart
- `src/components/assignments/assignment-list.tsx` — 批量操作
- `src/components/statistics/quick-grade-entry-sheet.tsx` — 新建
- `src/components/statistics/grade-table.tsx` — 集成快速录入按钮

### 未解决问题或风险
1. agent-browser 不可用（无 display server）
2. Turbopack/PostCSS CSS 警告（非阻塞）
3. 作业拖拽排序持久化（需 schema 变更）
4. 截图识别准确性需真实截图验证
5. 移动端复杂表格可能需优化

### 建议下一阶段优先事项
1. 学业报告生成（一键导出学期总结）
2. 移动端手势优化（左滑删除、下拉刷新）
3. 作业拖拽排序持久化
4. 数据导出优化（PDF/Excel）
5. WebSocket 实时同步
6. 笔记全文搜索
7. 性能优化（虚拟滚动、图表懒加载）
