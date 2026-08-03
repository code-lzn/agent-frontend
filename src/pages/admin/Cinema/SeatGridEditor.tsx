import { CrownOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { InputNumber, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface SeatGridEditorProps {
  rowCount: number;
  colCount: number;
  seatTemplate: string;
  onChange: (rowCount: number, colCount: number, seatTemplate: string) => void;
}

interface GridConfig {
  rows: number;
  cols: number;
  vipCells: string[];   // "row,col" 格式的 VIP 座位列表
  rowOverrides?: Record<string, number>;
}

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
    };
  } catch {
    return { rows: 10, cols: 10, vipCells: [], rowOverrides: {} };
  }
};

const buildTemplate = (config: GridConfig): string => {
  const tmpl: Record<string, any> = { rows: config.rows, cols: config.cols };
  // 只存 vipCells（统一格式）
  if (config.vipCells.length > 0) tmpl.vipCells = [...config.vipCells].sort();
  if (config.rowOverrides && Object.keys(config.rowOverrides).length > 0) {
    tmpl.rowOverrides = { ...config.rowOverrides };
  }
  return JSON.stringify(tmpl);
};

/** 获取某行的实际列数（考虑 rowOverrides） */
const getRowCols = (r: number, cfg: GridConfig): number =>
  cfg.rowOverrides?.[String(r)] ?? cfg.cols;

/** 判断座位是否为 VIP */
const isVipSeat = (r: number, c: number, vipSet: Set<string>): boolean =>
  vipSet.has(`${r},${c}`);

/** 行状态 */
type RowStatus = 'all' | 'mixed' | 'none';

