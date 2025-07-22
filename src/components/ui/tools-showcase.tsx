
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
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

const GoogleDriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M17 6L31 6 45 30 31 30z"></path><path fill="#1976D2" d="M9.875 42L16.938 30 45 30 38 42z"></path><path fill="#4CAF50" d="M3 30.125L9.875 42 24 18 17 6z"></path>
    </svg>
);

const GoogleCalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <rect width="22" height="22" x="13" y="13" fill="#fff"></rect><polygon fill="#1e88e5" points="25.68,20.92 26.688,22.36 28.272,21.208 28.272,29.56 30,29.56 30,18.616 28.56,18.616"></polygon><path fill="#1e88e5" d="M22.943,23.745c0.625-0.574,1.013-1.37,1.013-2.249c0-1.747-1.533-3.168-3.417-3.168 c-1.602,0-2.972,1.009-3.33,2.453l1.657,0.421c0.165-0.664,0.868-1.146,1.673-1.146c0.942,0,1.709,0.646,1.709,1.44 c0,0.794-0.767,1.44-1.709,1.44h-0.997v1.728h0.997c1.081,0,1.993,0.751,1.993,1.64c0,0.904-0.866,1.64-1.931,1.64 c-0.962,0-1.784-0.61-1.914-1.418L17,26.802c0.262,1.636,1.81,2.87,3.6,2.87c2.007,0,3.64-1.511,3.64-3.368 C24.24,25.281,23.736,24.363,22.943,23.745z"></path><polygon fill="#fbc02d" points="34,42 14,42 13,38 14,34 34,34 35,38"></polygon><polygon fill="#4caf50" points="38,35 42,34 42,14 38,13 34,14 34,34"></polygon><path fill="#1e88e5" d="M34,14l1-4l-1-4H9C7.343,6,6,7.343,6,9v25l4,1l4-1V14H34z"></path><polygon fill="#e53935" points="34,34 34,42 42,34"></polygon><path fill="#1565c0" d="M39,6h-5v8h8V9C42,7.343,40.657,6,39,6z"></path><path fill="#1565c0" d="M9,42h5v-8H6v5C6,40.657,7.343,42,9,42z"></path>
    </svg>
);

const SlackIcon = () => (
    <img width="48" height="48" src="https://img.icons8.com/external-tal-revivo-color-tal-revivo/50/external-slack-replace-email-text-messaging-and-instant-messaging-for-your-team-logo-color-tal-revivo.png" alt="Slack Icon"/>
);

const MicrosoftTeamsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#5059c9" d="M44,22v8c0,3.314-2.686,6-6,6s-6-2.686-6-6V20h10C43.105,20,44,20.895,44,22z M38,16	c2.209,0,4-1.791,4-4c0-2.209-1.791-4-4-4s-4,1.791-4,4C34,14.209,35.791,16,38,16z"></path><path fill="#7b83eb" d="M35,22v11c0,5.743-4.841,10.356-10.666,9.978C19.019,42.634,15,37.983,15,32.657V20h18	C34.105,20,35,20.895,35,22z M25,17c3.314,0,6-2.686,6-6s-2.686-6-6-6s-6,2.686-6,6S21.686,17,25,17z"></path><circle cx="25" cy="11" r="6" fill="#7b83eb"></circle><path d="M26,33.319V20H15v12.657c0,1.534,0.343,3.008,0.944,4.343h6.374C24.352,37,26,35.352,26,33.319z" opacity=".05"></path><path d="M15,20v12.657c0,1.16,0.201,2.284,0.554,3.343h6.658c1.724,0,3.121-1.397,3.121-3.121V20H15z" opacity=".07"></path><path d="M24.667,20H15v12.657c0,0.802,0.101,1.584,0.274,2.343h6.832c1.414,0,2.56-1.146,2.56-2.56V20z" opacity=".09"></path><linearGradient id="DqqEodsTc8fO7iIkpib~Na_zQ92KI7XjZgR_gr1" x1="4.648" x2="23.403" y1="14.648" y2="33.403" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#5961c3"></stop><stop offset="1" stopColor="#3a41ac"></stop></linearGradient><path fill="url(#DqqEodsTc8fO7iIkpib~Na_zQ92KI7XjZgR_gr1)" d="M22,34H6c-1.105,0-2-0.895-2-2V16c0-1.105,0.895-2,2-2h16c1.105,0,2,0.895,2,2v16	C24,33.105,23.105,34,22,34z"></path><path fill="#fff" d="M18.068,18.999H9.932v1.72h3.047v8.28h2.042v-8.28h3.047V18.999z"></path>
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

const CanvaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <linearGradient id="N8aMJ-jZ4-cfldZrsnvhda_iWw83PVcBpLw_gr1" x1="38.263" x2="10.15" y1="1373.62" y2="1342.615" gradientTransform="translate(0 -1333.89)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#823af3"></stop><stop offset=".36" stopColor="#4b66e1"></stop><stop offset=".906" stopColor="#01f1c4"></stop></linearGradient><path fill="url(#N8aMJ-jZ4-cfldZrsnvhda_iWw83PVcBpLw_gr1)" fillRule="evenodd" d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24	S12.955,4,24,4S44,12.955,44,24z" clipRule="evenodd"></path><path fill="#fff" fillRule="evenodd" d="M29.194,26.962c-0.835,0.915-2.007,1.378-2.556,1.378	c-0.635,0-0.982-0.389-1.053-0.974c-0.024-0.224-0.016-0.45,0.024-0.673c0.21-1.31,0.692-2.124,0.662-2.372	c-0.009-0.071-0.049-0.106-0.101-0.106c-0.406,0-1.83,1.47-2.046,2.443l-0.168,0.779c-0.11,0.549-0.648,0.902-1.018,0.902	c-0.177,0-0.311-0.088-0.334-0.283c-0.007-0.089,0-0.178,0.021-0.266l0.079-0.41c-0.768,0.574-1.596,0.962-1.984,0.962	c-0.53,0-0.827-0.283-0.933-0.709c-0.35,0.461-0.813,0.709-1.306,0.709c-0.63,0-1.237-0.417-1.528-1.034	c-0.415,0.466-0.907,0.922-1.496,1.299c-0.869,0.55-1.836,0.992-2.982,0.992c-1.058,0-1.956-0.566-2.453-1.026	c-0.737-0.69-1.126-1.718-1.241-2.656c-0.362-2.957,1.438-6.834,4.227-8.533c0.64-0.39,1.357-0.584,2.008-0.584	c1.34,0,2.34,0.958,2.48,2.104c0.126,1.032-0.286,1.924-1.431,2.501c-0.584,0.296-0.874,0.282-0.965,0.141	c-0.061-0.094-0.026-0.254,0.091-0.351c1.076-0.899,1.096-1.637,0.97-2.677c-0.082-0.669-0.522-1.098-1.016-1.098	c-2.115,0-5.149,4.745-4.727,8.197c0.165,1.346,0.99,2.904,2.682,2.904c0.564,0,1.162-0.159,1.694-0.425	c0.928-0.474,1.453-0.85,1.98-1.464c-0.13-1.596,1.24-3.6,3.278-3.6c0.882,0,1.612,0.354,1.698,1.062	c0.108,0.885-0.646,1.062-0.928,1.062c-0.247,0-0.643-0.071-0.671-0.301c-0.03-0.248,0.534-0.106,0.464-0.673	c-0.043-0.354-0.411-0.478-0.763-0.478c-1.269,0-1.97,1.77-1.835,2.869c0.061,0.496,0.315,0.991,0.774,0.991	c0.37,0,0.904-0.531,1.109-1.31c0.13-0.531,0.632-0.885,1.003-0.885c0.194,0,0.328,0.088,0.352,0.283	c0.008,0.071,0.002,0.16-0.021,0.266c-0.042,0.23-0.219,0.996-0.21,1.154c0.006,0.138,0.086,0.328,0.326,0.328	c0.19,0,0.89-0.378,1.538-0.958c0.203-1.051,0.454-2.351,0.474-2.454c0.079-0.426,0.232-0.865,1.096-0.865	c0.177,0,0.311,0.088,0.337,0.301c0.008,0.07,0.002,0.16-0.021,0.266l-0.242,1.093c0.758-1.01,1.936-1.752,2.642-1.752	c0.3,0,0.531,0.158,0.57,0.478c0.022,0.178-0.03,0.478-0.147,0.814c-0.251,0.69-0.533,1.727-0.72,2.62	c-0.04,0.19,0.026,0.476,0.373,0.476c0.277,0,1.166-0.339,1.885-1.288c-0.005-0.134-0.007-0.27-0.007-0.408	c0-0.744,0.053-1.346,0.194-1.787c0.141-0.461,0.723-0.902,1.11-0.902c0.194,0,0.335,0.106,0.335,0.318	c0,0.071-0.018,0.16-0.053,0.248c-0.264,0.779-0.405,1.506-0.405,2.231c0,0.407,0.088,1.062,0.177,1.398	c0.018,0.071,0.034,0.142,0.105,0.142c0.123,0,0.952-0.814,1.551-1.806c-0.53-0.337-0.829-0.956-0.829-1.718	c0-1.274,0.758-1.93,1.498-1.93c0.582,0,1.11,0.425,1.11,1.274c0,0.532-0.212,1.134-0.51,1.718c0,0,0.123,0.018,0.176,0.018	c0.458,0,0.811-0.213,1.006-0.443c0.088-0.1,0.17-0.178,0.248-0.224c0.59-0.713,1.455-1.228,2.47-1.228	c0.864,0,1.61,0.337,1.696,1.045c0.11,0.902-0.661,1.08-0.926,1.08c-0.264,0-0.661-0.071-0.689-0.301s0.551-0.106,0.484-0.654	c-0.043-0.354-0.413-0.496-0.766-0.496c-1.182,0-1.994,1.576-1.838,2.85c0.062,0.514,0.299,1.01,0.758,1.01	c0.37,0,0.923-0.532,1.127-1.31c0.131-0.514,0.632-0.885,1.002-0.885c0.176,0,0.328,0.088,0.354,0.301	c0.013,0.106-0.03,0.337-0.227,1.168c-0.081,0.354-0.097,0.655-0.066,0.903c0.063,0.514,0.298,0.85,0.516,1.045	c0.079,0.07,0.126,0.158,0.132,0.213c0.017,0.142-0.091,0.266-0.267,0.266c-0.053,0-0.123,0-0.181-0.035	c-0.908-0.372-1.285-0.991-1.391-1.576c-0.35,0.442-0.814,0.69-1.29,0.69c-0.811,0-1.603-0.709-1.715-1.629	c-0.046-0.378-0.001-0.785,0.123-1.184c-0.329,0.203-0.683,0.316-1.001,0.316c-0.106,0-0.194,0-0.299-0.018	c-0.793,1.15-1.622,1.947-2.257,2.302c-0.264,0.142-0.51,0.213-0.687,0.213c-0.142,0-0.3-0.035-0.37-0.159	C29.367,27.91,29.258,27.474,29.194,26.962L29.194,26.962z M32.067,23.191c0,0.496,0.246,1.01,0.564,1.346	c0.124-0.337,0.194-0.673,0.194-1.01c0-0.638-0.247-0.921-0.441-0.921C32.155,22.606,32.067,22.926,32.067,23.191z" clipRule="evenodd"></path>
    </svg>
);

const GoogleSheetsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <path fill="#169154" d="M29,6H15.744C14.781,6,14,6.781,14,7.744v7.259h15V6z"></path><path fill="#18482a" d="M14,33.054v7.202C14,41.219,14.781,42,15.743,42H29v-8.946H14z"></path><path fill="#0c8045" d="M14 15.003H29V24.005000000000003H14z"></path><path fill="#17472a" d="M14 24.005H29V33.055H14z"></path><g><path fill="#29c27f" d="M42.256,6H29v9.003h15V7.744C44,6.781,43.219,6,42.256,6z"></path><path fill="#27663f" d="M29,33.054V42h13.257C43.219,42,44,41.219,44,40.257v-7.202H29z"></path><path fill="#19ac65" d="M29 15.003H44V24.005000000000003H29z"></path><path fill="#129652" d="M29 24.005H44V33.055H29z"></path></g><path fill="#0c7238" d="M22.319,34H5.681C4.753,34,4,33.247,4,32.319V15.681C4,14.753,4.753,14,5.681,14h16.638 C23.247,14,24,14.753,24,15.681v16.638C24,33.247,23.247,34,22.319,34z"></path><path fill="#fff" d="M9.807 19L12.193 19 14.129 22.754 16.175 19 18.404 19 15.333 24 18.474 29 16.123 29 14.013 25.07 11.912 29 9.526 29 12.719 23.982z"></path>
    </svg>
);

const ZoomIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="#2196f3"></circle><path fill="#fff" d="M29,31H14c-1.657,0-3-1.343-3-3V17h15c1.657,0,3,1.343,3,3V31z"></path><polygon fill="#fff" points="37,31 31,27 31,21 37,17"></polygon>
    </svg>
);

