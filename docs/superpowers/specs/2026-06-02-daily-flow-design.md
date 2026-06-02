# Daily Flow — Design Spec

**Ngày:** 2026-06-02
**Trạng thái:** Draft for review
**Định vị một câu:** *"Wordle của puzzle nối đường"* — một web puzzle game phong cách Flow Free / Numberlink, với một màn toàn cầu mỗi ngày (Daily Flow) làm động cơ viral và một kho màn vô tận (Endless) để giữ chân.

> **Lưu ý nguồn:** Nghiên cứu thị trường/đối thủ trong spec này dựa trên kiến thức nội tại (cutoff 1/2026); chưa verify bằng research live (công cụ web đang quá tải 529 tại thời điểm soạn). Cần xác minh các con số/dẫn chứng trước khi dùng cho quyết định tài chính.

---

## 1. Mục tiêu & nguyên tắc

**Mục tiêu sản phẩm:**
- Gameplay Flow Free thuần, dễ hiểu trong vài giây.
- Web-first, deploy Vercel, để test thị trường & viral nhanh, không ma sát cài đặt.
- Viral-first: tối ưu share-loop trước; monetize (ads) đưa vào sau khi có traction.
- Mass-market casual; giữ chân lâu dài qua meta-layer (daily, streak, endless).
- Có thể mở rộng thành sản phẩm thương mại.

**Nguyên tắc:** YAGNI – KISS – DRY. MVP chỉ gồm thứ phục vụ trực tiếp viral-loop + retention-loop.

**Quyết định đã chốt (brainstorm 2026-06-02):**
| # | Quyết định |
|---|---|
| Monetization | Thiết kế viral trước, áp ads sau (kiến trúc chừa chỗ, MVP không có ads) |
| Định vị | Mass-market casual |
| Nền tảng | Webapp (Next.js) deploy Vercel |
| Trục viral | Daily Flow toàn cầu + artifact share spoiler-free |
| Artifact khoe | Tốc độ giải + xếp hạng tương đối |
| Luật chơi | Flow kinh điển thuần (twist để dành mode nâng cao sau) |
| Modes MVP | Daily Flow + Endless Practice |
| Generation | Pre-generate offline → ship kho màn tĩnh đã verify |
| Độ khó Endless | Auto-ramp theo kích thước lưới + van xả áp thủ công |
| Nhịp Daily | Ramp theo tuần kiểu NYT (T2 dễ → CN khó) |
| Art direction | "Khung tĩnh, mực rực" (calm UI + vibrant gameplay) |

---

## 2. Gameplay & luật chơi

**Core loop (1 màn):** nhìn bảng lưới có các cặp chấm màu → miết ngón tay nối hai chấm cùng màu bằng một đường ống → đường không được cắt nhau → **lấp đầy 100% bảng** thì thắng.

**Luật (Numberlink chuẩn):**
- Mỗi màu xuất hiện đúng 2 endpoint, phải nối thành đúng 1 đường liên tục.
- Đường đi theo ô kề (ngang/dọc), không chéo, không tự cắt, không cắt đường khác.
- Thắng khi mọi cặp được nối **và** mọi ô được lấp.
- "Perfect" = lấp đầy không có nước thừa (đường tối ưu). Mọi màn pre-gen đều có nghiệm perfect-fill duy nhất.

**Thao tác:** miết để vẽ; miết đè lên đường có sẵn sẽ ghi đè/cắt ngắn (chuẩn Flow). Undo, Reset, Hint (gợi ý một đoạn đường đúng).

---

## 3. Modes

### 3.1 Daily Flow (động cơ viral)
- **1 màn/ngày, cả thế giới chơi chung** một màn (deterministic theo ngày).
- **Reset 00:00 local** của người chơi (đơn giản hoá MVP; cân nhắc UTC ở mục Rủi ro).
- **Nhịp độ khó kiểu NYT:** T2 dễ (lưới nhỏ ~5×5) → CN khó (lưới lớn ~8–9×9). Gán sẵn khi build lịch.
- **Streak 🔥:** số ngày liên tiếp hoàn thành Daily. Mất streak nếu bỏ 1 ngày (cân nhắc "streak freeze" sau MVP).
- Một người chỉ tính thành tích Daily **một lần/ngày** (chống cày lại tốc độ — xem Rủi ro).

### 3.2 Endless Practice (động cơ giữ chân)
- Kho màn pre-gen vô tận (theo cảm nhận người chơi).
- **Auto-ramp:** bắt đầu 5×5 dễ → giải tốt thì độ khó/lưới nhích dần.
- **Van xả áp:** nút "Dễ hơn / Khó hơn" để người chơi tự điều chỉnh.
- Combo "just one more": auto-load màn kế + đếm chuỗi (⚡xN).
- Tiến trình lưu local (localStorage); không cần tài khoản ở MVP.

---

## 4. Procedural Level Generation (pre-gen offline)

Đây là phần kỹ thuật cốt lõi. Numberlink với ràng buộc lấp-đầy + nghiệm-duy-nhất là NP-complete → **không generate runtime**; pre-gen offline rồi ship JSON.

