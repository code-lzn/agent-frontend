import { getFilm } from '@/api/filmController';
import { Button, Col, Descriptions, Divider, Image, Rate, Row, Spin, Tag, Typography, message } from 'antd';
import { RobotOutlined, ArrowLeftOutlined } from '@ant-design/icons';
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
        if (res?.data) setFilm(res.data);
        else {
          message.error('影片不存在或已下架');
          history.push('/film');
        }
      })
      .catch((e) => {
        message.error('加载失败，请检查网络连接');
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 120 }}>
        <Spin size="large" />
        <div style={{ color: '#999', marginTop: 12 }}>加载中...</div>
      </div>
    );
  }

  if (!film) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* 返回 */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push('/film')}
          style={{ color: '#666', fontSize: 13 }}
        >
          返回影片列表
        </Button>
      </div>

      <Row gutter={36}>
        {/* 海报 */}
        <Col xs={24} sm={8} md={7} lg={6}>
          <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Image
              src={film.posterUrl || ''}
              alt={film.name}
              style={{ width: '100%', display: 'block' }}
              fallback="https://via.placeholder.com/300x450?text=No+Poster"
              preview={!!film.posterUrl}
            />
          </div>
        </Col>

        {/* 详情 */}
        <Col xs={24} sm={16} md={17} lg={18}>
          <div style={{ marginBottom: 20 }}>
            <Title level={2} style={{ margin: '0 0 4px', fontWeight: 800 }}>
              {film.name}
            </Title>
            {film.englishName && (
              <Text type="secondary" style={{ fontSize: 15, fontStyle: 'italic' }}>
                {film.englishName}
              </Text>
            )}
          </div>

          {/* 评分 */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            {film.rating && (
              <>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#ffaa00' }}>
                  {film.rating.toFixed(1)}
                </span>
                <div>
                  <Rate
                    disabled
                    value={film.rating / 2}
                    allowHalf
                    style={{ fontSize: 16, color: '#ffaa00' }}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    评分 ({film.rating})
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 标签 */}
          <div style={{ marginBottom: 20 }}>
            {film.type?.split(',').map((t, i) => (
              <Tag
                key={t}
                color={i === 0 ? 'red' : 'default'}
                style={{ fontSize: 13, padding: '2px 12px', marginRight: 6, marginBottom: 4 }}
              >
                {t}
              </Tag>
            ))}
            <Tag style={{ fontSize: 13, padding: '2px 12px' }}>{film.duration}分钟</Tag>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Descriptions column={{ xs: 1, sm: 2 }} size="small" labelStyle={{ color: '#999' }}>
            <Descriptions.Item label="上映日期">{film.releaseDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="导演">{film.director || '-'}</Descriptions.Item>
            <Descriptions.Item label="主演" span={2}>
              {film.actors || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: '16px 0' }} />

          <Title level={5} style={{ fontWeight: 700 }}>剧情简介</Title>
          <Paragraph style={{ color: '#666', lineHeight: 1.8, fontSize: 14 }}>
            {film.description || '暂无简介'}
          </Paragraph>

          <Divider style={{ margin: '20px 0' }} />

          {/* AI 入口 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #fff5f5, #fff1f0)',
              borderRadius: 10,
              cursor: 'pointer',
              border: '1px solid #ffd8d8',
              marginBottom: 24,
              transition: 'all 0.2s',
            }}
            onClick={() => history.push('/ai-chat')}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #e53e3e, #ff4d4f)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
                问问 AI · 关于《{film.name}》
              </div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                选场次、查座位、比价格，一句话搞定
              </div>
            </div>
            <span style={{ color: '#e53e3e', fontSize: 18, fontWeight: 700 }}>→</span>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={() => history.push(`/schedule?filmId=${film.id}`)}
            style={{
              background: 'linear-gradient(135deg, #e53e3e, #ff4d4f)',
              border: 'none',
              borderRadius: 8,
              height: 48,
              padding: '0 40px',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(229, 62, 62, 0.3)',
            }}
          >
            选择场次购票
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default FilmDetailPage;
