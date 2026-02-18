import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Heart, Search, User, Bell, PlusCircle, ArrowLeft, 
  CheckCircle, Play, MessageCircle, Star, ShieldCheck, TrendingUp, LogOut, Loader2, Send
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function TalentApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("list");
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [messages, setMessages] = useState([]); // チャット履歴
  const [inputText, setInputText] = useState(""); // 入力中の文字
  const [talents, setTalents] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchTalents() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setTalents(data);
    }
    fetchTalents();
  }, []);

  // チャット履歴の取得
  const fetchMessages = async (talentId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', talentId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  // メッセージ送信
  const sendMessage = async () => {
    if (!inputText.trim() || !session) return;
    const { error } = await supabase.from('messages').insert([
      { sender_id: session.user.id, receiver_id: selectedTalent.id, content: inputText }
    ]);
    if (!error) {
      setInputText("");
      fetchMessages(selectedTalent.id); // 再読み込み
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. リスト画面 */}
      {page === "list" && (
        <>
          <header className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center">
            <h1 className="text-xl font-black text-red-600 tracking-tighter">TALENT MARKET</h1>
            <User className="w-6 h-6 text-gray-600" onClick={() => setPage("auth")} />
          </header>
          <main className="p-4 grid grid-cols-2 gap-4 max-w-4xl mx-auto">
            {talents.map(t => (
              <div key={t.id} onClick={() => { setSelectedTalent(t); setPage("detail"); }} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer">
                <img src={t.avatar_url} className="aspect-[3/4] object-cover w-full" />
                <div className="p-3">
                  <h3 className="font-bold text-gray-800">{t.full_name}</h3>
                  <p className="text-red-500 font-black mt-1">¥{t.price_per_project?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </main>
        </>
      )}

      {/* 2. 詳細画面 */}
      {page === "detail" && selectedTalent && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen relative">
          <button onClick={() => setPage("list")} className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-full shadow-md"><ArrowLeft /></button>
          <img src={selectedTalent.avatar_url} className="w-full aspect-square object-cover" />
          <div className="p-6 space-y-4 text-center">
            <h2 className="text-3xl font-black">{selectedTalent.full_name}</h2>
            <p className="text-gray-600">{selectedTalent.bio}</p>
            <button 
              onClick={() => { setPage("chat"); fetchMessages(selectedTalent.id); }}
              className="w-full bg-red-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> このタレントに相談する
            </button>
          </div>
        </main>
      )}

      {/* 3. チャット画面 */}
      {page === "chat" && (
        <main className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col">
          <header className="p-4 border-b flex items-center gap-4 sticky top-0 bg-white z-10">
            <ArrowLeft onClick={() => setPage("detail")} className="cursor-pointer" />
            <span className="font-bold">{selectedTalent.full_name}さんへの相談</span>
          </header>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === session?.user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl font-medium ${m.sender_id === session?.user?.id ? "bg-red-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <footer className="p-4 border-t bg-white sticky bottom-0">
            <div className="flex gap-2">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-red-600 outline-none"
              />
              <button onClick={sendMessage} className="bg-red-600 text-white p-3 rounded-full shadow-lg"><Send className="w-5 h-5" /></button>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
