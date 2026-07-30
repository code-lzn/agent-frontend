import { listFilm } from '@/api/filmController';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Image, Rate, Row, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import type { Film } from '@/api/typings';

const { Text, Title } = Typography;

const FilmListPage: React.FC = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadFilms = async (pageNum = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await listFilm({ pageNum, pageSize, status: 'published' });
      if (res.data) {
        setFilms(res.data.records || []);
        setTotal(res.data.total || 0);
      }
    } catch (e: any) {
      console.error('加载影片失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilms();
  }, []);

  return (
    <PageContainer
      header={{
        title: '正在热映',
      }}
    >
      <Row gutter={[16, 16]}>
        {films.map((film) => (
          <Col key={film.id} xs={12} sm={8} md={6} lg={4} xl={4}>
            <Card
              hoverable
              loading={loading}
              cover={
                <Image
                  alt={film.name}
                  src={film.posterUrl || 'https://via.placeholder.com/300x400?text=No+Poster'}
                  style={{ height: 280, objectFit: 'cover' }}
                  preview={false}
                  fallback="https://via.placeholder.com/300x400?text=No+Poster"
                />
              }
              onClick={() => history.push(`/film/${film.id}`)}
              style={{ height: '100%' }}
            >
              <Card.Meta
                title={
                  <Text strong ellipsis style={{ fontSize: 16 }}>
                    {film.name}
                  </Text>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Rate disabled value={film.rating ? film.rating / 2 : 0} allowHalf style={{ fontSize: 14 }} />
                      <Text type="secondary" style={{ marginLeft: 4, fontSize: 12 }}>
                        {film.rating?.toFixed(1)}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {film.duration}分钟
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      {film.type?.split(',').map((t) => (
                        <Tag key={t} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginBottom: 2 }}>
                          {t}
                        </Tag>
                      ))}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
      {!loading && films.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无影片数据</div>
      )}
    </PageContainer>
  );
};

export default FilmListPage;
