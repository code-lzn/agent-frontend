import {
  getLoginUser,
  userLogin,
  userRegister,
  updateMyProfile,
  changePassword,
  userLogout,
} from '@/api/userController';
import { getMyPreference, saveMyPreference } from '@/api/userPreferenceController';
import { useModel, useSearchParams, history } from '@umijs/max';
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
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
  EditOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import type { UserPreference } from '@/api/typings';
import WechatLogin from '@/components/WechatLogin';
import './index.css';

const { Text } = Typography;

const ProfilePage: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/home';

  // ===== 登录/注册状态 =====
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'wechat'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm] = Form.useForm();

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

  // ===== 登录 =====
  const handleLogin = async (values: any) => {
    setAuthLoading(true);
    try {
      const res = await userLogin({
        userAccount: values.userAccount,
        userPassword: values.userPassword,
        checkPassword: values.userPassword,
      });
      if (res.data) {
        message.success('登录成功');
        setInitialState((pre: any) => ({ ...pre, currentUser: res.data }));
        const target =
          res.data.userRole === 'admin' ? '/admin/dashboard' : redirect;
        history.push(target, { replace: true });
      }
    } catch (e: any) {
      message.error('登录失败，' + (e?.message || '请检查账号密码'));
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== 注册 =====
  const handleRegister = async (values: any) => {
    if (values.userPassword !== values.checkPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setAuthLoading(true);
    try {
      await userRegister(values);
      message.success('注册成功，请登录');
      setAuthMode('login');
      loginForm.resetFields();
    } catch (e: any) {
      message.error('注册失败，' + (e?.message || '请稍后重试'));
    } finally {
      setAuthLoading(false);
    }
  };

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

  // ========== 未登录：显示登录/注册 ==========
  if (!currentUser) {
    return (
      <div className="profile-wrap">
        <div className="card">
          <div className="auth-box">
            <div className="brand">
              AI<span>电影票</span>
            </div>
            <div className="subtitle">智能购票 · 一句话搞定</div>

            <div className="auth-tabs">
              <span
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login');
                  loginForm.resetFields();
                }}
              >
                登录
              </span>
              <span
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('register');
                  loginForm.resetFields();
                }}
              >
                注册
              </span>
              <span
                className={authMode === 'wechat' ? 'active' : ''}
                onClick={() => setAuthMode('wechat')}
              >
                <WechatOutlined /> 微信登录
              </span>
            </div>

            {authMode === 'wechat' ? (
              <WechatLogin
                redirect={redirect}
                onLoginSuccess={(_userRole, target) => {
                  history.push(target, { replace: true });
                }}
              />
            ) : (
            <Form
              form={loginForm}
              layout="vertical"
              onFinish={
                authMode === 'login' ? handleLogin : handleRegister
              }
              size="large"
            >
              <Form.Item
                name="userAccount"
                rules={[
                  { required: true, message: '请输入账号' },
                  { min: 4, message: '账号至少4个字符' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bbb' }} />}
                  placeholder="请输入账号"
                />
              </Form.Item>

              <Form.Item
                name="userPassword"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bbb' }} />}
                  placeholder="请输入密码"
                />
              </Form.Item>

              {authMode === 'register' && (
                <Form.Item
                  name="checkPassword"
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('userPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error('两次输入的密码不一致'),
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#bbb' }} />}
                    placeholder="请再次输入密码"
                  />
                </Form.Item>
              )}

              <Form.Item style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={authLoading}
                  block
                  style={{
                    background: 'linear-gradient(135deg, #e53e3e, #ff4d4f)',
                    border: 'none',
                    borderRadius: 8,
                    height: 44,
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {authMode === 'login' ? '登录' : '注册'}
                </Button>
              </Form.Item>
            </Form>
            )}
          </div>
        </div>
      </div>
    );
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
