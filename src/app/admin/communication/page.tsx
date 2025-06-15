
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquareText, Search, Send, Paperclip, Smile, UserCircle2, Users, Circle, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'client' | 'staff';
  avatarUrl?: string;
  online?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  role?: 'admin' | 'client' | 'staff'; // Role of the sender
  senderName?: string; // Name of the sender
}

interface Conversation {
  id: string;
  type: 'dm' | 'project';
  name: string; // User name for DM, Project name for project chat
  avatarUrl?: string; // User avatar or project icon
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  participants?: User[];
  projectId?: string; // if type is project
}

// Sample Data (Replace with actual data fetching)
const currentUserId = 'admin1'; // Assume current user is an admin

const sampleUsers: User[] = [
  { id: 'admin1', name: 'Admin User (You)', role: 'admin', avatarUrl: 'https://placehold.co/100x100/00274d/ffffff?text=AU' },
  { id: 'client1', name: 'Alice Wonderland', role: 'client', avatarUrl: 'https://placehold.co/100x100/A855F7/ffffff?text=AW', online: true },
  { id: 'staff1', name: 'Bob The Builder', role: 'staff', avatarUrl: 'https://placehold.co/100x100/F0F4F8/00274d?text=BB', online: false },
  { id: 'staff2', name: 'Charlie Brown', role: 'staff', avatarUrl: 'https://placehold.co/100x100/4caf50/ffffff?text=CB', online: true },
];

const sampleConversations: Conversation[] = [
  { id: 'convo1', type: 'dm', name: 'Alice Wonderland', avatarUrl: sampleUsers.find(u=>u.id==='client1')?.avatarUrl, lastMessage: 'Okay, sounds good!', lastMessageTime: '10:30 AM', unreadCount: 2, participants: [sampleUsers.find(u=>u.id==='admin1')!, sampleUsers.find(u=>u.id==='client1')!] },
  { id: 'convo2', type: 'dm', name: 'Bob The Builder', avatarUrl: sampleUsers.find(u=>u.id==='staff1')?.avatarUrl, lastMessage: 'I will get on that right away.', lastMessageTime: 'Yesterday', participants: [sampleUsers.find(u=>u.id==='admin1')!, sampleUsers.find(u=>u.id==='staff1')!] },
  { id: 'convo3', type: 'project', name: 'Project Phoenix', projectId: 'projPhoenix', lastMessage: 'Charlie: Meeting notes are uploaded.', lastMessageTime: '9:15 AM', participants: [sampleUsers.find(u=>u.id==='admin1')!, sampleUsers.find(u=>u.id==='client1')!, sampleUsers.find(u=>u.id==='staff2')!] },
  { id: 'convo4', type: 'dm', name: 'Charlie Brown', avatarUrl: sampleUsers.find(u=>u.id==='staff2')?.avatarUrl, lastMessage: 'Can you review the presentation?', lastMessageTime: 'Mon', unreadCount: 1, participants: [sampleUsers.find(u=>u.id==='admin1')!, sampleUsers.find(u=>u.id==='staff2')!] },
];

