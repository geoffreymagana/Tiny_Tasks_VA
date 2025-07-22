
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap } from 'lucide-react';

// Define the structure for an icon
interface ToolIcon {
  name: string;
  component: React.ReactNode;
  position: { top: string; left: string };
  size?: string;
}

// SVG components for each tool
const GmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

const GoogleDriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#28B257" d="M31.3 12L18 34.6 15.7 30.6 28.3 8z"></path><path fill="#4CAF50" d="M16.4,30.1l-6.9-12c-0.6-1-1.9-1.2-2.8-0.6l0,0c-1,0.6-1.2,1.9-0.6,2.8l6.9,12L16.4,30.1z"></path><path fill="#FFC107" d="M19.3 8.3L16.4 13.6 37.8 13.6c1.1 0 2 0.9 2 2 0 0.1 0 0.2 0 0.3L31.3 32.7 35.1 26.2c0.5-0.9 0.4-2.1-0.5-2.7l0 0C33.7 22.9 32.5 23 32 23.9L19.3 8.3z"></path>
    </svg>
);

const GoogleCalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <rect width="22" height="22" x="13" y="13" fill="#fff"></rect><polygon fill="#1e88e5" points="25.68,20.92 26.688,22.36 28.272,21.208 28.272,29.56 30,29.56 30,18.616 28.56,18.616"></polygon><path fill="#1e88e5" d="M22.943,23.745c0.625-0.574,1.013-1.37,1.013-2.249c0-1.747-1.533-3.168-3.417-3.168 c-1.602,0-2.972,1.009-3.33,2.453l1.657,0.421c0.165-0.664,0.868-1.146,1.673-1.146c0.942,0,1.709,0.646,1.709,1.44 c0,0.794-0.767,1.44-1.709,1.44h-0.997v1.728h0.997c1.081,0,1.993,0.751,1.993,1.64c0,0.904-0.866,1.64-1.931,1.64 c-0.962,0-1.784-0.61-1.914-1.418L17,26.802c0.262,1.636,1.81,2.87,3.6,2.87c2.007,0,3.64-1.511,3.64-3.368 C24.24,25.281,23.736,24.363,22.943,23.745z"></path><polygon fill="#fbc02d" points="34,42 14,42 13,38 14,34 34,34 35,38"></polygon><polygon fill="#4caf50" points="38,35 42,34 42,14 38,13 34,14 34,34"></polygon><path fill="#1e88e5" d="M34,14l1-4l-1-4H9C7.343,6,6,7.343,6,9v25l4,1l4-1V14H34z"></path><polygon fill="#e53935" points="34,34 34,42 42,34"></polygon><path fill="#1565c0" d="M39,6h-5v8h8V9C42,7.343,40.657,6,39,6z"></path><path fill="#1565c0" d="M9,42h5v-8H6v5C6,40.657,7.343,42,9,42z"></path>
    </svg>
);

const SlackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#2196F3" d="M22,14c0,1.105-0.895,2-2,2s-2-0.895-2-2s0.895-2,2-2S22,12.895,22,14z"></path><path fill="#2196F3" d="M20,26c-1.105,0-2,0.895-2,2s0.895,2,2,2s2-0.895,2-2S21.105,26,20,26z"></path><path fill="#4CAF50" d="M24,22c-1.105,0-2,0.895-2,2s0.895,2,2,2s2-0.895,2-2S25.105,22,24,22z"></path><path fill="#4CAF50" d="M36,20c-1.105,0-2,0.895-2,2s0.895,2,2,2s2-0.895,2-2S37.105,20,36,20z"></path><path fill="#FFC107" d="M14,24c-1.105,0-2,0.895-2,2s0.895,2,2,2s2-0.895,2-2S15.105,24,14,24z"></path><path fill="#FFC107" d="M28,34c0,1.105-0.895,2-2,2s-2-0.895-2-2s0.895-2,2-2S28,32.895,28,34z"></path><path fill="#F44336" d="M26,14c0,1.105-0.895,2-2,2s-2-0.895-2-2s0.895-2,2-2S26,12.895,26,14z"></path><path fill="#F44336" d="M14,28c-1.105,0-2,0.895-2,2s0.895,2,2,2s2-0.895,2-2S15.105,28,14,28z"></path><path fill="#2196F3" d="M28,24c1.105,0,2-0.895,2-2V12c0-3.313-2.687-6-6-6h-8c-3.313,0-6,2.687-6,6v8 c0,3.313,2.687,6,6,6h2C17.105,26,18,25.105,18,24s-0.895-2-2-2h-2c-1.105,0-2-0.895-2-2v-8c0-1.105,0.895-2,2-2h8 c1.105,0,2,0.895,2,2v2C26,17.105,26.895,18,28,18s2-0.895,2-2v-2c0-3.313-2.687-6-6-6h-8c-3.313,0-6,2.687-6,6v8c0,3.313,2.687,6,6,6 h10V24z"></path><path fill="#4CAF50" d="M24,28c-1.105,0-2,0.895-2,2v10c0,3.313,2.687,6,6,6h8c3.313,0,6-2.687,6-6v-8 c0-3.313-2.687-6-6-6h-2c1.105,0,2-0.895,2-2s-0.895-2-2-2h2c3.313,0,6,2.687,6,6v8c0,3.313-2.687,6-6,6h-8c-3.313,0-6-2.687-6-6 V30c0-1.105,0.895-2,2-2s2,0.895,2,2v10c0,1.105,0.895,2,2,2h8c1.105,0,2-0.895,2-2v-8c0-1.105-0.895-2-2-2H24z"></path><path fill="#FFC107" d="M20,28H10C6.687,28,4,30.687,4,34v8c0,3.313,2.687,6,6,6h8c3.313,0,6-2.687,6-6v-2 c0-1.105-0.895-2-2-2s-2,0.895-2,2v2c0,1.105-0.895,2-2,2h-8c-1.105,0-2-0.895-2-2v-8c0-1.105,0.895-2,2-2h2c1.105,0,2-0.895,2-2 S21.105,28,20,28z M24,38H14v-4h10V38z"></path><path fill="#F44336" d="M38,20v-8c0-3.313-2.687-6-6-6h-8c-3.313,0-6,2.687-6,6v2c0,1.105,0.895,2,2,2s2-0.895,2-2v-2 c0-1.105,0.895-2,2-2h8c1.105,0,2,0.895,2,2v8c0,1.105-0.895,2-2,2h-2c-1.105,0-2,0.895-2,2s0.895,2,2,2h2c3.313,0,6-2.687,6-6v-8 C44,23.313,41.313,20.687,38,20.687V20z"></path>
    </svg>
);

const MicrosoftTeamsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#5059c9" d="M44,22v8c0,3.314-2.686,6-6,6s-6-2.686-6-6V20h10C43.105,20,44,20.895,44,22z M38,16	c2.209,0,4-1.791,4-4c0-2.209-1.791-4-4-4s-4,1.791-4,4C34,14.209,35.791,16,38,16z"></path><path fill="#7b83eb" d="M35,22v11c0,5.743-4.841,10.356-10.666,9.978C19.019,42.634,15,37.983,15,32.657V20h18	C34.105,20,35,20.895,35,22z M25,17c3.314,0,6-2.686,6-6s-2.686-6-6-6s-6,2.686-6,6S21.686,17,25,17z"></path><circle cx="25" cy="11" r="6" fill="#7b83eb"></circle><path d="M26,33.319V20H15v12.657c0,1.534,0.343,3.008,0.944,4.343h6.374C24.352,37,26,35.352,26,33.319z" opacity=".05"></path><path d="M15,20v12.657c0,1.16,0.201,2.284,0.554,3.343h6.658c1.724,0,3.121-1.397,3.121-3.121V20H15z" opacity=".07"></path><path d="M24.667,20H15v12.657c0,0.802,0.101,1.584,0.274,2.343h6.832c1.414,0,2.56-1.146,2.56-2.56V20z" opacity=".09"></path><linearGradient id="DqqEodsTc8fO7iIkpib~Na_zQ92KI7XjZgR_gr1" x1="4.648" x2="23.403" y1="14.648" y2="33.403" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5961c3"></stop><stop offset="1" stop-color="#3a41ac"></stop></linearGradient><path fill="url(#DqqEodsTc8fO7iIkpib~Na_zQ92KI7XjZgR_gr1)" d="M22,34H6c-1.105,0-2-0.895-2-2V16c0-1.105,0.895-2,2-2h16c1.105,0,2,0.895,2,2v16	C24,33.105,23.105,34,22,34z"></path><path fill="#fff" d="M18.068,18.999H9.932v1.72h3.047v8.28h2.042v-8.28h3.047V18.999z"></path>
    </svg>
);

const TrelloIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#1E88E5" d="M6,10c0-2.2,1.8-4,4-4h28c2.2,0,4,1.8,4,4v28c0,2.2-1.8,4-4,4H10c-2.2,0-4-1.8-4-4V10z"></path><path fill="#FFF" d="M10,12.2c0-1.2,1-2.2,2.2-2.2h7.6c1.2,0,2.2,1,2.2,2.2v21.6c0,1.2-1,2.2-2.2,2.2h-7.6C11,36,10,35,10,33.8V12.2z M26,22.8c0,1.2,1,2.2,2.2,2.2h7.6c1.2,0,2.2-1,2.2-2.2V12.2c0-1.2-1-2.2-2.2-2.2h-7.6C27,10,26,11,26,12.2V22.8z"></path>
    </svg>
);

const NotionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 64 64">
        <path d="M 42.019531 4 C 41.350297 3.998125 40.569828 4.0454531 39.611328 4.1269531 L 8.3945312 6.4140625 C 5.8765313 6.6300625 5 8.2646562 5 10.222656 L 5 44.193359 C 5 45.718359 5.5463281 47.022625 6.8613281 48.765625 L 14.199219 58.238281 C 15.404219 59.762281 16.500734 60.089469 18.802734 59.980469 L 55.056641 57.800781 C 58.122641 57.585781 59 56.169391 59 53.775391 L 59 15.558594 C 59 14.251594 58.450641 13.926516 56.806641 12.728516 L 46.841797 5.7597656 C 45.035047 4.4547656 44.027234 4.005625 42.019531 4 z M 41.373047 6.9882812 C 43.348223 7.0202598 44.474406 7.7785 45.347656 8.453125 L 50.556641 12.201172 C 50.777641 12.311172 51.332016 12.970703 50.666016 12.970703 L 19.298828 14.845703 C 15.971828 15.067703 15.306156 15.176141 13.535156 13.744141 L 9.2128906 10.326172 C 8.7708906 9.8841719 8.9926094 9.3336094 10.099609 9.2246094 L 40.472656 7.0214844 C 40.791156 6.9939844 41.090879 6.9837129 41.373047 6.9882812 z M 53.671875 17.009766 C 54.582299 17.101627 55 17.84175 55 19.078125 L 55 51.304688 C 55 52.720687 54.7795 53.920344 52.8125 54.027344 L 18.839844 55.988281 C 16.872844 56.095281 16 55.442219 16 53.699219 L 16 21.257812 C 16 19.842813 16.437047 19.186125 17.748047 19.078125 L 53.251953 17.011719 C 53.402328 16.997969 53.541814 16.996643 53.671875 17.009766 z M 50 22.5 L 43 23 C 41.359 23.196 40.5 24 40.5 25 L 43.5 25.5 L 43.5 40.5 L 32 23.5 L 24.201172 24.1875 C 22.662172 24.3795 22.12375 25.7085 22.34375 26.6875 L 25 27 L 25 48 L 24 48.5 C 22 49 22.5 50 22.5 50.5 L 30.5 50 C 33 49.5 33 48 33 48 L 29 47 L 29 31 L 39.935547 47.970703 C 41.244547 49.599703 41.751 50.5 43.5 50.5 C 45 50.5 46.5 50 47.5 49 L 47.5 25 L 48.892578 24.732422 C 49.999578 24.500422 50.5 23.5 50 22.5 z"></path>
    </svg>
);


const tools: ToolIcon[] = [
    { name: "Tiny Tasks VA", component: <Zap className="text-accent" />, position: { top: '50%', left: '50%' }, size: 'h-16 w-16 p-3 md:h-20 md:w-20 md:p-4' },
    { name: "Gmail", component: <GmailIcon />, position: { top: '25%', left: '25%' } },
    { name: "Google Calendar", component: <GoogleCalendarIcon />, position: { top: '20%', left: '75%' } },
    { name: "Google Drive", component: <GoogleDriveIcon />, position: { top: '45%', left: '85%' } },
    { name: "Slack", component: <SlackIcon />, position: { top: '75%', left: '15%' } },
    { name: "Microsoft Teams", component: <MicrosoftTeamsIcon />, position: { top: '80%', left: '80%' } },
    { name: "Trello", component: <TrelloIcon />, position: { top: '55%', left: '5%' } },
    { name: "Notion", component: <NotionIcon />, position: { top: '85%', left: '45%' } },
];

export const ToolsShowcase = () => {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <TooltipProvider>
                <div className="relative h-96 md:h-[500px] w-full" aria-label="Interactive map of tools we master">
                    {/* Background SVG with dotted lines */}
                    <svg className="absolute top-0 left-0 w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="dotted-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1" fill="hsl(var(--border))" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dotted-grid)" opacity="0.5" />
                        {/* Static connecting lines based on icon positions */}
                        <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="75%" y2="20%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="85%" y2="45%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="15%" y2="75%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="5%" y2="55%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="45%" y2="85%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                    </svg>

                    {tools.map((tool) => (
                        <Tooltip key={tool.name}>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "absolute bg-card p-2 rounded-lg shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:shadow-xl hover:scale-110",
                                        tool.size || 'h-12 w-12 md:h-14 md:w-14'
                                    )}
                                    style={{ top: tool.position.top, left: tool.position.left }}
                                >
                                    {tool.component}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tool.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </div>
    );
};
