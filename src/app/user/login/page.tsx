import { userLogin } from '@/api/userController';
import logo from '@/assets/logo.jpg';
import { LockOutlined, UserOutlined, WechatOutlined } from '@ant-design/icons';
import { LoginForm, ProForm, ProFormText } from '@ant-design/pro-components';
import { Link, useLocation, useModel, useNavigate } from '@umijs/max';
import { Image, message, Tabs } from 'antd';
import React, { useState } from 'react';
import WechatLogin from '@/components/WechatLogin';
import './index.css';

/**
 * 用户登录页面（密码登录 / 微信扫码登录）
 * @constructor
 */
const UserLoginPage: React.FC = () => {
  const [form] = ProForm.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { setInitialState } = useModel('@@initialState');
  const [activeTab, setActiveTab] = useState<string>('password');

  // 获取登录后回跳地址
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/';

  /**
   * 密码登录提交
   */
  const doSubmit = async (values: API.UserRegisterRequest) => {
    try {
      const res = await userLogin(values);
      if (res.data) {
        message.success('登录成功');
        setInitialState((pre: any) => ({
          ...pre,
          currentUser: res.data,
        }));
        const target = res.data.userRole === 'admin' ? '/admin/dashboard' : redirect;
        navigate(target, { replace: true });
        form.resetFields();
      }
    } catch (e: any) {
      message.error('登录失败，' + (e?.message ?? '请稍后重试'));
    }
  };

  /**
   * 微信登录成功回调
   */
  const onWechatLoginSuccess = (userRole: string | undefined, target: string) => {
    navigate(target, { replace: true });
  };

  return (
    <div id="userLoginPage" className="user-auth-page">
      <div className="user-auth-card">
        <div className="user-auth-header">
          <Image
            src={logo}
            alt="AI电影票"
            height={44}
            width={44}
            preview={false}
          />
          <div className="user-auth-title">AI电影票</div>
          <div className="user-auth-subtitle">智能购票 · 一句话搞定</div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'password',
              label: (
                <span>
                  <LockOutlined /> 密码登录
                </span>
              ),
              children: (
                <LoginForm
                  form={form}
                  logo={false}
                  title=""
                  subTitle=""
                  onFinish={doSubmit}
                  submitter={{
                    searchConfig: { submitText: '登录' },
                  }}
                >
                  <ProFormText
                    name="userAccount"
                    fieldProps={{
                      size: 'large',
                      prefix: <UserOutlined />,
                    }}
                    placeholder={'请输入用户账号'}
                    rules={[
                      {
                        required: true,
                        message: '请输入用户账号!',
                      },
                    ]}
                  />
                  <ProFormText.Password
                    name="userPassword"
                    fieldProps={{
                      size: 'large',
                      prefix: <LockOutlined />,
                    }}
                    placeholder={'请输入密码'}
                    rules={[
                      {
                        required: true,
                        message: '请输入密码！',
                      },
                    ]}
                  />
                  <div className="user-auth-footer">
                    还没有账号？
                    <Link to="/user/register">去注册</Link>
                  </div>
                </LoginForm>
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
  );
};

export default UserLoginPage;