**Pipeline (script Node chạy ở build-time / CI):**
1. **Sinh lời giải trước:** phủ kín lưới bằng các đường (random spanning paths / thuật toán phủ Hamiltonian từng vùng) → đảm bảo lấp đầy 100%.
2. **Suy ra endpoints:** lấy 2 đầu mỗi đường làm cặp chấm màu → tạo ra đề bài.
3. **Verify nghiệm duy nhất:** chạy solver (backtracking + pruning, hoặc SAT) trên đề bài; **loại** đề có >1 nghiệm hoặc không lấp đầy.
4. **Chấm độ khó:** heuristic (số nhánh rẽ bắt buộc, độ dài đường trung bình, số ngõ cụt, kích thước lưới, số màu) → điểm khó.
5. **Phân loại & đóng gói:** chia vào "rổ độ khó" (vd D1–D10), xuất JSON theo rổ + một lịch Daily (ngày → màn theo ramp tuần).

**Output ship lên web:** các file JSON tĩnh (per difficulty bucket) + `daily-schedule.json`. Runtime chỉ đọc, cực nhẹ.

**Format màn (đề xuất):**
```json
{ "id":"d6-00142", "size":[6,6], "difficulty":4,
  "pairs":[ {"color":0,"a":[0,0],"b":[3,1]}, ... ],
  "solution":[ {"color":0,"path":[[0,0],[1,0],...]} ] }
```
(solution dùng để chấm Perfect & cấp Hint; có thể tách file để tránh "xem trộm" đáp án trong Daily.)

**Quy mô MVP:** ~5.000–20.000 màn pre-gen, phủ các rổ độ khó + đủ lịch Daily ≥1 năm.

---

## 5. Viral System

**Artifact share (spoiler-free, khoe tốc độ):**
- Nội dung: `Daily Flow #142`, thời gian (vd `0:48`), xếp hạng tương đối ("Nhanh hơn 73%"), streak 🔥, một dải màu/emoji (🟥🟦🟩🟨🟧) thể hiện *các màu đã giải* — **không** vẽ lại lời giải.
- **Vì sao spoiler-free:** giống lưới emoji Wordle — khoe được mà người xem vẫn muốn tự thử; tránh lộ đáp án màn hôm nay.

**Cơ chế share (MVP):**
- **Copy-to-clipboard** dạng text + emoji (dán được vào mọi chat/mạng xã hội) — nhẹ, không cần tải ảnh.
- Link `dailyflow.app/142` kèm **OG image** (dùng `@vercel/og`) → khi dán vào chat hiện preview card hấp dẫn → tăng tỉ lệ click.
- "Xếp hạng tương đối" cần một bộ đếm phân phối thời gian (xem Tech).

**Nâng cấp sau MVP:** PNG card đẹp tải về, share trực tiếp lên story, leaderboard bạn bè.

---

## 6. UI/UX System ("Khung tĩnh, mực rực")

**Triết lý:** khung giao diện calm/premium (không gây mỏi mắt, sang); năng lượng dồn vào đường nối + khoảnh khắc thắng + artifact share.

**Color tokens:**
- Canvas: `#FAFAF8` (light) / `#0E0F13` (dark). Ink `#0F172A`, muted `#64748B`, line `#EBEDF2`.
- Brand: indigo `#4C6EF5` (đã duyệt).
- Flow colors (vibrant, hỗ trợ mù màu bằng ký hiệu): `#E5484D` đỏ ▲ · `#4C6EF5` lam ● · `#22C55E` lục ■ · `#FACC15` vàng ◆ · `#F97316` cam ✚ · `#22D3EE` cyan · `#EC4899` hồng · `#A855F7` tím ★.

**Typography:** Heading `Outfit`; Body/UI `Work Sans` (hoặc Plus Jakarta Sans); **Timer `Space Grotesk` + tabular-nums** (chỉ số tốc độ không nhảy layout).

**Hình khối & juice:** layout minimal single-column; dot & nút hơi phồng (clay nhẹ), bo 16–24px, bóng mềm. Animation 150–300ms, spring khi nối dot, "đổ đầy" ô khi đúng, confetti chỉ ở màn thắng. Tôn trọng `prefers-reduced-motion`.

**Layout thumb-first:** board căn giữa-trên; controls (Undo/Hint/Reset/Share) ở dải đáy trong thumb-zone, target ≥44px, cách ≥8px. Toggle Daily/Endless dạng segmented, không bottom-nav rườm rà.

**Accessibility (bắt buộc từ MVP):**
- **Hỗ trợ mù màu:** ký hiệu/số trên mỗi endpoint (đã duyệt) — điểm khác biệt so với nhiều clone Flow.
- Contrast ≥4.5:1 cho chữ; focus states cho keyboard; không truyền tin chỉ bằng màu.

**Mockup tham chiếu:** `mockups/daily-flow-mockup.html` (4 màn: onboarding, daily playing, win/share, endless dark) — đã được duyệt hướng thiết kế.

