
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea import
import {
  Activity, Zap, Newspaper, Bell, ListChecks, ExternalLink, Users, Briefcase, Settings,
  ClipboardList, PlusCircle, UserCircle, Circle, BarChart2, MessageSquare, Flag, Eye, Pin, Workflow, AlertCircle, Clock, LogIn, LogOut, CheckCircle as CheckCircleIcon, AlertTriangle, Rocket, MoreHorizontal, Trash2, Edit3, Filter, MessageCircle as MessageCircleChatIcon, BrainCircuit, CalendarDays as CalendarDaysIcon, Settings2, Info, ChevronDown, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Sample data (replace with actual data fetching later)
const sampleActivityFeed = [
  { id: '1', text: "Client 'Acme Corp' logged in.", time: "2m ago" },
  { id: '2', text: "VA 'Jane D.' completed task 'Social Media Schedule'.", time: "15m ago" },
  { id: '3', text: "Task 'Client Onboarding - Beta Inc.' deadline approaching.", time: "1h ago" },
  { id: '4', text: "New VA 'Mike R.' onboarding completed.", time: "3h ago" },
  { id: '5', text: "Invoice #INV-0012 paid by 'Solutions Co'.", time: "4h ago" },
  { id: '6', text: "Blog post 'Future of Remote Work' published.", time: "5h ago" },
];

const sampleTasks = [
  { id: 't1', title: "Draft blog post for Q3", status: "To Do", assignedTo: "Sarah K.", priority: "High" },
  { id: 't2', title: "Update client CRM records", status: "Doing", assignedTo: "John B.", priority: "Medium" },
  { id: 't3', title: "Prepare weekly analytics report", status: "Done", assignedTo: "Alice M.", priority: "Medium" },
  { id: 't4', title: "Schedule follow-up calls with new leads", status: "To Do", assignedTo: "David L.", priority: "Low" },
  { id: 't5', title: "Design social media graphics for campaign", status: "Doing", assignedTo: "Sarah K.", priority: "High" },
  { id: 't6', title: "Finalize Q2 financial summary", status: "To Do", assignedTo: "Admin", priority: "Urgent" },
];

const sampleVAs = [
  { id: 'va1', name: "Jane Doe", avatarFallback: "JD", online: true, completionRate: 92, satisfaction: 4.8, currentTask: "Social Media Posts for Client X" },
  { id: 'va2', name: "John Smith", avatarFallback: "JS", online: false, completionRate: 88, satisfaction: 4.5, currentTask: "Client Outreach & Follow-ups" },
  { id: 'va3', name: "Alice Brown", avatarFallback: "AB", online: true, completionRate: 95, satisfaction: 4.9, currentTask: "Report Generation for Project Y" },
  { id: 'va4', name: "Mike Ross", avatarFallback: "MR", online: true, completionRate: 90, satisfaction: 4.6, currentTask: "Calendar Management for Exec Team" },
];

const sampleClientActivity = [
  { id: 'c1', name: "Innovatech Ltd.", activeRequests: 5, status: "Active" },
  { id: 'c2', name: "Solutions Co.", activeRequests: 3, status: "Active" },
  { id: 'c3', name: "Beta Services", activeRequests: 1, status: "Flagged: Unresponsive" },
  { id: 'c4', name: "Alpha Corp", activeRequests: 8, status: "Active" },
];

const sampleWorkflows = [
  { id: 'wf1', name: "New Client Onboarding Flow", description: "Standard procedure for new clients." },
  { id: 'wf2', name: "Monthly Reporting Template", description: "Template for VA performance reports." },
  { id: 'wf3', name: "Social Media Content Calendar Setup", description: "Workflow for initiating SMM for clients." },
];

const sampleAlerts = [
  { id: 'al1', text: "VA 'Emily White' has 5 overdue tasks.", level: "High" },
  { id: 'al2', text: "Task 'Project Proposal - Alpha' stuck in 'Review' for 4 days.", level: "Medium" },
  { id: 'al3', text: "Email automation sequence 'Welcome Series' has a 5% error rate.", level: "System" },
  { id: 'al4', text: "Client 'Beta Services' payment overdue by 7 days.", level: "High" },
];

const sampleNotifications = [
    { id: 'n1', text: "Task 'Monthly Report - Client X' is overdue by 2 days.", type: "Overdue", priority: "High", time: "1h ago" },
    { id: 'n2', text: "New task 'Website Update - Phase 2' assigned to VA 'Laura P'.", type: "New Task", priority: "Medium", time: "3h ago" },
    { id: 'n3', text: "VA 'Tom B.' has marked 'Client Onboarding - Zed Corp' as complete.", type: "Info", priority: "Low", time: "5h ago" },
    { id: 'n4', text: "System Alert: Email server connection timed out. Retrying...", type: "System", priority: "High", time: "15m ago"},
    { id: 'n5', text: "Client 'Innovatech Ltd.' sent a new message regarding Project Titan.", type: "Client", priority: "Medium", time: "30m ago"},
];

const sampleAiSuggestions = [
    {id: 's1', text: "Consider assigning 'Market Research - Q4' to VA 'Anna S.' based on her recent performance in similar tasks.", category: "Task Assignment"},
    {id: 's2', text: "The 'Client Feedback Collection' workflow could be optimized by adding an automated follow-up email step.", category: "Workflow Optimization"},
    {id: 's3', text: "3 new unassigned tasks in 'Graphic Design'. Auto-distribute based on current VA workload?", category: "Task Distribution"},
    {id: 's4', text: "VA 'John Smith' has low availability next week. Proactively reassign critical tasks.", category: "Workload Balancing"},
];

const AdminDashboardPage: FC = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Middle Section: Primary Workspace */}
      <div className="flex-grow lg:w-2/3 space-y-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Admin Dashboard</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-accent" />Today’s Snapshot</CardTitle>
            <CardDescription>Recent activities and important updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              <ul className="space-y-3">
                {sampleActivityFeed.map(item => (
                  <li key={item.id} className="flex items-center justify-between text-sm pr-3">
                    <span className="text-foreground/90">{item.text}</span>
                    <span className="text-muted-foreground">{item.time}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
          <CardFooter>
             <Button variant="outline" size="sm" disabled>View Full Activity Log</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-accent" />Quick Task Manager</CardTitle>
            <CardDescription>Overview of current tasks. Full Kanban board coming soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-3 pr-3">
                {sampleTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-medium text-primary">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {task.assignedTo} - Priority: <span className={cn(task.priority === "High" && "text-destructive font-semibold", task.priority === "Urgent" && "text-destructive font-bold", task.priority === "Medium" && "text-yellow-600 font-medium")}>{task.priority}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        task.status === "To Do" ? "outline" : task.status === "Doing" ? "secondary" : "default"
                      }>
                        {task.status}
                      </Badge>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>Mark as Done</DropdownMenuItem>
                              <DropdownMenuItem disabled>Edit Task</DropdownMenuItem>
                              <DropdownMenuItem disabled>Reassign</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" disabled>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Button variant="outline" size="sm" disabled>View All Tasks</Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" disabled><PlusCircle className="mr-2 h-4 w-4"/>New Task</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Task Title" />
                        <Textarea placeholder="Task Description" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button disabled>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-accent" />VAs Status</CardTitle>
            <CardDescription>Overview of your Virtual Assistants.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-3">
                {sampleVAs.map(va => (
                  <Card key={va.id} className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar>
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${va.avatarFallback}`} alt={va.name} data-ai-hint="professional headshot" />
                        <AvatarFallback>{va.avatarFallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-primary">{va.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Circle className={cn("h-2 w-2 mr-1.5", va.online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400")} />
                          {va.online ? "Online" : "Offline"}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs space-y-1 mb-3 text-foreground/80">
                      <p className="flex items-center"><BarChart2 className="mr-1.5 h-3 w-3 text-blue-500"/>Completion: {va.completionRate}%</p>
                      <p className="flex items-center"><CheckCircleIcon className="mr-1.5 h-3 w-3 text-yellow-500"/>Satisfaction: {va.satisfaction}/5</p>
                      <p className="truncate" title={va.currentTask}><ClipboardList className="mr-1.5 h-3 w-3 text-purple-500 inline"/>Current: {va.currentTask}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" disabled>Assign Task</Button>
                      <Button variant="ghost" size="sm" className="flex-1" disabled>Message</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm" disabled>View All VAs</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-accent" />Client Activity</CardTitle>
            <CardDescription>Snapshot of client interactions and statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              <div className="space-y-2 pr-3">
                {sampleClientActivity.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="font-medium text-primary">{client.name}</p>
                      <p className="text-xs text-muted-foreground">Active Requests: {client.activeRequests}</p>
                    </div>
                    <div className="flex items-center gap-2">
                    {client.status.startsWith("Flagged") ? (
                        <Badge variant="destructive" className="text-xs">{client.status}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{client.status}</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled><Eye className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" disabled>View All Clients</Button>
            <Button size="sm" disabled>Onboard New Client</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Pin className="mr-2 h-5 w-5 text-accent" />Pinned Workflows & Templates</CardTitle>
            <CardDescription>Quick access to frequently used processes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              <div className="space-y-2 pr-3">
                {sampleWorkflows.map(flow => (
                    <div key={flow.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                        <div>
                            <p className="font-medium text-primary">{flow.name}</p>
                            <p className="text-xs text-muted-foreground">{flow.description}</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>Deploy</Button>
                    </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
             <Button variant="outline" size="sm" disabled>Manage Workflows</Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertCircle className="mr-2 h-5 w-5" />Alerts & Bottlenecks</CardTitle>
            <CardDescription className="text-destructive/80">Items requiring immediate attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              <div className="space-y-2 pr-3">
                {sampleAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start p-3 bg-destructive/10 rounded-md text-sm">
                        <AlertTriangle className={cn("h-4 w-4 mr-2 mt-0.5 shrink-0", alert.level === "High" ? "text-red-600" : "text-yellow-600")} />
                        <p className="text-destructive/90">{alert.text}</p>
                    </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm" disabled>View All Alerts</Button>
          </CardFooter>
        </Card>

      </div>

      {/* Right Panel: Utility/Assistance Zone */}
      <div className="lg:w-1/3 space-y-6 shrink-0">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><Bell className="mr-2 h-5 w-5 text-accent" /> Real-Time Notifications</CardTitle>
                <CardDescription>Sorted by importance. Filters coming soon.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled>
                                <Filter className="mr-1.5 h-3.5 w-3.5" /> Filter <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem>All</DropdownMenuItem>
                            <DropdownMenuItem>Tasks</DropdownMenuItem>
                            <DropdownMenuItem>VAs</DropdownMenuItem>
                            <DropdownMenuItem>System</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" className="text-xs" disabled>Mark all as read</Button>
                </div>
                <ScrollArea className="max-h-72">
                  <ul className="space-y-2.5 pr-3">
                      {sampleNotifications.map(item => (
                          <li key={item.id} className={cn(
                              "p-2.5 rounded-md text-sm border-l-4",
                              item.priority === "High" && "border-destructive bg-destructive/10",
                              item.priority === "Medium" && "border-yellow-500 bg-yellow-500/10",
                              item.priority === "Low" && "border-blue-500 bg-blue-500/10"
                          )}>
                              <div className="flex justify-between items-start">
                                  <p className="text-foreground/90 leading-tight">{item.text}</p>
                                  <Badge variant={
                                    item.type === "Overdue" ? "destructive" :
                                    item.type === "System" ? "secondary" :
                                    item.type === "Client" ? "outline" : // Added a variant for Client
                                    "outline"
                                  } className="text-xs ml-2 shrink-0">{item.type}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                          </li>
                      ))}
                      {sampleNotifications.length === 0 && <p className="text-muted-foreground text-center py-4">No new notifications.</p>}
                  </ul>
                </ScrollArea>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><MessageCircleChatIcon className="mr-2 h-5 w-5 text-accent" /> Internal Communication</CardTitle>
                <CardDescription>Threaded chat, DMs, channels. AI Assistant (soon).</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Full communication panel coming soon.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" disabled>Open Chat (Coming Soon)</Button>
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Settings2 className="mr-2 h-5 w-5 text-accent" /> Quick Tools & Shortcuts</CardTitle>
            <CardDescription>Frequently used actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start asChild">
              <Link href="/admin/clients/create" className="flex items-center w-full">
                <PlusCircle className="mr-2"/> Add New Client
              </Link>
            </Button>
             <Button variant="outline" className="w-full justify-start" disabled>
                <Workflow className="mr-2"/> Create Workflow Template
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
                <BookOpen className="mr-2"/> Run Audit Log Report
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
                <Zap className="mr-2"/> Toggle "Focus Mode"
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><BrainCircuit className="mr-2 h-5 w-5 text-accent" /> AI Suggestions Box</CardTitle>
                <CardDescription>Smart recommendations to optimize operations.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-72">
                  {sampleAiSuggestions.length > 0 ? (
                      <ul className="space-y-2.5 pr-3">
                          {sampleAiSuggestions.map(suggestion => (
                              <li key={suggestion.id} className="p-2.5 rounded-md bg-secondary/40 text-sm">
                                  <p className="text-foreground/90 leading-tight">{suggestion.text}</p>
                                  <Badge variant="outline" className="mt-1.5 text-xs">{suggestion.category}</Badge>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground">No AI suggestions at the moment.</p>
                  )}
                </ScrollArea>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-accent" disabled>View all suggestions</Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><CalendarDaysIcon className="mr-2 h-5 w-5 text-accent" /> Embedded Calendar / Upcoming</CardTitle>
                <CardDescription>Client meetings, VA time blocks.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Calendar
                    mode="single"
                    // selected={date} // Add state for selected date if needed
                    // onSelect={setDate} // Add handler if needed
                    className="rounded-md border shadow"
                />
            </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboardPage;

    