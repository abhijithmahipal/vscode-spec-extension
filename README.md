# 🚀 Spec-Driven Development

> Transform your development workflow with Kiro-style spec methodology in VSCode + GitHub Copilot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher.spec-driven-development)
[![VSCode](https://img.shields.io/badge/VSCode-1.74+-green.svg)](https://code.visualstudio.com/)
[![Copilot](https://img.shields.io/badge/GitHub%20Copilot-Compatible-purple.svg)](https://github.com/features/copilot)

## ✨ Features

### 🎯 **Structured Development Workflow**

- **Requirements Phase**: Define user stories with EARS format acceptance criteria
- **Design Phase**: Create comprehensive technical architecture
- **Tasks Phase**: Break down into actionable implementation steps
- **Execution Phase**: Code with Copilot assistance

### 🤖 **GitHub Copilot Integration**

- Context-aware prompts for each development phase
- Structured templates that maximize Copilot effectiveness
- File references for comprehensive understanding
- Clipboard integration for seamless workflow

### 📊 **Visual Progress Tracking**

- Interactive sidebar panel with phase indicators
- Task management with click-to-execute functionality
- Progress visualization and completion tracking
- Status bar integration

### 💡 **Intelligent Guidance**

- Phase-specific tips and best practices
- Context-sensitive help system
- Welcome experience for new users
- File organization and management

## 🚀 Quick Start

### 1. **Start Your First Spec**

- Click the Spec icon in the sidebar
- Or use Command Palette: `Spec: Start New Spec`
- Describe your feature in natural language

### 2. **Follow the Guided Workflow**

```
💭 Feature Idea → 📝 Requirements → 🎨 Design → 📋 Tasks → ⚡ Execution
```

### 3. **Work with Copilot**

- Extension generates structured prompts
- Copy prompts to GitHub Copilot chat
- Get context-aware assistance for each phase

## 📖 How It Works

### Requirements Phase 📝

```markdown
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]
```

### Design Phase 🎨

- Architecture overview
- Component interfaces
- Data models
- Error handling strategy
- Testing approach

### Tasks Phase 📋

- Numbered implementation checklist
- Requirement references
- Incremental development steps
- Test-driven approach

### Execution Phase ⚡

- Click tasks to get Copilot prompts
- Context-aware implementation guidance
- Progress tracking and completion

## 🏗️ File Structure

The extension organizes your specs in a clean structure:

```
.specs/
├── feature-name/
│   ├── requirements.md    # User stories & acceptance criteria
│   ├── design.md         # Technical architecture
│   └── tasks.md          # Implementation checklist
└── another-feature/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## 🎨 User Interface

### Sidebar Panel

- **Spec Workflow**: Current phase, progress, and actions
- **Spec Files**: Quick access to requirements, design, and tasks
- **Quick Help**: Tips and guidance for each phase

### Status Bar

- Shows current spec and progress
- Quick access to Spec panel
- Visual indicator of active development

### Interactive Elements

- ✅ Click tasks to execute with Copilot
- ➡️ Phase navigation buttons
- 🔄 Refresh and file management
- 📄 Direct file access

## 🛠️ Installation

### From Marketplace

1. Open VSCode Extensions panel (`Ctrl+Shift+X`)
2. Search for "Spec-Driven Development"
3. Click Install

### Manual Installation

```bash
# Clone and build
git clone https://github.com/your-username/spec-driven-development
cd spec-driven-development
npm install
npm run compile

# Package and install
vsce package
code --install-extension spec-driven-development-1.0.0.vsix
```

## 🎯 Best Practices

### Requirements Phase

- Focus on user value and business outcomes
- Use clear, testable acceptance criteria
- Consider edge cases and error scenarios
- Keep user stories independent and small

### Design Phase

- Think about system boundaries and interfaces
- Consider scalability and maintainability
- Address all functional and non-functional requirements
- Include error handling and recovery strategies

### Tasks Phase

- Break work into small, manageable chunks
- Ensure each task is independently testable
- Reference specific requirements
- Plan for incremental delivery

### Execution Phase

- Complete one task at a time
- Write tests before or alongside implementation
- Regularly commit and review progress
- Refactor and improve as you go

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/your-username/spec-driven-development
cd spec-driven-development
npm install
code .
# Press F5 to launch extension development host
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Kiro IDE's spec-driven development methodology
- Built for the GitHub Copilot ecosystem
- Designed for modern development workflows

---

**Happy Spec-Driven Development!** 🚀

_Transform your ideas into well-structured, implementable features with the power of systematic development and AI assistance._
