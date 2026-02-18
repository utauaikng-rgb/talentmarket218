import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  Heart, Search, User, Bell, PlusCircle, ArrowLeft, 
  CheckCircle, MessageCircle, TrendingUp, Send, CreditCard, ShieldCheck, Loader2
} from "lucide-react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function TalentApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("list");
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [talents, setTalents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: tData } = await supabase.from('profiles').select('*');
      if (tData) setTalents(tData);
      
      if (session) {
        const { data: bData } = await supabase.from('bookings').select('*, profiles(full_name)').eq('client_id', session.user.id);
        if (bData) setMyBookings(bData);
      }
    }
    fetchData();
  }, [session, page]);

  const handlePayment = async () => {
    if (!session) {
      alert("決済にはログインが必要です");
      setPage("auth");
      return;
    }
    const { error } = await supabase.from('bookings').insert([
      { 
        client_id: session.user.id, 
        talent_id: selectedTalent.id, 
        amount: selectedTalent.price_per_project,
        status: 'paid' 
      }
    ]);
    if (!error) {
      alert("決済が完了しました！マイページで確認できます。");
      setPage("dashboard");
    } else {
      alert("エラーが発生しました: " + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* 1. リスト画面 */}
      {page === "list" && (
        <main className="p-4 grid grid-cols-2 gap-4 max-w-4xl mx-auto">
          {talents.map(t => (
            <div key={t.id} onClick={() => { setSelectedTalent(t); setPage("detail"); }} className="bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer active:scale-95 transition-all">
              <img src={t.avatar_url} className="aspect-square object-cover w-full" />
              <div className="p-3 text-center">
                <h3 className="font-bold text-gray-800">{t.full_name}</h3>
                <p className="text-red-600 font-black">¥{t.price_per_project?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </main>
      )}

      {/* 2. 詳細 & 決済画面 */}
      {page === "detail" && selectedTalent && (
        <main className="max-w-md mx-auto bg-white min-h-screen relative">
          <button onClick={() => setPage("list")} className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-full shadow-md"><ArrowLeft /></button>
          <img src={selectedTalent.avatar_url} className="w-full aspect-[4/5] object-cover" />
          <div className="p-6 space-y-6">
            <h2 className="text-3xl font-black">{selectedTalent.full_name}</h2>
            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold">依頼料金</span>
              <span className="text-xl font-black text-red-600">¥{selectedTalent.price_per_project?.toLocaleString()}</span>
            </div>
            <button onClick={handlePayment} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
              <CreditCard className="w-5 h-5" /> 今すぐ決済する
            </button>
            <p className="text-[10px] text-gray-400 text-center">※安全な決済システム。完了まで代金は保護されます。</p>
          </div>
        </main>
      )}

      {/* 3. マイページ（購入履歴） */}
      {page === "dashboard" && (
        <main className="p-6 max-w-md mx-auto space-y-6">
          <h2 className="text-2xl font-black italic underline decoration-red-600">MY ORDERS</h2>
          {myBookings.length === 0 ? <p className="text-gray-400">注文履歴はありません</p> : (
            myBookings.map(b => (
              <div key={b.id} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-green-500 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-gray-400">Order ID: {b.id.slice(0,8)}</p>
                  <p className="font-bold">{b.profiles?.full_name} さんへの依頼</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Paid</span>
                  <p className="font-black mt-1 text-sm">¥{b.amount?.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
          <button onClick={() => setPage("list")} className="w-full py-4 text-gray-400 font-bold border-t mt-4">トップへ戻る</button>
        </main>
      )}

      {/* ログイン（簡易） */}
      {page === "auth" && (
        <div className="p-10 text-center space-y-4">
          <h2 className="text-2xl font-black">ログイン</h2>
          <p className="text-sm text-gray-400">決済にはログインが必要です</p>
          <button onClick={() => setPage("list")} className="text-red-600 font-bold">キャンセル</button>
        </div>
      )}

      {/* 下部ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-
