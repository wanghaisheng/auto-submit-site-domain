# 多层级订阅系统说明

本文档详细介绍了自动提交站点域名工具的多层级订阅系统，包括各个级别的功能和限制。

## 订阅级别概述

系统提供三个订阅级别，满足不同规模用户的需求：

1. **基础版** - 每月5.99美元，适合个人网站和小型项目
2. **高级版** - 适合小型企业和多个网站的管理
3. **企业版** - 适合大型企业和需要处理大量URL的用户

## 各级别功能对比

| 功能 | 基础版 | 高级版 | 企业版 |
|------|-------|--------|--------|
| 价格 | $5.99/月 | $19.99/月 | $49.99/月 |
| 最大域名数 | 无限制 | 无限制 | 无限制 |
| 每域名最大URL数 | 1,000 | 5,000 | 无限制 |
| 支持的搜索引擎 | Google | Google, Bing | Google, Bing, Yandex |
| 支持的域名提供商 | Cloudflare | Cloudflare, Namecheap | Cloudflare, Namecheap, GoDaddy |
| 高级功能 | ✅ | ✅ | ✅ |
| 批量处理 | ❌ | ✅ | ✅ |
| API访问 | ❌ | ❌ | ✅ |
| Cloudflare Worker支持 | ❌ | ❌ | ✅ |

## 许可证密钥格式

许可证密钥格式为：`[计划]-[客户ID]-[日期]-[随机字符串]`

例如：
- 基础版：`basic-12345-20230615-a1b2c3d4e5f6`
- 高级版：`premium-67890-20230615-g7h8i9j0k1l2`
- 企业版：`enterprise-13579-20230615-m3n4o5p6q7r8`

所有订阅计划都需要有效的许可证密钥才能使用。

## 企业版功能详解

### Cloudflare Worker批量处理

企业版用户可以使用Cloudflare Worker API处理大量URL和域名，突破GitHub Actions的运行时间限制。

#### 使用方法

1. 设置环境变量：
   ```
   CLOUDFLARE_WORKER_URL=https://your-worker-url.workers.dev
   LICENSE_KEY=your-enterprise-license-key
   ```

2. 使用企业客户端提交URL：
   ```bash
   python enterprise_client.py urls large_url_list.txt
   ```

3. 使用企业客户端提交域名：
   ```bash
   python enterprise_client.py domains large_domain_list.txt
   ```

### 工作原理

1. 企业客户端将大量URL或域名发送到Cloudflare Worker
2. Cloudflare Worker验证企业许可证
3. Worker将URL或域名分割成较小的批次（每批最多10,000个URL）
4. Worker为每个批次触发GitHub Actions工作流
5. GitHub Actions工作流处理每个批次并提交到搜索引擎

## 升级订阅

要升级您的订阅，请联系我们的销售团队获取新的许可证密钥。升级后，只需在配置中更新许可证密钥即可立即获得更高级别的功能。

## 配置示例

### config.json

```json
{
  "domain_whitelist": [],
  "domain_blacklist": [],
  "use_domain_file": false,
  "domain_file_path": "domains_list.txt",
  "url_limit_per_domain": 1000,
  "submit_not_indexed": true,
  "submit_sitemap": true,
  "split_large_domains": false,
  "max_urls_per_piece": 10000,
  "license_key": "your-license-key-here",
  "subscription_plan": "enterprise",
  "enable_cloudflare_worker": true,
  "cloudflare_worker_url": "https://auto-submit.your-worker.workers.dev"
}
```

### .env文件

```
# License key for premium features
LICENSE_KEY=your-license-key-here

# Enterprise features - Cloudflare Worker
CLOUDFLARE_WORKER_URL=https://auto-submit.your-worker.workers.dev
GITHUB_TOKEN=your_github_token_here
```