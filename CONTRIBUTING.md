# Contributing to VATEFS

Thank you for your interest in contributing to VATEFS! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title** describing the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Screenshots** if applicable
5. **Environment details** (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please include:

1. **Clear description** of the feature
2. **Use case** explaining why it's needed
3. **Proposed implementation** if you have ideas

### Pull Requests

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the code style
4. **Test thoroughly** - ensure nothing breaks
5. **Commit** with clear messages (`git commit -m 'Add amazing feature'`)
6. **Push** to your fork (`git push origin feature/amazing-feature`)
7. **Open a Pull Request** with a description of changes

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/vatefs.git
cd vatefs
```

2. Install dependencies:
```bash
npm run install:all
```

3. Create a branch:
```bash
git checkout -b feature/your-feature-name
```

4. Start development servers:
```bash
npm run dev
```

## Code Style Guidelines

### JavaScript/Vue

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Follow Vue 3 Composition API patterns
- Use meaningful variable and function names

### Vue Components

- Use PascalCase for component names
- Use kebab-case in templates
- Keep components focused and single-purpose
- Use props for parent-child communication
- Use emits for child-parent communication

### Naming Conventions

- **Components**: PascalCase (e.g., `FlightStrip.vue`)
- **Files**: kebab-case (e.g., `socket-service.js`)
- **Variables/Functions**: camelCase (e.g., `createStrip`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_STRIPS`)

## Project Structure

```
vatefs/
├── backend/              # Node.js backend
│   └── server.js        # Main server file
├── frontend/            # Vue 3 frontend
│   └── src/
│       ├── components/  # Vue components
│       ├── services/    # Service modules
│       └── App.vue      # Root component
└── templates/           # Strip templates
```

## Testing

Before submitting a PR:

1. Test all existing functionality still works
2. Test your new feature/fix thoroughly
3. Test on different screen sizes (responsive design)
4. Test with multiple browser windows (WebSocket sync)
5. Check browser console for errors

## Commit Messages

Write clear, descriptive commit messages:

```
Add feature: Brief description

Longer description if needed explaining:
- What changed
- Why it changed
- Any breaking changes
```

Examples:
- `Add drag-and-drop support for strips`
- `Fix: WebSocket reconnection not working`
- `Update: Improve strip visual design`
- `Docs: Add installation instructions`

## Documentation

If you add new features:

1. Update README.md if needed
2. Add JSDoc comments to functions
3. Update relevant markdown files
4. Include inline comments for complex logic

## Questions?

Feel free to:
- Open an issue for discussion
- Reach out to maintainers
- Check existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.

---

Thank you for contributing to VATEFS! 🎉

