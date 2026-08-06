# Hướng dẫn xây dựng hiệu ứng mega menu desktop

Tài liệu này tóm tắt cách triển khai hiệu ứng mega menu desktop hiện tại của Spinel. Mục tiêu là tạo cảm giác header và mega menu thuộc cùng một bề mặt: nền header nở xuống theo chiều cao nội dung, các cột xuất hiện so le, đổi từ menu A sang menu B không bị co về `0`, và thao tác đóng/mở ngược chiều giữa chừng vẫn mượt.

Phạm vi của hiệu ứng là desktop từ `900px`. Luồng mobile drawer là một hệ chuyển động riêng và không nên dùng chung state với desktop.

## 1. Kết quả cần đạt

Một implementation hoàn chỉnh nên đáp ứng các điểm sau:

- Header có **một lớp nền chung** cho tất cả mega menu, không phải mỗi panel tự vẽ một nền riêng.
- Panel mở từ `height: 0` đến chiều cao nội dung đã được JavaScript đo bằng pixel.
- Heading, cột link và promotion reveal từ dưới lên `15px`, duration `400ms`, stagger `50ms`.
- Khi đổi menu A → B, nền chung chuyển trực tiếp sang chiều cao của B, không collapse về chiều cao header.
- Khi đóng, `<details>` vẫn giữ `open` cho đến khi height transition hoàn tất; `300ms` là duration chuẩn, còn reduced/immediate path kết thúc ngay.
- Nếu người dùng đảo chiều lúc animation đang chạy, animation tiếp tục từ chiều cao đang hiển thị thay vì nhảy về đầu/cuối.
- Nội dung thay đổi sau khi mở được đo lại bằng `ResizeObserver`.
- `aria-expanded`, focus, `inert`, overlay, scroll lock và cleanup trong Theme Editor luôn đồng bộ với trạng thái nhìn thấy.
- `prefers-reduced-motion: reduce` bỏ transition/reveal nhưng vẫn giữ đúng trạng thái cuối.

Các thông số chuyển động hiện tại:

| Thành phần | Giá trị |
| --- | --- |
| Panel/nền | `300ms cubic-bezier(.6, .14, 0, 1)` |
| Opacity panel | `200ms cubic-bezier(.6, .14, 0, 1)` |
| Content reveal | `400ms ease` |
| Khoảng stagger | `50ms` |
| Offset reveal | `translateY(15px)` |
| Hover close delay | `120ms` |

## 2. Nguyên lý kiến trúc

Không animate `height: auto`. Trình duyệt không nội suy ổn định từ `0` sang `auto`, đặc biệt khi phải đổi qua lại giữa hai panel có chiều cao khác nhau. Thay vào đó:

1. Đo `panel.scrollHeight`.
2. Giới hạn chiều cao theo phần viewport còn lại.
3. Ghi kết quả vào custom property `--header-mega-panel-height`.
4. CSS chuyển `height: 0` → `height: var(--header-mega-panel-height)`.
5. Ghi cùng chiều cao vào `--header-mega-background-height` để nền chung chuyển động đồng bộ.

```text
header
├── shared background       z-index: 30, height = header + active panel
└── header inner            z-index: 31
    └── details
        ├── summary
        └── mega panel      height = 0 hoặc measured height
            └── surface     transparent trên desktop
```

Nền của `.header__mega-surface` phải trong suốt trên desktop. Nếu background vẫn nằm ở từng panel, lúc A đóng và B mở sẽ có hai lớp màu/opacity chồng nhau, tạo nháy hoặc đường nối nhìn thấy được.

## 3. State machine

`open` của `<details>` chỉ mô tả việc DOM còn được render. Ba data attribute bổ sung mô tả animation đang ở đâu.

| Trạng thái | `details.open` | `data-opening` | `data-mega-panel-visible` | `data-closing` | `panel.inert` |
| --- | --- | --- | --- | --- | --- |
| Closed | `false` | không | không | không | không còn ảnh hưởng; có thể vẫn `true` sau animated close |
| Opening | `true` | `true` | `true` sau frame kế | không | `false` |
| Open | `true` | không | `true` | không | `false` |
| Closing | **vẫn `true`** | không | vẫn giữ | `true` | `true` |
| Closed hoàn tất | `false` | không | không | không | mở lần sau phải đặt lại `false` |

Điểm quan trọng nhất là trạng thái Closing vẫn giữ `details.open = true`. Nếu bỏ `open` ngay khi bắt đầu đóng, browser loại panel khỏi layout trước khi CSS có thể animate về `0`.

## 4. Markup/Liquid tối thiểu

Lớp overlay desktop đặt ngoài header để che phần trang. Lớp nền chung đặt bên trong header nhưng đứng trước `.header__inner`.

Đoạn dưới là sơ đồ tích hợp, không phải một section Liquid độc lập. Overlay, `<header>` và shared background chỉ render **một lần**. Chỉ phần `<details>...</details>` được lặp bên trong `menu_links`; phần đó giả định `link`, `mega_menu_block`, `mega_columns`, `promotion_count` và `submenu_id` đã được tính như trong header hiện tại.

```liquid
<span
  class="header__menu-overlay header__menu-overlay--desktop"
  data-header-menu-overlay="Header-{{ section.id }}"
  aria-hidden="true"
></span>

<header id="Header-{{ section.id }}" class="header" data-header>
  <span class="header__mega-background" aria-hidden="true"></span>

  <div class="header__inner">
    <nav aria-label="{{ 'header.primary_navigation' | t | escape }}">
      <details class="header__submenu-disclosure header__submenu-disclosure--mega{% if section.settings.dropdown_trigger == 'hover' %} header__submenu-disclosure--hover{% endif %}">
        <summary
          class="header__menu-link"
          aria-expanded="false"
          aria-controls="{{ submenu_id }}"
          aria-label="{{ 'header.open_submenu' | t: item: link.title | escape }}"
          data-open-label="{{ 'header.open_submenu' | t: item: link.title | escape }}"
          data-close-label="{{ 'header.close_submenu' | t: item: link.title | escape }}"
        >
          <span>{{ link.title | escape }}</span>
        </summary>

        <div id="{{ submenu_id }}" class="header__mega-panel" {{ mega_menu_block.shopify_attributes }}>
          <div class="header__mega-surface">
            <div class="header__mega-inner">
              <div class="header__mega-navigation">
                {% if mega_menu_block.settings.column_heading != blank %}
                  <p class="header__mega-heading">
                    {{ mega_menu_block.settings.column_heading | escape }}
                  </p>
                {% endif %}

                <div class="header__mega-lists">
                  {% for column in (1..mega_columns) %}
                    <div class="header__mega-list">
                      <!-- links -->
                    </div>
                  {% endfor %}
                </div>
              </div>

              {% for promotion in (1..promotion_count) %}
                <article class="header__mega-promo">
                  <!-- media + text -->
                </article>
              {% endfor %}
            </div>
          </div>
        </div>
      </details>
    </nav>
  </div>
</header>
```

