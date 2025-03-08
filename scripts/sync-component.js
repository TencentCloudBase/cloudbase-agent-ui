const fs = require("fs-extra");
const path = require("path");

async function syncComponent() {
  const sourceDir = path.join(__dirname, "../apps/miniprogram-agent-ui/miniprogram/components/agent-ui");
  const targetDir = path.join(__dirname, "../components/agent-ui");

  try {
    console.log("🔄 同步组件文件...");
    await fs.remove(targetDir);
    await fs.copy(sourceDir, targetDir);

    // Git操作
    const { execSync } = require("child_process");
    execSync("git add .");
    execSync('git commit -m "chore: sync agent-ui component before release"', { stdio: "inherit" });

    console.log("✅ 组件同步完成");
  } catch (err) {
    console.error("❌ 同步失败:", err);
    process.exit(1);
  }
}

syncComponent();
