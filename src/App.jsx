import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Search, User, ArrowLeft, MessageCircle, TrendingUp, Send, CreditCard, 
  Loader2, PlusCircle, Play, Heart, Star, Zap, DollarSign, Briefcase, Bell, X
} from "lucide-react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function TalentApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("list"); // list, detail, chat, dashboard, auditions
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [talents, setTalents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. セッション管理
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 2. データ取得（タレント一覧・予約履歴）
  useEffect(() => {
    async function fetchData() {
      const { data: tData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (tData) setTalents(tData);
      if (session) {
        const { data: bData } = await supabase.from('bookings').select('*, profiles(full_name)').eq('client_id', session.user.id);
        if (bData) setMyBookings(bData);
      }
    }
    fetchData();
  }, [session, page]);

  // 3. チャット機能
  const fetchMessages = async (talentId) => {
    const { data } = await supabase.from('messages').select('*').eq('receiver_id', talentId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !session) return;
    const { error } = await supabase.from('messages').insert([{ 
      sender_id: session.user.id, 
      receiver_id: selectedTalent.id, 
      content: inputText 
    }]);
    if (!error) { setInputText(""); fetchMessages(selectedTalent.id); }
  };

  // 4. 決済機能
  const handlePayment = async () => {
    if (!session) { alert("ログインが必要です"); return; }
    const { error } = await supabase.from('bookings').insert([{ 
      client_id: session.user.id, 
      talent_id: selectedTalent.id, 
      amount: selectedTalent.price_per_project, 
      status: 'paid' 
    }]);
    if (!error) { alert("購入が完了しました！"); setPage("dashboard"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-red-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 font-sans text-[#222]">
      {/* プレミアムヘッダー */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setPage("list")}>
          <div className="bg-red-600 p-1.5 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-red-200">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <h1 className="text-2xl font-[1000] italic tracking-tighter text-red-600">TALENT MARKET</h1>
        </div>
        <div className="flex gap-5 text-gray-400">
          <Bell className="w-6 h-6 hover:text-red-600 transition-colors cursor-pointer" />
          <User className="w-6 h-6 hover:text-red-600 transition-colors cursor-pointer" onClick={() => setPage("dashboard")} />
        </div>
      </header>

      {/* --- メインコンテンツ --- */}

      {/* 1. 一覧画面 (メルカリ風 + ピックアップ) */}
      {page === "list" && (
        <main className="animate-in fade-in duration-700">
          {/* 注目枠 (Pickup) */}
          <section className="bg-white py-8 mb-4 border-b border-gray-100">
            <h2 className="px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" /> Featured Picks
            </h2>
            <div className="flex overflow-x-auto gap-6 px-6 no-scrollbar">
              {talents.map(t => (
                <div key={t.id} onClick={() => { setSelectedTalent(t); setPage("detail"); }} className="min-w-[100px] text-center group cursor-pointer">
                  <div className="relative mb-3">
                    <img src={t.avatar_url} className="w-20 h-20 rounded-[30px] object-cover ring-4 ring-red-50 group-hover:ring-red-200 transition-all shadow-md mx-auto" />
                    <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-white shadow-lg"><Zap className="w-3 h-3 text-white fill-current" /></div>
                  </div>
                  <p className="font-black text-[11px] truncate w-24 text-gray-600">{t.full_name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* メイングリッド */}
          <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {talents.map(t => (
              <div key={t.id} onClick={() => { setSelectedTalent(t); setPage("detail"); }} className="bg-white relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                <img src={t.avatar_url} className="aspect-[4/5] object-cover w-full group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-0 right-0 p-3">
                  <button className="bg-white/30 backdrop-blur-md p-2 rounded-full text-white hover:text-red-500 hover:bg-white transition-all shadow-lg">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{t.category}</p>
                  <h3 className="font-black text-lg leading-tight">{t.full_name}</h3>
                  <p className="text-xl font-black mt-1 italic">¥{t.price_per_project?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 2. 詳細画面 (ラグジュアリー・ポートフォリオ・ボイス) */}
      {page === "detail" && selectedTalent && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen relative animate-in slide-in-from-right duration-500 shadow-2xl">
          <button onClick={() => setPage("list")} className="absolute top-6 left-6 z-10 bg-black/30 text-white p-3 rounded-2xl backdrop-blur-xl hover:bg-black/50 transition-all"><ArrowLeft /></button>
          <img src={selectedTalent.avatar_url} className="w-full aspect-[4/5] object-cover" />
          
          <div className="p-10 -mt-12 relative bg-white rounded-t-[50px] space-y-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="bg-red-600 text-white font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-tighter">{selectedTalent.category}</span>
                <h2 className="text-5xl font-[1000] tracking-tighter leading-none">{selectedTalent.full_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-red-600 italic">¥{selectedTalent.price_per_project?.toLocaleString()}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Standard Rate</p>
              </div>
            </div>

            {/* ボイスサンプル */}
            {selectedTalent.voice_url && (
              <div className="bg-gray-50 rounded-[30px] p-6 border border-gray-100 flex items-center gap-6">
                <div className="bg-red-600 p-4 rounded-2xl shadow-lg shadow-red-200 animate-pulse"><Play className="text-white fill-current w-6 h-6" /></div>
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-400 uppercase mb-2">Voice Sample</p>
                  <audio controls className="w-full h-8"><source src={selectedTalent.voice_url} /></audio>
                </div>
              </div>
            )}

            <p className="text-gray-500 text-xl leading-relaxed font-medium border-l-[10px] border-red-600 pl-8 py-2">{selectedTalent.bio}</p>

            {/* サブ画像 */}
            <div className="grid grid-cols-2 gap-4">
              {selectedTalent.sub_image1 && <img src={selectedTalent.sub_image1} className="rounded-[30px] aspect-square object-cover shadow-md hover:scale-105 transition-transform" />}
              {selectedTalent.sub_image2 && <img src={selectedTalent.sub_image2} className="rounded-[30px] aspect-square object-cover shadow-md hover:scale-105 transition-transform" />}
            </div>

            {/* アクションボタン */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <button onClick={() => { setPage("chat"); fetchMessages(selectedTalent.id); }} className="bg-[#111] text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                <MessageCircle className="w-7 h-7" /> 相談する
              </button>
              <button onClick={handlePayment} className="bg-red-600 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 shadow-xl shadow-red-200 active:scale-95 transition-all uppercase italic">
                <CreditCard className="w-7 h-7" /> 購入手続きへ
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 3. チャット画面 (メッセージ履歴込み) */}
      {page === "chat" && selectedTalent && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="p-6 border-b flex items-center gap-4 bg-white/90 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
            <ArrowLeft onClick={() => setPage("detail")} className="cursor-pointer w-7 h-7 text-gray-400 hover:text-black" />
            <img src={selectedTalent.avatar_url} className="w-12 h-12 rounded-[18px] object-cover shadow-md" />
            <div>
              <p className="font-[1000] text-xl leading-none">{selectedTalent.full_name}</p>
              <p className="text-[10px] text-green-500 font-bold uppercase mt-1 tracking-widest">● Online Now</p>
            </div>
          </header>
          <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === session?.user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-5 rounded-[28px] text-[15px] font-bold shadow-sm ${
                  m.sender_id === session?.user?.id 
                  ? "bg-red-600 text-white rounded-br-none" 
                  : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <footer className="p-6 bg-white border-t border-gray-100 sticky bottom-0">
            <div className="flex gap-3 max-w-xl mx-auto bg-gray-100 p-2 rounded-[30px] shadow-inner">
              <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="メッセージを入力..." className="flex-1 bg-transparent border-none px-6 py-4 outline-none font-bold text-gray-700" />
              <button onClick={sendMessage} className="bg-red-600 text-white p-5 rounded-full shadow-lg hover:rotate-12 active:scale-90 transition-all"><Send className="w-6 h-6" /></button>
            </div>
          </footer>
        </main>
      )}

      {/* 4. オーディション画面 (公募) */}
      {page === "auditions" && (
        <main className="p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
          <h2 className="text-5xl font-[1000] italic tracking-tighter border-b-8 border-red-600 inline-block mb-8">AUDITIONS</h2>
          
          <div className="bg-white p-1 rounded-[45px] shadow-2xl border border-gray-100 overflow-hidden group cursor-pointer hover:-translate-y-2 transition-transform">
            <div className="bg-gradient-to-br from-[#111] to-[#333] p-10 rounded-[40px] text-white relative">
              <Briefcase className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />
              <span className="bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase mb-6 inline-block">Urgent</span>
              <h3 className="text-3xl font-[1000] mb-4 leading-tight">次世代Web3.0<br/>ブランドアンバサダー募集</h3>
              <p className="text-gray-400 font-bold mb-8">想定報酬：¥100,000 〜 ¥500,000</p>
              <button className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all shadow-xl">詳細を確認して応募</button>
            </div>
          </div>
          <p className="text-center text-gray-300 font-black uppercase tracking-[0.5em] text-xs pt-20">New Projects Loading...</p>
        </main>
      )}

      {/* 5. マイページ (売上金・出金管理) */}
      {page === "dashboard" && (
        <main className="p-10 max-w-2xl mx-auto space-y-12 animate-in zoom-in duration-500">
          <div className="flex justify-between items-end">
            <h2 className="text-5xl font-[1000] italic tracking-tighter">ACCOUNT</h2>
            <button className="text-gray-400 font-black text-xs underline underline-offset-8" onClick={() => supabase.auth.signOut()}>LOGOUT</button>
          </div>
          
          {/* 売上金ウォレット */}
          <div className="bg-white p-12 rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.08)] border border-gray-50 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><DollarSign className="w-32 h-32" /></div>
            <div className="text-center relative">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Available Balance</p>
              <p className="text-7xl font-[1000] text-gray-900 leading-none tracking-tighter italic">¥{(myBookings.length * 15000).toLocaleString()}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => alert("銀行口座が未登録です")} className="flex-1 bg-red-600 text-white py-6 rounded-[30px] font-[1000] flex items-center justify-center gap-3 shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-tighter">
                <DollarSign className="w-6 h-6" /> 出金申請
              </button>
            </div>
          </div>

          {/* 購入/販売履歴 */}
          <div className="space-y-6">
            <h3 className="font-black text-gray-400 text-[11px] uppercase tracking-[0.3em] px-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Transaction History
            </h3>
            {myBookings.length === 0 ? <p className="text-gray-300 font-black text-center py-10">NO DATA</p> : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <div key={b.id} className="bg-white p-6 rounded-3xl flex justify-between items-center shadow-sm border border-gray-50 hover:border-red-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="font-black text-gray-700">{b.profiles?.full_name}</p>
                    </div>
                    <span className="text-red-600 font-[1000] italic">¥{b.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* --- 究極のフローティング・ナビゲーション --- */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#111]/90 backdrop-blur-3xl px-12 py-7 rounded-[45px] flex gap-16 items-center shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-50 border border-white/10">
        <Search onClick={() => setPage("list")} className={`w-7 h-7 transition-all cursor-pointer ${page === "list" ? "text-red-500 scale-125" : "text-gray-400 hover:text-white"}`} />
        <Briefcase onClick={() => setPage("auditions")} className={`w-7 h-7 transition-all cursor-pointer ${page === "auditions" ? "text-red-500 scale-125" : "text-gray-400 hover:text-white"}`} />
        <TrendingUp onClick={() => setPage("dashboard")} className={`w-7 h-7 transition-all cursor-pointer ${page === "dashboard" ? "text-red-500 scale-125" : "text-gray-400 hover:text-white"}`} />
        <div className="relative group cursor-pointer" onClick={() => setPage("dashboard")}>
          <User className="w-7 h-7 text-gray-400 group-hover:text-white transition-all" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black"></div>
        </div>
      </nav>
    </div>
  );
}
