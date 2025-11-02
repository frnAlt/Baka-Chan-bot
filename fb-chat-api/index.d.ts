/**
 * TypeScript definitions for FCA adapted for GoatBot-V2
 */

declare module 'fca-goatbot-adapted' {
    export interface Credentials {
        appState?: any[];
        email?: string;
        password?: string;
    }

    export interface LoginOptions {
        selfListen?: boolean;
        listenEvents?: boolean;
        listenTyping?: boolean;
        updatePresence?: boolean;
        forceLogin?: boolean;
        autoMarkDelivery?: boolean;
        autoMarkRead?: boolean;
        autoReconnect?: boolean;
        online?: boolean;
        emitReady?: boolean;
        userAgent?: string;
        pauseLog?: boolean;
        logLevel?: string;
        logRecordSize?: number;
        pageID?: string;
        proxy?: string;
    }

    export interface Attachment {
        type: string;
        url?: string;
        filename?: string;
        [key: string]: any;
    }

    export interface Message {
        body?: string;
        attachment?: Attachment | Attachment[];
        url?: string;
        sticker?: string;
        emoji?: string;
        emojiSize?: string;
        mentions?: Array<{ tag: string; id: string }>;
        [key: string]: any;
    }

    export interface MessageEvent {
        type: string;
        threadID: string;
        messageID: string;
        senderID: string;
        body: string;
        attachments: Attachment[];
        mentions: any;
        timestamp: number;
        isGroup: boolean;
        participantIDs?: string[];
        [key: string]: any;
    }

    export interface ThreadInfo {
        threadID: string;
        threadName: string;
        participantIDs: string[];
        nicknames: { [id: string]: string };
        emoji: string;
        color: string;
        adminIDs: string[];
        approvalMode: boolean;
        imageSrc: string;
        [key: string]: any;
    }

    export interface UserInfo {
        id: string;
        name: string;
        firstName: string;
        vanity: string;
        thumbSrc: string;
        profileUrl: string;
        gender: number;
        type: string;
        isFriend: boolean;
        isBirthday: boolean;
        [key: string]: any;
    }

    export interface API {
        // Message functions
        sendMessage(message: string | Message, threadID: string, callback?: (err: any, messageInfo: any) => void): Promise<any>;
        sendMessage(message: string | Message, threadID: string, messageID: string, callback?: (err: any, messageInfo: any) => void): Promise<any>;
        
        // MQTT functions
        listenMqtt(callback: (err: any, event: MessageEvent) => void): any;
        sendMqttMessage(message: string | Message, threadID: string, callback?: (err: any, messageInfo: any) => void): Promise<any>;
        unsendMqttMessage(messageID: string, callback?: (err: any) => void): Promise<any>;
        setMessageReaction(reaction: string, messageID: string, callback?: (err: any) => void, forceCustomReaction?: boolean): Promise<any>;
        
        // Message management
        unsendMessage(messageID: string, callback?: (err: any) => void): Promise<any>;
        editMessage(text: string, messageID: string, callback?: (err: any) => void): Promise<any>;
        forwardAttachment(attachmentID: string, userOrUsers: string | string[], callback?: (err: any) => void): Promise<any>;
        
        // Thread management
        getThreadInfo(threadID: string, callback?: (err: any, info: ThreadInfo) => void): Promise<ThreadInfo>;
        getThreadHistory(threadID: string, amount: number, timestamp: number | null, callback?: (err: any, history: any[]) => void): Promise<any[]>;
        getThreadList(limit: number, timestamp: number | null, tags: string[], callback?: (err: any, threads: any[]) => void): Promise<any[]>;
        changeThreadColor(color: string, threadID: string, callback?: (err: any) => void): Promise<any>;
        changeThreadEmoji(emoji: string, threadID: string, callback?: (err: any) => void): Promise<any>;
        changeNickname(nickname: string, threadID: string, participantID: string, callback?: (err: any) => void): Promise<any>;
        setTitle(newTitle: string, threadID: string, callback?: (err: any) => void): Promise<any>;
        muteThread(threadID: string, muteSeconds: number, callback?: (err: any) => void): Promise<any>;
        
        // Group management
        createNewGroup(participantIDs: string[], groupTitle: string, callback?: (err: any, threadID: string) => void): Promise<string>;
        addUserToGroup(userID: string, threadID: string, callback?: (err: any) => void): Promise<any>;
        removeUserFromGroup(userID: string, threadID: string, callback?: (err: any) => void): Promise<any>;
        changeAdminStatus(threadID: string, adminIDs: string | string[], adminStatus: boolean, callback?: (err: any) => void): Promise<any>;
        changeGroupImage(image: any, threadID: string, callback?: (err: any) => void): Promise<any>;
        
        // User functions
        getUserInfo(ids: string | string[], callback?: (err: any, info: { [id: string]: UserInfo }) => void): Promise<{ [id: string]: UserInfo }>;
        getUserID(name: string, callback?: (err: any, users: any[]) => void): Promise<any[]>;
        getFriendsList(callback?: (err: any, friends: any[]) => void): Promise<any[]>;
        getCurrentUserID(): string;
        
        // Typing and presence
        sendTypingIndicator(threadID: string, callback?: (err: any) => void): Promise<any>;
        markAsDelivered(threadID: string, messageID: string, callback?: (err: any) => void): Promise<any>;
        markAsRead(threadID: string, callback?: (err: any) => void): Promise<any>;
        markAsSeen(callback?: (err: any) => void): Promise<any>;
        
        // Misc
        getAppState(): any[];
        setOptions(options: LoginOptions): void;
        logout(callback?: (err: any) => void): Promise<any>;
        
        [key: string]: any;
    }

    export type LoginCallback = (err: any, api?: API) => void;

    function login(credentials: Credentials, callback: LoginCallback): void;
    function login(credentials: Credentials, options: LoginOptions, callback: LoginCallback): void;

    export default login;
    export { login };
}
