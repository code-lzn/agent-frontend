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
import { Button, Card, Form, Input, InputNumber, message, Modal, Select, Space, Spin, Tag, Tooltip } from 'antd';
import { history } from '@umijs/max';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';

const { TextArea } = Input;

const ConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<API.SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  // 已保存的配置快照（用于脏检查 + 高风险变更检测）
  const loadedRef = useRef<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await list1();
      setConfigs((res as any)?.data || []);
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

  // 首次加载配置后记录快照
  useEffect(() => {
    if (!loading && configs.length > 0) {
      loadedRef.current = form.getFieldsValue(true);
      setDirty(false);
    }
  }, [loading, configs, form]);

  const markDirty = useCallback((_: any, allValues: any) => {
    setDirty(JSON.stringify(allValues) !== JSON.stringify(loadedRef.current));
  }, []);

  // 未保存离开提示（PRD 3.3.4 交互规则①）
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    const unblock = (history as any).block?.('当前配置已修改，是否确认离开？');
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      unblock?.();
    };
  }, [dirty]);

  const handleSaveAll = async () => {
    // 推荐策略权重 5 项之和必须等于 100（PRD 3.6.2）
    const values = form.getFieldsValue(true);
    const weightKeys = ['priceWeight', 'scoreWeight', 'distanceWeight', 'timeWeight', 'seatQualityWeight'];
    const weightSum = weightKeys.reduce((sum, k) => sum + (Number(values[k]) || 0), 0);
    if (weightSum !== 100) {
      message.error(`推荐策略权重之和必须等于 100%，当前为 ${weightSum}%`);
      return;
    }

    // 高风险配置项二次确认（PRD 3.3.4 交互规则⑤：锁座时长）
    const changedHighRisk = ['lockDuration'].filter(
      (key) => values[key] !== loadedRef.current[key],
    );
    if (changedHighRisk.length > 0) {
      const ok = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: '高风险配置修改确认',
          content: '锁座时长已修改，该配置会影响新生成的订单，是否确认保存？',
          okText: '确认保存',
          cancelText: '再想想',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
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
      loadedRef.current = form.getFieldsValue(true);
      setDirty(false);
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
          strategyTemplate: getConfigValue('strategyTemplate', '价格优先'),
          priceWeight: getConfigValue('priceWeight', 30),
          scoreWeight: getConfigValue('scoreWeight', 25),
          distanceWeight: getConfigValue('distanceWeight', 20),
          timeWeight: getConfigValue('timeWeight', 15),
          seatQualityWeight: getConfigValue('seatQualityWeight', 10),
          maxRecommendations: getConfigValue('maxRecommendations', 10),
          refundTimeoutHours: getConfigValue('refundTimeoutHours', 24),
        }}
        onValuesChange={markDirty}
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
              <Form.Item name="refundTimeoutHours" label={<span><ClockCircleOutlined /> 可退款时限（小时）</span>}>
                <InputNumber min={0} max={720} style={{ width: 200 }} />
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
                <span className="card-subtitle">（5项之和必须等于100%）</span>
              </div>
            }
          >
            <Form.Item name="strategyTemplate" label={<span><SlidersOutlined /> 推荐策略模板</span>}
              style={{ maxWidth: 300 }}>
              <Select
                placeholder="选择推荐策略"
                options={[
                  { label: '价格优先', value: '价格优先' },
                  { label: '评分优先', value: '评分优先' },
                  { label: '距离优先', value: '距离优先' },
                  { label: '体验优先', value: '体验优先' },
                ]}
              />
            </Form.Item>
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
              <Form.Item name="timeWeight" label={<span><PercentageOutlined /> 时间权重(%)</span>}
                rules={[{ required: true, message: '请输入时间权重' }]}>
                <InputNumber min={0} max={100} style={{ width: 180 }} />
              </Form.Item>
              <Form.Item name="seatQualityWeight" label={<span><PercentageOutlined /> 座位质量权重(%)</span>}
                rules={[{ required: true, message: '请输入座位质量权重' }]}>
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
