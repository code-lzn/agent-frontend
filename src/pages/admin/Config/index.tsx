import { list1, updateByKey } from '@/api/systemConfigController';
import {
  CheckCircleOutlined,
  MessageOutlined,
  ReloadOutlined,
  SettingOutlined,
  SlidersOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Space, Spin, Tag, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import './index.css';

const { TextArea } = Input;

const ConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<API.SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await list1();
      setConfigs(res.data || []);
    } catch {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const getConfigValue = (key: string, defaultValue: any = '') => {
    const cfg = configs.find((c) => c.configKey === key);
    if (!cfg?.configValue) return defaultValue;
    try {
      return JSON.parse(cfg.configValue);
    } catch {
      return cfg.configValue;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const entries = Object.entries(values);
      const results = await Promise.allSettled(
        entries.map(([key, value]) =>
          updateByKey({ configKey: key, configValue: JSON.stringify(value) })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length === 0) {
        message.success('所有配置已保存');
      } else {
        message.warning(`保存完成，${failed.length}/${entries.length} 项失败`);
      }
      loadConfigs();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="config-page">
        <Card className="config-card"><Spin size="large" /></Card>
      </div>
    );
  }

  return (
    <div className="config-page">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          lockDuration: getConfigValue('lockDuration', 15),
          welcomeMessage: getConfigValue('welcomeMessage', '你好！想看什么电影？'),
          presetChips: getConfigValue('presetChips', '周末喜剧,附近IMAX,低价场次'),
          priceWeight: getConfigValue('priceWeight', 30),
          scoreWeight: getConfigValue('scoreWeight', 25),
          distanceWeight: getConfigValue('distanceWeight', 20),
          ratingWeight: getConfigValue('ratingWeight', 25),
          maxRecommendations: getConfigValue('maxRecommendations', 10),
          orderTimeoutMinutes: getConfigValue('orderTimeoutMinutes', 15),
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* 基础参数 */}
          <Card
            className="config-card"
            title={
              <div className="card-header">
                <SettingOutlined className="card-icon" />
                <span className="card-title">基础参数</span>
              </div>
            }
          >
            <div className="config-form-grid">
              <Form.Item name="lockDuration" label={<span><ClockCircleOutlined /> 锁座时长（分钟）</span>}>
                <InputNumber min={1} max={60} style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="orderTimeoutMinutes" label={<span><ClockCircleOutlined /> 订单超时（分钟）</span>}>
                <InputNumber min={5} max={60} style={{ width: 200 }} />
              </Form.Item>
            </div>
            <Form.Item name="welcomeMessage" label={<span><MessageOutlined /> 对话开场白</span>}>
              <TextArea rows={2} style={{ maxWidth: 500 }} placeholder="你好！想看什么电影？" />
            </Form.Item>
            <Form.Item name="presetChips" label={<span><MessageOutlined /> 快捷Chip话术（逗号分隔）</span>}>
              <Input placeholder="周末喜剧,附近IMAX,低价场次" style={{ maxWidth: 500 }} />
            </Form.Item>
            <div className="chips-preview">
              {(form.getFieldValue('presetChips') || '').split(',').filter(Boolean).map((chip: string) => (
                <Tag key={chip} color="blue" style={{ marginBottom: 4 }}>{chip}</Tag>
              ))}
            </div>
          </Card>

          {/* 推荐策略 */}
          <Card
            className="config-card"
            title={
              <div className="card-header">
                <SlidersOutlined className="card-icon" />
                <span className="card-title">推荐策略权重</span>
                <span className="card-subtitle">（总和建议为100%）</span>
              </div>
            }
          >
            <div className="config-form-grid">
              <Form.Item name="priceWeight" label={<span><PercentageOutlined /> 价格权重(%)</span>}
                rules={[{ required: true, message: '请输入价格权重' }]}>
                <InputNumber min={0} max={100} style={{ width: 180 }} />
              </Form.Item>
              <Form.Item name="scoreWeight" label={<span><PercentageOutlined /> 评分权重(%)</span>}
                rules={[{ required: true, message: '请输入评分权重' }]}>
                <InputNumber min={0} max={100} style={{ width: 180 }} />
              </Form.Item>
              <Form.Item name="distanceWeight" label={<span><PercentageOutlined /> 距离权重(%)</span>}
                rules={[{ required: true, message: '请输入距离权重' }]}>
                <InputNumber min={0} max={100} style={{ width: 180 }} />
              </Form.Item>
              <Form.Item name="ratingWeight" label={<span><PercentageOutlined /> 好评权重(%)</span>}
                rules={[{ required: true, message: '请输入好评权重' }]}>
                <InputNumber min={0} max={100} style={{ width: 180 }} />
              </Form.Item>
            </div>
          </Card>

          {/* 其他配置 */}
          <Card
            className="config-card"
            title={
              <div className="card-header">
                <SettingOutlined className="card-icon" />
                <span className="card-title">其他配置</span>
              </div>
            }
          >
            <Form.Item name="maxRecommendations" label="最大推荐数量">
              <InputNumber min={1} max={50} style={{ width: 200 }} />
            </Form.Item>
          </Card>

          {/* 操作按钮 */}
          <Card className="config-card config-actions">
            <Space size={12}>
              <Button type="primary" onClick={handleSaveAll} loading={saving} icon={<CheckCircleOutlined />} size="large">
                {saving ? '保存中...' : '保存全部配置'}
              </Button>
              <Tooltip title="重新加载配置">
                <Button icon={<ReloadOutlined />} onClick={loadConfigs} size="large">
                  刷新
                </Button>
              </Tooltip>
            </Space>
          </Card>
        </Space>
      </Form>
    </div>
  );
};

export default ConfigPage;
