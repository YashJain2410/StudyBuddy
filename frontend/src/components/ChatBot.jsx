import React, {useState, useEffect} from 'react'

export default function Chatbot({token, socket}){
  const [messages, setMessages] = useState([]);

  useEffect(()=>{
    if(!socket) return;
    socket.on('notification', payload => {
      setMessages(m=>[{from:'bot', text:`${payload.title || 'Reminder'} - ${payload.msg || ''}`} , ...m]);
    });
  },[socket]);

  function send(msg){
    // For demo, chatbot is rule-based client-side
    const reply = generateReply(msg);
    setMessages(m=>[{from:'me', text:msg}, {from:'bot', text:reply}, ...m]);
  }

  function generateReply(msg){
    if(msg.includes('consistency')) return 'Try the Pomodoro method: 25+5. Start small and reward yourself.';
    return 'Good job! Keep it up. I will remind you daily.';
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">StudyBot</h3>
      <div className="h-56 overflow-auto border p-2 mb-2 bg-gray-50">
        {messages.map((m,i)=> <div key={i} className={`${m.from==='bot'?'text-left':'text-right'} mb-1`}><b>{m.from}</b>: {m.text}</div>)}
      </div>
      <ChatInput onSend={send} />
    </div>
  )
}

function ChatInput({onSend}){
  const [text,setText]=useState('');
  return (
    <form onSubmit={e=>{e.preventDefault(); onSend(text); setText('');}} className="flex gap-2">
      <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 p-2 border" />
      <button className="px-3 py-1 bg-indigo-600 text-white rounded">Send</button>
    </form>
  )
}
