import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { reconnectSocketWithAuth } from '../../services/socket';
import { KeyRound, X } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  text?: string;
  className?: string;
}

const DEFAULT_GOOGLE_CLIENT_ID =
  '681861375668-f0ri0q69lv7cqdhh3s250aa7cd5ed4cq.apps.googleusercontent.com';

export default function GoogleLoginButton({
  text = 'Đăng nhập với Google',
  className = '',
}: GoogleLoginButtonProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Read client ID with fallback to your configured client ID
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [clientId, setClientId] = useState(
    envClientId ||
      localStorage.getItem('online_chess_google_client_id') ||
      DEFAULT_GOOGLE_CLIENT_ID
  );
  const [inputClientId, setInputClientId] = useState(clientId);

  const tokenClientRef = useRef<any>(null);

  // Load Google Identity Services SDK
  useEffect(() => {
    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initClient();
      };
      document.body.appendChild(script);
    } else {
      initClient();
    }

    function initClient() {
      if (!window.google?.accounts?.oauth2 || !clientId) return;
      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setIsLoading(false);
              return;
            }
            if (tokenResponse?.access_token) {
              await handleAccessToken(tokenResponse.access_token);
            }
          },
        });
      } catch (err) {
        console.error('Failed to init Google OAuth client', err);
      }
    }
  }, [clientId]);

  const handleAccessToken = async (accessToken: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch user info directly on the client to avoid backend network/proxy issues
      let googleProfile = undefined;
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (userInfoRes.ok) {
          const data = await userInfoRes.json();
          if (data.email) {
            googleProfile = {
              email: data.email,
              name: data.name,
              picture: data.picture,
              sub: data.sub,
            };
          }
        }
      } catch (e) {
        console.warn('Could not fetch userinfo directly on client', e);
      }

      // 2. Send token and profile to backend
      const res = await api.post('/auth/google', {
        accessToken,
        profile: googleProfile,
      });

      if (res.data.success && res.data.data) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        reconnectSocketWithAuth();
        navigate('/lobby');
      }
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          'Đăng nhập bằng tài khoản Google không thành công. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    const activeClientId = clientId || DEFAULT_GOOGLE_CLIENT_ID;

    if (!window.google?.accounts?.oauth2) {
      alert('Đang tải thư viện Google, vui lòng thử lại sau 1-2 giây.');
      return;
    }

    setIsLoading(true);

    try {
      // Initialize or reuse tokenClient with activeClientId
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            setIsLoading(false);
            return;
          }
          if (tokenResponse?.access_token) {
            await handleAccessToken(tokenResponse.access_token);
          }
        },
      });

      // Launch Google's Official Popup "Choose an account"
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setShowConfigModal(true);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId.trim()) return;
    const cleanId = inputClientId.trim();
    setClientId(cleanId);
    localStorage.setItem('online_chess_google_client_id', cleanId);
    setShowConfigModal(false);

    // Prompt Google popup immediately
    setTimeout(() => {
      try {
        if (window.google?.accounts?.oauth2) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: cleanId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                await handleAccessToken(tokenResponse.access_token);
              }
            },
          });
          client.requestAccessToken({ prompt: 'select_account' });
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 px-4 bg-white hover:bg-slate-50/90 active:scale-[0.98] border border-slate-200/90 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm shadow-subtle hover:border-slate-300 transition-all duration-150 flex items-center justify-center gap-3 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${className}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {/* Google Colorful G SVG */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>{text}</span>
          </>
        )}
      </button>

      {/* Config Client ID Modal (Only fallback if user wants to change) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200/90 shadow-dialog animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cấu Hình Google OAuth Client ID
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              Google Client ID hiện tại của bạn:
            </p>

            <form onSubmit={handleSaveClientId} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Google Client ID (.apps.googleusercontent.com)
                </label>
                <input
                  type="text"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  placeholder="xxxx-xxxxxxxx.apps.googleusercontent.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 active:scale-[0.98] transition-all shadow-sm"
                >
                  Kích Hoạt Popup Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