**Onboarding "0 giây":** màn 3×3 với đường mờ gợi ý, một câu hướng dẫn; dạy bằng làm.

---

## 7. Tech Architecture (Next.js / Vercel)

- **Stack:** Next.js (App Router) + TypeScript + Tailwind; render board bằng SVG (đủ mượt cho lưới tĩnh + đường nối) hoặc Canvas nếu cần hiệu năng cao hơn.
- **Tương tác:** Pointer Events (chạy cả chuột & cảm ứng); `touch-action: none` trên board chống scroll-jank; ngưỡng kéo (drag threshold) chống vẽ nhầm.
- **Dữ liệu màn:** JSON tĩnh pre-gen phục vụ qua `public/` hoặc route handler; Daily chọn theo ngày từ `daily-schedule.json`.
- **State:** client-side; tiến trình/streak lưu `localStorage` (MVP không cần backend/account).
- **Xếp hạng tương đối:** route handler nhẹ (Vercel function) + KV/Postgres ghi nhận phân phối thời gian theo `puzzleId` → trả percentile. (Có thể stub bằng phân phối tĩnh ở bản đầu nếu chưa có dữ liệu.)
- **Share:** clipboard API + `@vercel/og` cho OG image động theo `puzzleId`.
- **Cấu trúc module (KISS, file <200 dòng):** `engine/` (luật, validate, solver-runtime cho hint), `generator/` (script offline), `components/board`, `components/controls`, `features/daily`, `features/endless`, `features/share`, `lib/storage`, `lib/rank`.

---

## 8. Retention & Addictive Patterns (ethical)

- Onboarding 0 giây (early win).
- "Just one more": auto-next + combo ở Endless.
- Daily ritual: streak 🔥 + đồng hồ đếm ngược màn kế.
- Khoảnh khắc thắng = đỉnh dopamine: tốc độ to + "nhanh hơn X%" + share.
- Không dùng dark-pattern ép buộc; van xả áp độ khó để tránh ức chế.

---

## 9. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Generation sinh màn đa nghiệm / dở | Cao | Verify nghiệm duy nhất bằng solver ở pre-gen; chỉ ship màn đã pass |
| Web retention yếu (push iOS kém) | Cao | Streak + đếm ngược + email/PWA add-to-home; tối ưu share-loop kéo người mới |
| "Khoe tốc độ" gây nản casual | Trung | "Nhanh hơn X%" (ai cũng hơn ai đó); Perfect là mục tiêu phụ |
| Cày lại Daily để ăn gian tốc độ | Trung | Khoá thành tích Daily 1 lần/ngày; tính thời gian từ lần mở đầu |
| Mù màu không chơi được | Trung | Ký hiệu endpoint bắt buộc từ MVP |
| Reset theo local bị lệch "màn chung toàn cầu" | Thấp | Hiển thị số màn theo ngày; cân nhắc chuyển UTC nếu cần đồng bộ leaderboard |
| Touch drag jank trên mobile-web | Trung | Pointer Events + touch-action none; test 60fps trên máy yếu |
| Chưa có dữ liệu percentile lúc launch | Thấp | Stub phân phối tĩnh, thay bằng dữ liệu thật khi đủ traffic |

---

## 10. Roadmap

**Phase 0 — Generator & Engine (nền tảng).** Script pre-gen offline (sinh + solver verify + chấm độ khó + đóng gói JSON); engine luật + validate + hint. *Done = có kho ≥5k màn đã verify + lịch Daily ≥1 năm.*

**Phase 1 — MVP chơi được.** Board SVG + Pointer Events; mode Endless với auto-ramp; mode Daily đọc lịch; onboarding 0 giây; UI theo "khung tĩnh, mực rực"; lưu localStorage. *Done = chơi mượt cả Daily & Endless trên mobile-web.*

**Phase 2 — Viral loop.** Màn thắng + artifact share (clipboard text/emoji) + OG image + streak + đếm ngược + xếp hạng (stub→thật). *Done = share được, link có preview, deploy Vercel public.*

**Phase 3 — Đo & tinh chỉnh.** Analytics (D1/D7, share rate, completion), cân bằng độ khó theo dữ liệu, A/B vài biến thể onboarding/artifact. *Done = có dashboard retention + share funnel.*

**Phase 4+ — Mở rộng thương mại (sau khi có traction).** Áp ads (rewarded hint, interstitial nhịp nhàng) + IAP remove-ads/cosmetic theme; Campaign theo pack; leaderboard bạn bè; account sync; biến thể luật (Bridges/Hexes) cho mode nâng cao; bản app (PWA→store).

---

## 11. Out of scope (YAGNI cho MVP)

Account/đăng nhập, backend nặng, ads, IAP, campaign map, leaderboard toàn cầu, biến thể luật, đa ngôn ngữ (ngoài VI/EN), realtime 1v1. Tất cả để Phase 4+.

## 12. Success metrics (đề xuất)

D1 retention, D7 retention, % người chơi share, viral coefficient (k-factor), số màn Endless trung bình/phiên, tỉ lệ hoàn thành Daily, độ dài streak trung bình.
