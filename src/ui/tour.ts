'use client';
import 'driver.js/dist/driver.css';
import { driver, type DriveStep } from 'driver.js';

interface TourStep { element?: string; title: string; description: string; }

const STEPS: TourStep[] = [
  { title: 'Chào mừng 👋', description: 'Đi một vòng nhanh để nắm cách chơi và các nút nhé.' },
  { element: '.df-board', title: 'Bảng chơi', description: 'Miết ngón tay nối hai chấm CÙNG MÀU. Lấp đầy mọi ô, các đường không được cắt nhau.' },
  { element: '.df-timer', title: 'Đồng hồ', description: 'Chỉ bắt đầu tính khi bạn vẽ nét đầu tiên. Giải càng nhanh, hạng càng cao.' },
  { element: '.df-progress', title: 'Tiến trình', description: 'Xem bạn đã lấp bao nhiêu % và đã nối xong mấy màu.' },
  { element: '[data-tour="hint"]', title: 'Gợi ý 💡', description: 'Bí thì bấm để được giải giúp một màu (3 lượt mỗi ngày).' },
  { element: '.df-controls', title: 'Hoàn tác / Làm lại', description: 'Lùi một bước, hoặc xoá hết để vẽ lại từ đầu.' },
  { element: '.df-chip', title: 'Chuỗi 🔥', description: 'Chơi mỗi ngày để giữ chuỗi. Bấm để xem lịch, kỷ lục và huy hiệu.' },
  { element: '.df-seg', title: 'Chế độ chơi', description: '“Hằng ngày” = 1 màn/ngày cho cả thế giới. “Vô tận” = chơi không giới hạn, khó dần.' },
  { element: '[data-tour="tools"]', title: 'Công cụ', description: 'Mở lại hướng dẫn này, bật/tắt âm thanh, đổi giao diện sáng/tối.' },
  { title: 'Xong! 🎉', description: 'Giải xong sẽ có nút Khoe (link rủ bạn) và Bảng xếp hạng. Chúc bạn chơi vui!' },
];

/** Run the interactive coach-mark tour over whatever target elements are currently on screen. */
export function startTour(): void {
  if (typeof document === 'undefined') return;
  const steps: DriveStep[] = STEPS
    .filter((s) => !s.element || document.querySelector(s.element))
    .map((s) => ({ element: s.element, popover: { title: s.title, description: s.description } }));
  if (steps.length === 0) return;
  driver({
    showProgress: true,
    progressText: '{{current}}/{{total}}',
    nextBtnText: 'Tiếp →',
    prevBtnText: '← Lùi',
    doneBtnText: 'Xong',
    steps,
  }).drive();
}
