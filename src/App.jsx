import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Heart, Search, User, Bell, PlusCircle, ArrowLeft, 
  CheckCircle, Play, MessageCircle, Star, ShieldCheck, TrendingUp, LogOut, Loader2, X
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function TalentApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("list");
  const [selectedTalent, setSelectedTalent] = useState(null); // 選択されたタレント
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState([]);

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

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setTalents(data);
    }
    fetchData();
  }, [page]);

  // 詳細画面を開く関数
  const openDetail = (talent) => {
    setSelectedTalent(talent);
    setPage("detail");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center">
        <h1 className="text-xl font-black text-red-600 tracking-tighter cursor-pointer" onClick={() => setPage("list")}>TALENT MARKET</h1>
        <div className="flex gap-4 items-center">
          <User className="w-6 h-6 text-gray-600 cursor-pointer" onClick={() => setPage(session ? "dashboard" : "auth")} />
        </div>
      </header>

      {/* 1. 一覧画面 */}
      {page === "list" && (
        <main className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {talents.map(t => (
            <div key={t.id} onClick={() => openDetail(t)} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <img src={t.avatar_url} className="aspect-[3/4] object-cover w-full" alt={t.full_name} />
              <div className="p-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{t.category}</p>
                <h3 className="font-bold text-gray-800">{t.full_name}</h3>
                <p className="text-red-500 font-black mt-1">¥{t.price_per_project?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </main>
      )}

      {/* 2. 詳細画面 */}
      {page === "detail" && selectedTalent && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen relative animate-in slide-in-from-right duration-300">
          <button onClick={() => setPage("list")} className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-full shadow-md"><ArrowLeft /></button>
          <img src={selectedTalent.avatar_url} className="w-full aspect-square object-cover" alt="" />
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">{selectedTalent.category}</span>
                <h2 className="text-3xl font-black text-gray-900 mt-2">{selectedTalent.full_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 font-bold tracking-tight uppercase">Price</p>
                <p className="text-2xl font-black text-red-600">¥{selectedTalent.price_per_project?.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed py-4 border-y border-gray-100">{selectedTalent.bio}</p>
            <button className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all">
              <MessageCircle className="w-5 h-5" />
              このタレントに相談する
            </button>
          </div>
        </main>
      )}

      {/* 3. ログイン・ダッシュボード (略) */}
      {page === "auth" && <div className="p-10 text-center"><h2 className="text-2xl font-bold">ログイン画面</h2><button onClick={() => setPage("list")} className="mt-4 text-red-600">戻る</button></div>}
      {page === "dashboard" && <div className="p-10 text-center"><h2 className="text-2xl font-bold">マイページ</h2><button onClick={() => setPage("list")} className="mt-4 text-red-600">戻る</button></div>}

      {/* 共通フッターナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 flex justify-around items-center max-w-4xl mx-auto">
        <Search className={page === "list" ? "text-red-600" : "text-gray-400"} onClick={() => setPage("list")} />
        <PlusCircle className="text-gray-400" onClick={() => setPage("auth")} />
        <MessageCircle className="text-gray-400" />
        <User className={page === "dashboard" ? "text-red-600" : "text-gray-400"} onClick={() => setPage(session ? "dashboard" : "auth")} />
      </nav>
    </div>
  );
}
