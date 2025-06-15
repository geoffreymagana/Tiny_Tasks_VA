
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  FolderKanban, UploadCloud, FolderPlus, Search, List, LayoutGrid, MoreVertical,
  FileText, Folder, Image as ImageIcon, Video, Archive, Users, Clock, Star, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sample data - replace with actual data fetching later
const sampleFiles = [
  { id: '1', name: 'Project Proposal.pdf', type: 'file', icon: <FileText className="h-5 w-5 text-primary" />, size: '2.3 MB', lastModified: '2024-07-15', sharedWith: ['Jane D.'], isStarred: true },
  { id: '2', name: 'Client Onboarding Docs', type: 'folder', icon: <Folder className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />, size: '15 files', lastModified: '2024-07-14', sharedWith: [], isStarred: false },
  { id: '3', name: 'Marketing Campaign Assets', type: 'folder', icon: <Folder className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />, size: '32 files', lastModified: '2024-07-12', sharedWith: ['Marketing Team'], isStarred: true },
  { id: '4', name: 'Product Demo.mp4', type: 'file', icon: <Video className="h-5 w-5 text-blue-500" />, size: '128 MB', lastModified: '2024-07-10', sharedWith: [], isStarred: false },
  { id: '5', name: 'Website_Hero_Banner.png', type: 'file', icon: <ImageIcon className="h-5 w-5 text-green-500" />, size: '5.1 MB', lastModified: '2024-07-09', sharedWith: [], isStarred: true },
  { id: '6', name: 'Archived Projects Q1', type: 'folder', icon: <Archive className="h-5 w-5 text-gray-500 fill-gray-500/20" />, size: '5 folders', lastModified: '2024-06-30', sharedWith: [], isStarred: false },
];

const FileManagerPage: FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  // Placeholder for breadcrumbs
  const breadcrumbs = [{ name: 'Files', href: '#' }];

  const filteredFiles = sampleFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-4 space-y-2 shrink-0 sticky top-0 h-screen max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold text-primary px-2 pt-2 pb-1">File Manager</h3>
        <nav className="flex flex-col space-y-1">
          <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary hover:bg-muted">
            <FolderKanban className="mr-2 h-5 w-5 text-accent" /> My Files
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted">
            <Users className="mr-2 h-5 w-5" /> Shared with me
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted">
            <Clock className="mr-2 h-5 w-5" /> Recent
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-muted">
            <Star className="mr-2 h-5 w-5" /> Starred
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive/70 hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 h-5 w-5" /> Trash
          </Button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Card className="rounded-none border-0 border-b flex-shrink-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, index) => (
                  <span key={index}>
                    <Link href={crumb.href} className="hover:underline">{crumb.name}</Link>
                    {index < breadcrumbs.length - 1 && <span className="mx-1">/</span>}
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search files & folders..."
                    className="pl-8 w-full h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className="h-9 w-9"
                  >
                    <List className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className="h-9 w-9"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                </Button>
            </div>
          </CardHeader>
        </Card>
        
        <ScrollArea className="flex-grow p-4">
            {viewMode === 'list' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead> {/* Icon */}
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Size</TableHead>
                    <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="px-2 py-2 w-10">{file.icon}</TableCell>
                      <TableCell className="font-medium py-2 truncate max-w-xs sm:max-w-sm md:max-w-md" title={file.name}>{file.name}</TableCell>
                      <TableCell className="text-muted-foreground py-2 hidden sm:table-cell">{file.size}</TableCell>
                      <TableCell className="text-muted-foreground py-2 hidden md:table-cell">{file.lastModified}</TableCell>
                      <TableCell className="text-right py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Download</DropdownMenuItem>
                            <DropdownMenuItem disabled>Rename</DropdownMenuItem>
                            <DropdownMenuItem disabled>Move</DropdownMenuItem>
                            <DropdownMenuItem disabled>{file.isStarred ? 'Unstar' : 'Star'}</DropdownMenuItem>
                            <DropdownMenuItem disabled>Share</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="group relative aspect-[4/3] flex flex-col items-center justify-center p-3 hover:shadow-lg transition-shadow cursor-pointer text-center">
                    <div className="text-4xl mb-2 text-muted-foreground group-hover:text-primary transition-colors">{file.icon}</div>
                    <p className="text-sm font-medium truncate w-full" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem disabled>Download</DropdownMenuItem>
                         <DropdownMenuItem disabled>Rename</DropdownMenuItem>
                         <DropdownMenuItem disabled>Move</DropdownMenuItem>
                         <DropdownMenuItem disabled>{file.isStarred ? 'Unstar' : 'Star'}</DropdownMenuItem>
                         <DropdownMenuItem disabled>Share</DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled>Delete</DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </Card>
                ))}
              </div>
            )}
            {filteredFiles.length === 0 && (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center h-full">
                <FolderKanban className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                <p className="text-lg">No files or folders found.</p>
                {searchTerm && <p className="text-sm">Try adjusting your search or clear the filter.</p>}
                 <Button variant="outline" size="sm" className="mt-4" disabled>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Your First File
                </Button>
              </div>
            )}
        </ScrollArea>
      </main>
    </div>
  );
};

export default FileManagerPage;