Yêu cầu markup:

- `summary[aria-controls]` trỏ đúng tới `id` duy nhất của panel.
- Panel là con trực tiếp của `<details>` để có thể dùng selector `:scope > .header__mega-panel`.
- `.header__mega-surface` bọc toàn bộ nội dung cần đo.
- Các phần tử reveal dùng ba selector ổn định: `.header__mega-heading`, `.header__mega-list`, `.header__mega-promo`.
- Mỗi header/overlay có quan hệ owner riêng qua `data-header-menu-overlay`; không dùng một overlay không định danh cho nhiều header instance.

## 5. CSS tạo chuyển động

### 5.1. Nền chung và panel

```css
@media (min-width: 900px) {
  .header.is-menu-open {
    background: transparent;
  }

  .header.is-menu-open > .header__inner {
    position: relative;
    z-index: 31;
  }

  .header__mega-background {
    position: absolute;
    z-index: 30;
    top: 0;
    left: 50%;
    width: calc(
      100vw - var(--scrollbar-width, var(--header-menu-scrollbar-width, 0px))
    );
    height: 100%;
    display: block;
    overflow: hidden;
    background: var(--gradient-background, var(--color-background));
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%);
    transition: height 300ms cubic-bezier(.6, .14, 0, 1);
    visibility: hidden;
  }

  .header.is-menu-open > .header__mega-background {
    height: calc(100% + var(--header-mega-background-height, 0px));
    opacity: 1;
    visibility: visible;
  }

  .header__submenu-disclosure--mega > .header__mega-panel {
    height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transition:
      height 300ms cubic-bezier(.6, .14, 0, 1),
      opacity 200ms cubic-bezier(.6, .14, 0, 1),
      visibility 0s linear 300ms;
  }

  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']:not([data-closing='true']) > .header__mega-panel {
    height: var(--header-mega-panel-height, 0px);
    opacity: 1;
    pointer-events: auto;
    transition-delay: 0s;
    visibility: visible;
  }

  /* Chỉ bật scroll khi mở xong để scrollbar không lóe trong transition. */
  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']:not([data-opening='true']):not([data-closing='true']) > .header__mega-panel {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .header__submenu-disclosure--mega
    > .header__mega-panel
    > .header__mega-surface {
    background: transparent;
  }
}
```

Không cần một rule Closing riêng: selector Open đã loại trừ `[data-closing='true']`, nên panel tự rơi về rule mặc định `height: 0`. Đây cũng là lý do `data-closing` phải nằm trên chính `<details>`.

### 5.2. Reveal nội dung theo nhịp

```css
@media (min-width: 900px) {
  .header__submenu-disclosure--mega .header__mega-heading,
  .header__submenu-disclosure--mega .header__mega-list,
  .header__submenu-disclosure--mega .header__mega-promo {
    opacity: 0;
    transform: translate3d(0, 15px, 0);
  }

  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']
    .header__mega-heading,
  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']
    .header__mega-list,
  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']
    .header__mega-promo {
    animation: header-mega-panel-reveal 400ms ease forwards;
    animation-delay: var(--header-mega-reveal-delay, 200ms);
  }
}

@keyframes header-mega-panel-reveal {
  from {
    opacity: 0;
    transform: translate3d(0, 15px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
```

### 5.3. Reduced motion

```css
@media (min-width: 900px) and (prefers-reduced-motion: reduce) {
  .header__mega-background,
  .header__submenu-disclosure--mega > .header__mega-panel {
    transition: none;
  }

  .header__submenu-disclosure--mega .header__mega-heading,
  .header__submenu-disclosure--mega .header__mega-list,
  .header__submenu-disclosure--mega .header__mega-promo,
  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']
    .header__mega-heading,
  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']
    .header__mega-list,
  .header__submenu-disclosure--mega[open][data-mega-panel-visible='true']
    .header__mega-promo {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
```

## 6. JavaScript: đo chiều cao và đồng bộ nền

Các state tạm nên lưu bằng `WeakMap`. Điều này tránh gắn object/timer phức tạp trực tiếp vào DOM và cho phép garbage collection khi section bị thay thế.

```js
const desktopMegaMenuMotions = new WeakMap();
const desktopMegaMenuRevealEnds = new WeakMap();
const desktopMegaMenuResizeObservers = new WeakMap();
const desktopMegaMenuHeightTimers = new WeakMap();

const DESKTOP_BREAKPOINT = '(min-width: 900px)';
const HEIGHT_DURATION = 300;
const HOVER_CLOSE_DELAY = 120;

const isDesktopMegaMenu = (details) => (
  window.matchMedia(DESKTOP_BREAKPOINT).matches &&
  details.matches('.header__submenu-disclosure--mega')
);

const getPanel = (details) => (
  details.querySelector(':scope > .header__mega-panel')
);
```

Toàn bộ phần đăng ký listener `document`/`window` phải nằm trong global guard hiện có để section reload không đăng ký trùng:

```js
if (!window.SpinelHeaderMenus) {
  window.SpinelHeaderMenus = true;

  // Khởi tạo WeakMap, helper và đăng ký listener đúng một lần tại đây.
}
```

Các handler `shopify:section:load` chỉ initialize node mới; chúng không đăng ký lại bộ listener global.

Đo chiều cao tối đa còn có thể hiển thị trong viewport:

