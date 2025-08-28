# Contributing to Spec-Driven Development

Thank you for your interest in contributing to the Spec-Driven Development extension! We welcome contributions from the community and are grateful for your support.

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide clear reproduction steps** for bugs
4. **Include system information** (VS Code version, OS, extension version)

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Describe the use case** and problem you're solving
3. **Provide examples** of how the feature would work
4. **Consider the scope** - features should align with spec-driven development methodology

### Development Setup

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/your-username/vscode-spec-driven-development
   cd vscode-spec-driven-development
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Open in VS Code**:

   ```bash
   code .
   ```

4. **Start development**:
   - Press `F5` to launch Extension Development Host
   - Make changes and test in the development instance
   - Use `Ctrl+R` (Windows/Linux) or `Cmd+R` (macOS) to reload

### Development Guidelines

#### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Use Prettier with the project configuration
- **Linting**: Follow ESLint rules defined in the project
- **Naming**: Use descriptive names for variables, functions, and classes

#### Architecture

- **Separation of Concerns**: Keep UI, business logic, and data access separate
- **Error Handling**: Always handle errors gracefully with user-friendly messages
- **Performance**: Consider extension startup time and memory usage
- **Accessibility**: Ensure all UI elements are accessible

#### Testing

- **Unit Tests**: Write tests for new functionality
- **Integration Tests**: Test user workflows end-to-end
- **Manual Testing**: Test in multiple VS Code versions when possible

### Pull Request Process

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:

   - Follow the development guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test thoroughly**:

   - Run existing tests: `npm test`
   - Test manually in Extension Development Host
   - Verify no regressions in existing functionality

4. **Commit with clear messages**:

   ```bash
   git commit -m "feat: add new feature description"
   ```

   Use conventional commit format:

   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for adding tests

5. **Push and create PR**:

   ```bash
   git push origin feature/your-feature-name
   ```

   Then create a pull request with:

   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Testing instructions

### Review Process

- **Automated checks** must pass (linting, tests, build)
- **Code review** by maintainers
- **Testing** by reviewers when applicable
- **Documentation** updates if needed

## Development Resources

### Project Structure

```
src/
├── core/                 # Core functionality
│   ├── fileManager.ts   # File operations
│   ├── workflowManager.ts # Workflow logic
│   └── uiManager.ts     # UI management
├── extension.ts         # Extension entry point
├── specPanelProvider.ts # Tree view provider
└── test/               # Test files
```

### Key Concepts

- **Spec Workflow**: Requirements → Design → Tasks → Implementation
- **Phase Management**: Tracking and transitioning between development phases
- **Copilot Integration**: Generating context-aware prompts
- **File Organization**: Managing spec files in `.kiro/specs/` structure

### VS Code Extension APIs

- [Extension API](https://code.visualstudio.com/api/references/vscode-api)
- [Contribution Points](https://code.visualstudio.com/api/references/contribution-points)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Getting Help

- **Documentation**: Check the [Wiki](https://github.com/spec-dev-tools/vscode-spec-driven-development/wiki)
- **Discussions**: Use [GitHub Discussions](https://github.com/spec-dev-tools/vscode-spec-driven-development/discussions)
- **Issues**: Search [existing issues](https://github.com/spec-dev-tools/vscode-spec-driven-development/issues)
- **Email**: Contact us at contact@spec-dev-tools.com

## Recognition

Contributors will be recognized in:

- Release notes for significant contributions
- README.md contributors section
- GitHub contributors graph

Thank you for helping make Spec-Driven Development better for everyone!
