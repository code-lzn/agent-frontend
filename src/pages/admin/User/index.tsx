import { deleteUser, listUserVoByPage, updateUser } from '@/api/userController';
import { ExclamationCircleOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Badge, Button, Card, Form, message, Modal, Select, Space, Tooltip } from 'antd';
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
  const [editForm] = Form.useForm();

  const columns: ProColumns<API.UserVO>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
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
      render: (_, record) => {
        const r = roleMap[record.userRole || 'user'];
        return r ? <Badge status={r.status} text={r.text} /> : record.userRole;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  /** 编辑角色 */
  const handleEdit = (record: API.UserVO) => {
    setEditingUser(record);
    editForm.setFieldsValue({ userRole: record.userRole || 'user' });
    setEditOpen(true);
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
              userRole: (params.userRole as string) || undefined,
            });
            return {
              data: res.data?.records || [],
              total: res.data?.totalRow || 0,
              success: true,
            };
          }}
          rowKey="id"
          search={{
            filterType: 'light',
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 800 }}
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
        onCancel={() => setEditOpen(false)}
        onOk={handleEditSave}
        width={400}
      >
        <Form form={editForm} layout="vertical">
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
    </div>
  );
};

export default UserListPage;