```js
const measurePanelHeight = (details) => {
  const panel = getPanel(details);
  if (!panel) return 0;

  const availableHeight = Math.max(
    0,
    document.documentElement.clientHeight - panel.getBoundingClientRect().top
  );

  return Math.ceil(
    Math.min(Math.max(0, panel.scrollHeight), availableHeight)
  );
};
```

Nền chung luôn chọn panel đang active. Nếu chỉ còn một panel Closing, vẫn giữ class `is-menu-open` nhưng đưa target height về `0`; nhờ vậy nền thu về header trước khi biến mất.

```js
const resetSharedBackground = (header) => {
  if (!header) return;
  header.classList.remove('is-menu-open');
  header.style.removeProperty('--header-mega-background-height');
};

const syncSharedBackground = (header, preferredDetails, preferredHeight) => {
  if (!header || !window.matchMedia(DESKTOP_BREAKPOINT).matches) {
    resetSharedBackground(header);
    return 0;
  }

  const preferredIsActive = (
    preferredDetails?.open && preferredDetails.dataset.closing !== 'true'
  );

  const activeDetails = preferredIsActive
    ? preferredDetails
    : header.querySelector(
        '.header__submenu-disclosure--mega[open]:not([data-closing="true"])'
      );

  if (!activeDetails) {
    const closingDetails = header.querySelector(
      '.header__submenu-disclosure--mega[open][data-closing="true"]'
    );

    if (closingDetails) {
      header.style.setProperty('--header-mega-background-height', '0px');
      header.classList.add('is-menu-open');
    } else {
      resetSharedBackground(header);
    }

    return 0;
  }

  const height = (
    activeDetails === preferredDetails && Number.isFinite(preferredHeight)
  )
    ? preferredHeight
    : measurePanelHeight(activeDetails);

  header.style.setProperty('--header-mega-background-height', `${height}px`);
  header.classList.add('is-menu-open');
  return height;
};
```

## 7. JavaScript: gán stagger delay

```js
const updateRevealDelays = (details) => {
  const panel = getPanel(details);
  if (!panel) return 0;

  const heading = panel.querySelector('.header__mega-heading');
  const columns = [...panel.querySelectorAll('.header__mega-list')];
  const promotions = [...panel.querySelectorAll('.header__mega-promo')];

  heading?.style.setProperty('--header-mega-reveal-delay', '200ms');

  columns.forEach((column, index) => {
    column.style.setProperty(
      '--header-mega-reveal-delay',
      `${200 + index * 50}ms`
    );
  });

  const promotionStart = Math.max(
    350,
    Math.min(400, 200 + columns.length * 50)
  );

  promotions.forEach((promotion, index) => {
    promotion.style.setProperty(
      '--header-mega-reveal-delay',
      `${Math.min(400, promotionStart + index * 50)}ms`
    );
  });

  const delays = [
    heading ? 200 : 0,
    ...columns.map((_, index) => 200 + index * 50),
    ...promotions.map((_, index) => (
      Math.min(400, promotionStart + index * 50)
    ))
  ];

  // Thời điểm phần tử reveal cuối cùng chạy xong.
  return Math.max(0, ...delays) + 400;
};

const clearRevealDelays = (details) => {
  getPanel(details)?.querySelectorAll(
    '.header__mega-heading, .header__mega-list, .header__mega-promo'
  ).forEach((element) => {
    element.style.removeProperty('--header-mega-reveal-delay');
  });
};
```

Giữ `data-opening` đến khi cả height transition và content reveal cuối cùng hoàn tất. Nếu bỏ sớm sau đúng `300ms`, `overflow-y: auto` có thể bật trong lúc các cột vẫn đang reveal và làm scrollbar lóe.

## 8. JavaScript: open/close có thể đảo chiều

Trước khi đổi state, luôn pin chiều cao hiện tại của panel:

```js
const currentHeight = panel.getBoundingClientRect().height;
panel.style.height = `${currentHeight}px`;

// Ép browser ghi nhận điểm bắt đầu.
panel.getBoundingClientRect();

requestAnimationFrame(() => {
  // CSS tiếp tục từ currentHeight đến custom property hoặc về 0.
  panel.style.removeProperty('height');
});
```

Đây là phần cốt lõi đã rút gọn của state machine. Production code nên giữ cả `transitionend` và fallback timer vì event có thể không phát khi tab bị background, style đổi giữa chừng hoặc duration bằng `0`.

Các hàm bên dưới mô tả **nhánh desktop mega** để ghép vào controller header hiện có, không phải file JavaScript thay thế toàn bộ. Giữ nguyên controller non-mega/mobile và dùng nó tại các integration hook được ghi rõ.

Snippet bên dưới gọi ba integration hook đã có trong header Spinel: `syncHeaderMenuScrollLock()` đồng bộ overlay/scroll lock, `scheduleResponsiveHeaderSync()` đồng bộ surface sticky/floating, và `setTransparentHeaderColorScheme()` chuyển logo/text sang color scheme có nền. Khi áp dụng cho header khác, phải map ba hook này sang lifecycle tương đương; không được bỏ chúng khỏi open/close path.

