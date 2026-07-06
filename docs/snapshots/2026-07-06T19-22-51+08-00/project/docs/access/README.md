# 访问许可邮箱名单

本目录用于说明 LEO 公网站点的访问许可名单管理方式。

## 推荐方式

推荐把真实邮箱名单保存到 GitHub Secret：

```text
LEO_ALLOWED_EMAILS_JSON
```

内容格式：

```json
{
  "emails": [
    "reader@example.com",
    "editor@example.com"
  ]
}
```

这样可以避免把真实邮箱提交到公开仓库。

## 本地方式

如果需要在本地调试，可以复制示例文件：

```powershell
Copy-Item docs/access/allowed-emails.example.json docs/access/allowed-emails.json
```

然后编辑：

```text
docs/access/allowed-emails.json
```

该文件已被 `.gitignore` 忽略，不应提交到仓库。

## 同步目标

同步脚本会维护一个 Cloudflare Access Group：

```text
LEO Readers
```

Cloudflare Access 的访问策略应引用这个组。以后只要更新许可邮箱名单并触发工作流，该组就会被自动创建或更新。
