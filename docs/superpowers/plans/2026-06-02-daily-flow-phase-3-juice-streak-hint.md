# Daily Flow — Phase 3 Plan: Juice · Streak · Hint · Easy Levels

**Ngày:** 2026-06-02
**Trạng thái:** Plan (chưa execute)
**Mục tiêu:** Tăng *độ sinh động, gây nghiện, viral* dựa trên nghiên cứu thị trường, + hoàn tất 2 yêu cầu của bạn (streak nâng cao, gợi ý/hint), + trả nợ kỹ thuật "cấp dễ thật".

> **Nguồn nghiên cứu (2025):** NYT Games 11.1B lượt/năm; Wordle share 1.2M lần/2 tuần → ease-of-sharing là động cơ viral #1. Retention chính = same-puzzle toàn cầu + reset local-midnight + **streak + badge**. "Game juice" (SFX, squash&stretch, pop, level-up animation) tạo vòng dopamine kể cả ở puzzle đơn giản — nhưng đừng lạm dụng. (deconstructoroffun.com, certainly.io, thedesignlab.blog, medium juicy-ui).

**Builds on:** state hiện tại trên `main` (Phase 0–2) + nhánh `feat/onboarding-and-share-link` (chờ merge). Engine `src/engine/`, game `src/game/`, UI `src/ui/`. Mỗi increment = một nhánh + một loạt task TDD (chi tiết hoá khi bắt đầu increment đó), execute bằng superpowers:subagent-driven-development.

---

## Thứ tự ưu tiên (đề xuất)
1. **3A — Juice & Feedback** (đáp thẳng "sinh động/gây nghiện", impact cao nhất)
2. **3B — Streak nâng cao** (yêu cầu của bạn; retention)
3. **3C — Hint/Gợi ý** (yêu cầu của bạn; giảm nản, giữ casual)
4. **3D — Cấp dễ thật + calibration** (onboarding casual; nợ kỹ thuật)

Mỗi increment độc lập, ship được riêng. Có thể đảo thứ tự tuỳ bạn.

---

## Increment 3A — Juice & Feedback

**Vì sao:** nghiên cứu chỉ rõ phản hồi cảm giác (âm thanh + animation + haptic) là thứ biến puzzle "đơn sơ" thành "đã tay, gây nghiện". App hiện gần như không có.

**File dự kiến:**
```
src/ui/useSound.ts          # Web Audio: bíp khi nối, chime khi thắng (tổng hợp tại runtime, không cần file)
src/ui/useHaptics.ts        # navigator.vibrate wrapper (mobile)
src/ui/useFeedbackPrefs.ts  # bật/tắt âm thanh (localStorage) + tôn trọng prefers-reduced-motion
src/ui/Confetti.tsx         # burst nhẹ canvas khi thắng (không thêm dependency nặng)
src/ui/Board.tsx            # (sửa) pulse/“đổ đầy” khi 1 màu hoàn thành; pop khi grab endpoint
src/app/globals.css         # (sửa) keyframes fill-pulse, win-flash; nút mute
```

**Tính năng & tiêu chí:**
- Âm "tách" nhẹ khi nối thêm ô; "đổ đầy" khi 1 màu nối xong; **chime thắng** + **confetti** + flash nền nhẹ khi lấp đầy bảng.
- **Haptic** (rung 8–12ms) khi nối/hoàn thành trên mobile (`navigator.vibrate`).
- **Squash & stretch / pop**: endpoint phồng nhẹ khi chạm; đường nối vào có spring.
- **Nút tắt âm** ở header (cạnh nút theme); lưu localStorage; tôn trọng `prefers-reduced-motion` (tắt animation, vẫn cho chơi).
- Tiết chế: 1–2 hiệu ứng/khoảnh khắc, không "ồn".

**Test:** `useSound`/`useHaptics`/`useFeedbackPrefs` test phần thuần (mute state, reduced-motion guard, gọi `vibrate` được mock). Hiệu ứng thị giác verify ở dev-run.

**Rủi ro:** SFX runtime (Web Audio) cần user-gesture để khởi tạo AudioContext (đã có gesture = chạm board) → khởi tạo lazy ở lần chạm đầu.

---

## Increment 3B — Streak nâng cao

**Vì sao:** streak hiện chỉ là một con số. Nghiên cứu: streak + badge + lịch + "đừng để mất chuỗi" là lõi retention của Wordle/NYT.

**File dự kiến:**
```
src/game/streak.ts          # logic mở rộng trên daily-stats: bestStreak, freeze, milestones, playedDates
src/game/badges.ts          # milestone -> badge (3/7/14/30/100), pure
src/ui/StreakBar.tsx        # 🔥 lớn dần + best + freeze indicator (header/daily)
src/ui/StreakCalendar.tsx   # lưới lịch tháng: ngày đã chơi sáng màu
src/ui/DailyResult.tsx      # (sửa) hiện badge mốc + best-streak + "freeze đã cứu chuỗi!"
src/game/daily-stats.ts     # (mở rộng) thêm bestStreak, freezeAvailable, playedDates[]
```