const sampleMessages: Record<string, Message[]> = {
  'convo1': [
    { id: 'msg1', senderId: 'client1', text: 'Hi Admin, can we schedule a call for tomorrow?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), role: 'client', senderName: 'Alice Wonderland' },
    { id: 'msg2', senderId: 'admin1', text: 'Sure Alice, how about 2 PM?', timestamp: new Date(Date.now() - 1000 * 60 * 58) },
    { id: 'msg3', senderId: 'client1', text: 'Okay, sounds good!', timestamp: new Date(Date.now() - 1000 * 60 * 30), role: 'client', senderName: 'Alice Wonderland' },
  ],
  'convo2': [
    { id: 'msg4', senderId: 'admin1', text: 'Bob, please check the latest designs for Project Alpha.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5) },
    { id: 'msg5', senderId: 'staff1', text: 'I will get on that right away.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), role: 'staff', senderName: 'Bob The Builder'},
  ],
  'convo3': [
    { id: 'msg6', senderId: 'admin1', text: 'Team, what\'s the status on Project Phoenix deliverables?', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
    { id: 'msg7', senderId: 'client1', text: 'Looking forward to the update!', timestamp: new Date(Date.now() - 1000 * 60 * 90), role: 'client', senderName: 'Alice Wonderland'},
    { id: 'msg8', senderId: 'staff2', text: 'Meeting notes are uploaded. Working on the final report.', timestamp: new Date(Date.now() - 1000 * 60 * 45), role: 'staff', senderName: 'Charlie Brown'},
  ],
   'convo4': [
    { id: 'msg9', senderId: 'staff2', text: 'Hey Admin, can you review the presentation for tomorrow\'s client meeting?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), role: 'staff', senderName: 'Charlie Brown'},
  ],
};

const CommunicationHubPage: FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(sampleConversations[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(selectedConversation ? sampleMessages[selectedConversation.id] || [] : []);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(sampleMessages[selectedConversation.id] || []);
    }
  }, [selectedConversation]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    const newMsg: Message = {
      id: `msg${Date.now()}`,
      senderId: currentUserId,
      text: newMessage,
      timestamp: new Date(),
      // role and senderName are not needed for 'self' messages for display
    };

    // Simulate adding message
    setMessages(prev => [...prev, newMsg]);
    
    // Update conversation list's last message (simulation)
    const updatedConvoIndex = sampleConversations.findIndex(c => c.id === selectedConversation.id);
    if (updatedConvoIndex > -1) {
        sampleConversations[updatedConvoIndex].lastMessage = newMessage;
        sampleConversations[updatedConvoIndex].lastMessageTime = format(new Date(), 'p');
    }

    setNewMessage('');
  };
  
  const filteredConversations = sampleConversations.filter(convo => 
    convo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSender = (senderId: string): User | undefined => {
    return sampleUsers.find(user => user.id === senderId);
  };


  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden bg-background"> {/* Adjusted height for admin layout */}
      {/* Conversation List Panel */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-primary">Chats</h2>
            {/* Add New Chat/Group button could go here */}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <nav className="py-2">
            {filteredConversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => handleSelectConversation(convo)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors",
                  selectedConversation?.id === convo.id && "bg-secondary/70"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={convo.avatarUrl || (convo.type === 'project' ? `https://placehold.co/100x100/8B5CF6/ffffff?text=${convo.name.substring(0,1)}P` : `https://placehold.co/100x100/F0F4F8/00274d?text=${convo.name.substring(0,1)}`)} alt={convo.name} />
                  <AvatarFallback>{convo.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  { convo.type === 'dm' && sampleUsers.find(u => u.id === convo.participants?.find(p => p.id !== currentUserId)?.id)?.online && (
                     <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                  )}
                </Avatar>
                <div className="flex-1 truncate">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-foreground">{convo.name}</h3>
                    <span className="text-xs text-muted-foreground">{convo.lastMessageTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                    {convo.unreadCount && convo.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">{convo.unreadCount}</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
                <p className="p-4 text-sm text-center text-muted-foreground">No conversations found.</p>
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col bg-secondary/30">
        {selectedConversation ? (
          <>
            <header className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                   <AvatarImage src={selectedConversation.avatarUrl || (selectedConversation.type === 'project' ? `https://placehold.co/100x100/8B5CF6/ffffff?text=${selectedConversation.name.substring(0,1)}P` : `https://placehold.co/100x100/F0F4F8/00274d?text=${selectedConversation.name.substring(0,1)}`)} alt={selectedConversation.name} />
                  <AvatarFallback>{selectedConversation.name.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-primary">{selectedConversation.name}</h2>
                  {selectedConversation.type === 'dm' && (
                    <p className="text-xs text-muted-foreground">
                      {sampleUsers.find(u => u.id === selectedConversation.participants?.find(p=>p.id !== currentUserId)?.id)?.online ? 'Online' : 'Offline'}
                    </p>
                  )}
                   {selectedConversation.type === 'project' && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.participants?.length || 0} members
                    </p>
                  )}
                </div>
              </div>
              {/* Action buttons like Call, Info could go here */}
            </header>

            <ScrollArea className="flex-1 p-4 space-y-4">
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUserId;
                const sender = getSender(msg.senderId);
                const senderDisplayName = isCurrentUser ? "You" : (msg.senderName || sender?.name || "Unknown User");
                const senderRole = isCurrentUser ? null : (msg.role || sender?.role || null);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn("max-w-[70%] flex flex-col", isCurrentUser ? "items-end" : "items-start")}>
                      {!isCurrentUser && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-primary">{senderDisplayName}</span>
                          {senderRole && <Badge variant={senderRole === 'admin' ? 'default' : (senderRole === 'client' ? 'secondary' : 'outline')} className="text-[10px] px-1 py-0 leading-tight">{senderRole}</Badge>}
                        </div>
                      )}
                       <div
                        className={cn(
                          "p-3 rounded-xl shadow-sm",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-card text-card-foreground rounded-bl-none"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className={cn(
                          "text-[10px] text-muted-foreground mt-1",
                          isCurrentUser ? "text-right" : "text-left"
                      )}>
                        {format(msg.timestamp, 'p')}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </ScrollArea>

            <footer className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground" disabled><Paperclip className="h-5 w-5" /></Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  autoComplete="off"
                />
                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground" disabled><Smile className="h-5 w-5" /></Button>
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageSquareText className="h-20 w-20 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground">Select a conversation</h2>
            <p className="text-sm text-muted-foreground">Choose a chat from the list to start messaging.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunicationHubPage;

    
