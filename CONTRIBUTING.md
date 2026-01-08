# Contributing to TabTimeMachine

Thank you for your interest in contributing to TabTimeMachine! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Windows 10 or later
- Python 3.7+
- Chrome or Edge browser
- Git
- Text editor (VS Code, Sublime, etc.)

### Initial Setup
1. Fork and clone the repository
2. Build the native host: `cd native-host && build.bat`
3. Load extension in Chrome/Edge developer mode
4. Install native host with your extension ID

## Project Structure

```
vICTOR-LIBRARY/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker (main logic)
├── options.html           # Options UI
├── options.js             # Options logic
├── icons/                 # Extension icons
├── native-host/           # Native messaging host
│   ├── tabtimemachine_host.py
│   ├── build.bat
│   ├── install.bat
│   └── uninstall.bat
└── docs/                  # Documentation
    ├── README.md
    ├── QUICKSTART.md
    ├── SMOKE_TEST.md
    ├── TROUBLESHOOTING.md
    └── ARCHITECTURE.md
```

## Making Changes

### Code Style

**JavaScript:**
- Use 2 spaces for indentation
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants
- Add comments for complex logic
- Use async/await over promises

**Python:**
- Follow PEP 8
- Use 4 spaces for indentation
- Add docstrings for functions
- Use type hints where appropriate

### Testing Your Changes

Before submitting:

1. **Test extension functionality**:
   - Load unpacked extension
   - Test all features
   - Check browser console for errors
   - Verify no regressions

2. **Test native host**:
   - Rebuild after Python changes
   - Test folder selection
   - Test file writing
   - Verify atomic operations

3. **Run smoke tests**:
   - Follow SMOKE_TEST.md checklist
   - Test all modified features
   - Test edge cases

4. **Cross-browser testing**:
   - Test in Chrome
   - Test in Edge
   - Verify both work identically

### Commit Guidelines

- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers if applicable
- Keep commits focused and atomic

Example:
```
Add support for custom PDF paper sizes

- Add paperSize option to settings
- Update options UI with size selector
- Pass paper dimensions to printToPDF
- Update documentation

Fixes #123
```

## Types of Contributions

### Bug Fixes
1. Check if bug is already reported
2. Reproduce the bug
3. Create a failing test (if applicable)
4. Fix the bug
5. Verify fix works
6. Submit PR with clear description

### New Features
1. Open an issue to discuss feature first
2. Get feedback on approach
3. Implement feature
4. Add tests
5. Update documentation
6. Submit PR

### Documentation
1. Fix typos, improve clarity
2. Add examples
3. Update for new features
4. Add troubleshooting tips
5. Improve installation guides

### Performance Improvements
1. Profile current performance
2. Identify bottleneck
3. Implement optimization
4. Measure improvement
5. Ensure no functionality changes

## Pull Request Process

1. **Before PR**:
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Test thoroughly
   - Update documentation

2. **Create PR**:
   - Clear title and description
   - Reference related issues
   - List changes made
   - Include screenshots if UI changes
   - Mark as draft if incomplete

3. **After PR**:
   - Respond to review comments
   - Make requested changes
   - Keep PR up to date with main
   - Wait for approval

4. **PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update

## Testing
- [ ] Tested in Chrome
- [ ] Tested in Edge
- [ ] Ran smoke tests
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes
```

## Reporting Issues

### Bug Reports
Include:
- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser version
- Extension version
- Python version
- Error messages/logs
- Screenshots if relevant

### Feature Requests
Include:
- Clear description
- Use case
- Proposed solution
- Alternative approaches
- Impact on existing features

## Development Tips

### Debugging Extension
```javascript
// In background worker console:
chrome.storage.local.get(null, console.log);  // View all settings

// Force a capture:
captureSession();

// Test catch-up:
chrome.storage.local.set({lastCaptureTime: Date.now() - 40*60*1000});
```

### Debugging Native Host
Add logging to tabtimemachine_host.py:
```python
import logging
logging.basicConfig(filename='C:\\temp\\host.log', level=logging.DEBUG)
logging.debug(f'Received message: {message}')
```

### Testing Native Messaging
```bash
# Test host directly:
echo {"action":"selectFolder"} | python tabtimemachine_host.py
```

### Quick Rebuild Cycle
1. Make changes to background.js
2. Go to chrome://extensions/
3. Click reload button for TabTimeMachine
4. Test changes

For native host:
1. Make changes to tabtimemachine_host.py
2. Run build.bat
3. Restart browser
4. Test changes

## Code Review Guidelines

When reviewing PRs:
- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve if changes are good enough
- Request changes if issues found
- Ask questions if unclear

## Release Process

1. Update version in manifest.json
2. Update CHANGELOG.md
3. Test all features
4. Create release branch
5. Build native host
6. Tag release
7. Create GitHub release
8. Attach .zip with extension files

## Getting Help

- Check existing documentation
- Search closed issues
- Ask in issue comments
- Be patient and respectful

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Thanked publicly

Thank you for contributing! 🎉
