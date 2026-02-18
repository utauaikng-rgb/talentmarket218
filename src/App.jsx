import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Heart, Search, User, Bell, PlusCircle, ArrowLeft, 
  CheckCircle, Play, MessageCircle, Star, ShieldCheck, TrendingUp, LogOut, Loader2 
} from "lucide-react";

// 環境変数からSupabaseの情報を取得（Vercelで設定するやつです）
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function TalentApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("list");
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState([]);
  const [myProfile, setMyProfile] = useState(null);

  // 1. ログイン状態の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  // 2. データの読み込み
  useEffect(() => {
    fetchTalents();
    if (session) fetchMyProfile();
  }, [session, page]);

  async function fetchTalents() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setTalents(data);
  }

  async function fetchMyProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) setMyProfile(data);
  }

  /* --- UIコンポーネント: ログイン画面 --- */
  if (!session && page === "auth") {
    return <AuthPage setPage={setPage} />;
  }

  /* --- UIコンポーネント: プロフィール編集 --- */
  if (page === "edit") {
    return <EditPage session={session} myProfile={myProfile} setPage={setPage} />;
  }

  /* --- メイン画面 --- */
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center">
        <h1 className="text-xl font-black text-red-600 tracking-tighter cursor-pointer" onClick={() => setPage("list")}>TALENT MARKET</h1>
        <div className="flex gap-4 items-center">
          <Bell className="w-5 h-5 text-gray-400" />
          {session ? (
            <img 
              src={myProfile?.avatar_url || "https://via.placeholder.com/100"} 
              className="w-8 h-8 rounded-full cursor-pointer border"
              onClick={() => setPage("dashboard")}
            />
          ) : (
            <button onClick={() => setPage("auth")} className="text-sm font-bold text-red-600">ログイン</button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      {page === "list" && (
        <main className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {talents.map(t => (
            <div key={t.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img src={t.avatar_url} className="aspect-[3/4] object-cover w-full" />
              <div className="p-3">
                <p className="text-[10px] text-gray-400 font-bold">{t.category}</p>
                <h3 className="font-bold text-gray-800">{t.full_name}</h3>
                <p className="text-red-500 font-black mt-1">¥{t.price_per_project?.toLocaleString()}<span className="text-[10px] text-gray-400">〜</span></p>
              </div>
            </div>
          ))}
        </main>
      )}

      {page === "dashboard" && (
        <div className="p-6 max-w-md mx-auto space-y-6">
           <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl">
             <p className="text-xs text-gray-400">現在の売上残高</p>
             <h2 className="text-3xl font-black mt-1">¥0</h2>
             <button onClick={() => setPage("edit")} className="w-full bg-white/10 mt-6 py-2 rounded-xl font-bold text-sm">プロフィールを編集する</button>
           </div>
           <button onClick={() => supabase.auth.signOut()} className="w-full text-red-500 font-bold py-4">ログアウト</button>
        </div>
      )}

      {/* 出品ボタン（ログイン時のみ） */}
      <button 
        onClick={() => session ? setPage("edit") : setPage("auth")}
        className="fixed bottom-6 right-6 bg-red-600 text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl font-bold transition-transform active:scale-95"
      >
        <PlusCircle className="w-6 h-6" />
        {session ? "管理画面" : "タレント登録"}
      </button>
    </div>
  );
}

// 認証・編集ページなどのサブコンポーネントはここに続く...（長くなるので一部省略していますが、実際は1つのファイルにまとめられます）
