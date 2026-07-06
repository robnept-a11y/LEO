# Git 与 Cloudflare Pages 自动部署

## 目标

LEO 使用 Git 保存历史版本，并由 Cloudflare Pages 在每次推送后自动构建和发布。

## 当前发布状态

```text
GitHub repository: robnept-a11y/LEO
Cloudflare Pages project: life-ethic-outline
Public URL: https://life-ethic-outline.pages.dev/
Production branch: main
```

## 推荐流程

```text
本地修改文档
→ 保存变更前快照
→ 更新 Change Log
→ git commit
→ git push
→ Cloudflare Pages 自动构建
→ 公网站点更新
```

## Cloudflare Pages 构建设置

```text
Framework preset: None
Build command: node build-static.js
Build output directory: dist
Root directory: /
```

## GitHub 仓库建议

推荐仓库名：

```text
life-ethic-outline
```

当前仓库名：

```text
LEO
```

如果希望项目公开访问，仓库可以设为 Public。  
如果希望源码暂时不公开，仓库可以设为 Private，Cloudflare Pages 仍可通过授权读取仓库。

## 每次内容更新要求

每次更新正式内容前，应保存变更前快照。

每次更新正式内容后，应更新：

```text
docs/change-log/index.json
```

然后提交到 Git。
