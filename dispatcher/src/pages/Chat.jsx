import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Send, User, Clock, ChevronRight, MessageSquare } from 'lucide-react'
import './Chat.css'

export function Chat() {
    const [conversations, setConversations] = useState([])
    const [activeUser, setActiveUser] = useState(null)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef(null)
    const pollRef = useRef(null)

    const loadConversations = async () => {
        try {
            const data = await api.getChatConversations()
            setConversations(data)
        } catch (e) {
            console.error('Failed to load conversations', e)
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (userId) => {
        if (!userId) return
        try {
            const data = await api.getChatWithUser(userId)
            setMessages(data)

            // Сбрасываем счетчик непрочитанных для этого юзера
            setConversations(prev => prev.map(c =>
                c.user_id === userId ? { ...c, unread_count: 0 } : c
            ))
        } catch (e) {
            console.error('Failed to load messages', e)
        }
    }

    useEffect(() => {
        loadConversations()
        pollRef.current = setInterval(() => {
            loadConversations()
            if (activeUser) {
                loadMessages(activeUser.user_id)
            }
        }, 5000)

        return () => clearInterval(pollRef.current)
    }, [activeUser])

    useEffect(() => {
        if (activeUser) {
            loadMessages(activeUser.user_id)
        } else {
            setMessages([])
        }
    }, [activeUser])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        const trimmed = text.trim()
        if (!trimmed || sending || !activeUser) return

        setSending(true)
        setText('')

        // Optimistic update
        const optimistic = {
            id: Date.now(),
            sender_id: 0, // admin doesn't matter much for display
            sender_role: 'admin',
            receiver_id: activeUser.user_id,
            text: trimmed,
            created_at: new Date().toISOString(),
            _pending: true,
        }
        setMessages(prev => [...prev, optimistic])

        try {
            await api.sendChatMessage({ text: trimmed, receiver_id: activeUser.user_id })
            await loadMessages(activeUser.user_id)
            await loadConversations() // update last message in list
        } catch (e) {
            console.error('Send error:', e)
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const formatTime = (dt) => {
        if (!dt) return ''
        const d = new Date(dt)
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dt) => {
        if (!dt) return ''
        const d = new Date(dt)
        const today = new Date()
        if (d.toDateString() === today.toDateString()) return 'Сегодня'
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 className="section-title">Центр коммуникаций</h2>
                <p className="section-subtitle">Оперативная связь с мастерами и координация выполнения заявок</p>
            </div>

            <div className="chat-container glass" style={{ flex: 1, minHeight: 0 }}>
                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                                <MessageSquare size={20} strokeWidth={2.5} />
                            </div>
                            <h3>Сообщения</h3>
                        </div>
                    </div>

                    <div className="chat-conv-list scrollbar">
                        {loading ? (
                            <div className="chat-empty">
                                <div className="pulse" style={{ width: '40px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', margin: '0 auto' }}></div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="chat-empty">
                                <MessageSquare size={40} style={{ opacity: 0.1, marginBottom: '12px' }} />
                                <div className="font-semibold text-sm">Нет активных диалогов</div>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.user_id}
                                    className={`chat-conv-item ${activeUser?.user_id === conv.user_id ? 'active' : ''}`}
                                    onClick={() => setActiveUser(conv)}
                                >
                                    <div className="chat-avatar" style={{
                                        background: activeUser?.user_id === conv.user_id ? 'var(--primary)' : '#111',
                                        color: activeUser?.user_id === conv.user_id ? 'white' : 'var(--text-main)',
                                        boxShadow: activeUser?.user_id === conv.user_id ? '0 8px 16px -4px rgba(59, 130, 246, 0.3)' : 'none'
                                    }}>
                                        {(conv.name || 'М')[0].toUpperCase()}
                                    </div>
                                    <div className="chat-conv-info">
                                        <div className="chat-conv-name">
                                            <span className="font-semibold">{conv.name}</span>
                                            <span className="chat-conv-time">{formatTime(conv.last_message_at)}</span>
                                        </div>
                                        <div className="chat-conv-last">
                                            <span className="chat-conv-text">{conv.last_message}</span>
                                            {conv.unread_count > 0 && (
                                                <span className="chat-conv-badge">{conv.unread_count}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
                    {!activeUser ? (
                        <div className="chat-placeholder">
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '30px', 
                                background: '#f9f9f9', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                marginBottom: '24px',
                                color: 'var(--primary)',
                                opacity: 0.5
                            }}>
                                <MessageSquare size={40} strokeWidth={2} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', tracking: '-0.02em' }}>Выберите диалог</h2>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '280px', margin: '12px auto 0', fontWeight: '600', lineHeight: '1.6' }}>
                                Выберите мастера из списка слева, чтобы начать переписку в режиме реального времени
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="chat-main-header">
                                <div className="chat-avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                                    {(activeUser.name || 'М')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="chat-main-name font-semibold">{activeUser.name}</div>
                                    <div className="chat-main-phone text-xs font-semibold" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{activeUser.phone}</div>
                                </div>
                            </div>

                            <div className="chat-messages scrollbar" ref={scrollRef}>
                                {messages.map((m, i) => {
                                    const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()
                                    const isAdmin = m.sender_role === 'admin'

                                    return (
                                        <React.Fragment key={m.id || i}>
                                            {showDate && (
                                                <div className="chat-date-divider">
                                                    <span>{formatDate(m.created_at)}</span>
                                                </div>
                                            )}
                                            <div className={`chat-bubble-wrapper ${isAdmin ? 'admin' : 'master'}`}>
                                                <div className={`chat-bubble ${m._pending ? 'pending' : ''}`} style={{
                                                    boxShadow: isAdmin ? '0 10px 20px -5px rgba(59, 130, 246, 0.2)' : '0 4px 12px -2px rgba(0,0,0,0.05)'
                                                }}>
                                                    <div className="chat-bubble-text font-medium">{m.text}</div>
                                                    <div className="chat-bubble-time flex items-center gap-1">
                                                        {formatTime(m.created_at)}
                                                        {isAdmin && <span className="text-[10px] ml-1 opacity-60">✓✓</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )
                                })}
                            </div>

                            <div className="chat-input-wrapper">
                                <div style={{ 
                                    flex: 1, 
                                    background: 'white', 
                                    borderRadius: '8px', 
                                    padding: '6px', 
                                    display: 'flex', 
                                    alignItems: 'flex-end',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: 'none'
                                }}>
                                    <textarea
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Напишите сообщение..."
                                        rows={1}
                                        className="chat-textarea"
                                        style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                                    />
                                    <button
                                        className="chat-send-btn"
                                        onClick={handleSend}
                                        disabled={!text.trim() || sending}
                                        style={{ width: '40px', height: '40px', borderRadius: '6px' }}
                                    >
                                        <Send size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