```js
const clearMotion = (details, result = false) => {
  const state = desktopMegaMenuMotions.get(details);
  if (!state) return;

  cancelAnimationFrame(state.frame);
  clearTimeout(state.timer);
  state.panel.removeEventListener('transitionend', state.onTransitionEnd);
  desktopMegaMenuMotions.delete(details);
  state.resolve(result);
};

const clearHeightGuard = (details) => {
  const timer = desktopMegaMenuHeightTimers.get(details);
  if (timer) clearTimeout(timer);
  desktopMegaMenuHeightTimers.delete(details);
  delete details.dataset.opening;
};

const syncAria = (details) => {
  const summary = details.querySelector(':scope > summary[aria-controls]');
  if (!summary) return;

  const visuallyOpen = details.open && details.dataset.closing !== 'true';
  summary.setAttribute('aria-expanded', String(visuallyOpen));

  const label = visuallyOpen
    ? summary.dataset.closeLabel
    : summary.dataset.openLabel;
  if (label) summary.setAttribute('aria-label', label);
};

const syncMenuEnvironment = (details) => {
  syncHeaderMenuScrollLock();

  if (details.closest(
    '[data-transparent-header="true"], [data-floating-header="true"]'
  )) {
    scheduleResponsiveHeaderSync();
  }
};

const prepareResponsiveHeaderSurface = (header) => {
  if (header?.dataset.transparentHeader !== 'true') return;
  header.classList.add('header--surface-visible');
  setTransparentHeaderColorScheme(header, true);
};

const scheduleMotionFinish = (state) => {
  clearTimeout(state.timer);
  const endsAt = Math.max(
    state.heightTransitionEndsAt,
    state.revealEndsAt
  );

  state.timer = window.setTimeout(
    state.finish,
    Math.max(0, endsAt - performance.now()) + 80
  );
};

const runMotion = (details, opening) => {
  const panel = getPanel(details);
  if (!panel) return Promise.resolve(false);

  const currentHeight = Math.max(0, panel.getBoundingClientRect().height);
  const wasVisible = details.dataset.megaPanelVisible === 'true';

  clearMotion(details);
  clearHeightGuard(details);
  panel.style.height = `${currentHeight}px`;

  const header = details.closest('[data-header]');
  const now = performance.now();
  let revealEndsAt = desktopMegaMenuRevealEnds.get(details) || now;
  let revealDuration = 0;

  if (opening) {
    panel.inert = false;
    details.dataset.opening = 'true';
    delete details.dataset.closing;

    revealDuration = updateRevealDelays(details);

    const targetHeight = measurePanelHeight(details);
    panel.style.setProperty(
      '--header-mega-panel-height',
      `${targetHeight}px`
    );
    syncSharedBackground(header, details, targetHeight);
  } else {
    // Đưa focus ra khỏi vùng sắp inert/ẩn.
    if (panel.contains(document.activeElement)) {
      details.querySelector(':scope > summary')?.focus({ preventScroll: true });
    }

    panel.inert = true;
    details.dataset.closing = 'true';
    delete details.dataset.opening;
    syncSharedBackground(header);
  }

  // Commit currentHeight trước khi chuyển sang target mới.
  panel.getBoundingClientRect();
  syncAria(details);
  syncMenuEnvironment(details);

  return new Promise((resolve) => {
    const finish = () => {
      const state = desktopMegaMenuMotions.get(details);
      if (!state || state.finish !== finish) return;

      clearMotion(details, true);
      panel.style.removeProperty('height');

      if (opening) {
        delete details.dataset.opening;
        desktopMegaMenuRevealEnds.delete(details);
        // Helper ở phần ResizeObserver sẽ bật lại height guard nếu target đổi.
        syncPanelHeight(details);
      } else {
        // Chỉ tới đây mới đóng details thật sự.
        details.open = false;
        delete details.dataset.closing;
        delete details.dataset.megaPanelVisible;
        desktopMegaMenuRevealEnds.delete(details);
        panel.style.removeProperty('--header-mega-panel-height');
        clearRevealDelays(details);
        syncSharedBackground(header);
      }

      syncAria(details);
      syncMenuEnvironment(details);
    };

    const onTransitionEnd = (event) => {
      if (
        !opening &&
        event.target === panel &&
        event.propertyName === 'height'
      ) {
        finish();
      }
    };

    const state = {
      panel,
      opening,
      frame: 0,
      timer: 0,
      heightTransitionEndsAt: now + HEIGHT_DURATION,
      revealEndsAt: opening ? revealEndsAt : now + HEIGHT_DURATION,
      revealDuration,
      wasVisible,
      finish,
      onTransitionEnd,
      resolve
    };

    desktopMegaMenuMotions.set(details, state);
    panel.addEventListener('transitionend', onTransitionEnd);

    state.frame = requestAnimationFrame(() => {
      if (desktopMegaMenuMotions.get(details) !== state) return;

      if (opening) details.dataset.megaPanelVisible = 'true';
      panel.style.removeProperty('height');

      const transitionStartsAt = performance.now();
      state.heightTransitionEndsAt = transitionStartsAt + HEIGHT_DURATION;

      if (opening && !state.wasVisible) {
        state.revealEndsAt = transitionStartsAt + state.revealDuration;
        desktopMegaMenuRevealEnds.set(details, state.revealEndsAt);
      } else if (!opening) {
        state.revealEndsAt = state.heightTransitionEndsAt;
      }

      scheduleMotionFinish(state);
    });
  });
};
```

Wrapper mở/đóng:

```js
const openMegaMenu = (details) => {
  // Nếu đang Closing thì details đã open; runMotion sẽ đảo chiều từ height hiện tại.
  if (details.open && details.dataset.closing !== 'true') return;
  const header = details.closest('[data-header]');
  prepareResponsiveHeaderSurface(header);
  if (!details.open) details.open = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const panel = getPanel(details);
    if (!panel) return;

    clearMotion(details);
    clearHeightGuard(details);
    desktopMegaMenuRevealEnds.delete(details);
    panel.style.removeProperty('height');
    const height = measurePanelHeight(details);

    panel.inert = false;
    panel.style.setProperty('--header-mega-panel-height', `${height}px`);
    details.dataset.megaPanelVisible = 'true';
    delete details.dataset.opening;
    delete details.dataset.closing;
    syncSharedBackground(header, details, height);
    syncAria(details);
    syncMenuEnvironment(details);
    return;
  }

  runMotion(details, true);
};

const closeMegaMenu = (details, immediate = false) => {
  if (!details.open || (!immediate && details.dataset.closing === 'true')) return;

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (immediate || reduceMotion) {
    clearMotion(details);
    clearHeightGuard(details);
    desktopMegaMenuRevealEnds.delete(details);
    const panel = getPanel(details);

    if (panel?.contains(document.activeElement)) {
      details.querySelector(':scope > summary')?.focus({ preventScroll: true });
    }

    if (panel) {
      panel.inert = false;
      panel.style.removeProperty('height');
      panel.style.removeProperty('--header-mega-panel-height');
    }

    details.open = false;
    delete details.dataset.opening;
    delete details.dataset.closing;
    delete details.dataset.megaPanelVisible;
    clearRevealDelays(details);
    syncSharedBackground(details.closest('[data-header]'));
    syncAria(details);
    syncMenuEnvironment(details);
    return;
  }

  runMotion(details, false);
};
```

## 9. Đổi trực tiếp giữa hai mega menu

Thứ tự đúng là **mở B trước, sau đó mới đóng A**:

