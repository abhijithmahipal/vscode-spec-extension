# Spec-Driven Development

**Systematic feature development with requirements, design, and implementation planning for GitHub Copilot**

[![Version](https://img.shields.io/visual-studio-marketplace/v/spec-dev-tools.spec-driven-development)](https://marketplace.visualstudio.com/items?itemName=spec-dev-tools.spec-driven-development)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/spec-dev-tools.spec-driven-development)](https://marketplace.visualstudio.com/items?itemName=spec-dev-tools.spec-driven-development)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/spec-dev-tools.spec-driven-development)](https://marketplace.visualstudio.com/items?itemName=spec-dev-tools.spec-driven-development)
[![VSCode](https://img.shields.io/badge/VSCode-1.74+-green.svg)](https://code.visualstudio.com/)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-Compatible-purple.svg)](https://github.com/features/copilot)

Transform your development workflow with a systematic approach to feature development. This extension guides you through a proven methodology: Requirements → Design → Tasks → Implementation, with seamless GitHub Copilot integration.

![Spec-Driven Development Workflow](https://raw.githubusercontent.com/spec-dev-tools/vscode-spec-driven-development/main/docs/images/workflow-overview.gif)

## Features

### Structured Development Workflow

- **Requirements Phase**: Define user stories with EARS format acceptance criteria
- **Design Phase**: Create comprehensive technical architecture and component design
- **Tasks Phase**: Break down features into actionable, testable implementation steps
- **Execution Phase**: Implement with GitHub Copilot assistance using context-aware prompts

### GitHub Copilot Integration

- **Context-Aware Prompts**: Generated prompts include full context from requirements and design
- **Structured Templates**: Maximize Copilot effectiveness with well-formatted, detailed prompts
- **File References**: Automatic inclusion of relevant spec files for comprehensive understanding
- **Clipboard Integration**: One-click copying of prompts for seamless workflow

### Visual Progress Tracking

- **Interactive Sidebar**: Dedicated panel with phase indicators and progress visualization
- **Task Management**: Click-to-execute functionality for individual implementation tasks
- **Status Integration**: Real-time progress updates in VS Code status bar
- **File Organization**: Automatic organization of spec files in logical directory structure

### Intelligent Guidance

- **Phase-Specific Tips**: Contextual help and best practices for each development phase
- **Welcome Experience**: Guided onboarding for new users with interactive tutorials
- **Smart Validation**: Automatic validation of spec completeness and quality
- **Error Prevention**: Built-in checks to prevent common specification mistakes

## Getting Started

### Installation

1. Open VS Code Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "Spec-Driven Development"
3. Click **Install**
4. Reload VS Code when prompted

### Quick Start

1. **Start Your First Spec**

   - Click the Spec icon in the Activity Bar (sidebar)
   - Or use Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`): `Spec: Start New Spec`
   - Enter your feature name and description

2. **Follow the Guided Workflow**

   ```
   Feature Idea → Requirements → Design → Tasks → Implementation
   ```

3. **Work with GitHub Copilot**
   - Extension generates structured, context-aware prompts
   - Click "Copy Prompts" to get prompts for current phase
   - Paste into GitHub Copilot Chat for intelligent assistance

![Getting Started Demo](https://raw.githubusercontent.com/spec-dev-tools/vscode-spec-driven-development/main/docs/images/getting-started.gif)

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

## Requirements

- **VS Code**: Version 1.74.0 or higher
- **GitHub Copilot**: Recommended for optimal experience (not required)
- **Node.js**: 16.x or higher (for development only)

## Configuration

The extension works out of the box with sensible defaults. Customize behavior through VS Code settings:

- `specDrivenDevelopment.workflowBehavior.*` - Workflow and phase transition settings
- `specDrivenDevelopment.uiPreferences.*` - Interface and display preferences
- `specDrivenDevelopment.integration.*` - GitHub Copilot and file naming settings

Access settings via: **File → Preferences → Settings** → Search "Spec-Driven Development"

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

## Support

- **Documentation**: [User Guide](https://github.com/spec-dev-tools/vscode-spec-driven-development/wiki)
- **Issues**: [GitHub Issues](https://github.com/spec-dev-tools/vscode-spec-driven-development/issues)
- **Discussions**: [GitHub Discussions](https://github.com/spec-dev-tools/vscode-spec-driven-development/discussions)
- **Email**: contact@spec-dev-tools.com

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/spec-dev-tools/vscode-spec-driven-development/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/spec-dev-tools/vscode-spec-driven-development
cd vscode-spec-driven-development
npm install
code .
# Press F5 to launch Extension Development Host
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by systematic development methodologies and spec-driven development practices
- Built for the GitHub Copilot ecosystem and modern AI-assisted development
- Designed for professional development teams and individual developers

---

**Transform your development workflow with systematic, AI-assisted feature development.**