const getRowStatus = (r: number, cols: number, vipSet: Set<string>): RowStatus => {
  let vipCount = 0;
  for (let c = 1; c <= cols; c++) {
    if (vipSet.has(`${r},${c}`)) vipCount++;
  }
  if (vipCount === 0) return 'none';
  if (vipCount === cols) return 'all';
  return 'mixed';
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

  // 同步外部 prop（编辑已有影厅时回填 — 包括 rowOverrides）
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

  /** vipCells 的 Set 缓存，避免重复构造 */
  const vipSet = useMemo(() => new Set(config.vipCells), [config.vipCells]);

  // ─── 事件处理 ───

  /** 点击单个座位 → 切换 VIP */
  const toggleSeat = useCallback(
    (r: number, c: number) => {
      const key = `${r},${c}`;
      const next = new Set(vipSet);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      update({ ...config, vipCells: [...next] });
    },
    [config, vipSet, update],
  );

  /** 点击行号 → 整行切换 VIP（全有↔全无） */
  const toggleRow = useCallback(
    (r: number) => {
      const rowCols = getRowCols(r, config);
      const status = getRowStatus(r, rowCols, vipSet);
      const next = new Set(vipSet);
      if (status === 'all') {
        // 全 VIP → 全部取消
        for (let c = 1; c <= rowCols; c++) next.delete(`${r},${c}`);
      } else {
        // 非全 VIP → 全部设为 VIP
        for (let c = 1; c <= rowCols; c++) next.add(`${r},${c}`);
      }
      update({ ...config, vipCells: [...next] });
    },
    [config, vipSet, update],
  );

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
      const next = { ...config, cols: val };
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

      // 列数变化后，调整 vipCells：超出的列移除，新列默认非 VIP
      const oldCols = getRowCols(r, config);
      const nextCells = new Set(vipSet);
      for (let c = val + 1; c <= oldCols; c++) nextCells.delete(`${r},${c}`);

      const next: GridConfig = {
        ...config,
        rowOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
        vipCells: [...nextCells],
      };
      update(next);
    },
    [config, vipSet, update],
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
    for (let r = 1; r <= config.rows; r++) {
      const cols = getRowCols(r, config);
      total += cols;
      for (let c = 1; c <= cols; c++) {
        if (vipSet.has(`${r},${c}`)) vip++;
      }
    }
    return { total, vip, regular: total - vip };
  }, [config, vipSet]);

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
        <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
          <span>共 <b>{stats.total}</b> 座</span>
          <Tag color="gold" style={{ marginRight: 0 }}>{stats.vip} VIP</Tag>
          <Tag color="blue" style={{ marginRight: 0 }}>{stats.regular} 普通</Tag>
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
          {/* 列号标尺（按最大列数显示，统一对齐） */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, paddingLeft: 56 }}>
            <div style={{ width: 130, flexShrink: 0 }} />
            {Array.from({ length: maxCols }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 30, textAlign: 'center', fontSize: 11, color: '#bbb', flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
            ))}
            <div style={{ width: 80, flexShrink: 0 }} />
          </div>

          {/* 行 */}
          {Array.from({ length: config.rows }, (_, ri) => {
            const r = ri + 1;
            const cellW = 30;
            const gap = 2;
            const cols = getRowCols(r, config);
            const status = getRowStatus(r, cols, vipSet);
            const hasOverride = config.rowOverrides?.[String(r)] !== undefined;
            const diff = maxCols - cols;

            let rowBg = 'transparent';
            if (status === 'all') rowBg = '#fff7e6';
            else if (status === 'mixed') rowBg = '#fffbe6';

            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', padding: '2px 0', background: rowBg, borderRadius: 4, marginBottom: 2 }}>
                <div style={{ width: 130, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, paddingLeft: 4 }}>
                  <Tooltip title={status === 'none' ? '点击整行设为 VIP' : '点击取消整行 VIP'}>
                    <div onClick={() => toggleRow(r)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: status === 'none' ? '#e8e8e8' : '#fa8c16', color: status === 'none' ? '#666' : '#fff', userSelect: 'none', flexShrink: 0, transition: 'all 0.2s' }}>{r}</div>
                  </Tooltip>
                  <Tag color={status === 'none' ? 'default' : status === 'mixed' ? 'orange' : 'gold'} style={{ margin: 0, fontSize: 11, lineHeight: '18px', minWidth: 36, textAlign: 'center', padding: '0 4px' }}>{status === 'none' ? '普通' : status === 'mixed' ? '部分' : 'VIP'}</Tag>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                    <Tooltip title={hasOverride ? `该行${cols}座（点击恢复为默认${config.cols}座）` : `该行${cols}座`}>
                      <InputNumber size="small" min={1} max={20} value={cols} onChange={(v) => handleRowCol(r, v)} style={{ width: 48, height: 26, fontSize: 12 }} variant={hasOverride ? 'filled' : 'outlined'} />
                    </Tooltip>
                    {hasOverride ? <Tooltip title="与默认列数不同"><span style={{ fontSize: 11, color: '#fa8c16', cursor: 'default' }}>✦</span></Tooltip> : <span style={{ fontSize: 10, color: '#ccc', width: 12 }} />}
                  </div>
                </div>
                <div style={{ display: 'flex', gap, flexShrink: 0, paddingLeft: diff > 0 ? diff * (cellW + gap) / 2 : 0, transition: 'padding-left 0.2s' }}>
                  {Array.from({ length: cols }, (_, ci) => {
                    const c = ci + 1;
                    const isVip = vipSet.has(`${r},${c}`);
                    const colors = isVip ? COLORS.vip : COLORS.regular;
                    return (
                      <Tooltip key={c} title={<span>{r}排{c}座<br /><span style={{ color: isVip ? '#ffd591' : '#91caff' }}>{isVip ? '👑 VIP（点击取消）' : '点击设为 VIP'}</span></span>}>
                        <div onClick={() => toggleSeat(r, c)} style={{ width: 28, height: 28, borderRadius: 3, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isVip ? '#d48806' : '#1677ff', fontWeight: isVip ? 700 : 400, flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none' }}>{isVip ? '👑' : c}</div>
                      </Tooltip>
                    );
                  })}
                </div>
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
        <span>💡 点击座位格子切换 VIP</span>
        <span>|</span>
        <span>🔄 点击行号切换整行</span>
        <span>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: '#e6f4ff', border: '1px solid #91caff', borderRadius: 2 }} />
          <span>普通</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 2 }} />
          <span>VIP</span>
        </div>
        <MinusCircleOutlined style={{ fontSize: 12, color: '#ddd' }} />
        <span style={{ fontSize: 12 }}>
          行号颜色：<b style={{ color: '#666' }}>灰色</b>=全普通 <b style={{ color: '#d48806' }}>◐橙色</b>=部分VIP <b style={{ color: '#d48806' }}>👑金色</b>=全VIP
        </span>
      </div>
    </div>
  );
};

export default SeatGridEditor;