const HubSpotIcon = () => (
    <img width="48" height="48" src="https://img.icons8.com/external-tal-revivo-color-tal-revivo/50/external-hubspot-a-developer-and-marketer-of-software-products-logo-color-tal-revivo.png" alt="Hubspot Icon"/>
);

const ZapierIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
        <linearGradient id="GNQpwzhk_IbsYQlQWcRHKa_2VvIzr7C1BEv_gr1" x1="24" x2="24" y1="3.369" y2="44.815" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fc7d5b"></stop><stop offset=".06" stopColor="#f8734f"></stop><stop offset=".18" stopColor="#f3653d"></stop><stop offset=".326" stopColor="#f05b31"></stop><stop offset=".523" stopColor="#ee552a"></stop><stop offset="1" stopColor="#ed5328"></stop></linearGradient><path fill="url(#GNQpwzhk_IbsYQlQWcRHKa_2VvIzr7C1BEv_gr1)" d="M29,24.009c0.001,1.442-0.259,2.873-0.768,4.223C26.882,28.74,25.451,29,24.008,29h-0.017	c-1.486-0.002-2.909-0.273-4.222-0.769C19.26,26.882,19,25.451,19,24.009v-0.017c-0.001-1.442,0.259-2.872,0.767-4.222	c1.35-0.509,2.781-0.77,4.224-0.769h0.017c1.443-0.001,2.874,0.26,4.224,0.769c0.509,1.349,0.769,2.78,0.768,4.222L29,24.009	L29,24.009z M32.048,20.667l7.639-7.64c0.353-0.353,0.402-0.919,0.095-1.313c-0.508-0.652-1.056-1.272-1.641-1.857V9.856	c-0.585-0.584-1.205-1.131-1.856-1.639c-0.393-0.307-0.96-0.257-1.313,0.095l-7.64,7.64V5.148c0-0.499-0.366-0.934-0.861-0.996	C25.655,4.051,24.833,4,24.01,4h-0.021c-0.834,0-1.656,0.053-2.463,0.153c-0.495,0.061-0.86,0.496-0.86,0.995v10.805l-7.64-7.64	c-0.353-0.353-0.919-0.402-1.313-0.095c-0.651,0.508-1.271,1.056-1.855,1.64L9.855,9.861c-0.583,0.584-1.13,1.203-1.637,1.853	c-0.307,0.393-0.258,0.96,0.095,1.313l7.64,7.64H5.17c-0.51,0-0.939,0.382-0.994,0.889C4.096,22.294,4,23.327,4,23.993v0.014	c0,0.836,0.052,1.659,0.153,2.467c0.061,0.495,0.497,0.859,0.995,0.859h10.805l-7.64,7.64c-0.353,0.353-0.402,0.92-0.095,1.313	c1.017,1.305,2.192,2.479,3.496,3.496c0.393,0.307,0.96,0.258,1.313-0.095l7.64-7.64v10.805c0,0.499,0.366,0.934,0.861,0.996	c0.815,0.101,1.636,0.152,2.457,0.152h0.028c0.822-0.001,1.642-0.052,2.458-0.152c0.495-0.061,0.861-0.497,0.861-0.996V32.047	l7.641,7.641c0.353,0.353,0.919,0.402,1.313,0.095c0.651-0.508,1.271-1.055,1.856-1.639l0.002-0.002	c0.584-0.585,1.131-1.204,1.639-1.856c0.307-0.393,0.258-0.96-0.095-1.313l-7.641-7.64h10.806c0.499,0,0.934-0.365,0.995-0.86	c0.1-0.806,0.151-1.626,0.152-2.459v-0.029c-0.001-0.833-0.053-1.653-0.152-2.459c-0.061-0.495-0.497-0.86-0.995-0.86L32.048,20.667	z"></path>
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
    { name: "Canva", component: <CanvaIcon />, position: { top: '10%', left: '50%' } },
    { name: "Google Sheets", component: <GoogleSheetsIcon />, position: { top: '30%', left: '5%' } },
    { name: "Zoom", component: <ZoomIcon />, position: { top: '15%', left: '10%' } },
    { name: "HubSpot", component: <HubSpotIcon />, position: { top: '70%', left: '95%' } },
    { name: "Zapier", component: <ZapierIcon />, position: { top: '90%', left: '65%' } },
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
                        <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="5%" y2="30%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="10%" y2="15%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="95%" y2="70%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
                        <line x1="50%" y1="50%" x2="65%" y2="90%" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4"/>
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