```js
const closeTimers = new WeakMap();

const clearCloseTimer = (details) => {
  clearTimeout(closeTimers.get(details));
  closeTimers.delete(details);
};

const closeTopLevelDisclosure = (details) => {
  clearCloseTimer(details);

  if (details.matches('.header__submenu-disclosure--mega')) {
    return closeMegaMenu(details);
  }

  // Adapter tới controller dropdown thường đang có của header.
  return closeExistingHeaderSubmenu(details);
};

const switchMegaMenu = (nextDetails) => {
  const header = nextDetails.closest('[data-header]');
  const previouslyOpen = [...header.querySelectorAll(
    '.header__submenu-disclosure[open]'
  )].filter((details) => details !== nextDetails);

  clearCloseTimer(nextDetails);
  openMegaMenu(nextDetails);

  // B đã trở thành preferred active panel; nền chung có target mới.
  previouslyOpen.forEach(closeTopLevelDisclosure);

  // Mỗi header giữ background/overlay owner riêng, nhưng chỉ một header active.
  document.querySelectorAll('[data-header]').forEach((otherHeader) => {
    if (otherHeader === header) return;
    otherHeader.querySelectorAll(
      '.header__submenu-disclosure[open]'
    ).forEach(closeTopLevelDisclosure);
  });
};
```

`closeExistingHeaderSubmenu()` là integration hook cho dropdown thường. Trong controller production của Spinel, hàm đóng hiện có đã bao phủ cả mega và non-mega; khi port guide sang header khác, phải gọi controller đó để cancel animation/state cũ, không chỉ gán thẳng `details.open = false`.

Nếu đóng A trước, `syncSharedBackground()` không còn tìm thấy active panel và sẽ đưa background về `0px`. Khi B mở ngay sau đó, nền phải đổi hướng thêm một lần nên tạo flicker/co giật.

Với hover desktop, khi pointer rời mega menu nhưng vẫn còn trong cùng header, chưa nên đóng ngay. Menu B có cơ hội nhận `pointerover` và thực hiện handoff:

```js
const supportsDesktopHover = () => window.matchMedia(
  '(min-width: 900px) and (hover: hover) and (pointer: fine)'
).matches;

const getOpenHoverMenus = (header) => (
  header?.querySelectorAll(
    '.header__submenu-disclosure--mega.header__submenu-disclosure--hover[open]'
  ) || []
);

const scheduleClose = (details) => {
  clearCloseTimer(details);

  closeTimers.set(details, window.setTimeout(() => {
    closeTimers.delete(details);
    if (details.matches(':hover') || details.querySelector(':focus-visible')) return;
    closeMegaMenu(details);
  }, HOVER_CLOSE_DELAY));
};

document.addEventListener('pointerover', (event) => {
  if (!supportsDesktopHover()) return;

  const overlay = event.target.closest(
    '.header__menu-overlay--desktop[data-header-menu-overlay]'
  );
  if (overlay) {
    const header = document.getElementById(overlay.dataset.headerMenuOverlay);
    getOpenHoverMenus(header).forEach(scheduleClose);
    return;
  }

  const details = event.target.closest(
    '.header__submenu-disclosure--mega.header__submenu-disclosure--hover'
  );
  if (!details || details.contains(event.relatedTarget)) return;
  clearCloseTimer(details);
  switchMegaMenu(details);
});

document.addEventListener('pointerout', (event) => {
  if (!supportsDesktopHover()) return;
  const details = event.target.closest(
    '.header__submenu-disclosure--mega.header__submenu-disclosure--hover'
  );

  if (details && !details.contains(event.relatedTarget)) {
    const header = details.closest('[data-header]');
    if (!header?.contains(event.relatedTarget)) scheduleClose(details);
    return;
  }

  // Fallback khi pointer rời header từ logo/action/vùng trống thay vì từ details.
  const header = event.target.closest('[data-header]');
  if (!header || header.contains(event.relatedTarget)) return;
  getOpenHoverMenus(header).forEach(scheduleClose);
});

document.addEventListener('focusout', (event) => {
  if (!supportsDesktopHover()) return;
  const details = event.target.closest(
    '.header__submenu-disclosure--mega.header__submenu-disclosure--hover[open]'
  );
  if (!details || details.contains(event.relatedTarget) || details.matches(':hover')) {
    return;
  }
  scheduleClose(details);
});

document.addEventListener('click', (event) => {
  if (!window.matchMedia(DESKTOP_BREAKPOINT).matches) return;
  const summary = event.target.closest('summary');
  const details = summary?.parentElement;
  if (!details?.matches('.header__submenu-disclosure--mega')) return;

  event.preventDefault();
  if (details.open && details.dataset.closing !== 'true') {
    closeMegaMenu(details);
  } else {
    switchMegaMenu(details);
  }
});
```

Click/tap desktop vẫn phải hoạt động trên `summary`; hover chỉ là một cách mở bổ sung, không phải cách duy nhất.

## 10. Theo dõi nội dung thay đổi bằng ResizeObserver

Ảnh lazy-load, font, text wrap hoặc merchant chỉnh nội dung có thể làm panel đổi chiều cao sau khi đã mở. Observe `.header__mega-surface`, không observe chính panel đang animate để tránh vòng lặp không cần thiết.

