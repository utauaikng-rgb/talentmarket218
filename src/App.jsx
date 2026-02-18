import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Heart, Search, User, Bell, PlusCircle, ArrowLeft, 
  CheckCircle, Play, MessageCircle, Star, ShieldCheck, TrendingUp, LogOut, Loader2 
} from "lucide-react";

// Supabaseクライアントの初期化
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. データの読み込み
  useEffect(() => {
    async function fetchData() {
      // タレント一覧取得
      const { data: talentData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (talentData) setTalents(talentData);

      // 自分のプロフィール取得
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) setMyProfile(profileData);
      }
    }
    fetchData();
  }, [session, page]);

  // ローディング画面
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
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
            <User className="w-6 h-6 text-gray-600 cursor-pointer" onClick={() => setPage("dashboard")} />
          ) : (
            <button onClick={() => setPage("auth")} className="text-sm font-bold text-red-600">ログイン</button>
          )}
        </div>
      </header>

      {/* ページ切り替え */}
      {page === "list" && (
        <main className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {talents.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">
              <p>まだ登録タレントがいません</p>
            </div>
          ) : (
            talents.map(t => (
              <div key={t.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img src={t.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"} className="aspect-[3/4] object-cover w-full" />
                <div className="p-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t.category}</p>
                  <h3 className="font-bold text-gray-800">{t.full_name}</h3>
                  <p className="text-red-500 font-black mt-1">¥{t.price_per_project?.toLocaleString()}<span className="text-[10px] text-gray-400 font-normal">〜</span></p>
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {page === "dashboard" && (
        <div className="p-6 max-w-md mx-auto space-y-6">
          <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <TrendingUp className="absolute right-[-10px] top-[-10px] w-32 h-32 text-white/5" />
            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">My Balance</p>
            <h2 className="text-4xl font-black mt-2">¥0</h2>
            <div className="mt-8 flex gap-2">
              <button className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold text-sm transition-colors">売上振込</button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-sm transition-colors">プラン変更</button>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => setPage("list"))} className="w-full text-gray-400 text-sm font-bold py-4">ログアウト</button>
        </div>
      )}

      {/* ログイン・新規登録画面 (簡易版) */}
      {page === "auth" && (
        <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-black mb-6 text-center">ログイン</h2>
          <p className="text-gray-500 text-sm text-center mb-8">タレント登録にはログインが必要です</p>
          {/* ここにSupabase Authのフォームが入ります */}
          <button className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200">メールアドレスで開始</button>
          <button onClick={() => setPage("list")} className="w-full text-gray-400 text-sm font-bold mt-4 text-center">キャンセル</button>
        </div>
      )}

      {/* 出品ボタン */}
      <button 
        onClick={() => session ? setPage("dashboard") : setPage("auth")}
        className="fixed bottom-6 right-6 bg-red-600 text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl font-bold hover:scale-105 active:scale-95 transition-all"
      >
        <PlusCircle className="w-6 h-6" />
        <span>{session ? "マイページ" : "出品する"}</span>
      </button>
    </div>
  );
}
