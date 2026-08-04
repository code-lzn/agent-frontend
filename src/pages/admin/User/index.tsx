import { adminResetPassword, deleteUser, freezeUser, listUserVoByPage, updateUser } from '@/api/userController';
import { getByUser, resetByUser } from '@/api/userPreferenceController';
import { ExclamationCircleOutlined, PlusOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Avatar, Badge, Button, Card, Descriptions, Form, Image, Input, message, Modal, Select, Space, Tooltip, Upload } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import './index.css';

const { confirm } = Modal;

const roleMap: Record<string, { status: 'default' | 'success' | 'processing'; text: string }> = {
  user: { status: 'default', text: '普通用户' },
  admin: { status: 'success', text: '管理员' },
};

const UserListPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<API.UserVO | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [editForm] = Form.useForm();

  // 偏好画像弹窗
  const [prefOpen, setPrefOpen] = useState(false);
  const [prefUser, setPrefUser] = useState<API.UserVO | null>(null);
  const [prefData, setPrefData] = useState<API.UserPreference | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);

  const columns: ProColumns<API.UserVO>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    {
      title: '头像',
      dataIndex: 'userAvatar',
      width: 60,
      search: false,
      render: (_, record) => (
        <Avatar
          src={record.userAvatar}
          icon={<UserOutlined />}
          size={32}
          onError={() => true} // 加载失败时显示 icon
        />
      ),
    },
    {
      title: '账号',
      dataIndex: 'userAccount',
      width: 140,
      ellipsis: true,
      copyable: true,
    },
    { title: '昵称', dataIndex: 'userName', width: 140, ellipsis: true },
    {
      title: '角色',
      dataIndex: 'userRole',
      width: 100,
      search: false, // 搜索只保留 用户名/账号
      render: (_, record) => {
        const r = roleMap[record.userRole || 'user'];
        return r ? <Badge status={r.status} text={r.text} /> : record.userRole;
      },
    },
    {
      title: '状态',
      dataIndex: 'userStatus',
      width: 90,
      search: false,
      render: (_, record) =>
        record.userStatus === 1 ? (
          <Badge status="error" text="已冻结" />
        ) : (
          <Badge status="success" text="正常" />
        ),
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      width: 160,
      search: false,
      render: (v) => (v ? dayjs(v as string).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handlePreference(record)}>
            画像
          </Button>
          <Button type="link" size="small" onClick={() => handleResetPassword(record)}>
            重置密码
          </Button>
          {record.userRole !== 'admin' &&
            (record.userStatus === 1 ? (
              <Button type="link" size="small" onClick={() => handleFreeze(record, 0)}>
                解冻
              </Button>
            ) : (
              <Button type="link" size="small" danger onClick={() => handleFreeze(record, 1)}>
                冻结
              </Button>
            ))}
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  /** 编辑用户 */
  const handleEdit = (record: API.UserVO) => {
    setEditingUser(record);
    setAvatarUrl(record.userAvatar || '');
    editForm.setFieldsValue({
      userName: record.userName,
      userRole: record.userRole || 'user',
      userAvatar: record.userAvatar,
    });
    setEditOpen(true);
  };

  /** 头像上传回调 */
  const handleAvatarChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'done') {
      const url = info.file.response?.data;
      if (url) {
        setAvatarUrl(url);
        editForm.setFieldValue('userAvatar', url);
      }
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  /** 保存编辑 */
  const handleEditSave = async () => {
    if (!editingUser?.id) return;
    try {
      const values = await editForm.validateFields();
      await updateUser({ id: editingUser.id, ...values });
      message.success('用户信息已更新');
      setEditOpen(false);
      actionRef.current?.reload();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('更新失败：' + (e.message || ''));
    }
  };

  /** 查看偏好画像 */
  const handlePreference = async (record: API.UserVO) => {
    setPrefUser(record);
    setPrefData(null);
    setPrefOpen(true);
    setPrefLoading(true);
    try {
      const res = await getByUser({ userId: record.id! });
      setPrefData((res as any)?.data ?? null);
    } catch {
      setPrefData(null);
    } finally {
      setPrefLoading(false);
    }
  };

  /** 重置偏好画像（二次确认） */
  const handleResetPreference = () => {
    if (!prefUser?.id) return;
    confirm({
      title: '确认重置偏好画像？',
      icon: <ExclamationCircleOutlined />,
      content: `将清空用户「${prefUser.userName || prefUser.userAccount}」的全部观影偏好数据，重置后 AI 推荐将不再参考历史偏好。`,
      okText: '确认重置',
      cancelText: '取消',
      onOk: async () => {
        try {
          await resetByUser({ userId: prefUser.id! });
          message.success('偏好画像已重置');
          setPrefData(null);
        } catch (e: any) {
          message.error('重置失败：' + (e?.message || ''));
        }
      },
    });
  };

  /** 重置密码（二次确认） */
  const handleResetPassword = (record: API.UserVO) => {
    confirm({
      title: '确认重置密码？',
      icon: <ExclamationCircleOutlined />,
      content: `将把用户「${record.userName || record.userAccount}」的密码重置为默认密码 12345678。`,
      okText: '确认重置',
      cancelText: '取消',
      onOk: async () => {
        try {
          await adminResetPassword({ id: record.id! });
          message.success('密码已重置为 12345678');
        } catch (e: any) {
          message.error('重置失败：' + (e?.message || ''));
        }
      },
    });
  };

  /** 冻结 / 解冻 */
  const handleFreeze = (record: API.UserVO, status: number) => {
    const isFreeze = status === 1;
    confirm({
      title: isFreeze ? '确认冻结该账号？' : '确认解冻该账号？',
      icon: <ExclamationCircleOutlined />,
      content: isFreeze
        ? `冻结后「${record.userName || record.userAccount}」将无法登录、无法发起购票。`
        : `解冻后「${record.userName || record.userAccount}」可恢复正常登录和购票。`,
      okText: isFreeze ? '确认冻结' : '确认解冻',
      cancelText: '取消',
      onOk: async () => {
        try {
          await freezeUser({ id: record.id!, status });
          message.success(isFreeze ? '账号已冻结' : '账号已解冻');
          actionRef.current?.reload();
        } catch (e: any) {
          message.error((isFreeze ? '冻结失败：' : '解冻失败：') + (e?.message || ''));
        }
      },
    });
  };

  /** 删除用户 */
  const handleDelete = (record: API.UserVO) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除用户「${record.userName || record.userAccount}」（ID: ${record.id}）吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await deleteUser({ id: record.id! });
          message.success('用户已删除');
          actionRef.current?.reload();
        } catch (e: any) {
          message.error('删除失败：' + (e.message || ''));
        }
      },
    });
  };

  return (
    <div className="user-page">
      <Card
        className="user-card"
        title={
          <div className="card-header">
            <span className="card-title">用户管理</span>
          </div>
        }
        extra={
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()} />
          </Tooltip>
        }
      >
        <ProTable<API.UserVO>
          actionRef={actionRef}
          columns={columns}
          request={async (params) => {
            const res = await listUserVoByPage({
              pageNum: params.current || 1,
              pageSize: params.pageSize || 10,
              userAccount: (params.userAccount as string) || undefined,
              userName: (params.userName as string) || undefined,
            });
            return {
              data: (res as any)?.data?.records || [],
              total: (res as any)?.data?.totalRow || 0,
              success: true,
            };
          }}
          rowKey="id"
          options={{ density: false }}
          search={{
            filterType: 'query',
            labelWidth: 'auto',
            defaultCollapsed: true,
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon"><UserOutlined /></div>
                <p className="empty-text">暂无用户数据</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* 编辑用户弹窗 */}
      <Modal
        title={`编辑用户 - ${editingUser?.userName || editingUser?.userAccount || ''}`}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setAvatarUrl('');
        }}
        onOk={handleEditSave}
        width={480}
      >
        <Form form={editForm} layout="vertical">
          {/* 头像上传 */}
          <div>
            <div style={{ marginBottom: 4, fontSize: 14, color: '#333' }}>头像</div>
            <Space align="start" size={16}>
              <Upload
                name="file"
                action="http://localhost:8123/api/file/upload"
                data={{ biz: 'user_avatar' }}
                withCredentials={true}
                maxCount={1}
                listType="picture-card"
                showUploadList={false}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/jpg,image/png,image/webp"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="头像"
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    preview={{ mask: '替换' }}
                    fallback="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20fill%3D%27%23f0f0f0%27%20width%3D%2780%27%20height%3D%2780%27%2F%3E%3Ctext%20x%3D%2740%27%20y%3D%2742%27%20text-anchor%3D%27middle%27%20fill%3D%27%23999%27%20font-size%3D%2728%27%3E👤%3C%2Ftext%3E%3C%2Fsvg%3E"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 0' }}>
                    <PlusOutlined style={{ fontSize: 20, color: '#999' }} />
                    <span style={{ fontSize: 12, color: '#999' }}>上传头像</span>
                  </div>
                )}
              </Upload>
              {avatarUrl && (
                <Button size="small" onClick={() => { setAvatarUrl(''); editForm.setFieldValue('userAvatar', ''); }}>
                  移除
                </Button>
              )}
            </Space>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>支持 jpg/png/webp，不超过 1MB</div>
          </div>
          <Form.Item name="userAvatar" hidden />

          <Form.Item name="userName" label="昵称">
            <Input placeholder="用户昵称" maxLength={20} />
          </Form.Item>
          <Form.Item name="userRole" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={[
                { label: '普通用户', value: 'user' },
                { label: '管理员', value: 'admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 偏好画像弹窗 */}
      <Modal
        title={`偏好画像 - ${prefUser?.userName || prefUser?.userAccount || ''}`}
        open={prefOpen}
        onCancel={() => setPrefOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setPrefOpen(false)}>关闭</Button>
            <Button danger onClick={handleResetPreference} disabled={!prefData}>
              一键重置画像
            </Button>
          </Space>
        }
        width={520}
        destroyOnClose
      >
        {prefLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
        ) : prefData ? (
          <Descriptions column={1} size="small" labelStyle={{ color: '#999', width: 110 }}>
            <Descriptions.Item label="偏好影片类型">
              {prefData.preferredTypes || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="偏好厅型">
              {prefData.preferredHallType || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="票价预算上限">
              {prefData.budgetMax != null ? `¥${prefData.budgetMax}` : '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="常用座位区域">
              {prefData.preferredSeatZone || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="常去影院ID">
              {prefData.frequentCinemaId != null ? prefData.frequentCinemaId : '未设置'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            该用户暂无偏好画像数据
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserListPage;
