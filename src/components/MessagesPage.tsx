import React, { useState, useEffect } from 'react';
import { Send, Phone, FileText, User, Clock, Search, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Lead, Message } from '../types';
import { useLeadStore } from '../store/useLeadStore';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

interface ConversationProps {
  lead: Lead;
  messages: Message[];
  isAdmin?: boolean;
  onSendMessage?: (content: string) => void;
}

function Conversation({ lead, messages, isAdmin, onSendMessage }: ConversationProps) {
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isAdmin) return;

    try {
      if (onSendMessage) {
        await onSendMessage(newMessage.trim());
        setNewMessage('');
        setError(null);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Lead Info Header */}
      <div className="bg-white p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{lead.patientName}</h2>
              <p className="text-sm text-gray-500">{lead.condition}</p>
            </div>
          </div>
          {!isAdmin && (
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <Phone className="w-5 h-5" />
              </button>
              <button className="text-gray-600 hover:text-gray-900">
                <FileText className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === 'p1' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === 'p1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{message.content}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${
                  message.senderId === 'p1'
                    ? 'text-blue-100'
                    : 'text-gray-500'
                }`}>
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </span>
                {message.read && (
                  <span className="text-xs text-blue-200">Read</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input - Only show for partners */}
      {!isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-4 border-t">
          {error && (
            <div className="flex items-center text-red-600 text-sm mb-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const leads = useLeadStore((state) => state.leads) || [];
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);

  const filteredLeads = searchTerm
    ? leads.filter(lead => 
        (lead.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.condition || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : leads;

  useEffect(() => {
    if (!selectedLeadId) return;

    // Subscribe to messages for the selected lead
    const q = query(
      collection(db, 'messages'),
      where('leadId', '==', selectedLeadId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(newMessages.sort((a, b) => 
        a.timestamp.toMillis() - b.timestamp.toMillis()
      ));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedLeadId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedLeadId || !user) return;

    const messageData = {
      leadId: selectedLeadId,
      content,
      senderId: user.id,
      timestamp: serverTimestamp(),
      read: false
    };

    try {
      // Add message to Firestore
      await addDoc(collection(db, 'messages'), messageData);

      // Update lead's last activity
      await updateDoc(doc(db, 'leads', selectedLeadId), {
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message:', err);
      throw new Error('Failed to send message');
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
          <p className="text-gray-600">
            {isAdmin 
              ? "No conversations to monitor at this time"
              : "You'll see your conversations here once you start receiving leads"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 -mt-8">
      {/* Leads List */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isAdmin ? 'Message Oversight' : 'Conversations'}
          </h2>
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          {filteredLeads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className={`w-full p-4 border-b text-left hover:bg-gray-50 ${
                selectedLeadId === lead.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{lead.patientName}</h3>
                  <p className="text-sm text-gray-500">{lead.condition}</p>
                </div>
                <div className="flex items-center">
                  {lead.messages?.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {lead.messages.length}
                    </span>
                  )}
                  <Clock className="w-4 h-4 text-gray-400 ml-2" />
                </div>
              </div>
              {lead.messages?.length > 0 && (
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {lead.messages[lead.messages.length - 1].content}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1">
        {selectedLead ? (
          loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : (
            <Conversation
              lead={selectedLead}
              messages={messages}
              isAdmin={isAdmin}
              onSendMessage={handleSendMessage}
            />
          )
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}