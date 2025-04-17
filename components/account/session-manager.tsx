'use client';

import { useTransition, useState } from 'react'; // Added useState back
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { revokeSession } from '@/app/account/actions'; // Import server action
import { Loader2, Smartphone, Monitor } from 'lucide-react'; // Removed unused Globe
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Type for individual session prop (can be derived from server fetch)
type Session = {
    id: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    createdAt: Date;
    expiresAt: Date; // Added expiresAt
};

interface SessionManagerProps {
    sessions: Session[];
    currentSessionId?: string; // Optional: To identify/disable revoke for the current session
}

// Helper to parse user agent (basic example)
const parseUserAgent = (uaString: string | null | undefined) => {
    if (!uaString) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    // Very basic parsing - consider a library like 'ua-parser-js' for robust parsing
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop'; // Default assumption

    if (uaString.includes('Firefox')) browser = 'Firefox';
    else if (uaString.includes('Chrome') && !uaString.includes('Edg')) browser = 'Chrome';
    else if (uaString.includes('Safari') && !uaString.includes('Chrome')) browser = 'Safari';
    else if (uaString.includes('Edg')) browser = 'Edge';
    else if (uaString.includes('MSIE') || uaString.includes('Trident')) browser = 'Internet Explorer';

    if (uaString.includes('Windows')) os = 'Windows';
    else if (uaString.includes('Macintosh') || uaString.includes('Mac OS')) os = 'macOS';
    else if (uaString.includes('Linux')) os = 'Linux';
    else if (uaString.includes('Android')) { os = 'Android'; device = 'Mobile'; }
    else if (uaString.includes('iPhone') || uaString.includes('iPad')) { os = 'iOS'; device = 'Mobile'; }

    return { browser, os, device };
};

export default function SessionManager({ sessions, currentSessionId }: SessionManagerProps) {
    const [isPending, startTransition] = useTransition();
    // State to track which session revoke is pending
    const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

    const handleRevoke = (sessionId: string) => {
        setPendingSessionId(sessionId); // Mark this session as pending
        startTransition(async () => {
            const result = await revokeSession(sessionId);
            if (result.success) {
                toast.success(result.message || "Session revoked successfully!");
                // Revalidation happens via revalidatePath in the action,
                // so the parent component will refetch and pass updated sessions.
            } else {
                toast.error(result.message || "Failed to revoke session.");
            }
             setPendingSessionId(null); // Clear pending state regardless of outcome
        });
    };

    if (!sessions || sessions.length === 0) {
        return <p className="text-sm text-muted-foreground">No active sessions found.</p>;
    }

    return (
        <TooltipProvider>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Location (IP)</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => {
                        const { browser, os, device } = parseUserAgent(session.userAgent);
                        const isCurrent = session.id === currentSessionId;
                        const isRevokingCurrent = isPending && pendingSessionId === session.id;

                        return (
                            <TableRow key={session.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                         {device === 'Mobile' ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : <Monitor className="h-4 w-4 text-muted-foreground" />}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="font-medium truncate max-w-[150px]">{browser} on {os}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs max-w-[300px] break-words">{session.userAgent || 'No User Agent'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        {isCurrent && <Badge variant="outline">Current</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>{session.ipAddress ?? 'N/A'}</TableCell>
                                <TableCell>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             {/* Displaying expiresAt as 'Last Active' might be misleading.
                                                 Consider adding a 'lastUsedAt' field to the session schema
                                                 if more precise 'last active' time is needed.
                                                 Using createdAt as a proxy for now. */}
                                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                                            <p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>
                                <TableCell className="text-right">
                                    {!isCurrent && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRevoke(session.id)}
                                            disabled={isPending} // Disable all revoke buttons while any is pending
                                        >
                                            {isRevokingCurrent ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Revoking...
                                                </>
                                            ) : (
                                                "Revoke"
                                            )}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TooltipProvider>
    );
}