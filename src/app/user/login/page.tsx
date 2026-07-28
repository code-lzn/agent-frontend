import { userLoginUsingPost } from '@/api/userController';
import logo from '@/assets/logo.jpg';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProForm, ProFormText } from '@ant-design/pro-components';
import { Link, useLocation, useModel, useNavigate } from '@umijs/max';
import { Image, message } from 'antd';
import React from 'react';
import './index.css';

/**
 * 用户登录页面
 * @constructor
 */
const UserLoginPage: React.FC = () => {
  const [form] = ProForm.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { setInitialState } = useModel('@@initialState');

  // 获取登录后回跳地址
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/';

  /**
   * 提交
   */
  const doSubmit = async (values: API.UserLoginRequest) => {
    try {
      const res = await userLoginUsingPost(values);
      if (res.data) {
        message.success('登录成功');
        // 更新全局登录用户状态
        setInitialState((pre: any) => ({
          ...pre,
          currentUser: res.data,
        }));
        navigate(redirect, { replace: true });
        form.resetFields();
      }
    } catch (e: any) {
      message.error('登录失败，' + (e?.message ?? '请稍后重试'));
    }
  };

  return (
    <div id="userLoginPage" className="user-auth-page">
      <LoginForm
        form={form}
        logo={
          <Image src={logo} alt="HRMS" height={44} width={44} preview={false} />
        }
        title="HRMS 人力资源管理系统"
        subTitle="欢迎登录"
        onFinish={doSubmit}
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
    </div>
  );
};

export default UserLoginPage;
