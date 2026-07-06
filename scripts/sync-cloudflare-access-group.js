#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const API_BASE = "https://api.cloudflare.com/client/v4";
const DEFAULT_ACCOUNT_ID = "1aa43533820c5e84e194b434051e79d6";
const DEFAULT_GROUP_NAME = "LEO Readers";
const LOCAL_EMAILS_FILE = path.join("docs", "access", "allowed-emails.json");

function readJson(value, sourceName) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${sourceName} 不是有效的 JSON：${error.message}`);
  }
}

function extractEmails(input, sourceName) {
  const values = Array.isArray(input) ? input : input && input.emails;
  if (!Array.isArray(values)) {
    throw new Error(`${sourceName} 必须是 JSON 数组，或包含 emails 数组的对象。`);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalized = values
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);

  const invalid = normalized.filter((email) => !emailPattern.test(email));
  if (invalid.length > 0) {
    throw new Error(`邮箱格式无效：${invalid.join(", ")}`);
  }

  return [...new Set(normalized)].sort();
}

function loadAllowedEmails() {
  if (process.env.LEO_ALLOWED_EMAILS_JSON) {
    return extractEmails(
      readJson(process.env.LEO_ALLOWED_EMAILS_JSON, "LEO_ALLOWED_EMAILS_JSON"),
      "LEO_ALLOWED_EMAILS_JSON"
    );
  }

  if (fs.existsSync(LOCAL_EMAILS_FILE)) {
    return extractEmails(
      readJson(fs.readFileSync(LOCAL_EMAILS_FILE, "utf8"), LOCAL_EMAILS_FILE),
      LOCAL_EMAILS_FILE
    );
  }

  return [];
}

async function cloudflareRequest(pathname, options = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const response = await fetch(`${API_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.success === false) {
    const messages = data && data.errors ? data.errors.map((item) => item.message).join("; ") : response.statusText;
    throw new Error(`Cloudflare API 请求失败：${response.status} ${messages}`);
  }

  return data.result;
}

function buildGroupPayload(groupName, emails) {
  return {
    name: groupName,
    include: emails.map((email) => ({ email: { email } })),
    exclude: [],
    require: [],
    is_default: false,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
  const groupName = process.env.CLOUDFLARE_ACCESS_GROUP_NAME || DEFAULT_GROUP_NAME;
  const emails = loadAllowedEmails();

  if (emails.length === 0) {
    console.log("没有找到许可邮箱名单，已跳过 Cloudflare Access Group 同步。");
    console.log(`可设置 LEO_ALLOWED_EMAILS_JSON，或创建本地文件 ${LOCAL_EMAILS_FILE}。`);
    return;
  }

  const payload = buildGroupPayload(groupName, emails);
  console.log(`准备同步 Cloudflare Access Group：${groupName}`);
  console.log(`许可邮箱数量：${emails.length}`);

  if (dryRun) {
    console.log("当前为 dry-run，不会调用 Cloudflare API。");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (!token) {
    console.log("没有设置 CLOUDFLARE_API_TOKEN，已跳过 Cloudflare Access Group 同步。");
    return;
  }

  const groups = await cloudflareRequest(`/accounts/${accountId}/access/groups`);
  const existing = groups.find((group) => group.name === groupName);

  if (existing) {
    await cloudflareRequest(`/accounts/${accountId}/access/groups/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    console.log(`已更新 Access Group：${groupName}`);
  } else {
    await cloudflareRequest(`/accounts/${accountId}/access/groups`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log(`已创建 Access Group：${groupName}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
