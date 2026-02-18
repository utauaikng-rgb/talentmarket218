import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Search, User, ArrowLeft, MessageCircle, TrendingUp, Send, CreditCard, Loader2, PlusCircle
} from "lucide-react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function TalentApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("list");
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [talents, setTalents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

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

  // チャット取得
  const fetchMessages = async (talentId) => {
    const { data } = await supabase.from('messages').select('*').eq('receiver_id', talentId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  // メッセージ送信
  const sendMessage = async () => {
    if (!inputText.trim() || !session) return;
    const { error } = await supabase.from('messages').insert([{ sender_id: session.user.id, receiver_id: selectedTalent.id, content: inputText }]);
    if (!error) { setInputText(""); fetchMessages(selectedTalent.id); }
  };

  // 決済実行
  const handlePayment = async () => {
    if (!session) { alert("ログインが必要です"); setPage("auth"); return; }
    const { error } = await supabase.from('bookings').insert([{ client_id: session.user.id, talent_id: selectedTalent.id, amount: selectedTalent.price_per_project, status: 'paid' }]);
    if (!error) { alert("決済が完了しました！"); setPage("dashboard"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-red-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 p-4 flex justify-between items-center">
        <h1 onClick={() => setPage("list")} className="text-2xl font-black text-red-600 tracking-tighter cursor-pointer">TALENT MARKET</h1>
        <User className="w-6 h-6 text-gray-400 cursor-pointer" onClick={() => setPage("dashboard")} />
      </header>

      {/* 1. 一覧画面 */}
      {page === "list" && (
        <main className="p-4 grid grid-cols-2 gap-4 max-w-4xl mx-auto animate-in fade-in duration-500">
          {talents.map(t => (
            <div key={t.id} onClick={() => { setSelectedTalent(t); setPage("detail"); }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl transition-all active:scale-95">
              <img src={t.avatar_url} className="aspect-[3/4] object-cover w-full" />
              <div className="p-4">
                <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-1">{t.category}</p>
                <h3 className="font-bold text-gray-800 text-lg">{t.full_name}</h3>
                <p className="text-gray-900 font-black mt-1 text-xl">¥{t.price_per_project?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </main>
      )}

      {/* 2. 詳細画面 */}
      {page === "detail" && selectedTalent && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen relative animate-in slide-in-from-right duration-300">
          <button onClick={() => setPage("list")} className="absolute top-4 left-4 z-10 bg-white/90 p-3 rounded-full shadow-lg"><ArrowLeft className="w-6 h-6" /></button>
          <img src={selectedTalent.avatar_url} className="w-full aspect-square object-cover shadow-inner" />
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{selectedTalent.category}</span>
                <h2 className="text-4xl font-black mt-3 leading-none">{selectedTalent.full_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-red-600 italic">¥{selectedTalent.price_per_project?.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-gray-500 leading-relaxed text-lg border-l-4 border-red-600 pl-4">{selectedTalent.bio}</p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => { setPage("chat"); fetchMessages(selectedTalent.id); }} className="bg-gray-100 text-gray-900 font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                <MessageCircle className="w-6 h-6" /> 相談する
              </button>
              <button onClick={handlePayment} className="bg-red-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-red-200 hover:bg-red-700 transition-all">
                <CreditCard className="w-6 h-6" /> 予約する
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 3. チャット画面 */}
      {page === "chat" && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 border-b flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <ArrowLeft onClick={() => setPage("detail")} className="cursor-pointer w-6 h-6" />
            <img src={selectedTalent.avatar_url} className="w-10 h-10 rounded-full object-cover" />
            <span className="font-black text-lg">{selectedTalent.full_name}</span>
          </header>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === session?.user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-4 rounded-3xl text-sm font-bold shadow-sm ${m.sender_id === session?.user?.id ? "bg-red-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <footer className="p-4 border-t bg-white sticky bottom-0">
            <div className="flex gap-2 max-w-xl mx-auto">
              <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="メッセージを入力..." className="flex-1 bg-gray-100 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-600 outline-none font-bold" />
              <button onClick={sendMessage} className="bg-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-200 hover:rotate-12 transition-transform"><Send className="w-6 h-6" /></button>
            </div>
          </footer>
        </main>
      )}

      {/* 4. マイページ */}
      {page === "dashboard" && (
        <main className="p-8 max-w-md mx-auto space-y-8 animate-in zoom-in duration-300">
          <h2 className="text-4xl font-black italic tracking-tighter text-gray-900 border-b-8 border-red-600 inline-block">MY ORDERS</h2>
          <div className="space-y-4">
            {myBookings.length === 0 ? <p className="text-gray-400 font-bold py-10">まだ注文はありません</p> : (
              myBookings.map(b => (
                <div key={b.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-green-500 uppercase mb-1">● Payment Completed</p>
                    <p className="font-black text-xl">{b.profiles?.full_name}</p>
                  </div>
                  <p className="font-black text-gray-900">¥{b.amount?.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          <button onClick={() => setPage("list")} className="w-full py-4 text-red-600 font-black border-2 border-red-600 rounded-2xl hover:bg-red-50 transition-all">トップへ戻る</button>
        </main>
      )}

      {/* フッターナビ */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl px-8 py-4 rounded-full flex gap-12 items-center shadow-2xl z-50">
        <Search onClick={() => setPage("list")} className={`w-6 h-6 ${page === "list" ? "text-red-500" : "text-white"}`} />
        <TrendingUp onClick={() => setPage("dashboard")} className={`w-6 h-6 ${page === "dashboard" ? "text-red-500" : "text-white"}`} />
        <PlusCircle onClick={() => setPage("auth")} className="w-6 h-6 text-white" />
      </nav>
    </div>
  );
}
