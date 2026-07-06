const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = __dirname;
const siteDir = path.join(rootDir, "site");
const docsDir = path.join(rootDir, "docs", "leo-project-baseline");
const changeLogDir = path.join(rootDir, "docs", "change-log");
const distDir = path.join(rootDir, "dist");

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

async function removeIfExists(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function build() {
  await removeIfExists(distDir);
  await copyDir(siteDir, distDir);

  await fs.mkdir(path.join(distDir, "data", "docs"), { recursive: true });
  await fs.mkdir(path.join(distDir, "data", "change-log"), { recursive: true });

  await copyDir(docsDir, path.join(distDir, "data", "docs"));
  await copyDir(changeLogDir, path.join(distDir, "data", "change-log"));

  console.log(`Cloudflare Pages 构建完成：${distDir}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
