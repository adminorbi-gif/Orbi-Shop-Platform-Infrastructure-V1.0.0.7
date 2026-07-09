import { apiFetch } from "./db";

export async function fetchConversations(userId?: string, role?: string) {
    let url = '/api/v1/chat/conversations';
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    if (params.toString()) url += `?${params.toString()}`;
    
    try {
        const json = await apiFetch(url);
        return json?.data || [];
    } catch (e) {
        console.warn("fetchConversations error:", e);
        return [];
    }
}

export async function fetchMessages(conversationId: string) {
    try {
        const json = await apiFetch(`/api/v1/chat/conversations/${conversationId}/messages`);
        return json?.data || [];
    } catch (e) {
        console.warn("fetchMessages error:", e);
        return [];
    }
}

export async function startConversation(participants: any[]) {
    const json = await apiFetch(`/api/v1/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants })
    });
    return json?.data;
}

export async function sendChatMessage(conversationId: string, message: any) {
    const json = await apiFetch(`/api/v1/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
    });
    return json;
}
export async function markMessagesAsRead(conversationId: string, userId: string) {
    try {
        const json = await apiFetch(`/api/v1/chat/conversations/${conversationId}/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return json?.success;
    } catch (e) {
        console.warn("markMessagesAsRead error:", e);
        return false;
    }
}

export async function deleteConversationMessages(conversationId: string) {
    try {
        const json = await apiFetch(`/api/v1/chat/conversations/${conversationId}/messages`, {
            method: 'DELETE',
        });
        return json?.success;
    } catch (e) {
        console.warn("deleteConversationMessages error:", e);
        return false;
    }
}
