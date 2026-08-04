# 影院浏览与购票功能设计

## 概述

新增影院优先的浏览路径：用户先选城市 → 浏览影院列表 → 进入影院详情查看排期 → 选座购票。与现有"影片→选场次"路径并行，互不影响。

## 页面设计

### 1. 影院列表页 `/cinema`

**城市选择器（顶部）**
- 从 `GET /cinema/list` 返回的影院数据中提取所有城市，去重
- 默认选中第一个城市，展示该城市下的影院
- 切换城市后影院列表刷新（纯前端筛选）

**影院卡片列表**
- 每张卡片展示：影院名称、地址、电话、特色标签（逗号分隔渲染为 Tag）、营业时间、基准票价
- 点击卡片跳转 `/cinema/:id`

**空状态/加载态**
- Loading: Spin 居中
- 空数据: Empty 组件提示"该城市暂无影院"

### 2. 影院详情页 `/cinema/:id`

**影院信息栏（顶部卡片）**
- 影院名称、地址、电话（可点击拨打）、营业时间
- 特色标签 Tag 展示
- 基准票价

**排期列表（按影片分组）**
- 调用 `GET /schedule/list?cinemaId=:id` 获取该影院所有排期
- 前端按 `filmId` 分组，每组一张影片卡片：
  - 左侧：影片海报缩略图
  - 中间：影片名称、类型、评分
  - 右侧：场次时间列表（每个场次显示时间+影厅+价格）
- 点击场次 → 跳转 `/seat?scheduleId=X`（复用现有选座流程）
- 未登录用户点击场次：弹登录确认框（复用 Schedule 页面模式）

**返回按钮**
- 左上角返回箭头，点击回到影院列表

## 路由

```typescript
// 新增两条路由，在 UserLayout 的 children 中
{ name: '影院', path: '/cinema', component: './Cinema' }
{ path: '/cinema/:id', component: './Cinema/Detail', hideInMenu: true }
```

## 导航改动

侧边栏 navItems 新增（放在"影片"后面）：
```typescript
{ key: '/cinema', icon: '🏢', label: '影院' }
```

pageTitleMap 新增：
```typescript
'/cinema': '影院',
```

## API 复用

| 页面 | API | 说明 |
|------|-----|------|
| 影院列表 | `GET /cinema/list` | 获取全部影院，前端按城市筛选 |
| 影院详情 | `GET /cinema/getInfo/{id}` | 获取影院基本信息 |
| 影院排期 | `GET /schedule/list?cinemaId=X` | 获取该影院所有排期（含关联影片信息） |

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/Cinema/index.tsx` | 新增 | 影院列表页 |
| `src/pages/Cinema/index.css` | 新增 | 影院列表样式 |
| `src/pages/Cinema/Detail/index.tsx` | 新增 | 影院详情页 |
| `src/pages/Cinema/Detail/index.css` | 新增 | 影院详情样式 |
| `src/layouts/UserLayout/index.tsx` | 修改 | 新增导航项、pageTitleMap |
| `.umirc.ts` | 修改 | 新增两条路由 |

## 不涉及

- 不修改后端任何代码
- 不修改现有页面（Film、Schedule、Seat、Order 等）
- 不影响现有购票流程
