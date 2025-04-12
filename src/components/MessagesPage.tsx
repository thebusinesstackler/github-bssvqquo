import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Phone, 
  FileText, 
  User, 
  Clock, 
  Search, 
  AlertCircle,
  MessageSquare,
  Calendar,
  ArrowRight,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useLeadStore } from '../store/useLeadStore';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  orderBy, 
  getDocs,
  limit
} from 'firebase/firestore';

interface LeadMessage {
  id: string;
  leadId: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  read: boolean;
  isPartner: boolean;
}

export function MessagesPage() {
  const { user, impersonatedUser } = useAuthStore();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeadStore();
  const effectiveUser = impersonatedUser || user;
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch leads when component mounts
  useEffect(() => {
    if (effectiveUser?.id) {
      fetchLeads(effectiveUser.id);
    }
  }, [effectiveUser?.id, fetchLeads]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to messages for the selected lead
  useEffect(() => {
    if (!selectedLeadId || !effectiveUser?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Query messages for the selected lead
      const messagesRef = collection(db, `partners/${effectiveUser.id}/leads/${selectedLeadId}/messages`);
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(messagesQuery, 
        (snapshot) => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            leadId: selectedLeadId,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
            isPartner: doc.data().senderId === effectiveUser.id
          })) as LeadMessage[];
          
          setMessages(fetchedMessages);
          setLoading(false);
        },
        (err) => {
          console.error('Error subscribing to messages:', err);
          setError('Failed to load messages');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up messages listener:', err);
      setError('Failed to load messages');
      setLoading(false);
      return () => {};
    }
  }, [selectedLeadId, effectiveUser?.id]);

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => {
    const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (lead.indication || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Selected lead object
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLeadId || !effectiveUser?.id) return;

    setSending(true);
    setError(null);

    try {
      // Create message data
      const messageData = {
        content: newMessage.trim(),
        senderId: effectiveUser.id,
        senderName: effectiveUser.name,
        timestamp: serverTimestamp(),
        read: false,
        isPartner: true
      };

      // Add message to Firestore
      const messagesRef = collection(db, `partners/${effectiveUser.id}/leads/${selectedLeadId}/messages`);
      await addDoc(messagesRef, messageData);

      // Update lead's last activity
      const leadRef = doc(db, `partners/${effectiveUser.id}/leads/${selectedLeadId}`);
      await updateDoc(leadRef, {
        lastUpdated: serverTimestamp(),
        lastContactedAt: serverTimestamp()
      });

      // Create a notification for the lead
      try {
        const notificationsRef = collection(db, `partners/${effectiveUser.id}/notifications`);
        await addDoc(notificationsRef, {
          title: "Message Sent",
          message: `You sent a message to ${selectedLead?.firstName} ${selectedLead?.lastName}`,
          type: "lead",
          read: false,
          createdAt: serverTimestamp(),
          leadId: selectedLeadId
        });
      } catch (err) {
        console.warn('Failed to create notification:', err);
      }

      setNewMessage('');
      setSuccess("Message sent successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) {
      return format(date, 'h:mm a');
    } else if (diffInDays < 7) {
      return format(date, 'EEE h:mm a');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-180px)]">
      <div className="flex h-full">
        {/* Leads Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Lead Conversations</h2>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {leadsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : filteredLeads.length > 0 ? (
              filteredLeads.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full p-4 border-b text-left hover:bg-blue-50 ${
                    selectedLeadId === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {lead.indication || 'No indication'} • {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'contacted' ? 'bg-green-100 text-green-800' :
                          lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'converted' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No leads found. Add new leads to start conversations.
              </div>
            )}
          </div>
        </div>
        
        {/* Conversation Area */}
        <div className="flex-1 flex flex-col h-full">
          {selectedLead ? (
            <>
              {/* Lead Header */}
              <div className="p-4 border-b bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h2>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Added {formatDistanceToNow(selectedLead.createdAt, { addSuffix: true })}
                        </span>
                        {selectedLead.indication && (
                          <>
                            <span>•</span>
                            <span>{selectedLead.indication}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isPartner ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!message.isPartner && (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            message.isPartner
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`text-xs mt-1 ${
                            message.isPartner ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.timestamp)}
                          </div>
                        </div>
                        {message.isPartner && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-2">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                {error && (
                  <div className="mb-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {success}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Send
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a lead to view messages</h3>
              <p className="text-gray-500 text-center max-w-sm">
                Choose a lead from the sidebar to view your conversation history and send messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}