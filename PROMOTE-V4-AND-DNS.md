# PROMOTE-V4-AND-DNS.md — V4 上線 + 域名切換 runbook

記錄 v4 由 preview 扶正做 live，以及將 `www.chanchingman.com` 由 Wix 切去
GitHub Pages 的完整流程、DNS 照抄清單、驗證與還原方法。
建立日期：2026-09-10。

---

## 1. 背景 / 現狀

| 項目 | 值 |
|---|---|
| Registrar（域名註冊商） | GoDaddy.com, LLC（2016 註冊，2029 到期） |
| DNS host（管記錄） | Wix — nameserver `ns12.wixdns.net` / `ns13.wixdns.net` |
| 目標 | 域名指向 GitHub Pages 上的 v4（自建靜態站） |
| GitHub Pages 站根 | https://mankit018-commits.github.io/chanchingman-website/ |
| Deploy 分支 | `master`（push 觸發 `.github/workflows/pages.yml`） |

v4 = v3 內容 + v2 色調/字體。

---

## 2. 已完成（GitHub 部分）

已 commit + push 到 `master`，Pages 已部署並驗證：

- `cc1e0dd` Add v4：`index-v4.html`（v3 內容，retarget `styles-v4.css`）
  + `styles-v4.css`（v2 樣式 + v3 專屬 section 重新套 v2 色調）。
- `75b90b5` Promote v4 to live：
  - `index.html` ← v4 build（robots 改回 index,follow；移除 preview 註解；
    link 指 `styles.css`；title 去除 (v4)；JSON-LD 逐字不變，CSP sha256 有效）。
  - `styles.css` ← v4 stylesheet。
  - `CNAME` = `www.chanchingman.com`（GitHub Pages 綁定自訂域名）。

驗證過：JSON-LD 與來源一致、0 個 inline on* handler、`<div>` 平衡 211/211、
可 index、link `styles.css`；Pages 首頁已 serve v4。

> 注意：因 DNS 未切，GitHub repo Settings → Pages 可能顯示自訂域名尚未驗證
> （"not properly configured"），屬正常；DNS 切好後會轉綠並自動簽發 HTTPS。

---

## 3. DNS 現狀備份（切換前，Wix DNS Records）

還原用。切換前的原始值：

### A（主機） apex `chanchingman.com`（指向 Wix）
```
chanchingman.com   185.230.63.171   1 小時
chanchingman.com   185.230.63.186   1 小時
chanchingman.com   185.230.63.107   1 小時
```

### CNAME（別名）
```
email.chanchingman.com   email.secureserver.net   1 小時   ← 電郵，勿動
en.chanchingman.com      cdn3.wixdns.net          1 小時   ← Wix 多語言
www.chanchingman.com     cdn3.wixdns.net          1 小時   ← 要改
zh.chanchingman.com      gcdn0.wixdns.net         1 小時   ← Wix 多語言
```

---

## 4. DNS 照抄清單（在 Wix DNS Records 內修改）

目標：`www` 與 apex 指向 GitHub Pages。**逐格照抄。**

### 改動 1 — CNAME `www`
| 欄位 | 由 | 改成 |
|---|---|---|
| 主機名稱 | www | www（不變） |
| 值 | `cdn3.wixdns.net` | `mankit018-commits.github.io` |
| TTL | 1 小時 | 1 小時（不變） |

### 改動 2 — A（apex `@` / chanchingman.com）
把 3 個舊 Wix A record 改成 GitHub 的 4 個 IP（改 3 個 + 新增 1 個）：

| 主機 | 新值 |
|---|---|
| @ (chanchingman.com) | `185.199.108.153` |
| @ (chanchingman.com) | `185.199.109.153` |
| @ (chanchingman.com) | `185.199.110.153` |
| @ (chanchingman.com) | `185.199.111.153` |

完成後 apex 應**剛好 4 個** A record，全部 `185.199.108/109/110/111.153`，
**不可再有** `185.230.63.x`。

### 不要動
- `email.chanchingman.com → email.secureserver.net`（電郵，動了會收不到信）。
- `en` / `zh`（Wix 多語言）：切走 Wix 後會失效但不影響主站；日後可刪。

---

## 5. 驗證（改完等幾分鐘～1 小時 TTL）

DNS 是否切到 GitHub：
```powershell
Resolve-DnsName www.chanchingman.com -Type CNAME   # 應見 mankit018-commits.github.io
Resolve-DnsName chanchingman.com     -Type A       # 應見 185.199.108/109/110/111.153
```

網站是否 serve v4（DNS 生效後）：
```powershell
$r = Invoke-WebRequest 'https://www.chanchingman.com/' -UseBasicParsing
$r.StatusCode                                   # 200
$r.Content -match 'Selected Experience'         # True（v3 內容）
$r.Content -match 'href="styles\.css"'          # True
```

GitHub 端：repo Settings → Pages
- 自訂域名 `www.chanchingman.com` 轉綠 / verified。
- 勾選 "Enforce HTTPS"（憑證簽發可能要多等一陣）。

---

## 6. 還原（若要切回 Wix）

在 Wix DNS Records 改回第 3 節備份值：
- `www` CNAME 值改回 `cdn3.wixdns.net`。
- apex A records 改回 `185.230.63.171` / `.186` / `.107`（刪去 4 個 GitHub IP）。
DNS 傳播後恢復由 Wix serve。

---

## 7. 尚待處理 / 注意

- **DNS 改動須本人在 Wix 後台手動執行**（高影響、直接改動 live 域名）。
- 切走後 Wix 上獨有內容（表單記錄、Wix blog、Wix SEO/redirect）不會自動存在於 v4。
- 切換成功且穩定後，可考慮退訂 Wix plan（但域名若在 Wix 買則需先處理域名續期歸屬；本域名 registrar 為 GoDaddy）。
- GoDaddy 登入遺失：如日後需改 nameserver 才用得着，可在 https://sso.godaddy.com 用註冊 email 走 "Forgot username" / "Reset password"。走 Wix 改記錄則無需 GoDaddy。