```js
const syncPanelHeight = (details) => {
  const panel = getPanel(details);
  if (!panel) return 0;

  const height = measurePanelHeight(details);
  const heightValue = `${height}px`;
  const heightChanged = (
    panel.style.getPropertyValue('--header-mega-panel-height') !== heightValue
  );
  const state = desktopMegaMenuMotions.get(details);
  const guardStableResize = (
    heightChanged &&
    !state &&
    details.open &&
    details.dataset.closing !== 'true' &&
    details.dataset.megaPanelVisible === 'true' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  if (guardStableResize) details.dataset.opening = 'true';
  panel.style.setProperty('--header-mega-panel-height', heightValue);

  if (details.open && details.dataset.closing !== 'true') {
    syncSharedBackground(details.closest('[data-header]'), details, height);
  }

  if (heightChanged && state?.opening) {
    state.heightTransitionEndsAt = performance.now() + HEIGHT_DURATION;
    scheduleMotionFinish(state);
  } else if (guardStableResize) {
    clearTimeout(desktopMegaMenuHeightTimers.get(details));
    desktopMegaMenuHeightTimers.set(details, window.setTimeout(() => {
      desktopMegaMenuHeightTimers.delete(details);

      if (
        desktopMegaMenuMotions.has(details) ||
        !details.open ||
        details.dataset.closing === 'true'
      ) {
        return;
      }

      delete details.dataset.opening;
    }, HEIGHT_DURATION + 80));
  }

  return height;
};

const observeMegaMenu = (details) => {
  if (!window.ResizeObserver || desktopMegaMenuResizeObservers.has(details)) {
    return;
  }

  const surface = getPanel(details)?.querySelector(
    ':scope > .header__mega-surface'
  );
  if (!surface) return;

  const observer = new ResizeObserver(() => {
    if (
      isDesktopMegaMenu(details) &&
      details.open &&
      details.dataset.closing !== 'true'
    ) {
      syncPanelHeight(details);
    }
  });

  observer.observe(surface);
  desktopMegaMenuResizeObservers.set(details, observer);
};

const disconnectMegaMenuObserver = (details) => {
  desktopMegaMenuResizeObservers.get(details)?.disconnect();
  desktopMegaMenuResizeObservers.delete(details);
};

let desktopMegaMenuResizeFrame = 0;

window.addEventListener('resize', () => {
  cancelAnimationFrame(desktopMegaMenuResizeFrame);
  desktopMegaMenuResizeFrame = requestAnimationFrame(() => {
    desktopMegaMenuResizeFrame = 0;
    if (!window.matchMedia(DESKTOP_BREAKPOINT).matches) return;

    document.querySelectorAll(
      '.header__submenu-disclosure--mega[open]:not([data-closing="true"])'
    ).forEach(syncPanelHeight);
  });
});
```

Height guard ở trên giữ `data-opening="true"` trong `300ms + buffer` khi một menu đang ổn định phải retarget. Nhờ vậy `overflow-y: auto` chỉ quay lại sau transition mới, không xuất hiện scrollbar giữa chuyển động.

## 11. Overlay, scroll lock, accessibility và focus

### Overlay theo đúng header owner

```js
document.querySelectorAll(
  '.header__menu-overlay--desktop[data-header-menu-overlay]'
).forEach((overlay) => {
  const header = document.getElementById(overlay.dataset.headerMenuOverlay);
  const hasVisibleMenu = (
    window.matchMedia(DESKTOP_BREAKPOINT).matches &&
    Boolean(header?.querySelector(
      '.header__submenu-disclosure[open]:not([data-closing="true"])'
    ))
  );

  overlay.toggleAttribute('data-visible', hasVisibleMenu);
});
```

Không dùng một query toàn document để bật tất cả overlay. Trang có thể có nhiều header instance trong Theme Editor hoặc section được re-render độc lập. Mobile overlay phải được đồng bộ riêng từ trạng thái drawer `data-open`/`data-motion-state`; đoạn desktop trên tuyệt đối không chạm vào `.header__menu-overlay--mobile`.

### ARIA và inert

- Khi bắt đầu Closing, đặt `aria-expanded="false"` ngay dù `details.open` còn là `true` phục vụ animation.
- Khi Closing, đặt `panel.inert = true` để keyboard không tab vào vùng đang biến mất.
- Nếu focus đang ở trong panel khi đóng, đưa focus về `summary` trước khi đặt `inert`.
- Escape ưu tiên đóng menu của header đang chứa focus/event target. Nếu event không có owner header, production có thể fallback đóng các menu đang mở, nhưng vẫn phải khôi phục focus về trigger hợp lệ.
- Overlay click đóng tất cả submenu thuộc đúng header owner.

### Scroll lock

Scroll lock nên dùng owner riêng, ví dụ `mega-menu`, và luôn release đối xứng. Nếu theme chưa có scroll-lock manager, lưu lại inline style cũ trước khi gán `body.style.overflow = 'hidden'`, sau đó khôi phục chính xác giá trị cũ khi menu cuối cùng đóng.

Khi khóa scroll, chiều rộng viewport có thể thay đổi do scrollbar biến mất. Tính phần bù và dùng trong chiều rộng nền/overlay:

```js
const scrollbarWidth = Math.max(
  0,
  window.innerWidth - document.documentElement.clientWidth
);

document.documentElement.style.setProperty(
  '--header-menu-scrollbar-width',
  `${scrollbarWidth}px`
);
document.documentElement.style.setProperty(
  '--scrollbar-width',
  `${scrollbarWidth}px`
);
```

## 12. Breakpoint và Theme Editor lifecycle

Khi đi qua breakpoint `899px ↔ 900px`, không mang state desktop sang mobile hoặc ngược lại. Reset presentation phải dọn cả motion, hover timer, height guard, reveal state và inline style:

