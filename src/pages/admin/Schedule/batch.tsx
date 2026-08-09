import { listAll2 } from '@/api/filmController';
import { list4 } from '@/api/cinemaController';
import { listByCinema } from '@/api/hallController';
import { batchSave, checkConflict } from '@/api/scheduleController';
import { PageContainer } from '@ant-design/pro-components';
import { useNavigate } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  InputNumber,
  message,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

const { RangePicker } = DatePicker;

/** 计算散场时间 */
const calcEndTime = (start: string, durationMin: number) => {
  if (!start || !durationMin) return '';
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + durationMin + 15;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

/** 自动生成全天场次：从开始时间起，每场 = 片长 + 15分钟散场，间隔20分钟休息，最后一场在 24:00 前结束 */
const generateDaySlots = (startTime: string, filmDuration: number) => {
  const DAY_END = 24 * 60;
  const CLEANUP = 15;
  const BREAK = 20;
  const step = filmDuration + CLEANUP + BREAK;
  const [sh, sm] = startTime.split(':').map(Number);
  let t = sh * 60 + sm;
  const fmt = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const slots: { startTime: string; endTime: string }[] = [];
  while (t + filmDuration + CLEANUP <= DAY_END) {
    const end = t + filmDuration + CLEANUP;
    slots.push({ startTime: fmt(t), endTime: fmt(end) });
    t += step;
  }
  return slots;
};

/** 星期 */
const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface PreviewItem {
  key: string;
  showDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  filmName: string;
  hallName: string;
  hallId: string;
  conflict: boolean | null; // null=待检查, true=冲突, false=无冲突
}

const ScheduleBatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 基础数据
  const [films, setFilms] = useState<API.Film[]>([]);
  const [cinemas, setCinemas] = useState<API.Cinema[]>([]);
  const [halls, setHalls] = useState<API.Hall[]>([]);
  const [selectedFilm, setSelectedFilm] = useState<API.Film | null>(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>();

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // 预览列表
  const [preview, setPreview] = useState<PreviewItem[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [filmRes, cinemaRes] = await Promise.all([listAll2(), list4()]);
      setFilms((filmRes as any)?.data || filmRes || []);
      setCinemas((cinemaRes as any)?.data || cinemaRes || []);
    } catch {
      message.error('加载影片或影院数据失败');
    }
  };

  const handleCinemaChange = async (cinemaId: string) => {
    setSelectedCinemaId(cinemaId);
    try {
      const res = await listByCinema({ cinemaId });
      setHalls((res.data as any)?.data || res.data || []);
    } catch {
      setHalls([]);
    }
    form.setFieldValue('hallId', undefined);
    setPreview([]);
  };

  const handleFilmChange = (filmId: string) => {
    const film = films.find((f) => f.id === filmId) || null;
    setSelectedFilm(film);
    setPreview([]);
  };

  const handleHallChange = () => setPreview([]);

  /** 按片长+休息自动生成全天场次，填充到时间列表（生成后可继续微调） */
  const handleAutoGenerate = () => {
    const dayStart = form.getFieldValue('dayStartTime');
    const film = selectedFilm;
    if (!dayStart) {
      message.warning('请先选择开始时间');
      return;
    }
    if (!film || !film.duration) {
      message.warning('请先选择影片（需有片长才能计算）');
      return;
    }
    const startStr = dayjs(dayStart).format('HH:mm');
    const slots = generateDaySlots(startStr, film.duration);
    if (slots.length === 0) {
      message.warning('该开始时间已无法排入一场完整电影，请提前');
      return;
    }
    form.setFieldsValue({
      timeSlots: slots.map((s) => dayjs(`2000-01-01 ${s.startTime}`)),
    });
    setPreview([]); // 时间已变，清空旧预览
    message.success(`已自动生成 ${slots.length} 个场次，可继续微调`);
  };

  // ===== 生成预览 =====
  const generatePreview = () => {
    const values = form.getFieldsValue();
    const { dateRange, timeSlots, hallId } = values;
    const film = selectedFilm;
    // 缺项时给出明确提示，避免"点了没反应"
    if (!film) {
      message.warning('请先选择影片');
      return;
    }
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('请选择日期范围');
      return;
    }
    if (!timeSlots?.length) {
      message.warning('请至少设置一个放映时间');
      return;
    }
    if (!hallId) {
      message.warning('请选择影厅');
      return;
    }

    const [start, end] = dateRange;
    const skipWeekends = values.skipWeekends;
    const hall = halls.find((h) => h.id === hallId);

    // 将 timeSlots 统一转为 "HH:mm" 字符串（兼容 dayjs 对象和字符串）
    const timeStrings: string[] = timeSlots.map((t: any) => {
      if (dayjs.isDayjs(t)) return t.format('HH:mm');
      return String(t);
    });

    const items: PreviewItem[] = [];
    let cur = start.startOf('day');

    while (cur.isBefore(end.endOf('day')) || cur.isSame(end.endOf('day'))) {
      const dayOfWeek = cur.day();
      if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        cur = cur.add(1, 'day');
        continue;
      }

      const dateStr = cur.format('YYYY-MM-DD');
      for (const timeStr of timeStrings) {
        const key = `${dateStr}_${timeStr}`;
        items.push({
          key,
          showDate: dateStr,
          dayOfWeek: WEEK_NAMES[dayOfWeek],
          startTime: timeStr,
          endTime: calcEndTime(timeStr, film.duration || 0),
          filmName: film.name || '',
          hallName: hall?.name || '',
          hallId: hall?.id || '',
          conflict: null,
        });
      }
      cur = cur.add(1, 'day');
    }

    if (items.length === 0) {
      setPreview([]);
      message.warning('所选范围内没有可生成的场次（可能日期范围都在周末且勾选了跳过周末）');
      return;
    }

    setPreview(items);
    // 自动触发冲突检查
    runConflictCheck(items);
  };

  // ===== 冲突检查 =====
  const runConflictCheck = async (items: PreviewItem[]) => {
    setCheckingConflict(true);
    // 全部并发检查：远程数据库单次查询约 200ms+，串行分组会 N 倍放大耗时
    const checks = items.map((item) =>
      checkConflict({
        hallId: item.hallId,
        showDate: item.showDate,
        startTime: item.startTime,
        endTime: item.endTime,
      })
        .then((res) => ({ key: item.key, conflict: (res as any).data === true }))
        .catch(() => ({ key: item.key, conflict: true })),
    );
    const settled = await Promise.allSettled(checks);
    const results = [...items];
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        const idx = results.findIndex((p) => p.key === r.value.key);
        if (idx >= 0) {
          results[idx] = { ...results[idx], conflict: r.value.conflict };
        }
      }
    }
    setPreview(results);
    setCheckingConflict(false);
  };

  // ===== 批量保存 =====
  const handleSubmit = async () => {
    const values = form.getFieldsValue();
    const { hallId } = values;
    if (!hallId || !selectedFilm) {
      message.warning('请先完成基础设置');
      return;
    }
    const validItems = preview.filter((p) => p.conflict === false);
    if (validItems.length === 0) {
      message.warning('没有可保存的场次（无冲突的场次为 0）');
      return;
    }
    if (preview.some((p) => p.conflict === null)) {
      message.warning('冲突检查尚未完成，请稍候');
      return;
    }
    // 跨天场次拦截：散场时间（片长 + 15分钟）超过 24:00 不允许添加
    const crossingItems = validItems.filter((p) => p.endTime && Number(p.endTime.split(':')[0]) >= 24);
    if (crossingItems.length > 0) {
      message.error(`有 ${crossingItems.length} 个场次散场时间超过午夜（如 ${crossingItems[0].startTime} → ${crossingItems[0].endTime}），不允许添加跨天场次`);
      return;
    }

    setSubmitting(true);
    try {
      const schedules: API.Schedule[] = validItems.map((item) => ({
        filmId: selectedFilm.id,
        cinemaId: selectedCinemaId,
        hallId,
        showDate: item.showDate,
        startTime: item.startTime,
        endTime: item.endTime,
        price: values.price,
        vipPrice: values.vipPrice || undefined,
        status: values.status || 'published',
      }));

      const res = await batchSave(schedules);
      message.success(`成功创建 ${res.data || validItems.length} 个场次`);
      navigate('/admin/schedule');
    } catch (e: any) {
      message.error('批量创建失败：' + (e.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 预览表格列 =====
  const previewColumns = [
    {
      title: '日期',
      dataIndex: 'showDate',
      width: 110,
      render: (v: string, r: PreviewItem) => `${v} ${r.dayOfWeek}`,
    },
    { title: '开场', dataIndex: 'startTime', width: 80 },
    { title: '散场', dataIndex: 'endTime', width: 80 },
    { title: '影片', dataIndex: 'filmName', width: 150, ellipsis: true },
    { title: '影厅', dataIndex: 'hallName', width: 100 },
    {
      title: '冲突',
      dataIndex: 'conflict',
      width: 80,
      render: (v: boolean | null) => {
        if (v === null) return <Tag color="default">检查中...</Tag>;
        if (v) return <Badge status="error" text="冲突" />;
        return <Badge status="success" text="通过" />;
      },
    },
  ];

  const conflictCount = preview.filter((p) => p.conflict === true).length;
  const okCount = preview.filter((p) => p.conflict === false).length;
  const checkingCount = preview.filter((p) => p.conflict === null).length;

  return (
    <PageContainer
      header={{
        title: '批量新增场次',
        onBack: () => navigate('/admin/schedule'),
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'published', skipWeekends: false }}>
        {/* ====== Step 1: 基础设置 ====== */}
        <Card title="1. 基础设置" style={{ marginBottom: 16 }}>
          <Form.Item name="filmId" label="影片" rules={[{ required: true, message: '请选择影片' }]}>
            <Select
              showSearch
              placeholder="搜索并选择影片"
              optionFilterProp="label"
              onChange={handleFilmChange}
              options={films
                // 可上映状态才可排片：正在上映 / 热映（草稿、即将上映、已下线不排）
                .filter((f) => f.status === 'published' || f.status === 'hot')
                .map((f) => ({
                  label: `${f.name}（${f.duration}分钟）`,
                  value: f.id,
                }))}
              style={{ maxWidth: 400 }}
            />
          </Form.Item>

          <Space size={16} style={{ width: '100%' }} align="start">
            <Form.Item name="cinemaId" label="影院" rules={[{ required: true, message: '请选择影院' }]} style={{ minWidth: 240 }}>
              <Select
                placeholder="选择影院"
                onChange={handleCinemaChange}
                options={cinemas.filter((c) => c.status === 'published').map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item name="hallId" label="影厅" rules={[{ required: true, message: '请选择影厅' }]} style={{ minWidth: 240 }}>
              <Select
                placeholder={selectedCinemaId ? '选择影厅' : '请先选择影院'}
                disabled={!selectedCinemaId}
                onChange={handleHallChange}
                options={halls.map((h) => ({
                  label: `${h.name}（${h.hallType} · ${h.rowCount}×${h.colCount}）`,
                  value: h.id,
                }))}
              />
            </Form.Item>
          </Space>

          <Space size={16}>
            <Form.Item name="price" label="标准票价(元)" rules={[{ required: true, message: '请输入票价' }]}>
              <InputNumber min={0} precision={2} placeholder="票价" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="vipPrice" label="VIP区票价(元)">
              <InputNumber min={0} precision={2} placeholder="可选" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="status" label="发布状态">
              <Select style={{ width: 120 }} options={[
                { label: '已发布', value: 'published' },
                { label: '草稿', value: 'draft' },
              ]} />
            </Form.Item>
          </Space>
        </Card>

        {/* ====== Step 2: 排期时间 ====== */}
        <Card title="2. 排期时间设置" style={{ marginBottom: 16 }}>
          <Form.Item name="dateRange" label="日期范围" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))} />
          </Form.Item>

          <Space size={16} style={{ marginBottom: 4 }}>
            <Form.Item name="dayStartTime" label="开始时间" initialValue={dayjs('08:00', 'HH:mm')} style={{ marginBottom: 0 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label=" " colon={false} style={{ marginBottom: 0 }}>
              <Button icon={<span>⚡</span>} onClick={handleAutoGenerate} disabled={!selectedFilm}>
                自动生成全天场次
              </Button>
            </Form.Item>
          </Space>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
            按「片长 + 15分钟散场 + 20分钟休息」自动排满一天，最后一场在 24:00 前结束，生成后可在下方微调
          </div>

          <Form.Item label="放映时间" required>
            <Form.List name="timeSlots" initialValue={[dayjs('10:00', 'HH:mm'), dayjs('14:00', 'HH:mm'), dayjs('18:00', 'HH:mm'), dayjs('21:00', 'HH:mm')]}>
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ marginBottom: 8 }}>
                      <Form.Item {...rest} name={name} noStyle rules={[{ required: true, message: '请选择时间' }]}>
                        <TimePicker format="HH:mm" minuteStep={5} placeholder="时间" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button type="link" danger onClick={() => remove(name)}>
                          删除
                        </Button>
                      )}
                    </Space>
                  ))}
                  <div>
                    <Button type="dashed" onClick={() => add()} size="small">
                      + 添加时间
                    </Button>
                  </div>
                </div>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="skipWeekends" valuePropName="checked">
            <Checkbox>跳过周末</Checkbox>
          </Form.Item>

          <Button type="primary" onClick={generatePreview} icon={<span>🔍</span>}>
            生成预览 & 检查冲突
          </Button>
        </Card>

        {/* ====== Step 3: 预览 ====== */}
        {preview.length > 0 && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>3. 预览 & 保存</span>
                <Tag>共 {preview.length} 场</Tag>
                {checkingConflict ? (
                  <Tag color="processing">冲突检查中...（{checkingCount} 待查）</Tag>
                ) : (
                  <>
                    <Tag color="success">{okCount} 场无冲突</Tag>
                    {conflictCount > 0 && <Tag color="error">{conflictCount} 场冲突</Tag>}
                  </>
                )}
              </div>
            }
            extra={
              <Space size={8}>
                <Button onClick={() => runConflictCheck(preview)} loading={checkingConflict}>
                  重新检查
                </Button>
                <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={okCount === 0}>
                  保存 {okCount} 个场次
                </Button>
              </Space>
            }
          >
            {conflictCount > 0 && (
              <Alert
                message={`${conflictCount} 个场次与现有排期冲突，已自动排除，不会被保存`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              dataSource={preview}
              columns={previewColumns}
              rowKey="key"
              pagination={{
                defaultPageSize: 50,
                showSizeChanger: true,
                showTotal: (t) => `共 ${t} 场`,
                pageSizeOptions: ['50', '100', '200'],
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          </Card>
        )}
      </Form>
    </PageContainer>
  );
};

export default ScheduleBatchPage;