**Mô hình (mở rộng `DailyStats`):**
```ts
interface DailyStats {
  lastDate: string | null; streak: number; bestMs: Record<string, number>;
  bestStreak: number;            // kỷ lục
  freezeAvailable: boolean;      // 1 lần "đóng băng" miễn phí
  playedDates: string[];         // cho lịch
}
```
- **Streak-freeze:** nếu bỏ ĐÚNG 1 ngày và còn freeze → chuỗi sống tiếp (tiêu freeze); bỏ ≥2 ngày → reset. Tặng lại freeze sau mỗi 7 ngày streak (hoặc khi đạt mốc).
- **Badge mốc:** 3🔥, 7🔥, 14🔥, 30🔥, 100🔥 → huy hiệu hiển thị + thêm vào artifact share (tăng viral khoe).
- **Calendar:** lưới tháng, ngày đã hoàn thành tô sáng — tạo cảm giác "đừng làm đứt chuỗi".

**Test:** `recordDailyWin` mở rộng (consecutive/gap/freeze-saves/double-gap-resets/bestStreak), `badges` (mốc đúng), pure. UI verify dev-run.

**Lưu ý:** cần migrate `DailyStats` cũ (thiếu field mới) → `loadStats` điền default an toàn.

---

## Increment 3C — Hint / Gợi ý

**Vì sao:** mass-casual cần "van xả áp" để không bỏ cuộc. Hint là cơ chế chuẩn (và là điểm gắn rewarded-ad ở Phase 4).

**Quyết định kỹ thuật:** màn pre-gen **không** ship lời giải (để JSON nhẹ). → Hint tính **runtime**:
```
src/engine/solver.ts        # (mở rộng) export solve(puzzle): Solution | null  — nghiệm đầu tiên (tái dùng backtracking đã có)
src/game/hint.ts            # nextHintCell(puzzle, state, solution): {color, cell} | null  — ô đúng kế tiếp cho 1 màu chưa xong
src/ui/useHintQuota.ts      # giới hạn lượt/ngày (localStorage, reset local-midnight)
src/ui/SoloGame.tsx         # (sửa) nút 💡 Gợi ý: solve 1 lần (cache), vẽ giúp 1 ô đúng + nhấp nháy
```
- `solve()` chạy nhanh với lưới ≤8×8 (offline-grade backtracking đã có); cache nghiệm sau lần đầu.
- Hint reveal **một ô đúng** của một màu chưa hoàn thành (không giải hộ cả màn).
- **Giới hạn** vd 3 lượt/ngày (free); Phase 4 sẽ cho thêm qua rewarded-ad.
- Nút Gợi ý xuất hiện ở cả Daily lẫn Endless.

**Test:** `solve` (puzzle unique → trả đúng 1 nghiệm hợp lệ qua `isSolved`); `nextHintCell` (chọn ô đúng tiếp theo, null khi đã xong); `useHintQuota` (đếm + reset ngày). 

**Lưu ý chính xác:** với màn nghiệm-duy-nhất (mọi màn pre-gen), `solve()` trả đúng nghiệm người chơi cần → hint không bao giờ dẫn sai.

---

## Increment 3D — Cấp dễ thật + Calibration

**Vì sao:** màn đầu hiện ở bucket 5 (hơi khó cho người mới). Onboarding casual cần cấp 1–3 thật.

**Thay đổi:**
```
scripts/generator/cli.ts            # (sửa) thêm lưới 3x3, 4x4 vào SIZES; tăng TARGET
scripts/generator/score-difficulty.ts # (sửa) recalibrate để 3x3/4x4 → 1–3, 5–8 → cao dần, phủ 1–10
scripts/generator/package.ts        # (kiểm) ramp tuần T2 dễ → CN khó hoạt động khi đã có đủ bucket
public/levels/*                     # regenerate (COUNT lớn hơn, vd 1000+)
src/game/level-loader.ts            # (kiểm) endlessOrder bắt đầu từ bucket thấp nhất
```
- Mục tiêu phân phối: 3×3/4×4 → bucket 1–3; 5–6 → 4–6; 7–8 → 7–10. Daily T2 lấy bucket ~2, CN ~8 (đã có sẵn `WEEKDAY_BUCKET` + `nearestBucket`).
- Endless **bắt đầu từ màn dễ nhất** → người mới thắng ngay (early dopamine, khớp nghiên cứu).

**Test:** `scoreDifficulty` (3×3 đơn giản < 8×8 phức tạp, span rộng); chạy generator end-to-end → manifest có nhiều bucket gồm cả 1–3.

---

## Ngoài phạm vi Phase 3 (để Phase 4)
Ads (rewarded hint), IAP, cosmetic theme packs, leaderboard bạn bè, push notification "đừng mất streak", account sync, biến thể luật (Bridges/Hexes). 

## Success metrics cần theo dõi (khi deploy)
D1/D7 retention, % share, streak trung bình & phân phối, tỉ lệ dùng hint, completion-rate màn đầu (đo hiệu quả cấp dễ).