```js
const clearExistingResponsiveSubmenuMotions = (details) => {
  // Hai WeakMap này thuộc controller non-mega/mobile đã có của Spinel.
  megaMenuAnimations.get(details)?.cancel();
  megaMenuAnimations.delete(details);
  mobileMegaMenuMotions.get(details)?.animation.cancel();
  mobileMegaMenuMotions.delete(details);
};

const resetPresentation = (details) => {
  clearMotion(details);
  clearHeightGuard(details);
  clearCloseTimer(details);
  clearExistingResponsiveSubmenuMotions(details);
  desktopMegaMenuRevealEnds.delete(details);
  delete details.dataset.opening;
  delete details.dataset.closing;
  delete details.dataset.megaPanelVisible;

  const panel = getPanel(details);
  panel?.style.removeProperty('height');
  panel?.style.removeProperty('--header-mega-panel-height');
  if (panel) panel.inert = false;

  clearRevealDelays(details);
};

const resetHeaderMenus = (header) => {
  header.querySelectorAll(
    '.header__submenu-disclosure, .header__submenu-nested-disclosure'
  ).forEach((details) => {
    resetPresentation(details);
    details.open = false;
    syncAria(details);
  });

  const mobileDisclosure = header.querySelector(
    ':scope > .header__inner > .header__menu-disclosure'
  );
  if (mobileDisclosure) {
    clearMobileDrawerMotion(mobileDisclosure);
    mobileDisclosure.open = false;
    const drawer = mobileDisclosure.nextElementSibling;
    if (drawer?.matches('[data-header-mobile-drawer]')) {
      drawer.dataset.motionState = 'closed';
    }
    syncMobileDrawer(mobileDisclosure);
  }

  resetSharedBackground(header);
};

const desktopMediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

desktopMediaQuery.addEventListener('change', () => {
  // Capture owner/focus target trước khi đóng nếu theme cần phục hồi focus.
  const activeElement = document.activeElement;
  const focusOwnerHeader = activeElement?.closest('[data-header]');
  const focusedDetails = activeElement?.closest(
    '.header__submenu-disclosure, .header__submenu-nested-disclosure'
  );

  document.querySelectorAll('[data-header]').forEach(resetHeaderMenus);
  syncHeaderMenuScrollLock();
  scheduleResponsiveHeaderSync();

  if (!focusOwnerHeader) return;
  const focusCandidates = desktopMediaQuery.matches
    ? [
        focusedDetails?.querySelector(':scope > summary'),
        focusOwnerHeader.querySelector(
          '.header__menu-item > .header__submenu-disclosure > summary, .header__menu-item > a.header__menu-link'
        )
      ]
    : [focusOwnerHeader.querySelector(
        ':scope > .header__inner > .header__menu-disclosure > summary'
      )];

  requestAnimationFrame(() => {
    const nextFocus = focusCandidates.find((candidate) => (
      candidate?.getClientRects().length &&
      getComputedStyle(candidate).visibility !== 'hidden'
    ));
    nextFocus?.focus({ preventScroll: true });
  });
});
```

`clearMobileDrawerMotion()` và `syncMobileDrawer()` ở đây là hook của flow mobile hiện có. Dùng chúng để reset mobile đối xứng; không đưa desktop animation vào drawer.

Theme Editor có thể thay hoặc xóa cả section. Mọi observer, timer, state animation và scroll lock phải được dọn theo đúng `event.target`:

```js
document.querySelectorAll(
  '.header__submenu-disclosure--mega'
).forEach(observeMegaMenu);

document.querySelectorAll(
  '.header__submenu-disclosure, .header__submenu-nested-disclosure'
).forEach(syncAria);

document.querySelectorAll(
  '[data-header] > .header__inner > .header__menu-disclosure'
).forEach(syncMobileDrawer);

syncHeaderMenuScrollLock();
scheduleResponsiveHeaderSync();

document.addEventListener('shopify:section:load', (event) => {
  event.target
    .querySelectorAll('.header__submenu-disclosure--mega')
    .forEach(observeMegaMenu);

  event.target
    .querySelectorAll(
      '.header__submenu-disclosure, .header__submenu-nested-disclosure'
    )
    .forEach(syncAria);

  event.target.querySelectorAll(
    '[data-header] > .header__inner > .header__menu-disclosure'
  ).forEach(syncMobileDrawer);

  syncHeaderMenuScrollLock();
  scheduleResponsiveHeaderSync();
});

document.addEventListener('shopify:section:unload', (event) => {
  event.target
    .querySelectorAll(
      '.header__submenu-disclosure, .header__submenu-nested-disclosure'
    )
    .forEach((details) => {
      resetPresentation(details);
      disconnectMegaMenuObserver(details);
      details.open = false;
      syncAria(details);
    });

  event.target.querySelectorAll('[data-header]').forEach((header) => {
    resetSharedBackground(header);

    const mobileDisclosure = header.querySelector(
      ':scope > .header__inner > .header__menu-disclosure'
    );
    if (mobileDisclosure) {
      clearMobileDrawerMotion(mobileDisclosure);
      mobileDisclosure.open = false;
      const drawer = mobileDisclosure.nextElementSibling;
      if (drawer?.matches('[data-header-mobile-drawer]')) {
        drawer.dataset.motionState = 'closed';
      }
      syncMobileDrawer(mobileDisclosure);
    }
  });

  // Hàm owner-aware này release lock khi menu cuối cùng đã biến mất.
  syncHeaderMenuScrollLock();
  scheduleResponsiveHeaderSync();
});

document.addEventListener('shopify:block:select', (event) => {
  const details = event.target.closest?.('.header__submenu-disclosure');
  if (!details) return;

  const header = details.closest('[data-header]');
  const mobileDisclosure = header?.querySelector(
    ':scope > .header__inner > .header__menu-disclosure'
  );

  if (!desktopMediaQuery.matches && mobileDisclosure) {
    mobileDisclosure.open = true;
    syncMobileDrawer(mobileDisclosure);
  }

  // Dùng controller responsive hiện có, không gọi thẳng desktop-only wrapper.
  openHeaderSubmenu(details);
});
```

Không chờ một `shopify:section:load` khác để cleanup lock của section vừa unload, vì thao tác xóa section có thể chỉ phát `unload`.

## 13. Floating/transparent header

Khi mega menu mở, background gốc của header được chuyển thành transparent và surface chung chịu trách nhiệm vẽ màu. Trước khi mở một transparent header, phải bật surface và chuyển logo/text sang color scheme dành cho nền có màu; helper `prepareResponsiveHeaderSurface()` ở phần state machine thực hiện đúng thứ tự này:

```js
header.classList.add('header--surface-visible');
setTransparentHeaderColorScheme(header, true);
```

Khi Closing bắt đầu hoặc kết thúc, gọi `scheduleResponsiveHeaderSync()` thay vì tự xóa surface ngay. Controller responsive chỉ trả header về transparent scheme sau khi menu cuối cùng thực sự đóng, nhờ đó close animation không đổi màu chữ giữa chừng.

Với floating header, radius phải thuộc surface chung:

```css
@media (min-width: 900px) {
  .header--floating > .header__mega-background {
    left: 0;
    width: 100%;
    overflow: clip;
    border-radius: 12px;
    transform: none;
  }

  .header--floating.header--scrolled > .header__mega-background {
    border-radius: 0 0 12px 12px;
  }

  .header--floating:has(.header__submenu-disclosure--mega[open]) {
    border-radius: 12px 12px 0 0;
  }
}
```

Nếu quên override `header--scrolled`, hai góc trên của surface vẫn bo `12px` trong khi header đã dính sát mép viewport, để lộ khoảng trống ở hai góc.

