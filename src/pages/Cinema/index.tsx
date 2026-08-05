import { list4 } from '@/api/cinemaController';
import { history, useSearchParams } from '@umijs/max';
import { Card, Empty, Spin, Tag, Typography } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Cinema } from '@/api/typings';
import './index.css';

const { Text } = Typography;

/** 归一化城市名：去掉"市""省""特别行政区"等后缀 */
const normalizeCity = (city: string): string => {
  if (!city) return city;
  return city
    .replace(/市$/, '')
    .replace(/省$/, '')
    .replace(/特别行政区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/维吾尔自治区$/, '')
    .replace(/自治区$/, '')
    .trim();
};

const CinemaListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const cityFromUrl = searchParams.get('city') || '';

  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selCity, setSelCity] = useState(cityFromUrl);

  useEffect(() => {
    setLoading(true);
    list4()
      .then((res) => {
        const data = (res as any)?.data;
        if (data && Array.isArray(data)) {
          setCinemas(data);
        } else if (Array.isArray(res)) {
          setCinemas(res as any);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // 提取城市列表（归一化后去重排序）
  const cities = useMemo(() => {
    const map = new Map<string, string>(); // normalizedName → originalName
    cinemas.forEach((c) => {
      if (c.city) {
        const key = normalizeCity(c.city);
        if (!map.has(key)) {
          map.set(key, c.city);
        }
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'zh'))
      .map(([key, label]) => ({ key, label }));
  }, [cinemas]);

  // 数据加载完成后，设置默认城市
  useEffect(() => {
    if (cities.length === 0) return;
    if (cityFromUrl) {
      const found = cities.find(
        (c) => c.key === normalizeCity(cityFromUrl),
      );
      if (found) {
        setSelCity(found.key);
        return;
      }
    }
    if (!selCity) {
      setSelCity(cities[0].key);
    }
  }, [cities]);

  // 切换城市时同步到URL
  const handleCityChange = (cityKey: string) => {
    setSelCity(cityKey);
    setSearchParams({ city: cityKey });
  };

  // 按城市筛选（归一化匹配）
  const filtered = useMemo(() => {
    if (!selCity) return cinemas;
    return cinemas.filter((c) => normalizeCity(c.city || '') === selCity);
  }, [cinemas, selCity]);

  // 跳转影院详情（带城市参数，返回时可恢复）
  const goToCinema = useCallback((cinema: Cinema) => {
    history.push(`/cinema/${cinema.id}?city=${encodeURIComponent(selCity)}`);
  }, [selCity]);

  // 解析标签
  const parseTags = (tags?: string) => {
    if (!tags) return [];
    return tags.split(',').filter(Boolean);
  };

  return (
    <div className="cinema-list-page">
      {/* 城市选择器 */}
      <Card className="city-filter-card">
        <div className="city-filter-bar">
          <span className="city-label">城市：</span>
          <div className="city-tags">
            {cities.map((city) => (
              <span
                key={city.key}
                className={`city-tag ${selCity === city.key ? 'active' : ''}`}
                onClick={() => handleCityChange(city.key)}
              >
                {city.key}
              </span>
            ))}
          </div>
          <span className="cinema-total">{filtered.length} 家影院</span>
        </div>
      </Card>

      {/* 影院列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty description={selCity ? `${selCity}暂无影院` : '暂无影院'} style={{ padding: '40px 0' }} />
        </Card>
      ) : (
        <div className="cinema-grid">
          {filtered.map((cinema, index) => (
            <div
              key={cinema.id ?? index}
              className="cinema-card-wrapper"
              data-cinema-id={cinema.id}
              onClick={() => goToCinema(cinema)}
            >
              <Card className="cinema-card" hoverable>
                <div className="cinema-card-body">
                  <div className="cinema-card-left">
                    <div className="cinema-name">{cinema.name}</div>
                    <div className="cinema-info-row">
                      <EnvironmentOutlined style={{ color: '#999', fontSize: 13 }} />
                      <Text type="secondary" className="cinema-address" ellipsis>
                        {cinema.address || '暂无地址'}
                      </Text>
                    </div>
                    {cinema.phone && (
                      <div className="cinema-info-row">
                        <PhoneOutlined style={{ color: '#999', fontSize: 13 }} />
                        <Text type="secondary">{cinema.phone}</Text>
                      </div>
                    )}
                    {cinema.businessHours && (
                      <div className="cinema-info-row">
                        <ClockCircleOutlined style={{ color: '#999', fontSize: 13 }} />
                        <Text type="secondary">{cinema.businessHours}</Text>
                      </div>
                    )}
                    {cinema.basePrice != null && (
                      <div className="cinema-price-info">
                        参考价 <span className="price-num">¥{cinema.basePrice}</span> 起
                      </div>
                    )}
                  </div>
                  <div className="cinema-card-right">
                    {parseTags(cinema.tags).length > 0 && (
                      <div className="cinema-tags">
                        {parseTags(cinema.tags).map((tag) => (
                          <Tag key={tag} color="red" style={{ marginBottom: 4 }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <div className="cinema-buy-hint">选座购票 →</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CinemaListPage;
