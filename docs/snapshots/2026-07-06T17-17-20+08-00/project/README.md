# LEO

LEO 是 Life Ethic Outline 的缩写，中文名称为“伦理大纲”。

## 本地查看器

启动本地站点：

```powershell
node server.js
```

打开：

```text
http://127.0.0.1:4173
```

当前查看器读取 `docs/leo-project-baseline/index.json`，再按索引加载对应章节文件。

## Cloudflare Pages 发布

生成静态发布目录：

```powershell
node build-static.js
```

预览静态发布目录：

```powershell
node preview-static.js
```

Cloudflare Pages 推荐设置：

```text
Build command: node build-static.js
Build output directory: dist
```

详细说明见：

```text
docs/deploy/cloudflare-pages.md
```

## Change Log 与快照

更新记录保存在：

```text
docs/change-log/index.json
```

历史快照保存在：

```text
docs/snapshots
```

每次正式更新前，应先保存变更前完整快照，再把更新时间、更新者、更新范围、更新理由和快照位置写入 Change Log。
