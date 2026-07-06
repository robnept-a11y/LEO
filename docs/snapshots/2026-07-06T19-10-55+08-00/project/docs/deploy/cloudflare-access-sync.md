# Cloudflare Access 自动同步

本文档记录 LEO 使用“外部邮箱名单 + GitHub Actions + Cloudflare API”维护访问许可名单的方案。

## 目标

- 网站继续由 Cloudflare Pages 发布。
- 访问权限由 Cloudflare Access 控制。
- 许可邮箱名单通过自动机制同步到 Cloudflare Access Group。
- 真实邮箱名单不提交到公开仓库。

## GitHub Secrets

在 GitHub 仓库中进入：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

创建以下 Secret：

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
LEO_ALLOWED_EMAILS_JSON
```

`CLOUDFLARE_ACCOUNT_ID` 当前可使用：

```text
1aa43533820c5e84e194b434051e79d6
```

`LEO_ALLOWED_EMAILS_JSON` 示例：

```json
{
  "emails": [
    "reader@example.com",
    "editor@example.com"
  ]
}
```

## Cloudflare API Token 权限

API Token 需要能够读取和写入 Cloudflare Access Group。建议使用包含以下能力的 Token：

```text
Access: Groups Read
Access: Groups Write
```

如果界面显示旧权限名称，可选择：

```text
Access: Organizations, Identity Providers, and Groups Write
```

Token 的资源范围限制在当前 Cloudflare 账号即可。

## GitHub Actions

工作流文件：

```text
.github/workflows/sync-cloudflare-access.yml
```

触发方式：

- 推送 `docs/access/**`
- 推送同步脚本或工作流本身
- 手动运行 `workflow_dispatch`

如果没有配置 Secret，工作流会跳过同步，不会修改 Cloudflare。

## 本地调试

先准备本地邮箱名单：

```powershell
Copy-Item docs/access/allowed-emails.example.json docs/access/allowed-emails.json
```

只检查将要同步的内容：

```powershell
node scripts/sync-cloudflare-access-group.js --dry-run
```

真正同步需要设置：

```powershell
$env:CLOUDFLARE_API_TOKEN="你的 API Token"
$env:CLOUDFLARE_ACCOUNT_ID="1aa43533820c5e84e194b434051e79d6"
node scripts/sync-cloudflare-access-group.js
```

## Cloudflare Access 策略

Cloudflare Zero Trust 中仍需存在一个保护 `life-ethic-outline.pages.dev` 的 Access Application，并在策略里允许：

```text
Access Group: LEO Readers
```

完成后，后续许可邮箱名单变化就可以由 GitHub Actions 自动同步到该组。
