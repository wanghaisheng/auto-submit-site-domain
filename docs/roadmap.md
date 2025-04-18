# 项目功能路线图

## 已实现功能

1. 自动通过 Cloudflare/Namecheap/GoDaddy 等供应商 API 获取域名
2. 自动发现每个域名的 sitemap（通过 robots.txt 解析）
3. 递归解析 sitemap，收集所有页面 URL
4. 支持 fallback：无 sitemap 时自动抓取首页链接
5. 智能速率控制，避免触发 Google 验证码
6. 详细日志记录与状态跟踪
7. 支持 Google Search Console API 直接提交
8. 支持通过 site: 查询判断索引状态
9. 支持 GitHub Actions 自动化定时运行
10. 支持 Bing/Yandex 等多搜索引擎提交

## 优化方向

1. **缓存与增量更新优化**
   - 利用 GitHub Actions cache，缓存 domains.txt、urls.txt、index_database.json、sitemaps，减少重复解析和无效提交
   - 对 sitemap 文件做 hash 比较，仅在内容变更时重新解析
   - 支持 index_database 增量更新，避免重复检查已索引 URL

2. **多线程/异步处理**
   - 对 sitemap 解析和 URL 提交流程引入并发，提升处理效率（需注意 API 限流）

3. **SEO 检查与报告自动化**
   - 自动检测页面 SEO 关键项（如 canonical、meta robots、结构化数据等），生成报告
   - 检查 Google 重定向、noindex、404 等问题

4. **更智能的索引状态判断**
   - site: 查询结果结合页面内容、收录数等多维度判断
   - 支持自定义索引判定规则

5. **多语言与多站点支持增强**
   - 自动识别 sitemap 中的 hreflang、多语言页面
   - 支持多站点统一管理与分组报告

6. **通知与可视化**
   - 支持邮件/钉钉/微信等方式推送提交与收录结果
   - 生成可视化报表（如收录率趋势、提交成功率等）

7. **代码结构与配置优化**
   - 统一配置入口（如 config.json/.env），支持多环境切换
   - 脚本模块化，便于扩展和维护

8. **自动化测试与回归**
   - 增加单元测试和集成测试，保证主流程稳定
   - 关键功能变更自动回归测试

## 建议补充

- 提供详细的操作文档和常见问题解答
- 持续跟进搜索引擎 API/策略变化，及时适配