# Daily Flow — Phase 4 Plan: Measure → Monetize → Grow

**Ngày:** 2026-06-02
**Trạng thái:** Plan
**Nguyên tắc:** *Đo trước, kiếm tiền sau.* App là **web (Next.js/Vercel)** → dùng **AdSense H5 Games Ads** (rewarded + interstitial), KHÔNG dùng AdMob (chỉ cho native).

> **Nghiên cứu (2025):** Rewarded video eCPM $10–50 (TB ~$16–19 US), xem hết 80–90%, 87% người chơi thích → "vua" casual ads. Interstitial thấp hơn 2–3×, chỉ ở điểm nghỉ. Banner thấp nhất, dễ bẩn UI. Cap 6–10 rewarded/phiên, 15–20/ngày. (Tenjin 2025, AdReact, AdSense H5 Games Ads, CrazyGames docs.)

---

## Thứ tự ưu tiên
1. **4A — Analytics** (đo D1/D7, share, completion, hint) — *làm trước để biết có đáng monetize*.
2. **4B — Ad-ready rewarded scaffolding (stub)** — "Xem QC +1 gợi ý", chạy stub, sẵn sàng cắm network.
3. **4C — Compliance + bật ads thật** — Privacy Policy, CMP, ads.txt, custom domain, AdSense/H5 duyệt → thay stub bằng API thật + interstitial giữa Endless.
4. **4D — Leaderboard** (cần backend nhẹ) — social/viral.
5. **4E — Push "đừng mất chuỗi"** (web push).
6. **4F — IAP cosmetic** (theme packs) — sau cùng.

---

## 4A — Analytics (làm ngay)
**Mục tiêu:** biết retention/viral thật trước khi đổ công vào ads.
**Chọn:** `@vercel/analytics` (zero-config trên Vercel, không cần API key, privacy-friendly) + một **lớp trừu tượng `track()`** để sau đổi sang PostHog/GA chỉ sửa 1 file.
**File:**
```
src/ui/analytics.ts        # track(event, props) — wrap @vercel/analytics, no-op an toàn
src/app/layout.tsx         # <Analytics/> (pageviews)
```
**Sự kiện cần bắn:** `daily_win` (day, fasterThan, streak), `endless_win`, `share`, `hint_used`, `challenge_opened`, `onboarding_done`.
**Việc của bạn:** bật **Web Analytics** trong Vercel dashboard (Project → Analytics → Enable). track() no-op nếu chưa bật → an toàn.
**Done:** deploy → dashboard thấy pageviews + custom events.

---

## 4B — Ad-ready rewarded scaffolding (stub)
**Mục tiêu:** code sẵn sàng cho rewarded ad mà chưa cần network (chưa đủ traffic để AdSense duyệt).
**Thiết kế:** lớp trừu tượng `adProvider` với 2 cài đặt: `stubProvider` (giả lập "xem QC" 5s rồi reward) và (sau này) `adsenseProvider`. UI chỉ gọi `showRewarded(): Promise<boolean>`.
**File:**
```
src/ui/ads/ad-provider.ts     # interface AdProvider { showRewarded(): Promise<boolean> }
src/ui/ads/stub-provider.ts   # mô phỏng overlay "Đang xem QC… 5s" -> resolve(true)
src/ui/useRewardedHint.ts     # hết quota -> showRewarded -> +1 lượt hint
```
**UI:** khi `hintQuota.remaining === 0`, nút 💡 đổi thành **"🎁 Xem QC +1 gợi ý"** (opt-in, có thể bỏ qua) → gọi stub → +1 lượt.
**Best practice (CrazyGames/Google):** opt-in, có lựa chọn thay thế, không chain, vị trí cố định, không hiện khi đang vẽ.
**Done:** bấm "Xem QC" → overlay giả 5s → +1 lượt hint. Khi có network thật chỉ đổi provider.

---

## 4C — Compliance + bật ads thật (khi đủ traffic)
**Việc kỹ thuật (code):**
```
src/app/privacy/page.tsx   # trang Chính sách bảo mật
public/ads.txt             # google.com, pub-XXXX, DIRECT, f08c47fec0942fa0
src/ui/ads/adsense-provider.ts  # Ad Placement API: adBreak({type:'reward'}) / interstitial
```
**Việc ngoài code (của bạn):** mua **custom domain**; đăng ký **AdSense** + **H5 Games Ads beta**; cài **CMP** (consent GDPR) qua AdSense; chờ duyệt.
**Interstitial:** chèn giữa các màn **Endless** (mỗi ~3–5 màn), KHÔNG vào Daily.
**Done:** đổi `adProvider` từ stub → adsense; ads thật chạy; tuân thủ cap.

---

## 4D — Leaderboard (cần backend nhẹ)
**Mục tiêu:** bảng xếp hạng tốc độ Daily (toàn cầu/bạn bè) → social + viral + đồng thời cung cấp **phân phối thời gian thật** để thay stub `fasterThanPercent`.
**Hạ tầng:** Vercel KV (Redis) hoặc Postgres + route handlers `POST /api/score` (gửi thời gian Daily), `GET /api/rank?day=&ms=` (percentile).
**File:**
```
src/app/api/score/route.ts     # ghi {day, ms} (ẩn danh hoặc nickname)
src/app/api/rank/route.ts      # trả percentile thật
src/game/rank.ts               # thay stub bằng gọi API (fallback stub khi offline)
src/ui/Leaderboard.tsx         # top thời gian theo ngày
```
**Cân nhắc:** chống gian lận (validate thời gian hợp lý, rate-limit), ẩn danh vs nickname.
**Done:** Daily result hiện "Nhanh hơn X%" từ dữ liệu THẬT + bảng top.

---

## 4E — Push "đừng mất chuỗi"
**Mục tiêu:** kéo người chơi quay lại giữ streak.
**Hạn chế:** Web Push trên iOS Safari yếu (cần PWA add-to-home). Android/desktop tốt.
**File:** PWA manifest + service worker + `src/app/api/push/route.ts` (lưu subscription) + cron nhắc.
**Done:** opt-in nhận nhắc; gửi "Chuỗi 🔥 của bạn sắp đứt!" trước nửa đêm.

---

## 4F — IAP cosmetic (sau cùng)
Theme/màu mở khóa (Stripe/LemonSqueezy cho web). Cần thanh toán + entitlement. Để cuối vì phức tạp pháp lý/thanh toán và cần base người chơi.

---

## Ngoài phạm vi / lưu ý
- Doanh thu ads chỉ đáng kể khi **traffic scale** → 4A (đo) + viral (đã làm) quan trọng hơn 4C (bật ads) ở giai đoạn này.
- Mọi thứ giữ **web-first**; nếu sau muốn lên store → bọc PWA hoặc Capacitor (Phase 5).
