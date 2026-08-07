import { listAll2 } from '@/api/filmController';
import { list4 } from '@/api/cinemaController';
import { listByCinema } from '@/api/hallController';
import { checkConflict, getInfo3, save3, update3 } from '@/api/scheduleController';
import { PageContainer } from '@ant-design/pro-components';
import { useNavigate, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Spin,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

/** 计算散场时间 */
const calcEndTime = (start: dayjs.Dayjs | null, durationMin: number) => {
  if (!start || !durationMin) return '';
  return start.add(durationMin + 15, 'minute').format('HH:mm');
};

const ScheduleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  // 选择今天的日期时，禁用已过去的时间
  const watchedShowDate = Form.useWatch('showDate', form);
  const isToday = !!watchedShowDate && dayjs(watchedShowDate).isSame(dayjs(), 'day');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [films, setFilms] = useState<API.Film[]>([]);
  const [cinemas, setCinemas] = useState<API.Cinema[]>([]);
  const [allHalls, setAllHalls] = useState<API.Hall[]>([]);

  const [selectedFilm, setSelectedFilm] = useState<API.Film | null>(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>();
  const [showConflict, setShowConflict] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  // 编辑模式：加载已有场次数据回填（依赖 films 就绪，确保影片高亮正确）
  useEffect(() => {
    if (!isEdit || films.length === 0) return;
    (async () => {
      try {
        const res = await getInfo3({ id: id as any });
        const s = (res as any)?.data;
        if (!s) {
          message.error('场次不存在');
          navigate('/admin/schedule');
          return;
        }
        // 加载影院影厅
        if (s.cinemaId) {
          const hallRes = await listByCinema({ cinemaId: s.cinemaId });
          setAllHalls((hallRes.data as any)?.data || hallRes.data || []);
          setSelectedCinemaId(s.cinemaId);
        }
        if (s.filmId) {
          const film = films.find((f) => f.id === s.filmId);
          setSelectedFilm(film || null);
        }
        form.setFieldsValue({
          filmId: s.filmId,
          cinemaId: s.cinemaId,
          hallId: s.hallId,
          showDate: s.showDate ? dayjs(s.showDate) : undefined,
          startTime: s.startTime ? dayjs(`2000-01-01 ${s.startTime}`) : undefined,
          endTime: s.endTime,
          price: s.price,
          vipPrice: s.vipPrice,
        });
      } catch {
        message.error('加载场次失败');
        navigate('/admin/schedule');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, films]);

  const loadOptions = async () => {
    const [filmRes, cinemaRes] = await Promise.all([listAll2(), list4()]);
    setFilms((filmRes as any)?.data || []);
    setCinemas((cinemaRes as any)?.data || []);
  };

  const handleCinemaChange = async (cinemaId: string) => {
    setSelectedCinemaId(cinemaId);
    try {
      const res = await listByCinema({ cinemaId });
      setAllHalls((res.data as any)?.data || res.data || []);
    } catch {
      setAllHalls([]);
    }
    form.setFieldValue('hallId', undefined);
  };

  const handleFilmChange = (filmId: string) => {
    const film = films.find((f) => f.id === filmId) || null;
    setSelectedFilm(film);
    // 自动计算散场时间
    const startTime = form.getFieldValue('startTime');
    if (startTime) {
      form.setFieldValue('endTime', calcEndTime(startTime, film?.duration || 0));
    }
  };

  const handleStartTimeChange = (time: dayjs.Dayjs | null) => {
    form.setFieldValue('endTime', calcEndTime(time, selectedFilm?.duration || 0));
  };

  // 冲突校验
  const doCheckConflict = async (values: any): Promise<boolean> => {
    try {
      const res = await checkConflict({
        hallId: values.hallId,
        showDate: values.showDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime || calcEndTime(values.startTime, selectedFilm?.duration || 0),
        excludeScheduleId: isEdit ? (id as any) : undefined,
      } as any);
      const hasConflict = (res as any)?.data === true;
      if (hasConflict) {
        setShowConflict(true);
        setConflictMsg('该影厅在所选时段已有排期，请调整时间或选择其他影厅');
        return true;
      }
      setShowConflict(false);
      return false;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (values: any) => {
    // 先检查冲突
    const hasConflict = await doCheckConflict(values);
    if (hasConflict) return;

    setSubmitting(true);
    try {
      const params = {
        filmId: values.filmId,
        cinemaId: values.cinemaId,
        hallId: values.hallId,
        showDate: values.showDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime || calcEndTime(values.startTime, selectedFilm?.duration || 0),
        price: values.price,
        vipPrice: values.vipPrice,
        status: 'published',
      };
      if (isEdit) {
        // 雪花 ID 用字符串传递，避免 Number() 精度丢失
        await update3({ id: id as any, ...params } as any);
        message.success('场次更新成功');
      } else {
        await save3(params);
        message.success('场次创建成功');
      }
      navigate('/admin/schedule');
    } catch (e: any) {
      message.error(isEdit ? '更新失败：' + (e.message || '') : '创建失败：' + (e.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: isEdit ? '编辑场次' : '新增场次',
        onBack: () => navigate('/admin/schedule'),
      }}
    >
      <Card style={{ maxWidth: 700 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
        <>
        {showConflict && (
          <Alert
            message={conflictMsg}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setShowConflict(false)}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="filmId" label="关联影片" rules={[{ required: true, message: '请选择影片' }]}>
            <Select
              showSearch
              placeholder="搜索并选择影片"
              optionFilterProp="label"
              onChange={handleFilmChange}
              options={films
                // 可上映状态才可排片：正在上映 / 热映 / 准备上映（草稿、已下线不排）
                .filter((f) => f.status === 'published' || f.status === 'hot' || f.status === 'upcoming')
                .map((f) => ({
                  label: `${f.name}（${f.duration}分钟）`,
                  value: f.id,
                }))}
            />
          </Form.Item>

          <Form.Item name="cinemaId" label="关联影院" rules={[{ required: true, message: '请选择影院' }]}>
            <Select
              placeholder="选择影院"
              onChange={handleCinemaChange}
              options={cinemas.filter((c) => c.status === 'published').map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>

          <Form.Item
            name="hallId"
            label="关联影厅"
            rules={[{ required: true, message: '请选择影厅' }]}
            dependencies={['cinemaId']}
          >
            <Select
              placeholder={selectedCinemaId ? '选择影厅' : '请先选择影院'}
              disabled={!selectedCinemaId}
              options={allHalls.map((h) => ({
                label: `${h.name}（${h.hallType} · ${h.rowCount}×${h.colCount}）`,
                value: h.id,
              }))}
            />
          </Form.Item>

          <Space size={16}>
            <Form.Item name="showDate" label="放映日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker
                placeholder="选择日期"
                disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
              />
            </Form.Item>
            <Form.Item name="startTime" label="放映时间" rules={[{ required: true, message: '请选择时间' }]}>
              <TimePicker
                format="HH:mm"
                minuteStep={5}
                placeholder="选择时间"
                onChange={handleStartTimeChange}
                disabledHours={isToday ? () => Array.from({ length: dayjs().hour() }, (_, i) => i) : undefined}
                disabledMinutes={
                  isToday
                    ? (hour: number) => {
                        if (hour > dayjs().hour()) return [];
                        if (hour === dayjs().hour()) return Array.from({ length: dayjs().minute() }, (_, i) => i);
                        return [];
                      }
                    : undefined
                }
              />
            </Form.Item>
          </Space>

          <Form.Item name="endTime" label="散场时间">
            <Input disabled style={{ width: 200 }} placeholder="自动计算（开场+片长+15分钟）" />
          </Form.Item>

          <Space size={16}>
            <Form.Item name="price" label="标准票价(元)" rules={[{ required: true, message: '请输入票价' }]}>
              <InputNumber min={0} precision={2} placeholder="票价" />
            </Form.Item>
            <Form.Item name="vipPrice" label="VIP区票价(元)">
              <InputNumber min={0} precision={2} placeholder="可选" />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? '保存修改' : '创建场次'}
              </Button>
              <Button onClick={() => navigate('/admin/schedule')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
        </>
        )}
      </Card>
    </PageContainer>
  );
};

export default ScheduleFormPage;
