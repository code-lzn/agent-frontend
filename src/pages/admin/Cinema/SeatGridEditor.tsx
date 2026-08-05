import { InputNumber, Segmented, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface SeatGridEditorProps {
  rowCount: number;
  colCount: number;
  seatTemplate: string;
  onChange: (rowCount: number, colCount: number, seatTemplate: string) => void;
}

/** 绘制模式：点击格子设置的格子类型 */
type PaintMode = 'regular' | 'vip' | 'blocked';

interface GridConfig {
  rows: number;
  cols: number;
  vipCells: string[];       // "row,col" 格式的 VIP 座位列表
  rowOverrides?: Record<string, number>;
  blockedCells: string[];   // "row,col" 格式的空位/缺口（柱子、门、设备区，不生成座位）
  aisleRows: number[];      // 这些行【之后】插入横向过道
  aisleCols: number[];      // 这些列【之后】插入纵向过道
}

const AISLE_COL_GAP = 16;   // 纵向过道宽度（列间加宽）
const AISLE_ROW_HEIGHT = 12; // 横向过道高度（行间加宽）
const ROW_AISLE_BTN_W = 24;  // 行左侧「过道」按钮宽度
const ROW_LABEL_W = 162;     // 行号区宽度（行号按钮+状态+列数输入），保证状态含「·空」时不挤压列数输入框
const LEFT_W = ROW_AISLE_BTN_W + ROW_LABEL_W; // 左侧固定区总宽，列标尺/横向过道对齐基准

/* ---------- 工具函数 ---------- */

const parseTemplate = (template: string): GridConfig => {
  try {
    const p = JSON.parse(template || '{}');
    const vipCells: string[] = [];
    // 兼容旧的 vipRows 格式 → 转换为 vipCells
    if (p.vipRows?.length) {
      const cols = p.cols || 10;
      for (const row of p.vipRows) {
        for (let c = 1; c <= cols; c++) vipCells.push(`${row},${c}`);
      }
    }
    // 合并已有的 vipCells
    if (p.vipCells?.length) {
      for (const cell of p.vipCells) {
        if (!vipCells.includes(cell)) vipCells.push(cell);
      }
    }
    return {
      rows: p.rows || 10,
      cols: p.cols || 10,
      vipCells,
      rowOverrides: p.rowOverrides || {},
      blockedCells: p.blockedCells || [],
      aisleRows: p.aisleRows || [],
      aisleCols: p.aisleCols || [],
    };
  } catch {
    return { rows: 10, cols: 10, vipCells: [], rowOverrides: {}, blockedCells: [], aisleRows: [], aisleCols: [] };
  }
};

const buildTemplate = (config: GridConfig): string => {
  const tmpl: Record<string, any> = { rows: config.rows, cols: config.cols };
  if (config.vipCells.length > 0) tmpl.vipCells = [...config.vipCells].sort();
  if (config.rowOverrides && Object.keys(config.rowOverrides).length > 0) {
    tmpl.rowOverrides = { ...config.rowOverrides };
  }
  if (config.blockedCells.length > 0) tmpl.blockedCells = [...config.blockedCells].sort();
  if (config.aisleRows.length > 0) tmpl.aisleRows = [...config.aisleRows].sort((a, b) => a - b);
  if (config.aisleCols.length > 0) tmpl.aisleCols = [...config.aisleCols].sort((a, b) => a - b);
  return JSON.stringify(tmpl);
};

/** 获取某行的实际列数（考虑 rowOverrides） */
const getRowCols = (r: number, cfg: GridConfig): number =>
  cfg.rowOverrides?.[String(r)] ?? cfg.cols;

/** 行状态（仅基于非空位格子） */
type RowStatus = 'all' | 'mixed' | 'none' | 'empty';

const getRowStatus = (
  r: number,
  cols: number,
  vipSet: Set<string>,
  blockedSet: Set<string>,
): RowStatus => {
  let vipCount = 0;
  let seatCount = 0;
  for (let c = 1; c <= cols; c++) {
    if (blockedSet.has(`${r},${c}`)) continue;
    seatCount++;
    if (vipSet.has(`${r},${c}`)) vipCount++;
  }
  if (seatCount === 0) return 'empty';
  if (vipCount === 0) return 'none';
  if (vipCount === seatCount) return 'all';
  return 'mixed';
};

/** 该行是否包含空位格 */
const hasBlockedInRow = (r: number, cols: number, blockedSet: Set<string>): boolean => {
  for (let c = 1; c <= cols; c++) {
    if (blockedSet.has(`${r},${c}`)) return true;
  }
  return false;
};

// 座位颜色
const COLORS = {
  regular: { bg: '#e6f4ff', border: '#91caff' },
  vip: { bg: '#fff7e6', border: '#ffd591' },
};

const SeatGridEditor: React.FC<SeatGridEditorProps> = ({
  rowCount: propRowCount,
  colCount: propColCount,
  seatTemplate,
  onChange,
}) => {
  const [config, setConfig] = useState<GridConfig>(() =>
    parseTemplate(seatTemplate || JSON.stringify({ rows: propRowCount, cols: propColCount })),
  );
  // 当前绘制模式：点击格子时应用的格子类型
  const [paintMode, setPaintMode] = useState<PaintMode>('vip');

  // 同步外部 prop（编辑已有影厅时回填 — 包括 rowOverrides/blockedCells/过道）
  useEffect(() => {
    const parsed = parseTemplate(seatTemplate || JSON.stringify({ rows: propRowCount, cols: propColCount }));
    setConfig(parsed);
  }, [propRowCount, propColCount, seatTemplate]);

  /** 更新 state 并通知父组件 */
  const update = useCallback(
    (next: GridConfig) => {
      setConfig(next);
      onChange(next.rows, next.cols, buildTemplate(next));
    },
    [onChange],
  );

  const vipSet = useMemo(() => new Set(config.vipCells), [config.vipCells]);
  const blockedSet = useMemo(() => new Set(config.blockedCells), [config.blockedCells]);
  const aisleRowSet = useMemo(() => new Set(config.aisleRows), [config.aisleRows]);
  const aisleColSet = useMemo(() => new Set(config.aisleCols), [config.aisleCols]);

  // ─── 绘制事件 ───

  /** 按当前绘制模式点击格子 */
  const paintSeat = useCallback(
    (r: number, c: number) => {
      const key = `${r},${c}`;
      const nextVip = new Set(vipSet);
      const nextBlocked = new Set(blockedSet);
      if (paintMode === 'vip') {
        nextVip.add(key);
        nextBlocked.delete(key);
      } else if (paintMode === 'blocked') {
        nextBlocked.add(key);
        nextVip.delete(key);
      } else {
        nextVip.delete(key);
        nextBlocked.delete(key);
      }
      update({ ...config, vipCells: [...nextVip], blockedCells: [...nextBlocked] });
    },
    [config, vipSet, blockedSet, paintMode, update],
  );

  /** 点击行号 → 整行 VIP 切换（全有↔全无，空位格保持空位） */
  const toggleRow = useCallback(
    (r: number) => {
      const rowCols = getRowCols(r, config);
      const status = getRowStatus(r, rowCols, vipSet, blockedSet);
      if (status === 'empty') return;
      const nextVip = new Set(vipSet);
      const nextBlocked = new Set(blockedSet);
      const makeVip = status !== 'all';
      for (let c = 1; c <= rowCols; c++) {
        const key = `${r},${c}`;
        if (nextBlocked.has(key)) continue; // 空位格不受整行 VIP 影响
        if (makeVip) nextVip.add(key);
        else nextVip.delete(key);
      }
      update({ ...config, vipCells: [...nextVip], blockedCells: [...nextBlocked] });
    },
    [config, vipSet, blockedSet, update],
  );

  /** 行尾过道：在行 r 之后插入/移除横向过道 */
  const toggleRowAisle = useCallback(
    (r: number) => {
      const next = new Set(aisleRowSet);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      update({ ...config, aisleRows: [...next].sort((a, b) => a - b) });
    },
    [config, aisleRowSet, update],
  );

  /** 列号下过道：在列 c 之后插入/移除纵向过道 */
  const toggleColAisle = useCallback(
    (c: number) => {
      const next = new Set(aisleColSet);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      update({ ...config, aisleCols: [...next].sort((a, b) => a - b) });
    },
    [config, aisleColSet, update],
  );

  // ─── 行/列数调整 ───

  /** 总行数 */
  const handleRowCount = useCallback(
    (val: number | null) => {
      if (!val || val < 1) return;
      const next: GridConfig = {
        ...config,
        rows: val,
        vipCells: config.vipCells.filter((cell) => {
          const [r] = cell.split(',').map(Number);
          return r <= val;
        }),
        blockedCells: config.blockedCells.filter((cell) => {
          const [r] = cell.split(',').map(Number);
          return r <= val;
        }),
        aisleRows: config.aisleRows.filter((r) => r <= val),
        rowOverrides: config.rowOverrides
          ? Object.fromEntries(Object.entries(config.rowOverrides).filter(([k]) => Number(k) <= val))
          : undefined,
      };
      if (next.rowOverrides && Object.keys(next.rowOverrides).length === 0) next.rowOverrides = undefined;
      update(next);
    },
    [config, update],
  );

  /** 默认列数 */
  const handleColCount = useCallback(
    (val: number | null) => {
      if (!val || val < 1) return;
      const next = {
        ...config,
        cols: val,
        // 列数缩小后，超出的 VIP/空位/列过道清理
        vipCells: config.vipCells.filter((cell) => {
          const [, c] = cell.split(',').map(Number);
          return c <= val;
        }),
        blockedCells: config.blockedCells.filter((cell) => {
          const [, c] = cell.split(',').map(Number);
          return c <= val;
        }),
        aisleCols: config.aisleCols.filter((c) => c <= val),
      };
      update(next);
    },
    [config, update],
  );

  /** 某行单独列数 */
  const handleRowCol = useCallback(
    (r: number, val: number | null) => {
      if (!val || val < 1) return;
      const overrides = { ...(config.rowOverrides || {}) };
      if (val === config.cols) delete overrides[String(r)];
      else overrides[String(r)] = val;

      // 列数变化后，调整 VIP/空位：超出的列移除
      const oldCols = getRowCols(r, config);
      const nextVip = new Set(vipSet);
      const nextBlocked = new Set(blockedSet);
      for (let c = val + 1; c <= oldCols; c++) {
        nextVip.delete(`${r},${c}`);
        nextBlocked.delete(`${r},${c}`);
      }

      const next: GridConfig = {
        ...config,
        rowOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
        vipCells: [...nextVip],
        blockedCells: [...nextBlocked],
      };
      update(next);
    },
    [config, vipSet, blockedSet, update],
  );

  // ─── 最大列数（用于居中 + 列号标尺） ───
  const maxCols = useMemo(() => {
    let m = config.cols;
    if (config.rowOverrides) {
      for (const v of Object.values(config.rowOverrides)) {
        if (v > m) m = v;
      }
    }
    return m;
  }, [config.cols, config.rowOverrides]);

  // ─── 统计 ───
  const stats = useMemo(() => {
    let total = 0;
    let vip = 0;
    let blocked = 0;
    for (let r = 1; r <= config.rows; r++) {
      const cols = getRowCols(r, config);
      for (let c = 1; c <= cols; c++) {
        const key = `${r},${c}`;
        if (blockedSet.has(key)) {
          blocked++;
          continue;
        }
        total++;
        if (vipSet.has(key)) vip++;
      }
    }
    return { total, vip, regular: total - vip, blocked };
  }, [config, vipSet, blockedSet]);

  // ─── 渲染一行（座位/空位 + 列过道间隙） ───
  const renderRowCells = (r: number, cols: number) => {
    const cells: React.ReactNode[] = [];
    for (let c = 1; c <= cols; c++) {
      const key = `${r},${c}`;
      const isBlocked = blockedSet.has(key);
      const isVip = vipSet.has(key);

      if (isBlocked) {
        cells.push(
          <Tooltip
            key={key}
            title={
              <span>
                {r}排{c}格
                <br />
                <span style={{ color: '#bfbfbf' }}>
                  空位（点击设为{paintMode === 'vip' ? 'VIP' : paintMode === 'blocked' ? '取消空位' : '普通'}）
                </span>
              </span>
            }
          >
            <div
              onClick={() => paintSeat(r, c)}
              style={{
                width: 28, height: 28, borderRadius: 3,
                background: '#fafafa', border: '1px dashed #e8e8e8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#ccc', flexShrink: 0,
                cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
              }}
            >
              ·
            </div>
          </Tooltip>,
        );
      } else {
        const colors = isVip ? COLORS.vip : COLORS.regular;
        cells.push(
          <Tooltip
            key={key}
            title={
              <span>
                {r}排{c}座
                <br />
                <span style={{ color: isVip ? '#ffd591' : '#91caff' }}>
                  {paintMode === 'vip' ? (isVip ? '👑 VIP（点击取消）' : '点击设为 VIP') : paintMode === 'blocked' ? '点击设为空位' : isVip ? '👑 VIP（点击取消）' : '普通（点击取消 VIP）'}
                </span>
              </span>
            }
          >
            <div
              onClick={() => paintSeat(r, c)}
              style={{
                width: 28, height: 28, borderRadius: 3,
                background: colors.bg, border: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: isVip ? '#d48806' : '#1677ff', fontWeight: isVip ? 700 : 400,
                flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
              }}
            >
              {isVip ? '👑' : c}
            </div>
          </Tooltip>,
        );
      }

      // 纵向过道：在 aisleCols 中的列之后插入间隙
      if (aisleColSet.has(c)) {
        cells.push(<div key={`aisle-${c}`} style={{ width: AISLE_COL_GAP, flexShrink: 0 }} />);
      }
    }
    return cells;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ======== 顶部控制栏 ======== */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          padding: '12px 16px',
          background: '#fafafa',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#666' }}>总行数</span>
          <InputNumber min={1} max={20} value={config.rows} onChange={handleRowCount} style={{ width: 64 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#666' }}>默认列数</span>
          <InputNumber min={1} max={20} value={config.cols} onChange={handleColCount} style={{ width: 64 }} />
        </div>
        <div style={{ borderLeft: '1px solid #e8e8e8', height: 24 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#666' }}>绘制</span>
          <Segmented
            size="small"
            value={paintMode}
            onChange={(v) => setPaintMode(v as PaintMode)}
            options={[
              { label: '🟦 普通', value: 'regular' },
              { label: '👑 VIP', value: 'vip' },
              { label: '▩ 空位', value: 'blocked' },
            ]}
          />
        </div>
        <div style={{ borderLeft: '1px solid #e8e8e8', height: 24 }} />
        <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
          <span>共 <b>{stats.total}</b> 座</span>
          <Tag color="gold" style={{ marginRight: 0 }}>{stats.vip} VIP</Tag>
          <Tag color="blue" style={{ marginRight: 0 }}>{stats.regular} 普通</Tag>
          <Tag color="default" style={{ marginRight: 0 }}>{stats.blocked} 空位</Tag>
        </div>
      </div>

      {/* ======== 网格 ======== */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: 500,
          padding: '4px 0',
        }}
      >
        <div style={{ minWidth: Math.max(maxCols * 32 + 240, 280) }}>
          {/* 列号标尺（左侧与座位格起点对齐；过道列后同步插入间隙，保证列号与座位列对齐） */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: LEFT_W, flexShrink: 0 }} />
            {Array.from({ length: maxCols }, (_, i) => {
              const c = i + 1;
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 30, textAlign: 'center', fontSize: 11, color: '#bbb' }}>{c}</div>
                  {aisleColSet.has(c) && <div style={{ width: AISLE_COL_GAP, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* 列过道切换按钮（与列号标尺同一基准） */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ width: LEFT_W, flexShrink: 0 }} />
            {Array.from({ length: maxCols }, (_, i) => {
              const c = i + 1;
              const hasAisle = aisleColSet.has(c);
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 30, textAlign: 'center' }}>
                    <Tooltip title={hasAisle ? '移除该列右侧纵向过道' : '在该列右侧插入纵向过道'}>
                      <div
                        onClick={() => toggleColAisle(c)}
                        style={{
                          cursor: 'pointer', fontSize: 10, lineHeight: '16px', height: 16,
                          color: hasAisle ? '#1677ff' : '#c0c4cc', background: hasAisle ? '#e6f4ff' : 'transparent',
                          borderRadius: 3, userSelect: 'none', transition: 'all 0.15s',
                        }}
                      >
                        {hasAisle ? '━' : '＋'}
                      </div>
                    </Tooltip>
                  </div>
                  {hasAisle && <div style={{ width: AISLE_COL_GAP, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* 行 */}
          {Array.from({ length: config.rows }, (_, ri) => {
            const r = ri + 1;
            const cellW = 30;
            const gap = 2;
            const cols = getRowCols(r, config);
            const status = getRowStatus(r, cols, vipSet, blockedSet);
            const hasBlocked = hasBlockedInRow(r, cols, blockedSet);
            const hasOverride = config.rowOverrides?.[String(r)] !== undefined;
            const hasRowAisle = aisleRowSet.has(r);
            const diff = maxCols - cols;

            let rowBg = 'transparent';
            if (status === 'all') rowBg = '#fff7e6';
            else if (status === 'mixed') rowBg = '#fffbe6';
            else if (status === 'empty') rowBg = '#f5f5f5';

            const statusTagText =
              status === 'empty' ? '空位'
              : status === 'all' ? 'VIP'
              : status === 'mixed' ? '部分'
              : '普通';

            return (
              <div key={r}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0', background: rowBg, borderRadius: 4, marginBottom: 2 }}>
                  {/* 行过道按钮 */}
                  <div style={{ width: ROW_AISLE_BTN_W, flexShrink: 0, textAlign: 'center' }}>
                    <Tooltip title={hasRowAisle ? '移除该行下方横向过道' : '在该行下方插入横向过道'}>
                      <div
                        onClick={() => toggleRowAisle(r)}
                        style={{
                          cursor: 'pointer', fontSize: 11, lineHeight: '18px', height: 18, width: 22,
                          color: hasRowAisle ? '#1677ff' : '#c0c4cc', background: hasRowAisle ? '#e6f4ff' : 'transparent',
                          borderRadius: 3, margin: '0 auto', userSelect: 'none', transition: 'all 0.15s',
                        }}
                      >
                        {hasRowAisle ? '━' : '＋'}
                      </div>
                    </Tooltip>
                  </div>

                  <div style={{ width: ROW_LABEL_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, paddingLeft: 4 }}>
                    <Tooltip title={status === 'empty' ? '该行无座位' : status === 'none' || status === 'mixed' ? '点击整行设为 VIP' : '点击取消整行 VIP'}>
                      <div
                        onClick={() => toggleRow(r)}
                        style={{
                          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 4, cursor: status === 'empty' ? 'not-allowed' : 'pointer',
                          fontWeight: 600, fontSize: 13,
                          background: status === 'none' || status === 'empty' ? '#e8e8e8' : '#fa8c16',
                          color: status === 'none' || status === 'empty' ? '#666' : '#fff',
                          userSelect: 'none', flexShrink: 0, transition: 'all 0.2s',
                        }}
                      >
                        {r}
                      </div>
                    </Tooltip>
                    <Tag
                      color={status === 'mixed' ? 'orange' : status === 'all' ? 'gold' : 'default'}
                      style={{ margin: 0, fontSize: 11, lineHeight: '18px', minWidth: 42, textAlign: 'center', padding: '0 4px' }}
                    >
                      {hasBlocked && status !== 'empty' ? `${statusTagText}·空` : statusTagText}
                    </Tag>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                      <Tooltip title={hasOverride ? `该行${cols}座（点击恢复为默认${config.cols}座）` : `该行${cols}座`}>
                        <InputNumber size="small" min={1} max={20} value={cols} onChange={(v) => handleRowCol(r, v)} style={{ width: 48, height: 26, fontSize: 12 }} variant={hasOverride ? 'filled' : 'outlined'} />
                      </Tooltip>
                      {hasOverride ? <Tooltip title="与默认列数不同"><span style={{ fontSize: 11, color: '#fa8c16', cursor: 'default' }}>✦</span></Tooltip> : <span style={{ fontSize: 10, color: '#ccc', width: 12 }} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap, flexShrink: 0, paddingLeft: diff > 0 ? diff * (cellW + gap) / 2 : 0, transition: 'padding-left 0.2s' }}>
                    {renderRowCells(r, cols)}
                  </div>
                </div>

                {/* 横向过道：行 r 之后（与座位格起点对齐） */}
                {hasRowAisle && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '2px 0 4px' }}>
                    <div style={{ width: LEFT_W, flexShrink: 0 }} />
                    <div
                      style={{
                        height: AISLE_ROW_HEIGHT,
                        flex: 1,
                        background: 'repeating-linear-gradient(90deg, #fafafa, #fafafa 4px, #ffffff 4px, #ffffff 8px)',
                        borderRadius: 3,
                        opacity: 0.9,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======== 图例 & 操作提示 ======== */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          padding: '8px 16px',
          background: '#fafafa',
          borderRadius: 6,
          fontSize: 13,
          color: '#888',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span>💡 先选绘制模式，再点格子：普通 / VIP / 空位</span>
        <span>|</span>
        <span>🔄 点行号切换整行 VIP</span>
        <span>|</span>
        <span>➕ 行左/列下按钮插入过道</span>
        <span>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: '#e6f4ff', border: '1px solid #91caff', borderRadius: 2 }} />
          <span>普通</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 2 }} />
          <span>VIP</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: '#fafafa', border: '1px dashed #e8e8e8', borderRadius: 2 }} />
          <span>空位</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: 6, background: 'repeating-linear-gradient(90deg, #fafafa, #fafafa 3px, #ffffff 3px, #ffffff 6px)', borderRadius: 2 }} />
          <span>过道</span>
        </div>
        <span style={{ fontSize: 12 }}>
          行号：<b style={{ color: '#666' }}>灰</b>=全普通 <b style={{ color: '#d48806' }}>◐橙</b>=部分VIP <b style={{ color: '#d48806' }}>👑金</b>=全VIP
        </span>
      </div>
    </div>
  );
};

export default SeatGridEditor;
