import { userRegisterUsingPost } from '@/api/userController';
import logo from '@/assets/logo.jpg';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProForm, ProFormText } from '@ant-design/pro-components';
import { Link, useNavigate } from '@umijs/max';
import { Image, message } from 'antd';
import React from 'react';
import './index.css';

/**
 * 用户注册页面
 * @constructor
 */
const UserRegisterPage: React.FC = () => {
  const [form] = ProForm.useForm();
  const navigate = useNavigate();

  /**
   * 提交
   */
  const doSubmit = async (values: API.UserRegisterRequest) => {
    try {
      const res = await userRegisterUsingPost(values);
      if (res.data) {
        message.success('注册成功，请登录');
        // 前往登录页
        navigate('/user/login', { replace: true });
        form.resetFields();
      }
    } catch (e: any) {
      message.error('注册失败，' + (e?.message ?? '请稍后重试'));
    }
  };

  return (
    <div id="userRegisterPage" className="user-auth-page">
      <LoginForm
        form={form}
        logo={
          <Image src={logo} alt="HRMS" height={44} width={44} preview={false} />
        }
        title="HRMS 人力资源管理系统"
        subTitle="创建新账号"
        submitter={{
          searchConfig: {
            submitText: '注册',
          },
        }}
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
            {
              min: 4,
              message: '账号至少 4 个字符',
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
            {
              min: 8,
              message: '密码至少 8 位',
            },
          ]}
        />
        <ProFormText.Password
          name="checkPassword"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined />,
          }}
          placeholder={'请再次输入密码'}
          rules={[
            {
              required: true,
              message: '请再次输入密码！',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('userPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致！'));
              },
            }),
          ]}
        />
        <div className="user-auth-footer">
          已有账号？
          <Link to="/user/login">去登录</Link>
        </div>
      </LoginForm>
    </div>
  );
};

export default UserRegisterPage;
