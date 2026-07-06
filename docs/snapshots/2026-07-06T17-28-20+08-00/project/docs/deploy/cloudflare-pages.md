# Cloudflare Pages 发布说明

## 目标

将 LEO 发布为 Cloudflare Pages 静态站点，并在以后绑定易读域名。

## 本地构建

在项目根目录运行：

```powershell
node build-static.js
```

构建结果位于：

```text
dist
```

## Cloudflare Pages 设置

推荐设置：

```text
Build command: node build-static.js
Build output directory: dist
Root directory: /
```

## 数据来源

Cloudflare Pages 上没有本地 API。发布版站点读取：

```text
dist/data/docs
dist/data/change-log
```

本地预览时，站点优先读取：

```text
/api/index
/api/doc
/api/changelog
```

如果 API 不可用，前端会回退到静态数据路径。

## 易读域名

后续可以在 Cloudflare Pages 的 Custom domains 中绑定域名，例如：

```text
leo.example.com
```

域名问题可以在项目内容结构稳定后再处理。

