import { changePassword, setPassword } from '@/api/userController';
import { history, useModel } from '@umijs/max';
import { Button, Form, Input, message, Card, Typography, Divider } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [saving, setSaving] = useState(false);
  const [pwdForm] = Form.useForm();
  const [setPwdForm] = Form.useForm();

  // 未登录跳转
  if (!currentUser) {
    history.replace('/user/login?redirect=' + encodeURIComponent('/user/settings'));
    return null;
  }

  const needSetPassword = currentUser.needSetPassword === true;

  // 修改密码
  const handleChangePassword = async (values: any) => {
    setSaving(true);
    try {
      await changePassword(values);
      message.success('密码修改成功');
      pwdForm.resetFields();
    } catch (e: any) {
      message.error(e?.message || '修改失败');
    } finally {
      setSaving(false);
    }
  };

  // 设置初始密码
  const handleSetPassword = async (values: any) => {
    setSaving(true);
    try {
      await setPassword(values);
      message.success('密码设置成功');
      setPwdForm.resetFields();
    } catch (e: any) {
      message.error(e?.message || '设置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => history.push('/user/profile')}
        style={{ marginBottom: 16 }}
      >
        返回个人中心
      </Button>

      <Title level={4} style={{ marginBottom: 24 }}>账号设置</Title>

      {/* 首次设置密码 */}
      {needSetPassword && (
        <Card
          title={<span><LockOutlined /> 设置登录密码</span>}
          style={{ marginBottom: 16, borderRadius: 12 }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            您当前使用默认密码，建议设置专属密码以保护账号安全。
          </Text>
          <Form
            form={setPwdForm}
            layout="vertical"
            onFinish={handleSetPassword}
          >
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              name="checkPassword"
              label="确认新密码"
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              设置密码
            </Button>
          </Form>
        </Card>
      )}

      {/* 修改密码 */}
      {!needSetPassword && (
        <Card
          title={<span><LockOutlined /> 修改密码</span>}
          style={{ marginBottom: 16, borderRadius: 12 }}
        >
          <Form
            form={pwdForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="oldPassword"
              label="旧密码"
              rules={[{ required: true, message: '请输入旧密码' }]}
            >
              <Input.Password placeholder="请输入旧密码" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              name="checkPassword"
              label="确认新密码"
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              修改密码
            </Button>
          </Form>
        </Card>
      )}

      {/* 账号信息 */}
      <Card title="账号信息" style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#666' }}>
          <div><Text type="secondary">账号：</Text>{currentUser.userAccount}</div>
          <div><Text type="secondary">昵称：</Text>{currentUser.userName || '未设置'}</div>
          <div><Text type="secondary">角色：</Text>{currentUser.userRole === 'admin' ? '管理员' : '普通用户'}</div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
