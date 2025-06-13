
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
import {
  Activity, Zap, Newspaper, Bell, ListChecks, ExternalLink, Users, Briefcase, Settings,
  ClipboardList, PlusCircle, UserCircle, Circle, BarChart2, MessageSquare, Flag, Eye, Pin, Workflow, AlertCircle, Clock, LogIn, LogOut, CheckCircle as CheckCircleIcon, AlertTriangle, Rocket, MoreHorizontal, Trash2, Edit3
} from 'lucide-react';
import Link from 'next/link';

// Sample data (replace with actual data fetching later)
const sampleActivityFeed = [
  { id: '1', icon: <LogIn className="text-green-500" />, text: "Client 'Acme Corp' logged in.", time: "2m ago" },
  { id: '2', icon: <CheckCircleIcon className="text-blue-500" />, text: "VA 'Jane D.' completed task 'Social Media Schedule'.", time: "15m ago" },
  { id: '3', icon: <AlertTriangle className="text-yellow-500" />, text: "Task 'Client Onboarding - Beta Inc.' deadline approaching.", time: "1h ago" },
  { id: '4', icon: <Rocket className="text-purple-500" />, text: "New VA 'Mike R.' onboarding completed.", time: "3h ago" },
];

const sampleTasks = [
  { id: 't1', title: "Draft blog post for Q3", status: "To Do", assignedTo: "Sarah K.", priority: "High" },
  { id: 't2', title: "Update client CRM records", status: "Doing", assignedTo: "John B.", priority: "Medium" },
  { id: 't3', title: "Prepare weekly analytics report", status: "Done", assignedTo: "Alice M.", priority: "Medium" },
  { id: 't4', title: "Schedule follow-up calls", status: "To Do", assignedTo: "David L.", priority: "Low" },
];

const sampleVAs = [
  { id: 'va1', name: "Jane Doe", avatarFallback: "JD", online: true, completionRate: 92, satisfaction: 4.8, currentTask: "Social Media Posts" },
  { id: 'va2', name: "John Smith", avatarFallback: "JS", online: false, completionRate: 88, satisfaction: 4.5, currentTask: "Client Outreach" },
  { id: 'va3', name: "Alice Brown", avatarFallback: "AB", online: true, completionRate: 95, satisfaction: 4.9, currentTask: "Report Generation" },
];

const sampleClientActivity = [
  { id: 'c1', name: "Innovatech Ltd.", activeRequests: 5, status: "Active" },
  { id: 'c2', name: "Solutions Co.", activeRequests: 3, status: "Active" },
  { id: 'c3', name: "Beta Services", activeRequests: 1, status: "Flagged: Unresponsive" },
];

const sampleWorkflows = [
  { id: 'wf1', name: "New Client Onboarding Flow", description: "Standard procedure for new clients." },
  { id: 'wf2', name: "Monthly Reporting Template", description: "Template for VA performance reports." },
];

const sampleAlerts = [
  { id: 'al1', text: "VA 'Emily White' has 5 overdue tasks.", level: "High" },
  { id: 'al2', text: "Task 'Project Proposal - Alpha' stuck in 'Review' for 4 days.", level: "Medium" },
  { id: 'al3', text: "Email automation sequence 'Welcome Series' has a 5% error rate.", level: "System" },
];


const AdminDashboardPage: FC = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Middle Section: Primary Workspace */}
      <div className="flex-grow lg:w-2/3 space-y-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Admin Dashboard</h1>
        
        {/* 1. Today’s Snapshot / Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-accent" />Today’s Snapshot</CardTitle>
            <CardDescription>Recent activities and important updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {sampleActivityFeed.map(item => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="mr-3 h-5 w-5">{item.icon}</span>
                    <span className="text-foreground/90">{item.text}</span>
                  </div>
                  <span className="text-muted-foreground">{item.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
             <Button variant="outline" size="sm">View Full Activity Log</Button>
          </CardFooter>
        </Card>

        {/* 2. Quick Task Manager */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-accent" />Quick Task Manager</CardTitle>
            <CardDescription>Overview of current tasks. Full Kanban board coming soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="font-medium text-primary">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Assigned to: {task.assignedTo} - Priority: <span className={cn(task.priority === "High" && "text-destructive", task.priority === "Medium" && "text-yellow-600")}>{task.priority}</span>
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
                            <DropdownMenuItem>Mark as Done</DropdownMenuItem>
                            <DropdownMenuItem>Edit Task</DropdownMenuItem>
                            <DropdownMenuItem>Reassign</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Button variant="outline" size="sm">View All Tasks</Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/>New Task</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Task Title" />
                        <Textarea placeholder="Task Description" />
                        {/* Add fields for assignment, priority, due date etc. */}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* 3. VAs Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-accent" />VAs Status</CardTitle>
            <CardDescription>Overview of your Virtual Assistants.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Button variant="outline" size="sm" className="flex-1">Assign Task</Button>
                  <Button variant="ghost" size="sm" className="flex-1">Message</Button>
                </div>
              </Card>
            ))}
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm">View All VAs</Button>
          </CardFooter>
        </Card>

        {/* 4. Client Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-accent" />Client Activity</CardTitle>
            <CardDescription>Snapshot of client interactions and statuses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
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
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-4 w-4"/></Button>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">View All Clients</Button>
            <Button size="sm">Onboard New Client</Button>
          </CardFooter>
        </Card>

        {/* 5. Pinned Workflows or Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Pin className="mr-2 h-5 w-5 text-accent" />Pinned Workflows & Templates</CardTitle>
            <CardDescription>Quick access to frequently used processes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             {sampleWorkflows.map(flow => (
                <div key={flow.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors">
                    <div>
                        <p className="font-medium text-primary">{flow.name}</p>
                        <p className="text-xs text-muted-foreground">{flow.description}</p>
                    </div>
                    <Button variant="outline" size="sm">Deploy</Button>
                </div>
             ))}
          </CardContent>
          <CardFooter>
             <Button variant="outline" size="sm">Manage Workflows</Button>
          </CardFooter>
        </Card>

        {/* 6. Alerts & Bottlenecks */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertCircle className="mr-2 h-5 w-5" />Alerts & Bottlenecks</CardTitle>
            <CardDescription className="text-destructive/80">Items requiring immediate attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sampleAlerts.map(alert => (
                 <div key={alert.id} className="flex items-start p-3 bg-destructive/10 rounded-md text-sm">
                    <AlertTriangle className={cn("h-4 w-4 mr-2 mt-0.5", alert.level === "High" ? "text-red-600" : "text-yellow-600")} />
                    <p className="text-destructive/90">{alert.text}</p>
                </div>
            ))}
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm">View All Alerts</Button>
          </CardFooter>
        </Card>

      </div>

      {/* Right Panel: Notifications, Updates, Quick Actions */}
      <div className="lg:w-1/3 space-y-6 shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Bell className="mr-2 h-5 w-5 text-accent" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No new notifications.</p>
            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-accent">View all</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-accent" /> Recent Activity (Log)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">New blog post "Intro to VAs" published.</li>
              <li className="text-muted-foreground">Client "Acme Corp" onboarded.</li>
              <li className="text-muted-foreground">Staff member "Jane Doe" updated profile.</li>
            </ul>
            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-accent">View full log</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Settings className="mr-2 h-5 w-5 text-accent" /> Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start asChild">
              <Link href="/admin/blog/create" className="flex items-center w-full">
                Create New Blog Post <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start asChild">
              <Link href="/admin/clients/create" className="flex items-center w-full">
                Add New Client <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start asChild">
              <Link href="/admin/staff/create" className="flex items-center w-full">
                Add New Staff <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
