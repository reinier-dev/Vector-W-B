# Contributing to Vector W&B

Thank you for your interest in contributing to Vector W&B! This document provides guidelines and instructions for contributing to this project.

## Git Flow Workflow

This project uses **Git Flow** as its branching model. Please familiarize yourself with this workflow before contributing.

### Branch Structure

- **main** - Production-ready code. Only releases and hotfixes are merged here.
- **develop** - Main development branch. All features are merged here first.
- **feature/** - Feature branches for new functionality
- **release/** - Release preparation branches
- **hotfix/** - Emergency fixes for production
- **bugfix/** - Bug fixes for develop branch

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/reinier-dev/Vector-W-B.git
   cd Vector-W-B
   ```

2. **Install Git Flow** (if not already installed)
   ```bash
   # macOS
   brew install git-flow-avh

   # Linux
   apt-get install git-flow

   # Windows
   # Download from: https://github.com/petervanderdoes/gitflow-avh
   ```

3. **Initialize Git Flow** (already configured)
   ```bash
   git flow init -d
   ```

## Development Workflow

### Creating a New Feature

1. **Start a new feature branch**
   ```bash
   git flow feature start feature-name
   ```
   This creates a branch `feature/feature-name` from `develop`

2. **Work on your feature**
   ```bash
   # Make your changes
   git add .
   git commit -m "Add feature description"
   ```

3. **Finish the feature**
   ```bash
   git flow feature finish feature-name
   ```
   This merges your feature into `develop` and deletes the feature branch

4. **Push changes**
   ```bash
   git push origin develop
   ```

### Creating a Release

1. **Start a release branch**
   ```bash
   git flow release start 1.1.0
   ```

2. **Prepare the release** (update version numbers, changelog, etc.)
   ```bash
   # Update version in README.md
   # Update CHANGELOG.md
   git add .
   git commit -m "Prepare release 1.1.0"
   ```

3. **Finish the release**
   ```bash
   git flow release finish 1.1.0
   ```
   This merges into both `main` and `develop`, and creates a tag

4. **Push everything**
   ```bash
   git push origin main
   git push origin develop
   git push origin --tags
   ```

### Hotfix for Production

1. **Start a hotfix**
   ```bash
   git flow hotfix start 1.0.1
   ```

2. **Fix the issue**
   ```bash
   # Make your fix
   git add .
   git commit -m "Fix critical bug description"
   ```

3. **Finish the hotfix**
   ```bash
   git flow hotfix finish 1.0.1
   ```

4. **Push changes**
   ```bash
   git push origin main
   git push origin develop
   git push origin --tags
   ```

### Bug Fixes (non-critical)

1. **Start a bugfix branch**
   ```bash
   git flow bugfix start bug-description
   ```

2. **Fix the bug**
   ```bash
   git add .
   git commit -m "Fix bug description"
   ```

3. **Finish the bugfix**
   ```bash
   git flow bugfix finish bug-description
   ```

## Commit Message Guidelines

Follow these conventions for commit messages:

```
<type>: <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
git commit -m "feat: add fuel tank reordering with drag-and-drop"
git commit -m "fix: correct CG calculation for metric units"
git commit -m "docs: update installation instructions"
```

## Code Style Guidelines

### JavaScript
- Use ES5+ compatible syntax for broad browser support
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code formatting

### CSS
- Use vendor prefixes for cross-browser compatibility
- Follow BEM naming convention where applicable
- Keep selectors specific but not overly complex

### HTML
- Use semantic HTML5 elements
- Ensure accessibility (ARIA labels, alt text, etc.)
- Keep structure clean and organized

## Testing

Before submitting a pull request:

1. **Test in multiple browsers**
   - Chrome/Edge
   - Firefox
   - Safari
   - IE11 (if possible)

2. **Test both light and dark modes**

3. **Test both Imperial and Metric units**

4. **Verify responsive design** (mobile, tablet, desktop)

5. **Check console for errors**

## Pull Request Process

1. **Create a feature branch** using Git Flow
2. **Make your changes** following the code style guidelines
3. **Test thoroughly** in multiple browsers
4. **Update documentation** if needed
5. **Commit with clear messages**
6. **Push to your fork**
7. **Create a Pull Request** to the `develop` branch
8. **Wait for review** and address any feedback

### Pull Request Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Code refactoring

## Testing
- [ ] Tested in Chrome/Edge
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Tested in IE11
- [ ] Tested light/dark modes
- [ ] Tested Imperial/Metric units
- [ ] Tested on mobile devices

## Screenshots (if applicable)
Add screenshots to demonstrate changes

## Related Issues
Closes #issue_number
```

## Reporting Issues

When reporting issues, please include:

1. **Browser and version**
2. **Operating system**
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Screenshots or error messages**

## Questions?

If you have questions about contributing, please open an issue with the label `question`.

## License

By contributing to Vector W&B, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Vector W&B! 🛩️

**Maintainer**: [@reinier-dev](https://github.com/reinier-dev)