import { getSeatMap } from '@/api/seatController';
import { Button, Modal, Spin, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

interface SeatViewModalProps {
  scheduleId?: number;
  scheduleDesc?: string;
  open: boolean;
  onClose: () => void;
}

/** 该行实际物理列数（考虑 rowOverrides） */
const getRowCols = (rowNum: number, seatMap: API.SeatMapVO): number =>
  seatMap.rowOverrides?.[rowNum] ?? seatMap.colCount ?? 0;

const AISLE_COL_GAP = 16;   // 纵向过道宽度
const AISLE_ROW_HEIGHT = 12; // 横向过道高度

/**
 * 场次座位视图弹窗（PRD 3.3.3.3 交互规则⑤）
 * 只读展示场次座位状态：可售 / 已售 / 锁定 / VIP，按物理格遍历渲染
 * —— 空位格（柱子/缺口）留白，过道行/列加宽间距
 */
const SeatViewModal: React.FC<SeatViewModalProps> = ({
  scheduleId,
  scheduleDesc,
  open,
  onClose,
}) => {
  const [seatMap, setSeatMap] = useState<API.SeatMapVO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !scheduleId) return;
    setLoading(true);
    setSeatMap(null);
    getSeatMap({ scheduleId })
      .then((res) => {
        if ((res as any)?.data) setSeatMap((res as any)?.data);
      })
      .catch(() => setSeatMap(null))
      .finally(() => setLoading(false));
  }, [open, scheduleId]);

  const getSeatStyle = (seat: API.Seat): React.CSSProperties => {
    if (seat.status === 'sold') {
      return { background: '#e8e8e8', border: '1px solid #d9d9d9', color: '#bfbfbf' };
    }
    if (seat.status === 'locked') {
      return { background: '#fff7e6', border: '1px solid #ffd591', color: '#d46b08' };
    }
    if (seat.zone === 'vip') {
      return { background: '#fff8e1', border: '1px solid #ffe082', color: '#d4a017' };
    }
    return { background: '#e8f4fd', border: '1px solid #b3d9f2', color: '#1677ff' };
  };

  // rowNum → { colNum → seat }
  const seatByPos: Record<number, Record<number, API.Seat>> = {};
  seatMap?.seats?.forEach((seat) => {
    if (seat.rowNum == null || seat.colNum == null) return;
    if (!seatByPos[seat.rowNum]) seatByPos[seat.rowNum] = {};
    seatByPos[seat.rowNum][seat.colNum] = seat;
  });

  const aisleRowSet = new Set(seatMap?.aisleRows || []);
  const aisleColSet = new Set(seatMap?.aisleCols || []);

  const countBy = (fn: (s: API.Seat) => boolean) =>
    seatMap?.seats?.filter(fn).length || 0;
  const availableCount = countBy((s) => s.status === 'available');
  const soldCount = countBy((s) => s.status === 'sold');
  const lockedCount = countBy((s) => s.status === 'locked');
  const vipCount = countBy((s) => s.zone === 'vip');

  const rowCount = seatMap?.rowCount ?? 0;
  const colCount = seatMap?.colCount ?? 0;

  return (
    <Modal
      title={`座位视图 ${scheduleDesc ? `- ${scheduleDesc}` : ''}`}
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          关闭
        </Button>
      }
      width={760}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : !seatMap ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          座位信息不存在或场次已失效
        </div>
      ) : (
        <div>
          {/* 影厅信息 + 统计 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15 }}>
              {seatMap.hallName}（{seatMap.hallType}厅）
            </Text>
            <Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
              {rowCount}排{colCount}座 · 普通 ¥{seatMap.price}
              {seatMap.vipPrice ? ` · VIP ¥${seatMap.vipPrice}` : ''}
            </Text>
            <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 13 }}>
              <span>🟦 可售 {availableCount}</span>
              <span>⬛ 已售 {soldCount}</span>
              <span style={{ color: '#d46b08' }}>🟧 锁定 {lockedCount}</span>
              <span style={{ color: '#d4a017' }}>👑 VIP {vipCount}</span>
            </div>
          </div>

          {/* 银幕 */}
          <div
            style={{
              width: '50%', margin: '0 auto 20px', height: 6,
              background: 'linear-gradient(90deg, transparent, rgba(22,119,255,.2), transparent)',
              borderRadius: 3, textAlign: 'center', position: 'relative',
            }}
          >
            <Text
              style={{
                fontSize: 12, color: '#1677ff', position: 'absolute',
                top: -18, left: '50%', transform: 'translateX(-50%)', letterSpacing: 5,
              }}
            >
              银 幕
            </Text>
          </div>

          {/* 座位网格：按物理格遍历，空位留白、过道加宽 */}
          <div style={{ overflowX: 'auto', padding: '0 4px' }}>
            {Array.from({ length: rowCount }, (_, ri) => {
              const r = ri + 1;
              const rowCols = getRowCols(r, seatMap);
              const rowSeats = seatByPos[r] || {};
              const cells: React.ReactNode[] = [];

              for (let c = 1; c <= rowCols; c++) {
                const seat = rowSeats[c];
                if (seat) {
                  cells.push(
                    <div
                      key={seat.id}
                      title={`${seat.seatLabel}${seat.zone === 'vip' ? '（VIP）' : ''}· ${seat.status}`}
                      style={{
                        width: 26, height: 24, borderRadius: '4px 4px 3px 3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, cursor: 'default', ...getSeatStyle(seat),
                      }}
                    >
                      {seat.colNum}
                    </div>,
                  );
                } else {
                  // 空位格（柱子/缺口/rowOverrides 少座区域）：留白
                  cells.push(
                    <div
                      key={`blank-${c}`}
                      style={{
                        width: 26, height: 24, borderRadius: '4px 4px 3px 3px',
                        background: '#fafafa', border: '1px dashed #eee',
                      }}
                    />,
                  );
                }
                // 纵向过道：在过道列之后插入间隙
                if (aisleColSet.has(c)) {
                  cells.push(<div key={`aisle-${c}`} style={{ width: AISLE_COL_GAP, flexShrink: 0 }} />);
                }
              }

              return (
                <div key={r}>
                  <div
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      gap: 5, marginBottom: 2,
                    }}
                  >
                    <span style={{ width: 22, textAlign: 'right', fontSize: 11, color: '#999', marginRight: 4 }}>
                      {r}
                    </span>
                    {cells}
                    <span style={{ width: 22, fontSize: 11, color: '#999', marginLeft: 4 }}>
                      {r}
                    </span>
                  </div>
                  {/* 横向过道：行 r 之后 */}
                  {aisleRowSet.has(r) && (
                    <div
                      style={{
                        height: AISLE_ROW_HEIGHT,
                        margin: '2px auto',
                        width: '92%',
                        background: 'repeating-linear-gradient(90deg, #fafafa, #fafafa 4px, #ffffff 4px, #ffffff 8px)',
                        borderRadius: 3,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SeatViewModal;
