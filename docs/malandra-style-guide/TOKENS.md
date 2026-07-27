# Design Tokens

## Color schemes

| Token | Scheme 1 | Scheme 2 | Scheme 3 | Scheme 4 |
|---|---|---|---|---|
| Background | `#ffffff` | `#f4efe9` | `#432315` | `#f9f9f9` |
| Heading | `#181818` | `#181818` | `#ffffff` | `#181818` |
| Text | `#636363` | `#636363` | `#ffffff` at 80% | `#636363` |
| Variant overlay | `#5a5a5a` at 50% | `#212121` at 50% | `#ffffff` at 50% | `#212121` at 50% |
| Variant border | `#e6e6e6` | `#cccccc` | `#cccccc` | `#cccccc` |
| Variant bar background | `#e6e6e6` | `#cccccc` | `#666666` | `#cccccc` |
| Variant component background | `#f2f2f2` | `#e6e6e6` | `#808080` | `#e6e6e6` |
| Primary button background | `#181818` | `#1e1e1e` | `#ffffff` | `#1e1e1e` |
| Primary button label | `#ffffff` | `#ffffff` | `#1e1e1e` | `#ffffff` |
| Primary button outline | `#181818` | `#1e1e1e` | `#ffffff` | `#1e1e1e` |
| Secondary button background | `#ffffff` | `#ffffff` | `#343434` | `#ffffff` |
| Secondary button label | `#1e1e1e` | `#1e1e1e` | `#ffffff` | `#1e1e1e` |
| Secondary button outline | `#ececec` | `#d8d8d8` | `#181818` | `#d8d8d8` |
| Tertiary button | `#181818` | `#1e1e1e` | `#ffffff` | `#1e1e1e` |

Scheme 1 is the default. Scheme 2 is warm ivory. Scheme 3 is the dark brown inverse palette. Scheme 4 is soft gray.

## Static commerce colors

| Token | Value |
|---|---|
| Sale price | `#d82727` |
| Sale badge background | `#d82727` |
| Sale badge text | `#ffffff` |
| Sold-out badge background | `#adadad` |
| Sold-out badge text | `#ffffff` |
| Custom badge 1 background | `#ffffff` |
| Custom badge 1 text | `#181818` |
| Custom badge 2 background | `#6f6f6f` |
| Custom badge 2 text | `#ffffff` |

## Spacing scale

| Token | px | Token | px | Token | px |
|---|---:|---|---:|---|---:|
| px | 1 | 0.5 | 2 | 1 | 4 |
| 1.5 | 6 | 2 | 8 | 2.5 | 10 |
| 3 | 12 | 4 | 16 | 5 | 20 |
| 6 | 24 | 7 | 28 | 8 | 32 |
| 9 | 36 | 10 | 40 | 12 | 48 |
| 14 | 56 | 16 | 64 | 20 | 80 |
| 24 | 96 | 28 | 112 | 32 | 128 |
| 36 | 144 |  |  |  |  |

## Radius scale

| Token | Value |
|---|---:|
| none | 0 px |
| xs | 2 px |
| sm | 4 px |
| md | 6 px |
| lg | 8 px |
| xl | 12 px |
| 2xl | 16 px |
| 3xl | 24 px |
| 4xl | 32 px |
| full | 9999 px |

### Component radius modes

| Component | Square | Rounded | Pill/full |
|---|---:|---:|---:|
| Media and cards | 0 px | token-scaled 2–32 px | 9999 px where applicable |
| Buttons | 0 px | 6 px | 9999 px |
| Badges | 0 px | 4 px | 9999 px |
| Swatches | 0 px | 4 px outer / 2 px inner | 9999 px |
| Forms | 0 px | 6 px | 9999 px |

All component collections default to Square in Figma.

## Opacity scale

`0`, `5`, `10`, `20`, `25`, `30`, `40`, `50`, `60` (disabled), `70`, `75`, `80`, `90`, `95`, `100` percent.

## Devices and containers

| Token | Desktop | Tablet | Mobile |
|---|---:|---:|---:|
| Reference viewport | 1920 px | 768 px | 375 px |
| Page width | 1600 px | 708 px | 343 px |
| Full-width content | 1824 px | 708 px | 343 px |
| Derived side margin | 48 px | 30 px | 16 px |
| Button/form height | 44 px | 44 px | 40 px |
| Button horizontal padding | 28 px | 28 px | 24 px |
