# Contributing to SmartDocs

Thank you for your interest in contributing to SmartDocs! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/smartdocs-workspace
   cd smartdocs-workspace
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm build
   ```

4. **Test your changes**
   ```bash
   cd packages/smartdocs
   node dist/cli.js --help
   ```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or npm
- Git

### Project Structure
```
smartdocs-workspace/
├── packages/
│   └── smartdocs/           # Main package
│       ├── src/
│       │   ├── cli.ts       # CLI entry point
│       │   ├── commands/    # Command implementations
│       │   ├── scan/        # Code scanning logic
│       │   └── generate/    # Documentation generation
│       └── templates/       # Site templates
├── package.json             # Workspace configuration
├── pnpm-workspace.yaml     # pnpm workspace config
└── README.md
```

### Build Process
```bash
# Build all packages
pnpm -r build

# Watch mode for development
pnpm -r dev

# Test the CLI
cd packages/smartdocs
node dist/cli.js init
```

## 📝 Making Changes

### Code Style
- Use TypeScript for all new code
- Follow existing code style and formatting
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

### Testing Your Changes
1. **Create a test project**
   ```bash
   mkdir test-project
   cd test-project
   npm init -y
   ```

2. **Test the CLI commands**
   ```bash
   # Test init
   node ../smartdocs-workspace/packages/smartdocs/dist/cli.js init
   
   # Test build
   node ../smartdocs-workspace/packages/smartdocs/dist/cli.js build
   
   # Test check
   node ../smartdocs-workspace/packages/smartdocs/dist/cli.js check
   ```

3. **Test with real components**
   - Create sample React components
   - Test prop extraction
   - Verify JSDoc parsing
   - Check Storybook integration

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment information**:
   - Node.js version
   - Operating system
   - Package version
5. **Code samples** or minimal reproduction case

### Bug Report Template
```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Run `smartdocs init`
2. Create component with props
3. Run `smartdocs build`
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Node.js: v18.17.0
- OS: Windows 11
- SmartDocs: v0.1.0

## Additional Context
Any other context about the problem.
```

## ✨ Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and motivation
3. **Provide examples** of how it would work
4. **Consider implementation complexity**

### Feature Request Template
```markdown
## Feature Description
A clear description of what you want to happen.

## Use Case
Describe the problem this feature would solve.

## Proposed Solution
Describe how you'd like this feature to work.

## Alternatives
Any alternative solutions you've considered.

## Additional Context
Any other context or screenshots.
```

## 🔧 Areas for Contribution

### High Priority
- **Framework support**: Vue.js, Svelte, Angular adapters
- **Additional parsers**: Flow types, PropTypes
- **Template themes**: Multiple design options
- **Performance**: Faster scanning for large codebases

### Medium Priority
- **Plugins system**: Custom scanners and generators
- **Internationalization**: Multi-language support
- **Advanced search**: Filters, sorting, categories
- **Export formats**: PDF, Word, etc.

### Documentation
- **Examples**: More real-world examples
- **Tutorials**: Step-by-step guides
- **API documentation**: Detailed API reference
- **Video content**: Screencasts and demos

## 📋 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
   
   Use conventional commit format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code refactoring
   - `test:` for adding tests

4. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Add screenshots for UI changes

### Pull Request Template
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Fixes #123
```

## 🧪 Testing Guidelines

### Manual Testing
1. **Test all CLI commands**
   - `smartdocs init`
   - `smartdocs build`
   - `smartdocs dev`
   - `smartdocs check`

2. **Test different project structures**
   - Create React App
   - Next.js projects
   - Vite projects
   - Custom webpack setups

3. **Test component types**
   - Function components
   - Class components
   - TypeScript interfaces
   - PropTypes

### Automated Testing
```bash
# Run existing tests
pnpm test

# Add new tests
# Create test files alongside source files
# Use .test.ts or .spec.ts extensions
```

## 📚 Documentation

### README Updates
- Keep examples current
- Update feature lists
- Verify all links work
- Check code samples

### Code Documentation
- Add JSDoc comments for all public APIs
- Document complex algorithms
- Explain design decisions
- Include usage examples

## 🎯 Code Review Guidelines

### For Contributors
- **Small, focused PRs** are easier to review
- **Self-review** your code before submitting
- **Respond promptly** to review feedback
- **Test thoroughly** before marking as ready

### For Reviewers
- **Be constructive** and helpful
- **Focus on the code**, not the person
- **Explain reasoning** behind suggestions
- **Approve promptly** when ready

## 🌟 Recognition

Contributors will be:
- Listed in the README contributors section
- Mentioned in release notes
- Invited to join the maintainers team (for significant contributions)

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: [Join our community](https://discord.gg/smartdocs) (coming soon)

## 📄 License

By contributing to SmartDocs, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to SmartDocs! 🎉**