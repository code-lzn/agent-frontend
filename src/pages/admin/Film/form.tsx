import { getInfo6, save6, update6 } from '@/api/filmController';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@umijs/max';

const { TextArea } = Input;

const FILM_TYPES = ['动作', '喜剧', '科幻', '爱情', '恐怖', '动画', '剧情', '悬疑', '奇幻', '战争'];

const FilmFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!id && id !== 'add';

  useEffect(() => {
    if (isEdit) {
      loadFilm();
    }
  }, [id]);

  const loadFilm = async () => {
    setLoading(true);
    try {
      const res = await getInfo6({ id: Number(id) });
      if (res.data) {
        const film = res.data;
        form.setFieldsValue({
          ...film,
          type: film.type?.split(',').filter(Boolean),
          releaseDate: film.releaseDate ? dayjs(film.releaseDate) : undefined,
        });
      }
    } catch (e) {
      message.error('加载影片信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const params = {
        ...values,
        type: values.type?.join(','),
        releaseDate: values.releaseDate?.format('YYYY-MM-DD'),
      };

      if (isEdit) {
        await update6({ id: Number(id), ...params });
        message.success('更新成功');
      } else {
        await save6(params);
        message.success('创建成功');
      }
      navigate('/admin/film');
    } catch (e: any) {
      message.error('操作失败：' + (e.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: isEdit ? '编辑影片' : '新增影片',
        onBack: () => navigate('/admin/film'),
      }}
    >
      <Card loading={loading} style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'published' }}
        >
          <Form.Item name="name" label="影片名称" rules={[{ required: true, message: '请输入影片名称' }]}>
            <Input placeholder="请输入影片名称" maxLength={50} />
          </Form.Item>

          <Form.Item name="englishName" label="英文名称">
            <Input placeholder="请输入英文名称" maxLength={100} />
          </Form.Item>

          <Form.Item name="type" label="影片类型" rules={[{ required: true, message: '请选择影片类型' }]}>
            <Select
              mode="multiple"
              placeholder="请选择影片类型"
              options={FILM_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>

          <Space size={16}>
            <Form.Item name="duration" label="片长(分钟)" rules={[{ required: true, message: '请输入片长' }]}>
              <InputNumber min={1} max={600} placeholder="片长" />
            </Form.Item>
            <Form.Item name="rating" label="评分">
              <InputNumber min={0} max={10} step={0.1} placeholder="1.0-10.0" />
            </Form.Item>
            <Form.Item name="releaseDate" label="上映日期" rules={[{ required: true, message: '请选择上映日期' }]}>
              <DatePicker placeholder="选择日期" />
            </Form.Item>
          </Space>

          <Form.Item name="director" label="导演">
            <Input placeholder="导演姓名" />
          </Form.Item>

          <Form.Item name="actors" label="主演">
            <Input placeholder="主演姓名，逗号分隔" />
          </Form.Item>

          <Form.Item name="description" label="简介">
            <TextArea rows={4} placeholder="影片简介（最多500字）" maxLength={500} showCount />
          </Form.Item>

          <Form.Item name="status" label="发布状态">
            <Radio.Group>
              <Radio value="published">已发布</Radio>
              <Radio value="offline">已下线</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? '保存修改' : '创建影片'}
              </Button>
              <Button onClick={() => navigate('/admin/film')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default FilmFormPage;
