import {
  changePassword,
  updateMyProfile,
  userLogout,
} from '@/api/userController';
import { getMyPreference, saveMyPreference } from '@/api/userPreferenceController';
import { history, useModel } from '@umijs/max';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Tag,
  Typography,
  Card,
} from 'antd';
import {
  EditOutlined,
  LockOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import type { UserPreference } from '@/api/typings';
import './index.css';

const { Text } = Typography;

const ProfilePage: React.FC = () => {
  const { initialState, loading, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // ===== 个人资料状态 =====
  const [profileVisible, setProfileVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [preference, setPreference] = useState<UserPreference | null>(null);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [prefForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 加载偏好
  useEffect(() => {
    if (!currentUser) return;
    getMyPreference()
      .then((res: any) => {
        if (res && res.id) setPreference(res);
      })
      .catch(() => {});
  }, [currentUser]);

  // ===== 修改资料 =====
  const handleUpdateProfile = async (values: any) => {
    setSaving(true);
    try {
      const res = await updateMyProfile(values);
      if (res?.data) {
        message.success('个人信息已更新');
        setInitialState((pre: any) => ({ ...pre, currentUser: res.data }));
        setProfileVisible(false);
      }
    } catch (e: any) {
      message.error('更新失败：' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // ===== 修改密码 =====
  const handleChangePassword = async (values: any) => {
    setSaving(true);
    try {
      await changePassword(values);
      message.success('密码修改成功');
      setPasswordVisible(false);
      passwordForm.resetFields();
    } catch (e: any) {
      message.error('修改失败：' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // ===== 保存偏好 =====
  const handleSavePreference = async (values: any) => {
    setSaving(true);
    try {
      await saveMyPreference(values);
      setPreference(values);
      message.success('偏好已保存');
    } catch (e: any) {
      message.error('保存失败：' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // ===== 退出 =====
  const handleLogout = async () => {
    try {
      await userLogout();
      message.success('已退出登录');
      setInitialState((pre: any) => ({ ...pre, currentUser: undefined }));
    } catch {
      message.error('退出失败');
    }
  };

  // ========== 未登录：跳转统一登录页 ==========
  useEffect(() => {
    if (!loading && !currentUser) {
      history.replace('/user/login?redirect=' + encodeURIComponent('/user/profile'));
    }
  }, [loading, currentUser]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>;
  }

  if (!currentUser) {
    return null; // 等待跳转
  }

  // ========== 已登录：显示个人资料 ==========
  return (
    <div className="profile-wrap">
      {/* 个人信息 */}
      <div className="card">
        <div className="cardTitle">个人信息</div>
        <div className="profile-header">
          <div className="avatar">
            {currentUser.userAvatar ? (
              <img src={currentUser.userAvatar} alt="" />
            ) : (
              (currentUser.userName || currentUser.userAccount)
                ?.charAt(0)
                ?.toUpperCase() || 'U'
            )}
          </div>
          <div className="profile-info">
            <div className="name">
              {currentUser.userName || '未设置昵称'}
            </div>
            <div className="account">账号：{currentUser.userAccount}</div>
            {currentUser.userProfile && (
              <div className="bio">{currentUser.userProfile}</div>
            )}
            <div style={{ marginTop: 8 }}>
              <Tag color={currentUser.userRole === 'admin' ? 'red' : 'blue'}>
                {currentUser.userRole === 'admin' ? '管理员' : '普通用户'}
              </Tag>
            </div>
          </div>
          <div>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                profileForm.setFieldsValue({
                  userName: currentUser.userName,
                  userAvatar: currentUser.userAvatar,
                  userProfile: currentUser.userProfile,
                });
                setProfileVisible(true);
              }}
            >
              编辑资料
            </Button>
          </div>
        </div>
      </div>

      {/* ★ 快捷入口卡片 */}
      <div className="card">
        <div className="cardTitle">快捷入口</div>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              size="small"
              onClick={() => history.push('/order/list')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <ShoppingCartOutlined style={{ fontSize: 28, color: '#FF4D4F' }} />
              <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>我的订单</div>
              <div style={{ fontSize: 11, color: '#999' }}>查看购票记录</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              size="small"
              onClick={() => history.push('/user/settings')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <SettingOutlined style={{ fontSize: 28, color: '#1677ff' }} />
              <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>账号设置</div>
              <div style={{ fontSize: 11, color: '#999' }}>密码与安全</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              size="small"
              onClick={() => history.push('/film')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <div style={{ fontSize: 28 }}>🎬</div>
              <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>浏览影片</div>
              <div style={{ fontSize: 11, color: '#999' }}>发现好电影</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              size="small"
              onClick={() => history.push('/ai-chat')}
              style={{ textAlign: 'center', borderRadius: 12 }}
            >
              <TrophyOutlined style={{ fontSize: 28, color: '#fa8c16' }} />
              <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>AI 助手</div>
              <div style={{ fontSize: 11, color: '#999' }}>智能选片购票</div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 观影偏好 */}
      <div className="card">
        <div className="cardTitle">观影偏好</div>
        <Form
          form={prefForm}
          layout="vertical"
          onFinish={handleSavePreference}
          initialValues={preference || {}}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="preferredTypes" label="偏好影片类型">
                <Input placeholder="如：科幻,喜剧,动画（逗号分隔）" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preferredHallType" label="偏好厅型">
                <Select
                  placeholder="选择偏好厅型"
                  allowClear
                  options={[
                    { label: 'IMAX', value: 'IMAX' },
                    { label: '杜比', value: '杜比' },
                    { label: '普通', value: '普通' },
                    { label: '4DX', value: '4DX' },
                    { label: 'VIP', value: 'VIP' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="budgetMax" label="单张票价预算上限（元）">
                <InputNumber
                  placeholder="如：100"
                  min={0}
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preferredSeatZone" label="常用座位区域">
                <Select
                  placeholder="选择偏好区域"
                  allowClear
                  options={[
                    { label: '中间', value: '中间' },
                    { label: '靠前', value: '靠前' },
                    { label: '靠后', value: '靠后' },
                    { label: '靠边', value: '靠边' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存偏好
          </Button>
        </Form>
      </div>

      {/* 账号操作 */}
      <div className="card">
        <div className="cardTitle">账号安全</div>
        <Row gutter={16}>
          <Col>
            <Button
              icon={<LockOutlined />}
              onClick={() => {
                passwordForm.resetFields();
                setPasswordVisible(true);
              }}
            >
              修改密码
            </Button>
          </Col>
          <Col>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </Col>
        </Row>
      </div>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑个人资料"
        open={profileVisible}
        onCancel={() => setProfileVisible(false)}
        onOk={() => profileForm.submit()}
        confirmLoading={saving}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item name="userName" label="昵称">
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="userAvatar" label="头像 URL">
            <Input placeholder="请输入头像图片地址" />
          </Form.Item>
          <Form.Item name="userProfile" label="个人简介">
            <Input.TextArea placeholder="介绍一下自己" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordVisible}
        onCancel={() => setPasswordVisible(false)}
        onOk={() => passwordForm.submit()}
        confirmLoading={saving}
      >
        <Form
          form={passwordForm}
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
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
