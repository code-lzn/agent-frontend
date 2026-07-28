import { healthUsingGet } from '@/api/testHealth';
import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess } from '@umijs/max';
import { Button } from 'antd';

const AccessPage: React.FC = () => {
  const access = useAccess();
  const test = async () => {
    const res = await healthUsingGet();
    console.log(res);
  };
  return (
    <PageContainer
      ghost
      header={{
        title: '权限示例',
      }}
    >
      <Access accessible={access.canSeeAdmin}>
        <Button>只有 Admin 可以看到这个按钮</Button>
        <Button onClick={() => test()}>测试接口</Button>
      </Access>
    </PageContainer>
  );
};

export default AccessPage;
