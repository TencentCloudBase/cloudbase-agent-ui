module.exports = {
  types: [
    { type: "feat", section: "✨ Features | 新功能" },
    { type: "fix", section: "🐛 Bug Fixes | Bug 修复" },
    { type: "perf", section: "⚡ Performance Improvements | 性能优化" },
    { type: "revert", section: "⏪ Reverts | 回退" },
    { type: "chore", section: "📦 Chores | 其他更新" },
    { type: "docs", section: "📝 Documentation | 文档" },
    { type: "style", section: "💄 Styles | 风格" },
    { type: "refactor", section: "♻️ Code Refactoring | 代码重构" },
    { type: "test", section: "✅ Tests | 测试" },
  ],
  // 新增配置
  gitRawCommitsOpts: {
    from: "HEAD~10", // 只获取最近10次提交
    to: "HEAD",
  },
  // 其他有用的配置
  skip: {
    changelog: false,
  },
  preset: "conventionalcommits",
  tagPrefix: "v",
};