## 14. Thứ tự tích hợp khuyến nghị

1. Chuẩn hóa DOM: `details > summary + panel > surface`.
2. Thêm một `.header__mega-background` dùng chung cho mỗi header instance.
3. Thêm CSS state Closed/Open/Closing và xác nhận thủ công với các data attribute tĩnh.
4. Thêm hàm đo chiều cao và hai custom property cho panel/background.
5. Thêm state machine open/close, giữ `details.open` đến cuối close.
6. Thêm pin current height để hỗ trợ reversal.
7. Thêm handoff A → B theo thứ tự mở B rồi đóng A.
8. Thêm stagger reveal và giữ overflow hidden đến khi reveal cuối kết thúc.
9. Thêm `ResizeObserver`, reduced motion và breakpoint reset.
10. Nối overlay, scroll lock, ARIA, focus, Escape và Theme Editor lifecycle.

## 15. Checklist QA

### Chuyển động

- Mở từ trạng thái đóng: nền và panel nở đồng bộ, không jump.
- Đóng: panel co về header rồi mới biến mất.
- A → B và B → A với hai chiều cao khác nhau: không có frame nền về `0`.
- Hover nhanh A → B → C: không nháy, không còn timer cũ đóng menu mới.
- Đóng rồi mở lại giữa chừng: bắt đầu từ chiều cao đang hiển thị.
- Mở rồi đóng lại giữa chừng: không jump về full height.
- Nội dung cao hơn viewport: panel giới hạn theo viewport và scroll được sau khi animation hoàn tất.
- Không xuất hiện scrollbar trong height/reveal transition và không có layout shift bất thường.
- Resize viewport và ảnh lazy-load: panel/nền retarget đúng chiều cao.
- Resize `899px → 900px` và `900px → 899px`: không còn `open`, data state, inline height hoặc CSS variable sai breakpoint.
- Reduced motion: state đổi ngay, không để sót opacity `0` hoặc `inert`.

### Interaction/accessibility

- Hover, click, keyboard Enter/Space đều mở/đóng được.
- `aria-expanded` là `false` ngay khi bắt đầu Closing.
- Focus trong panel được trả về summary khi đóng.
- Escape và overlay chỉ tác động tới header đúng owner.
- Tab không đi vào panel Closing.
- Sticky, transparent và floating header giữ đúng màu chữ, surface, vị trí và radius.
- Search, cart, account và các header action khác vẫn click/focus được.

### Hồi quy mobile

- Hamburger và drawer animation giữ nguyên.
- Submenu, nested submenu và nút Back giữ nguyên.
- Mobile overlay chỉ theo drawer state; desktop submenu không bật/tắt nó.
- Touch/click, focus trap/return focus và scroll lock giữ nguyên.
- Mobile drawer không nhận các data state/transition desktop.

### Theme Editor

- Reload section, đổi setting gây re-render, xóa section, xóa block, chọn block và sắp xếp block.
- Sau mỗi thao tác, `html`/`body` vẫn scroll được khi không còn menu mở.
- Không còn `ResizeObserver`, timeout, inline height, CSS variable hoặc class `is-menu-open` của section cũ.
- Nhiều header instance không bật overlay/background của nhau.
- Console không có warning/error mới trong các flow trên.

### Static validation khi triển khai code

```bash
node --check assets/section-header.js

scripts/validate-theme-8gb.sh \
  'sections/header.liquid,assets/section-header.js,assets/section-header-critical-1.css,assets/section-header-mobile.css'

git diff --check
```

Ngoài ra, tìm lại toàn bộ identifier mới để chắc chắn không mang prefix của theme tham chiếu và chỉ sử dụng naming convention hiện tại của Spinel.

## 16. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| Panel không animate | Dùng `height: auto` | Đo pixel và truyền qua CSS variable |
| Close biến mất ngay | Bỏ `details.open` quá sớm | Giữ `open` đến `transitionend`/fallback timer |
| Đảo chiều bị jump | Không pin current rendered height | Đọc `getBoundingClientRect().height`, set inline height rồi bỏ ở frame kế |
| A → B bị co về header | Đóng A trước khi mở B | Mở/sync B trước, sau đó đóng siblings |
| Nền bị đậm/nháy | Panel và shared surface cùng có background | Cho surface panel transparent trên desktop |
| Scrollbar lóe khi mở | Bật `overflow-y: auto` khi reveal chưa xong | Giữ `data-opening` đến khi transition/reveal cuối hoàn tất |
| Link vẫn tab được lúc đóng | Chỉ đổi opacity/height | Đặt `panel.inert = true` trong Closing |
| Overlay sai header | Query global không theo owner | Ghép overlay với header ID qua data attribute |
| Theme Editor bị khóa scroll | Cleanup chỉ chạy khi load lại | Release lock trực tiếp trong `shopify:section:unload` |
| Floating header hở góc | Radius background không đổi khi sticky/scrolled | Override hai góc trên về `0` ở trạng thái scrolled |

## 17. Vị trí implementation hiện tại trong Spinel

- Markup và owner của overlay/surface: [`sections/header.liquid`](../sections/header.liquid)
- Desktop surface, panel transition và reveal: [`assets/section-header-critical-1.css`](../assets/section-header-critical-1.css)
- Mobile overlay/drawer riêng biệt: [`assets/section-header-mobile.css`](../assets/section-header-mobile.css)
- State machine, handoff, resize, ARIA và lifecycle: [`assets/section-header.js`](../assets/section-header.js)

Các tên hàm production quan trọng để tra nhanh:

```text
measureDesktopMegaMenuPanelHeight
syncDesktopMegaMenuBackground
updateDesktopMegaMenuRevealDelays
syncDesktopMegaMenuPanelHeight
runDesktopMegaMenuCssMotion
observeDesktopMegaMenu
openHeaderSubmenu
closeMegaMenu
syncHeaderDisclosureAria
syncHeaderMenuScrollLock
```

Tài liệu này mô tả cơ chế chuyển động. Khi tái áp dụng sang header khác, giữ nguyên state machine và thay selector/markup theo kiến trúc của header đó; không ghép luồng desktop vào mobile drawer chỉ để tái sử dụng code.
