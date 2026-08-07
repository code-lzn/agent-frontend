import { mailLogin, sendMailCode, userLogin } from '@/api/userController';
import WechatLogin from '@/components/WechatLogin';
import { LockOutlined, MailOutlined, UserOutlined, WechatOutlined } from '@ant-design/icons';
import { history, useLocation, useModel } from '@umijs/max';
import { Button, Form, Input, message, Tabs, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import './index.css';

const UserLoginPage: React.FC = () => {
  const [codeForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const location = useLocation();
  const { setInitialState } = useModel('@@initialState');

  const [tab, setTab] = useState('code');
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // ★ 兼容 hash 路由：优先从 hash 中解析 query 参数
  const getRedirectFromHash = (): string => {
    const hash = window.location.hash;
    if (hash && hash.includes('?')) {
      const queryStr = hash.split('?')[1];
      return new URLSearchParams(queryStr).get('redirect') || '/';
    }
    // 兜底：从 search 参数获取（history 路由）
    return new URLSearchParams(window.location.search).get('redirect') || '/';
  };
  const redirect = getRedirectFromHash();

  // 清理定时器
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [countdown]);

  /** 更新全局用户状态 + 按角色跳转 */
  const handleLoginSuccess = (user: any) => {
    (setInitialState as any)((prev: any) => ({ ...prev, currentUser: user }));
    message.success('登录成功');

    // 根据角色跳转不同页面
    const target = user.userRole === 'admin' ? '/admin/dashboard'
      : redirect.startsWith('/admin') ? '/film'
      : redirect === '/' ? '/film' : redirect;

    setTimeout(() => {
      history.push(target);
    }, 100);
    codeForm.resetFields();
    pwdForm.resetFields();
  };

  /** 切换 Tab 时重置 */
  const handleTabChange = (key: string) => {
    setTab(key);
    setCountdown(0);
  };

  /** 发送验证码 */
  const handleSendCode = async () => {
    try {
      await codeForm.validateFields(['email']);
    } catch {
      return; // 邮箱格式校验不通过，Form 会展示错误信息
    }
    setCodeSending(true);
    try {
      await sendMailCode({ email });
      message.success('验证码已发送');
      setCountdown(60);
    } catch (e: any) {
      message.error(e.message || '发送失败');
    } finally {
      setCodeSending(false);
    }
  };

  /** Tab1: 邮箱验证码登录 */
  const handleCodeLogin = async (values: any) => {
    if (!values.code || values.code.length < 4) {
      message.warning('请输入验证码');
      return;
    }
    try {
      const res: any = await mailLogin({ email: values.email, code: values.code });
      if (res.data) handleLoginSuccess(res.data);
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
  };

  /** Tab2: 密码登录 */
  const handlePwdLogin = async (values: any) => {
    try {
      const res: any = await userLogin(values);
      if (res.data) handleLoginSuccess(res.data);
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
  };

  /**
   * 微信登录成功回调（与邮箱登录 handleLoginSuccess 对齐）
   */
  const onWechatLoginSuccess = (user: any, target: string) => {
    // ★ 将 JWT Token 存入 localStorage，后续请求通过 Authorization header 携带
    // 解决跨域 Cookie 无法传递导致登录态丢失的问题
    if (user.token) {
      localStorage.setItem('token', user.token);
    }
    (setInitialState as any)((prev: any) => ({ ...prev, currentUser: user }));
    // 规范化跳转路径（与邮箱登录一致）
    const finalTarget =
      user.userRole === 'admin'
        ? '/admin/dashboard'
        : target.startsWith('/admin')
        ? '/film'
        : target === '/' || target === ''
        ? '/film'
        : target;
    // ★ 使用两层保障：先尝试 history.push，500ms 后用 window.location.href 兜底
    setTimeout(() => {
      history.push(finalTarget);
    }, 100);
    // 兜底：如果 500ms 后还在登录页，直接跳转
    setTimeout(() => {
      const hash = window.location.hash;
      const currentPath = hash ? hash.replace(/^#/, '') : window.location.pathname;
      if (currentPath.includes('/user/login')) {
        window.location.href = '/#' + finalTarget;
      }
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-panel">
          {/* 左：品牌区 */}
          <div className="login-brand">
            <div className="brand-eyebrow">🎬 妙语购票</div>
            <h1>一句话<br />搞定购票</h1>
            <p>AI 智能选片 · 可视化选座 · 即时出票</p>
            <div className="brand-features">
              <span>🤖 AI 对话购票</span>
              <span>💺 双模式共享选座</span>
              <span>🎫 电子票即时出票</span>
            </div>
            <div className="brand-orb" />
          </div>

          {/* 右：登录表单 */}
          <div className="login-form-wrap">
            <div className="form-eyebrow">欢迎回来</div>
            <div className="login-form-header">
              <h2>{redirect.startsWith('/admin') ? '管理员登录' : '登录 / 注册'}</h2>
              <p className="login-subtitle">
                {redirect.startsWith('/admin') ? '进入后台管理' : '智能购票 · 一句话搞定'}
              </p>
            </div>

            <Tabs
              className="login-tabs"
              activeKey={tab}
              onChange={handleTabChange}
              items={[
            {
              key: 'code',
              label: <span>📧 邮箱验证码登录</span>,
              children: (
                <Form form={codeForm} layout="vertical" onFinish={handleCodeLogin}>
                  <Form.Item name="email" label="邮箱" rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '邮箱格式不正确' },
                  ]}>
                    <Input
                      size="large"
                      prefix={<MailOutlined />}
                      placeholder="请输入邮箱地址"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <div>
                    <div style={{ marginBottom: 4, fontSize: 14, color: '#333' }}>验证码</div>
                    <div className="code-row">
                      <Form.Item name="code" noStyle rules={[
                        { required: true, message: '请输入验证码' },
                        { len: 6, message: '验证码为6位数字' },
                      ]}>
                        <Input
                          size="large"
                          placeholder="输入6位验证码"
                          maxLength={6}
                          autoComplete="one-time-code"
                          className="code-input"
                        />
                      </Form.Item>
                      <Tooltip title={countdown > 0 ? `${countdown}s 后可重新获取` : ''}>
                        <Button
                          size="large"
                          onClick={handleSendCode}
                          disabled={countdown > 0 || codeSending}
                          loading={codeSending}
                          className="code-btn"
                        >
                          {countdown > 0 ? `${countdown}s` : '获取验证码'}
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  <Form.Item style={{ marginBottom: 8 }}>
                    <button type="submit" className="login-submit-btn">
                      登录 / 自动注册
                      <span className="submit-arrow">→</span>
                    </button>
                    <div className="login-tip">新用户将自动创建账号</div>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'pwd',
              label: <span>🔑 密码登录</span>,
              children: (
                <Form form={pwdForm} layout="vertical" onFinish={handlePwdLogin}>
                  <Form.Item name="userAccount" label="账号 / 邮箱" rules={[
                    { required: true, message: '请输入账号或邮箱' },
                  ]}>
                    <Input
                      size="large"
                      prefix={<UserOutlined />}
                      placeholder="请输入账号或邮箱"
                      autoComplete="username"
                    />
                  </Form.Item>

                  <Form.Item name="userPassword" label="密码" rules={[
                    { required: true, message: '请输入密码' },
                  ]}>
                    <Input.Password
                      size="large"
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <button type="submit" className="login-submit-btn">
                      登录
                      <span className="submit-arrow">→</span>
                    </button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'wechat',
              label: (
                <span>
                  <WechatOutlined /> 微信登录
                </span>
              ),
              children: (
                <WechatLogin
                  redirect={redirect}
                  onLoginSuccess={onWechatLoginSuccess}
                />
              ),
            },
          ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
