import { getFilm } from '@/api/filmController';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Col, Descriptions, Divider, Image, Rate, Row, Spin, Tag, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import type { Film } from '@/api/typings';

const { Text, Title, Paragraph } = Typography;

const FilmDetailPage: React.FC = () => {
  const { id } = useParams();
  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFilm({ id: Number(id) })
      .then((res) => {
        if (res.data) {
          setFilm(res.data);
        } else {
          message.error('影片不存在');
          history.push('/film');
        }
      })
      .catch((e) => {
        message.error('加载失败');
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!film) return null;

  return (
    <PageContainer>
      <Row gutter={32}>
        <Col xs={24} sm={8} md={6}>
          <Image
            src={film.posterUrl || 'https://via.placeholder.com/300x400?text=No+Poster'}
            alt={film.name}
            style={{ width: '100%', borderRadius: 8 }}
            fallback="https://via.placeholder.com/300x400?text=No+Poster"
          />
        </Col>
        <Col xs={24} sm={16} md={18}>
          <Title level={3}>{film.name}</Title>
          {film.englishName && (
            <Text type="secondary" style={{ fontSize: 14 }}>
              {film.englishName}
            </Text>
          )}
          <Divider />
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="类型">
              {film.type?.split(',').map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="片长">{film.duration} 分钟</Descriptions.Item>
            <Descriptions.Item label="评分">
              <Rate disabled value={film.rating ? film.rating / 2 : 0} allowHalf style={{ fontSize: 16 }} />
              <Text style={{ marginLeft: 8 }}>{film.rating?.toFixed(1)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="上映日期">{film.releaseDate}</Descriptions.Item>
            <Descriptions.Item label="导演">{film.director || '-'}</Descriptions.Item>
            <Descriptions.Item label="主演">{film.actors || '-'}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Title level={5}>剧情简介</Title>
          <Paragraph>{film.description || '暂无简介'}</Paragraph>
          <Divider />
          <Button
            type="primary"
            size="large"
            onClick={() => history.push(`/schedule?filmId=${film.id}`)}
          >
            选择场次购票
          </Button>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default FilmDetailPage;
