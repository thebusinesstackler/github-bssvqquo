import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { 
  Search, 
  Users, 
  Send, 
  AlertCircle, 
  CheckCircle,
  MessageSquare,
  Filter,
  ChevronDown,
  ChevronUp,
  Bell,
  RefreshCw
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';

export function MessageOversight() {
  const { partners } = useAdminStore();
  const { sendNotification } = useNotificationStore();
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState<'lead' | 'promotion'>('lead');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const [messageForm, setMessageForm] = useState({
    title: '',
    message: '',
    template: ''
  });

  // Message templates
  const templates = {
    lead: [
      {
        name: 'New Lead Assignment',
        title: 'New Lead Assigned',
        message: 'A new lead has been assigned to your site. Please review and contact the patient within 24 hours.'
      },
      {
        name: 'Lead Follow-up Reminder',
        title: 'Lead Follow-up Required',
        message: 'This is a reminder to follow up with your recently assigned leads. Timely contact improves conversion rates.'
      }
    ],
    promotion: [
      {
        name: 'New Study Opportunity',
        title: 'New Study Opportunity Available',
        message: 'We have a new study opportunity that matches your site\'s capabilities. Check your dashboard for details.'
      },
      {
        name: 'Performance Milestone',
        title: 'Congratulations on Your Performance!',
        message: 'Your site has achieved excellent response rates this month. Keep up the great work!'
      }
    ]
  };

  // Fetch previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get messages from the global messages collection
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const messagesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setMessages(messagesList);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    
    fetchMessages();
  }, []);

  const handleTemplateSelect = (templateName: string) => {
    const template = templates[messageType].find(t => t.name === templateName);
    if (template) {
      setMessageForm({
        title: template.title,
        message: template.message,
        template: templateName
      });
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!messageForm.title || !messageForm.message) {
      setError('Please provide both title and message');
      setIsLoading(false);
      return;
    }

    if (selectedPartners.length === 0) {
      setError('Please select at least one partner');
      setIsLoading(false);
      return;
    }

    try {
      // Send notification to each selected partner
      await Promise.all(
        selectedPartners.map(async (partnerId) => {
          // Create notification entry
          const notificationId = await sendNotification(
            partnerId,
            messageForm.title,
            messageForm.message,
            'admin'
          );
          
          // Create a message entry in Firebase
          const messageData = {
            content: messageForm.message,
            title: messageForm.title,
            senderId: 'admin',
            recipientId: partnerId,
            timestamp: serverTimestamp(),
            read: false,
            type: messageType,
            notificationId: notificationId
          };
          
          // Also create a message in the partner's messages collection
          await addDoc(collection(db, `partners/${partnerId}/messages`), messageData);
          
          // Add to global messages collection for admin reference
          await addDoc(collection(db, 'messages'), messageData);
          
          // Find the partner to get their name
          const partner = partners.find(p => p.id === partnerId);
          
          // Update local messages state for immediate UI feedback
          setMessages(prev => [{
            id: Date.now().toString(),
            ...messageData,
            timestamp: new Date(),
            recipientName: partner?.name || 'Unknown Partner'
          }, ...prev]);
        })
      );

      setSuccess(`Message sent successfully to ${selectedPartners.length} partner(s)`);
      setSelectedPartners([]);
      setMessageForm({
        title: '',
        message: '',
        template: ''
      });
    } catch (err) {
      console.error('Error sending messages:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Message Oversight</h1>
      </div>

      {/* Message Type Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMessageType('lead')}
            className={`px-4 py-2 rounded-lg flex items-center ${
              messageType === 'lead'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Bell className="w-5 h-5 mr-2" />
            Lead Notifications
          </button>
          <button
            onClick={() => setMessageType('promotion')}
            className={`px-4 py-2 rounded-lg flex items-center ${
              messageType === 'promotion'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Promotional Messages
          </button>
        </div>

        {/* Message Templates */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Template
          </label>
          <select
            value={messageForm.template}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a template...</option>
            {templates[messageType].map(template => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message Title
            </label>
            <input
              type="text"
              value={messageForm.title}
              onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter message title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message Content
            </label>
            <textarea
              value={messageForm.message}
              onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your message"
            />
          </div>
        </div>
      </div>

      {/* Partner Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Select Recipients</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedPartners.length === filteredPartners.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPartners(filteredPartners.map(p => p.id));
                  } else {
                    setSelectedPartners([]);
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Select All</span>
            </label>
            <span className="text-sm text-gray-500">
              {selectedPartners.length} selected
            </span>
          </div>

          <div className="border rounded-lg divide-y">
            {filteredPartners.map(partner => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPartners.includes(partner.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPartners([...selectedPartners, partner.id]);
                      } else {
                        setSelectedPartners(selectedPartners.filter(id => id !== partner.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                    <p className="text-sm text-gray-500">{partner.email}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {partner.currentLeads} leads
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Messages</h2>
        
        {messages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {messages.slice(0, 5).map((message) => (
              <div key={message.id} className="py-3">
                <div className="flex justify-between">
                  <div className="font-medium">{message.title}</div>
                  <div className="text-sm text-gray-500">
                    {message.timestamp instanceof Date ? 
                      format(message.timestamp, 'MMM d, yyyy h:mm a') : 
                      'Just now'}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{message.content}</div>
                <div className="text-xs text-gray-500 mt-2">
                  To: {message.recipientName || partners.find(p => p.id === message.recipientId)?.name || 'Unknown Partner'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No recent messages found
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSendMessage}
          disabled={isLoading || selectedPartners.length === 0 || !messageForm.title || !messageForm.message}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> 
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Send Message
            </>
          )}
        </button>
      </div>
    </div>
  );
}