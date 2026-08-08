import { checkLogin, createQrCode } from '@/api/weixinPortalController';
import { weixinLogin } from '@/api/userController';
import { message, Spin } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';

interface WechatLoginProps {
  onLoginSuccess: (user: any, redirect: string) => void;
  redirect: string;
}

/**
 * 微信扫码登录组件
 * - 自动获取二维码 ticket
 * - 展示二维码图片
 * - 定时轮询扫码状态
 * - 扫码成功后完成登录
 */
const WechatLogin: React.FC<WechatLoginProps> = ({
  onLoginSuccess,
  redirect,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [ticket, setTicket] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'waiting' | 'scanned' | 'expired' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_COUNT = 150; // 5分钟 / 2秒 = 150次

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 生成二维码
  const fetchQrCode = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMsg('');
      stopPolling();

      const res = await createQrCode();
      if (res.data?.ticket && res.data?.qrCodeUrl) {
        setTicket(res.data.ticket);
        // ★ 对 ticket 做 URL 编码，防止特殊字符导致图片加载失败
        const encodedUrl = res.data.qrCodeUrl.replace(
          /ticket=([^&]+)/,
          (_, t) => 'ticket=' + encodeURIComponent(t)
        );
        setQrCodeUrl(encodedUrl);
        setStatus('waiting');
      } else {
        setStatus('error');
        setErrorMsg('获取二维码失败');
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message || '获取二维码失败，请稍后重试');
    }
  }, [stopPolling]);

  // 开始轮询
  const startPolling = useCallback(
    (ticket: string) => {
      stopPolling();
      pollCountRef.current = 0;
      let loginCalled = false; // 防止重复调用登录接口
      timerRef.current = setInterval(async () => {
        if (loginCalled) return; // 已经在处理登录，不再重复轮询

        // ★ 超时检查：超过 5 分钟自动停止
        pollCountRef.current++;
        if (pollCountRef.current > MAX_POLL_COUNT) {
          stopPolling();
          setStatus('expired');
          setErrorMsg('二维码已过期，请刷新');
          return;
        }

        try {
          const res = await checkLogin({ ticket });
          if (res.data?.scanned && res.data?.openid) {
            // 扫码成功！
            loginCalled = true;
            stopPolling();
            setStatus('scanned');

            // 调用后端完成登录
            try {
              const loginRes = await weixinLogin({ openid: res.data.openid });
              if (loginRes.data) {
                const target =
                  loginRes.data.userRole === 'admin'
                    ? '/admin/dashboard'
                    : redirect;
                onLoginSuccess(loginRes.data, target);
              } else {
                // weixinLogin 返回了但没有 data，稍后重试
                setStatus('error');
                setErrorMsg('登录校验失败，请刷新二维码重试');
              }
            } catch (loginErr: any) {
              // weixinLogin 失败，可能是网络问题，稍后重试
              console.warn('微信登录接口调用失败，将重试:', loginErr);
              loginCalled = false; // 允许重试
              // 不改变 status，继续等待
            }
          }
        } catch (e: any) {
          // 轮询中的网络错误不中断，继续等待
          console.warn('轮询扫码状态失败:', e);
        }
      }, 2000); // 每 2 秒轮询一次
    },
    [stopPolling, redirect, onLoginSuccess],
  );

  // ticket 变化后开始轮询
  useEffect(() => {
    if (ticket && status === 'waiting') {
      startPolling(ticket);
    }
  }, [ticket, status, startPolling]);

  // 首次加载
  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  // 刷新二维码
  const handleRefresh = () => {
    fetchQrCode();
  };

  return (
    <div className="wechat-login">
      <div className="wechat-qrcode-wrapper">
        {status === 'loading' && (
          <div className="wechat-qrcode-placeholder">
            <Spin size="large" tip="加载中..." />
          </div>
        )}

        {status === 'waiting' && qrCodeUrl && (
          <>
            <img
              className="wechat-qrcode-img"
              src={qrCodeUrl}
              alt="微信扫码登录二维码"
            />
            <div className="wechat-qrcode-tip">
              <span className="wechat-icon">💚</span>
              请使用微信扫一扫登录
            </div>
          </>
        )}

        {status === 'scanned' && (
          <div className="wechat-qrcode-placeholder">
            <div className="wechat-scanned-icon">✅</div>
            <div className="wechat-scanned-text">扫码成功，正在登录...</div>
          </div>
        )}

        {(status === 'expired' || status === 'error') && (
          <div className="wechat-qrcode-placeholder">
            <div className="wechat-error-icon">⏰</div>
            <div className="wechat-error-text">
              {errorMsg || '二维码已过期，请刷新'}
            </div>
            <button className="wechat-refresh-btn" onClick={handleRefresh}>
              刷新二维码
            </button>
          </div>
        )}
      </div>

      {status === 'waiting' && (
        <div className="wechat-refresh-link" onClick={handleRefresh}>
          点击刷新
        </div>
      )}
    </div>
  );
};

export default WechatLogin;
