# 🍼 宝宝喂养记录软件

一个使用 Tauri 开发的跨平台宝宝喂养记录应用，支持 macOS 和 Windows。

## ✨ 功能特性

- 📝 记录喂养信息（母乳/奶粉/混合）
- ⏱️ 记录奶量和喂养时长
- 📊 查看今日统计（次数和总量）
- 🗑️ 删除不需要的记录
- 💾 本地数据存储，保护隐私
- 🎨 美观的用户界面
- 🖥️ 跨平台支持（macOS、Windows）

## 🚀 开发环境要求

### 必需环境

1. **Node.js** (推荐 v18 或更高版本)
   - 下载：https://nodejs.org/

2. **Rust** (推荐最新稳定版)
   - macOS/Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Windows: 从 https://rustup.rs/ 下载安装

3. **系统依赖**
   - **macOS**: Xcode Command Line Tools
     ```bash
     xcode-select --install
     ```

   - **Windows**:
     - Microsoft Visual Studio C++ Build Tools
     - WebView2 (Windows 10/11 已内置)

## 📦 安装和运行

### 1. 安装依赖

```bash
# 安装 Node.js 依赖
npm install
```

### 2. 开发模式运行

```bash
npm run dev
```

这将启动应用的开发版本，支持热重载。

### 3. 构建生产版本

```bash
npm run build
```

构建完成后，安装包将生成在 `src-tauri/target/release/bundle/` 目录下：

- **macOS**: `.dmg` 和 `.app` 文件
- **Windows**: `.msi` 和 `.exe` 安装程序

## 📱 使用说明

### 添加记录

1. 选择喂养方式（母乳/奶粉/混合）
2. 输入奶量（毫升）
3. 输入喂养时长（分钟）
4. 选择喂养时间（默认为当前时间）
5. 可选：添加备注信息
6. 点击"添加记录"按钮

### 查看记录

- 所有记录按时间倒序显示
- 顶部显示今日统计（喂养次数和总奶量）
- 每条记录显示详细信息

### 删除记录

点击记录下方的"删除"按钮，确认后即可删除。

## 💾 数据存储

所有数据都存储在本地，位置如下：

- **macOS**: `~/Library/Application Support/com.baby-feeding-tracker.app/feeding_records.json`
- **Windows**: `%APPDATA%/com.baby-feeding-tracker.app/feeding_records.json`

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **框架**: Tauri 2.0
- **后端**: Rust
- **构建工具**: Vite 5.0

## 📝 项目结构

```
baby-feeding-tracker/
├── src/                    # 前端源代码
│   ├── main.js            # 主 JavaScript 文件
│   └── styles.css         # 样式文件
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   └── main.rs        # Rust 主程序
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 配置
├── index.html             # 入口 HTML
├── vite.config.js         # Vite 配置
└── package.json           # Node.js 配置
```

## 🔧 常见问题

### Q: 如何备份数据？
A: 直接复制数据文件 `feeding_records.json` 即可。

### Q: 数据会上传到云端吗？
A: 不会，所有数据都存储在本地，完全保护您的隐私。

### Q: 可以在手机上使用吗？
A: 当前版本仅支持桌面平台（macOS 和 Windows）。

## 📄 许可证

本项目仅供个人使用。

## 👨‍💻 作者

Damon

---

如有问题或建议，欢迎反馈！
