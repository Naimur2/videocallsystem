# MediaSoup Video Call Application - AI Coding Instructions

## Architecture Overview

This is a **real-time multi-party video calling application** built with MediaSoup WebRTC, featuring microservices architecture:

- **Frontend**: Next.js 15.5.2 + React 19 + TypeScript (Port 3000)
- **Backend**: Express.js + MediaSoup WebRTC + Socket.IO (Port 3001)
- **Database**: PostgreSQL + Redis for session management
- **Infrastructure**: Docker Compose + Nginx reverse proxy + COTURN server

## Key Components & Data Flow

### 1. MediaSoup WebRTC Architecture
- **Backend**: `videocallbackend/src/services/mediasoupService.ts` manages MediaSoup workers, routers, and transports
- **Frontend**: `videocall/src/services/mediaSoupClientService.ts` handles client-side MediaSoup device initialization
- **Configuration**: `videocallbackend/src/config/mediasoup.ts` defines codecs (VP8, VP9, H.264, Opus) and transport settings
- **Flow**: Router → Transports → Producers/Consumers → Real-time media streams

### 2. Real-time Communication Pattern
- **Socket Service**: `videocallbackend/src/services/socketService.ts` (1156 lines) manages all WebRTC signaling
- **State Management**: `videocall/src/hooks/useVideoCallZustand.ts` with Zustand for client state
- **Pattern**: Socket events → MediaSoup operations → UI updates → Component re-renders

### 3. Component Architecture (Recently Modularized)
- **Main Page**: `videocall/src/app/meeting/[roomId]/page.tsx` (1067 lines) orchestrates the meeting experience
- **Modular Components**: 
  - `ChatSidebar.tsx` - Chat functionality
  - `MeetingHeader.tsx` - Room info and controls
  - `VideoGrid.tsx` - Video tile management
  - `EnhancedControlPanel.tsx` - Media controls
- **Pattern**: Large components split into focused, reusable modules following DRY principles

## Critical Developer Workflows

### Package Management
**ALWAYS use Bun** (not npm/yarn):
```bash
cd videocallbackend && bun install && bun run dev
cd videocall && bun install && bun run dev
```

### MediaSoup Development Pattern
1. **Backend First**: Start backend with `bun run dev` in `videocallbackend/`
2. **Worker Binary**: If MediaSoup fails, run `bun pm trust mediasoup` to allow postinstall scripts
3. **Port Management**: Backend uses ports 3001 + 10000-10100 (RTC range)
4. **Type Safety**: Import types from `mediasoup/node/lib/types` (NOT from Transport module)

### Environment Configuration
- **Ngrok/Cloudflare**: Use `satisfaction-budget-symbols-happens.trycloudflare.com` as default tunnel URL
- **TURN Server**: COTURN configuration in `coturn/turnserver.conf`
- **Cross-Origin**: Backend CORS configured for tunnel URLs in `docker-compose.yml`

### Docker Orchestration
```bash
# Full stack startup
.\start.ps1  # PowerShell script (Windows primary environment)

# Individual services
docker-compose up frontend backend postgres redis coturn nginx
```

## Project-Specific Patterns

### 1. Multi-Tab Session Management
- **Storage Pattern**: `videocall/src/lib/storage.ts` prevents duplicate user sessions
- **Cross-Tab Communication**: Uses localStorage events to detect conflicts
- **User Cleanup**: `videocall/src/lib/userCleanup.ts` manages session lifecycle

### 2. MediaSoup Error Handling
```typescript
// Pattern: Always check device initialization first
if (!this.device || !this.device.loaded) {
    throw new Error("MediaSoup device not initialized");
}

// Transport creation with proper error catching
const transport = await router.createWebRtcTransport(transportOptions);
```

### 3. Component State Pattern
- **Zustand Store**: Single source of truth for meeting state
- **Local State**: UI-specific state (modals, forms) stays in components
- **Effect Pattern**: Use `useEffect` for Socket.IO event listeners with proper cleanup

### 4. TypeScript Integration Points
- **Backend Types**: `videocallbackend/src/types/index.ts` defines Socket.IO events and room structures
- **Frontend Types**: `videocall/src/types/index.ts` mirrors backend types for type safety
- **MediaSoup Types**: Import from official MediaSoup type definitions, avoid internal modules

## File Organization Rules

### Naming Conventions
- **Components**: PascalCase (e.g., `MeetingHeader.tsx`, `ChatSidebar.tsx`)
- **Services**: camelCase with descriptive names (e.g., `mediasoupService.ts`, `socketService.ts`)
- **Hooks**: `use` prefix (e.g., `useVideoCallZustand.ts`, `useDeviceCheck.ts`)

### Import Organization
```typescript
// 1. External libraries first
import { Server } from "socket.io";
import * as mediasoupClient from "mediasoup-client";

// 2. Internal types and services
import { ClientToServerEvents } from "../types";
import mediasoupServiceInstance from "./mediasoupService";

// 3. React/Next.js imports last (frontend only)
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
```

### Critical Dependencies
- **MediaSoup**: Handles WebRTC transport - requires worker binary compilation
- **Socket.IO**: Real-time signaling between frontend/backend
- **Zustand**: Lightweight state management (preferred over Redux)
- **Next.js 15.5.2**: Uses App Router (not Pages Router)

## Common Gotchas

1. **MediaSoup Worker**: Windows requires trusted postinstall scripts - run `bun pm trust mediasoup`
2. **Port Conflicts**: Check for running processes on 3000/3001/5432/6379 before startup
3. **Transport Protocol**: Use string literals ("udp"/"tcp") instead of TransportProtocol enum
4. **Component Separation**: Recently refactored - avoid duplicate functionality between main page and modular components
5. **Docker Networking**: Services communicate via container names (e.g., `postgres:5432`, `redis:6379`)

## Testing & Debugging

- **Backend**: Extensive logging in socket service with participant tracking
- **Frontend**: Enhanced video tiles with debug overlays and connection status
- **Multi-tab**: Use `DEBUG_MULTI_TAB.md` for testing cross-tab scenarios
- **MediaSoup**: Check worker logs for WebRTC transport issues

Focus on maintaining the modular component architecture while ensuring MediaSoup WebRTC functionality remains robust across all browsers and network conditions.
