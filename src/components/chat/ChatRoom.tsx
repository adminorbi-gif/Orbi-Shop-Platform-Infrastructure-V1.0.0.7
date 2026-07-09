import React, { useState, useEffect, useRef, useMemo } from "react";
// UI: Chat Room
import { 
  Send, 
  User, 
  ShieldAlert, 
  Check, 
  CheckCheck, 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  Sparkles, 
  Tag, 
  ExternalLink, 
  Bot, 
  Info,
  Cpu,
  ShieldCheck,
  Lock,
  Trash, Zap, RefreshCw,
  Compass,
  Image,
  Smile,
  X,
  Menu
} from "lucide-react";
import { motion } from "motion/react";
import { ChatMessage, Conversation } from "../../types";
import { apiFetch } from "../../lib/db";
import { sendChatMessage, deleteConversationMessages } from "../../lib/chat";

export function ChatRoom({
  conversation,
  currentUserId,
  currentUserRole,
  messages,
  onSendMessage,
  isAdminPreview = false,
  isConnected = true,
  lang = "sw",
  products = [],
  hideHeader = false,
  askStaffAgent: askStaffAgentProp,
  setAskStaffAgent: setAskStaffAgentProp,
  onOpenMobileInbox,
  onDeleted,
  currentUserName,
}: {
  conversation: Conversation;
  currentUserId: string;
  currentUserRole: "customer" | "seller" | "admin";
  messages: ChatMessage[];
  onSendMessage: (content: string, customSender?: { senderId: string; senderRole: "customer" | "seller" | "admin"; senderName: string }) => void;
  isAdminPreview?: boolean;
  isConnected?: boolean;
  lang?: string;
  products?: any[];
  hideHeader?: boolean;
  askStaffAgent?: boolean;
  setAskStaffAgent?: (val: boolean) => void;
  onOpenMobileInbox?: () => void;
  onDeleted?: () => void;
  currentUserName?: string;
}) {
  const [inputText, setInputText] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  
  const [internalAskStaffAgent, setInternalAskStaffAgent] = useState(false);
  const askStaffAgent = askStaffAgentProp !== undefined ? askStaffAgentProp : internalAskStaffAgent;
  const setAskStaffAgent = setAskStaffAgentProp !== undefined ? setAskStaffAgentProp : setInternalAskStaffAgent;

  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New States for emoji picker, reactions, and image attachments
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<"smileys" | "gestures" | "hearts" | "trade">("smileys");

  const [unlockedAIUsers, setUnlockedAIUsers] = useState<string[]>([]);
  useEffect(() => {
    if (currentUserRole !== "admin") return;
    const fetchUnlockedUsers = async () => {
      try {
        const res = await fetch("/api/v1/ai/unlocked-ai");
        const data = await res.json();
        if (data.list) setUnlockedAIUsers(data.list);
      } catch (err) {
        console.warn(err);
      }
    };
    fetchUnlockedUsers();
  }, [currentUserRole]);

  const handleToggleAIOverride = async (customerId: string) => {
    try {
      const res = await fetch("/api/v1/ai/unlocked-ai/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (data.success) {
        setUnlockedAIUsers(data.list || []);
        alert(
          lang === "sw"
            ? "Msimbo wa kuruhusu AI bila kikomo umesasishwa!"
            : "Unlimited AI Lockout Override configured for customer!"
        );
      }
    } catch (err: any) {
      console.error(err);
      alert("Bypass toggle error: " + err.message);
    }
  };

  const handleResetAIQuota = (customerId: string) => {
    const countKey = `orbi_ai_count_${customerId}`;
    const timeKey = `orbi_ai_last_time_${customerId}`;
    localStorage.removeItem(countKey);
    localStorage.removeItem(timeKey);
    alert(
      lang === "sw"
        ? "Quota ya ujumbe 10 vya AI imewekwa upya kwa mteja huyu!"
        : "The 10-message AI quota has been successfully reset for this user!"
    );
  };


  const getOtherParticipant = () => {
    const rawParticipant = conversation.participants.find((p) => p.id !== currentUserId) || conversation.participants[0];
    if (rawParticipant) {
      if (rawParticipant.id === "support" || rawParticipant.name?.toLowerCase().includes("support")) {
        return {
          ...rawParticipant,
          name: "Orbi Shop Support Team",
          avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
        };
      }
      if (rawParticipant.id === "00000000-0000-0000-0000-000000000001" || rawParticipant.name?.toLowerCase().includes("orbi shop store") || rawParticipant.name?.toLowerCase().includes("orbi store")) {
        return {
          ...rawParticipant,
          name: "Orbi Shop Store",
          avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
        };
      }
    }
    return rawParticipant;
  };

  const otherParticipant = getOtherParticipant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const isAiAgentActive = !askStaffAgent && currentUserRole === "customer" && (otherParticipant?.id === "support" || otherParticipant?.id === "00000000-0000-0000-0000-000000000001");

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const showSuggestedReplies = lastMessage && lastMessage.senderId !== currentUserId && !isAiResponding && !isAdminPreview;

  const getAiUsageStats = () => {
    if (!currentUserId) return { count: 0, lastTime: 0 };
    const countKey = `orbi_ai_count_${currentUserId}`;
    const timeKey = `orbi_ai_last_time_${currentUserId}`;
    
    let count = parseInt(localStorage.getItem(countKey) || "0", 10);
    const lastTime = parseInt(localStorage.getItem(timeKey) || "0", 10);
    
    // If last chart was more than 4 hours ago, restore/reset counter
    if (lastTime > 0 && Date.now() - lastTime > 4 * 60 * 60 * 1000) {
      count = 0;
      localStorage.setItem(countKey, "0");
    }
    
    return { count, lastTime };
  };

  useEffect(() => {
    if (!currentUserId) return;
    const { count } = getAiUsageStats();
    if (count >= 10) {
      setAskStaffAgent(true);
    } else {
      setAskStaffAgent(false);
    }
  }, [currentUserId]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding]);

  // Handle click outside to close product tag autocomplete and emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products matching typing query
  const filteredProducts = useMemo(() => {
    if (!tagQuery) return products.slice(0, 6);
    return products
      .filter((p) => p.name.toLowerCase().includes(tagQuery))
      .slice(0, 6);
  }, [products, tagQuery]);

  // Auto-resize textarea height to fit content dynamically up to max-height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const partAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
      // Only show suggestions if there are no spaces or newlines in the part after '@' up to the cursor
      if (!partAfterAt.includes(" ") && !partAfterAt.includes("\n")) {
        setShowTagDropdown(true);
        setTagQuery(partAfterAt.toLowerCase());
        setSelectedTagIndex(0);
        return;
      }
    }
    setShowTagDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showTagDropdown && filteredProducts.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedTagIndex((prev) => (prev + 1) % filteredProducts.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedTagIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectProductTag(filteredProducts[selectedTagIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowTagDropdown(false);
      }
    } else {
      // Enter without Shift should send message, Shift + Enter creates a new line
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
      }
    }
  };

  const selectProductTag = (product: any) => {
    const selectionStart = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = inputText.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = inputText.slice(selectionStart);

    // Formatted clean product tag
    const tagText = `@${product.name} `;
    const newText = inputText.slice(0, lastAtIdx) + tagText + textAfterCursor;

    setInputText(newText);
    setShowTagDropdown(false);

    // Restore focus and position cursor elegantly
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = lastAtIdx + tagText.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // One-click AI response drafter for Co-pilot support
  const handleGenerateAiDraft = async () => {
    if (isDrafting) return;
    setIsDrafting(true);
    try {
      // Find the last message from the other participant
      const recentUserMessage = messages.length > 0
        ? [...messages].reverse().find((m) => m.senderId !== currentUserId)?.content || ""
        : "Habari! Naomba nisaidiwe kujua bidhaa bora kwangu.";

      const chatHistory = messages.slice(-5).map((m) => ({
        role: m.senderId === currentUserId ? "user" : "model",
        text: m.content
      }));

      const res = await apiFetch("/api/v1/ai/copilot-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerMessage: recentUserMessage,
          history: chatHistory,
          customInstruction: "Provide a direct, complete support draft in Kiswahili and English. Highly welcoming, professional and brief."
        })
      });

      if (res && res.success && res.suggestion) {
        setInputText(res.suggestion);
      }
    } catch (err) {
      console.warn("AI draft generation failure:", err);
    } finally {
      setIsDrafting(false);
    }
  };

  const [isFrozen, setIsFrozen] = useState(() => {
    return parseInt(localStorage.getItem(`orbi_scam_flags_${currentUserId}`) || "0", 10) > 3;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsFrozen(parseInt(localStorage.getItem(`orbi_scam_flags_${currentUserId}`) || "0", 10) > 3);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUserId]);

  const sendMessageText = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isAdminPreview || isFrozen) return;
    
    let processedText = textToSubmit.trim();

    // Auto-replace `@ProductName` with `@[ProductName](product:id)` in background
    if (products && products.length > 0) {
      const sortedProducts = [...products]
        .filter((p) => p && typeof p.name === "string")
        .sort((a, b) => b.name.length - a.name.length);
      for (const p of sortedProducts) {
        const escapedName = p.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Match @Name, case-insensitively, followed by boundary, whitespace or end
        const regex = new RegExp(`@${escapedName}(?=\\b|\\s|$)`, 'gi');
        processedText = processedText.replace(regex, `@[${p.name}](product:${p.id})`);
      }
    }

    // Submit user's message
    // If the server rejects it with a security error, ChatWidget will handle it. 
    // We can't await onSendMessage easily to set isFrozen here, but if the local storage gets updated by ChatWidget, we could.
    onSendMessage(processedText);

    // Trigger AI response if Auto-Pilot mode is active
    if (isAiAgentActive) {
      const { count } = getAiUsageStats();
      if (count >= 10) {
        setAskStaffAgent(true);
        const alertedKey = `orbi_ai_alerted_${currentUserId}`;
        if (!sessionStorage.getItem(alertedKey)) {
          sessionStorage.setItem(alertedKey, "true");
          onSendMessage(
            lang === "sw"
              ? "⚠️ Taarifa ya Mfumo: Mteja huyu ametumia kikomo cha maswali 10 ya AI ya leo. Mfumo umebadilika kuwa wa Ongea na Mhudumu sasa."
              : "⚠️ System Notification: Customer has reached the 10 daily AI limit. Pausing auto-AI replies and handing over to live Staff support.",
            {
              senderId: "system",
              senderRole: "admin",
              senderName: "Orbi System"
            }
          );
        }
        return;
      }

      setIsAiResponding(true);
      try {
        const chatHistory = messages.map((m) => ({
          role: m.senderId === currentUserId ? "user" : "model",
          text: m.content
        }));

        // Call our server-side inventory-aware assistant endpoint
        const aiResponse = await apiFetch("/api/v1/ai/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: processedText,
            history: chatHistory,
            customer: { id: currentUserId, name: "Customer" }
          })
        });

        if (aiResponse) {
          if (aiResponse.reply) {
            const countKey = `orbi_ai_count_${currentUserId}`;
            const timeKey = `orbi_ai_last_time_${currentUserId}`;
            const newCount = count + 1;
            localStorage.setItem(countKey, newCount.toString());
            localStorage.setItem(timeKey, Date.now().toString());

            // Deliver via centralized messaging system to ensure websocket broadcast and state updates
            onSendMessage(aiResponse.reply, {
              senderId: "orbi-ai-agent",
              senderRole: "admin",
              senderName: "Orbi AI Support"
            });
          }

          if (aiResponse.transferToLiveAgent) {
            setAskStaffAgent(true);
            onSendMessage(
              lang === "sw"
                ? "⚠️ Taarifa ya Mfumo: Nimekuhamisha kwa Mhudumu (Live Agent) kuendelea kukusaidia."
                : "⚠️ System Notification: Auto-transferred to a Live Agent for further assistance.",
              {
                senderId: "system",
                senderRole: "admin",
                senderName: "Orbi System"
              }
            );
          } else if (count + 1 >= 10 && aiResponse.reply) {
            setAskStaffAgent(true);
            onSendMessage(
              lang === "sw"
                ? "⚠️ Taarifa ya Mfumo: Mteja huyu ametumia kikomo cha maswali 10 ya AI ya leo. Mfumo umebadilika kuwa wa Ongea na Mhudumu sasa."
                : "⚠️ System Notification: Customer has reached the 10 daily AI limit. Pausing auto-AI replies and handing over to live Staff support.",
              {
                senderId: "system",
                senderRole: "admin",
                senderName: "Orbi System"
              }
            );
          }
        }
      } catch (err) {
        console.warn("AI Agent processing failure:", err);
      } finally {
        setIsAiResponding(false);
      }
    }
  };

  const getSuggestedReplies = (lastMessageContent: string) => {
    if (!lastMessageContent) return [];

    const text = lastMessageContent.toLowerCase();
    const suggestions: { labelEn: string; labelSw: string; text: string }[] = [];

    // 1. Safety & PaySafe
    if (text.includes("paysafe") || text.includes("salama") || text.includes("security") || text.includes("ulinzi") || text.includes("ulaghai") || text.includes("usilipe") || text.includes("safeguard")) {
      suggestions.push({
        labelEn: "🛡️ How does PaySafe work?",
        labelSw: "🛡️ PaySafe inafanyaje kazi?",
        text: "How does the Orbi PaySafe escrow system protect me from fraud?"
      });
      suggestions.push({
        labelEn: "🔒 Is it 100% secure?",
        labelSw: "🔒 Je, ni salama 100%?",
        text: "Is Orbi PaySafe fully secured for my online purchases?"
      });
    }

    // 2. Product context (if products are recommended, tagged, or mentioned)
    else if (text.includes("product") || text.includes("bidhaa") || text.includes("tsh") || text.includes("shilingi") || text.includes("p.") || text.includes("bei") || text.includes("price")) {
      suggestions.push({
        labelEn: "✨ Yes, show me more",
        labelSw: "✨ Ndiyo, nionyeshe zaidi",
        text: "Yes, please show me more details or specifications about these products."
      });
      suggestions.push({
        labelEn: "🔄 Do you have alternatives?",
        labelSw: "🔄 Kuna mbadala mwingine?",
        text: "Can you recommend some other alternative products with different prices?"
      });
      suggestions.push({
        labelEn: "🛍️ How do I add to cart?",
        labelSw: "🛍️ Jinsi ya kuweka kwenye kikapu?",
        text: "How can I add these products to my shopping cart and proceed?"
      });
    }

    // 3. Delivery / Pickup / Carrier / Kariakoo / Hubs
    else if (text.includes("delivery") || text.includes("usafiri") || text.includes("mzigo") || text.includes("carrier") || text.includes("point") || text.includes("kituo") || text.includes("kariakoo") || text.includes("posta") || text.includes("mbezi") || text.includes("arusha") || text.includes("locator")) {
      suggestions.push({
        labelEn: "📍 Where is the Kariakoo hub?",
        labelSw: "📍 Kituo cha Kariakoo kipo wapi?",
        text: "Can you guide me on where the Kariakoo pickup hub is located?"
      });
      suggestions.push({
        labelEn: "🚚 How much is delivery?",
        labelSw: "🚚 Gharama ya usafirishaji ni kiasi?",
        text: "What are the standard delivery rates and delivery options on Orbi?"
      });
      suggestions.push({
        labelEn: "📦 Track my order",
        labelSw: "📦 Fuatilia mzigo wako",
        text: "Can you help me track my package and see the active delivery status?"
      });
    }

    // 4. Rewards / Receipt / Loyalty
    else if (text.includes("reward") || text.includes("point") || text.includes("zawadi") || text.includes("risiti") || text.includes("scan") || text.includes("kupata")) {
      suggestions.push({
        labelEn: "🎁 Check my rewards balance",
        labelSw: "🎁 Angalia salio langu la zawadi",
        text: "How do I check my Orbi Rewards balance and loyalty points?"
      });
      suggestions.push({
        labelEn: "📸 How to scan a receipt?",
        labelSw: "📸 Jinsi ya kuskani risiti?",
        text: "Can you explain how I can scan my purchase receipt to earn reward points?"
      });
    }

    // Always include a human agent transition & a general inquiry if slots are available
    if (suggestions.length < 3) {
      suggestions.push({
        labelEn: "💬 Connect me to a human",
        labelSw: "💬 Ongea na mhudumu (binadamu)",
        text: "Habari, naomba kuunganishwa na mhudumu au muuzaji wa duka hili ili niongee na binadamu."
      });
    }
    if (suggestions.length < 3) {
      suggestions.push({
        labelEn: "🏷️ What are top recommended?",
        labelSw: "🏷️ Bidhaa bora za leo ni zipi?",
        text: "What are the top recommended or promoted products in the Orbi marketplace right now?"
      });
    }
    if (suggestions.length < 3) {
      suggestions.push({
        labelEn: "💳 Payment options?",
        labelSw: "💳 Mbinu za malipo?",
        text: "What are the secure payment options available on Orbi Shop?"
      });
    }

    return suggestions.slice(0, 3); // Return top 3 context-aware suggestions
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminPreview) return;
    
    let textToSubmit = inputText.trim();
    if (!textToSubmit && !attachedImageUrl) return;

    if (attachedImageUrl) {
      const imgMarkdown = `![attachment](${attachedImageUrl})`;
      if (textToSubmit) {
        textToSubmit = `${textToSubmit}\n${imgMarkdown}`;
      } else {
        textToSubmit = imgMarkdown;
      }
    }

    setInputText("");
    setAttachedImageUrl(null);
    setUploadError(null);
    await sendMessageText(textToSubmit);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(lang === "sw" ? "Picha ni kubwa mno. Kikomo ni 50MB." : "File is too large. Maximum size is 50MB.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chart_images");

      const response = await fetch("/api/v1/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data && data.success && data.publicUrl) {
        setAttachedImageUrl(data.publicUrl);
      } else {
        setUploadError(data.message || (lang === "sw" ? "Imeshindwa kupakia picha." : "Failed to upload image."));
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(lang === "sw" ? "Hitilafu imetokea wakati wa kupakia." : "An error occurred during upload.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const selectionStart = inputRef.current?.selectionStart || 0;
    const selectionEnd = inputRef.current?.selectionEnd || 0;
    const textBeforeCursor = inputText.slice(0, selectionStart);
    const textAfterCursor = inputText.slice(selectionEnd);
    const newText = textBeforeCursor + emoji + textAfterCursor;
    setInputText(newText);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = selectionStart + emoji.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  const emojiCategories = {
    smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
    gestures: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪"],
    hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💋", "🔥", "✨", "🌟", "⭐", "💥", "💯"],
    trade: ["📦", "🏷️", "💳", "🛒", "💰", "📈", "📉", "📊", "📋", "📅", "📌", "🔒", "🔑", "✉️", "💬", "💡"]
  };

  const handleDeleteAllMessages = async () => {
    if (isAdminPreview) return;
    setIsDeleting(true);
    try {
      const success = await deleteConversationMessages(conversation.id);
      if (success) {
        setShowDeleteConfirm(false);
        if (onDeleted) onDeleted();
      } else {
        alert(lang === "sw" ? "Imeshindwa kufuta historia ya ujumbe." : "Failed to delete message history.");
      }
    } catch (err) {
      console.error("Error clearing messages:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkResolved = () => {
    const resolverName = currentUserName || (currentUserRole === "admin" ? "Orbi Support" : "Seller Agent");
    
    // 1. Send resolution confirmation message from the staff profile
    const logMsg = lang === "sw" 
      ? `✅ Soga imewezwa kama Imesuluhishwa na mhudumu: ${resolverName}`
      : `✅ Live chat has been marked as Resolved by staff: ${resolverName}`;
    
    onSendMessage(logMsg);

    // 2. Wait slightly and generate the automated customer follow-up message
    setTimeout(() => {
      const followUpMsg = lang === "sw"
        ? `Habari! Je, bado unahitaji usaidizi wowote kuhusu mazungumzo yetu? Kama kila kitu kiko sawa, asante sana kwa kuchagua Orbi Shop! 🙏✨`
        : `Hello! Do you still need any assistance with our conversation? If everything is perfect, thank you so much for choosing Orbi Shop! 🙏✨`;
      
      onSendMessage(followUpMsg);
    }, 1200);
  };



  const starters = [
    { labelSw: "Fuatilia Oda Yangu 📦", labelEn: "Track My Order 📦", text: "Habari, naomba kusaidiwa kufuatilia oda yangu ya hivi karibuni." },
    { labelSw: "Tatizo la Malipo 💳", labelEn: "Payment Support 💳", text: "Habari, napata changamoto kidogo wakati wa kufanya malipo." },
    { labelSw: "Uliza Kuhusu Bidhaa 🏷️", labelEn: "Product Inquiry 🏷️", text: "Habari, nina swali kuhusu bidhaa na sifa zake." },
    { labelSw: "Ongea na Mhudumu 💬", labelEn: "Talk to Agent 💬", text: "Habari, nahitaji kuongea na mhudumu au Orbi Support." }
  ];

  // Helper function to dynamically tag products mentioned in plain text
  const autoTagProducts = (text: string, productList: any[]): string => {
    if (!text || !productList || productList.length === 0) return text;

    let result = text;
    const placeholders: string[] = [];

    // 1. Temporarily replace existing tags to prevent double-tagging
    const existingTagRegex = /@\[([^\]]+)\]\(product:([a-zA-Z0-9_-]+)\)/g;
    result = result.replace(existingTagRegex, (match) => {
      placeholders.push(match);
      return `__ORBI_TAG_PH_${placeholders.length - 1}__`;
    });

    // 2. Sort products by name length descending to avoid partial matches on shorter sub-strings
    const sortedProducts = [...productList]
      .filter((p) => p && typeof p.name === "string")
      .sort((a, b) => b.name.length - a.name.length);

    // 3. Match and tag untagged product names (supporting optional leading @)
    for (const p of sortedProducts) {
      if (!p.name) continue;
      const escapedName = p.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b@?${escapedName}\\b`, 'gi');
      result = result.replace(regex, `@[${p.name}](product:${p.id})`);
    }

    // 4. Restore original tags
    for (let i = 0; i < placeholders.length; i++) {
      result = result.replace(`__ORBI_TAG_PH_${i}__`, placeholders[i]);
    }

    return result;
  };

  // Parses bold syntax (**text**) and converts @[Name](product:id) and @[Label](nav:target) tags to high-contrast interactive badges
  const renderInlineBadgesAndText = (text: string, isMe?: boolean) => {
    if (!text) return "";

    // Split text by **bold** tags to format bold words
    const boldRegex = /(\*\*[^*]+\*\*)/g;
    const textParts = text.split(boldRegex);

    const parseProductTags = (str: string) => {
      const tagRegex = /(\@\[[^\]]+\]\(product:[a-zA-Z0-9_-]+\)|\@\[[^\]]+\]\(nav:[a-zA-Z0-9_-]+\))/g;
      const parts = str.split(tagRegex);

      return parts.map((part, index) => {
        // Product tag match
        const match = part.match(/^\@\[([^\]]+)\]\(product:([a-zA-Z0-9_-]+)\)$/);
        if (match) {
          const pName = match[1];
          const pId = match[2];
          const product = products.find((p) => p.id === pId);

          if (isMe) {
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("view-product-detail", {
                      detail: { productId: pId },
                    })
                  );
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-white text-slate-950 hover:bg-slate-100 rounded-md font-extrabold text-[10px] cursor-pointer select-none transition-all active:scale-95 shadow-xs align-middle border border-slate-100 font-sans"
                title={lang === "sw" ? `Gusa kuona: ${pName}` : `Click to view: ${pName}`}
              >
                <Tag size={8} className="text-indigo-600 shrink-0" />
                <span className="truncate max-w-[120px]">{pName}</span>
                {product && (
                  <span className="text-[9px] text-indigo-500 font-bold ml-1 border-l border-indigo-100 pl-1">
                    TSh {Number(product.price).toLocaleString()}
                  </span>
                )}
                <ExternalLink size={8} className="text-slate-400 shrink-0 ml-0.5" />
              </span>
            );
          } else {
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("view-product-detail", {
                      detail: { productId: pId },
                    })
                  );
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md font-extrabold text-[10px] cursor-pointer select-none transition-all active:scale-95 shadow-xs align-middle border border-indigo-500 font-sans"
                title={lang === "sw" ? `Gusa kuona: ${pName}` : `Click to view: ${pName}`}
              >
                <Tag size={8} className="text-white shrink-0" />
                <span className="truncate max-w-[120px]">{pName}</span>
                {product && (
                  <span className="text-[9px] text-indigo-200 font-bold ml-1 border-l border-white/15 pl-1">
                    TSh {Number(product.price).toLocaleString()}
                  </span>
                )}
                <ExternalLink size={8} className="text-white/60 shrink-0 ml-0.5" />
              </span>
            );
          }
        }

        // Navigation tag match
        const navMatch = part.match(/^\@\[([^\]]+)\]\(nav:([a-zA-Z0-9_-]+)\)$/);
        if (navMatch) {
          const btnText = navMatch[1];
          const target = navMatch[2];

          const handleNavClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (target === "cart") {
              window.dispatchEvent(new CustomEvent("open-cart"));
            } else if (target === "checkout") {
              window.dispatchEvent(new CustomEvent("open-checkout"));
            } else if (target === "track") {
              window.dispatchEvent(new CustomEvent("open-track-order"));
            } else if (["locator", "rewards", "orders", "settings"].includes(target)) {
              window.dispatchEvent(new CustomEvent("open-profile-tab", { detail: { tab: target } }));
            } else if (["security", "buyer", "seller", "terms", "privacy"].includes(target)) {
              window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: target } }));
            }
          };

          if (isMe) {
            return (
              <span
                key={index}
                onClick={handleNavClick}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-slate-900 text-slate-100 hover:bg-slate-800 rounded-md font-extrabold text-[10px] cursor-pointer select-none transition-all active:scale-95 shadow-xs align-middle border border-slate-700 font-sans uppercase tracking-wider"
                title={lang === "sw" ? `Bonyeza kwenda: ${btnText}` : `Click to navigate: ${btnText}`}
              >
                <Compass size={8} className="text-indigo-400 shrink-0" />
                <span>{btnText}</span>
              </span>
            );
          } else {
            return (
              <span
                key={index}
                onClick={handleNavClick}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-amber-500 text-white hover:bg-amber-600 rounded-md font-extrabold text-[10px] cursor-pointer select-none transition-all active:scale-95 shadow-xs align-middle border border-amber-400 font-sans uppercase tracking-wider"
                title={lang === "sw" ? `Bonyeza kwenda: ${btnText}` : `Click to navigate: ${btnText}`}
              >
                <Compass size={8} className="text-white shrink-0 animate-pulse" />
                <span>{btnText}</span>
              </span>
            );
          }
        }

        return part;
      });
    };

    return textParts.map((part, index) => {
      const match = part.match(/^\*\*([^*]+)\*\*$/);
      if (match) {
        return (
          <strong key={index} className={isMe ? "font-black text-white" : "font-black text-slate-900"}>
            {parseProductTags(match[1])}
          </strong>
        );
      }
      return <span key={index}>{parseProductTags(part)}</span>;
    });
  };

  // Professional renderer for message bubbles supporting inline product badging
  const renderMessageContent = (content: string, isMe?: boolean) => {
    if (!content) return null;

    // 1. Dynamic auto-tagger converts any mentioned product names in plain text to clickable badges
    const taggedContent = autoTagProducts(content, products);

    // 2. Identify all products featured in this message
    const productMatches = [...taggedContent.matchAll(/\@\[[^\]]+\]\(product:([a-zA-Z0-9_-]+)\)/g)];
    const productIds = Array.from(new Set(productMatches.map((m) => m[2])));
    const matchedProducts = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);

    // 3. Process line-by-line to generate structured HTML components (lists, alerts, dividers)
    const lines = taggedContent.split("\n");

    const parsedLines = lines.map((line, lineIdx) => {
      // Image attachment matching (Markdown or raw URL)
      const isMarkdownImg = line.match(/!\[(.*?)\]\((.*?)\)/);
      const isRawImgUrl = line.trim().match(/^https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)(?:\?[^\s]+)?$/i) || 
                           line.trim().match(/^\/uploads\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i);

      if (isMarkdownImg || isRawImgUrl) {
        const imgUrl = isMarkdownImg ? isMarkdownImg[2] : line.trim();
        const altText = isMarkdownImg ? isMarkdownImg[1] : "Attachment";
        return (
          <div key={lineIdx} className="my-2 max-w-full rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xs relative group bg-slate-50 transition-all duration-300 hover:shadow-xs hover:border-slate-300">
            <img 
              src={imgUrl} 
              alt={altText} 
              className="max-h-72 w-auto object-contain mx-auto rounded-xl hover:scale-[1.01] transition-transform duration-200 cursor-zoom-in"
              onClick={() => window.open(imgUrl, "_blank")}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <Compass size={13} />
                <span>{lang === "sw" ? "Fungua Picha ↗" : "View Image ↗"}</span>
              </span>
            </div>
          </div>
        );
      }

      // Catch safety, paysafe, or alert rules and highlight them in a specialized Amber secure box
      const isSecurityOrAlert = 
        line.includes("⚠️") || 
        line.toLowerCase().includes("paysafe") || 
        line.toLowerCase().includes("security") || 
        line.toLowerCase().includes("salama") || 
        line.toLowerCase().includes("usipipe") || 
        line.toLowerCase().includes("usilipe") || 
        line.toLowerCase().includes("ulaghai");

      if (isSecurityOrAlert) {
        const cleanText = line.replace(/^⚠️\s*/, "");
        const lineContent = renderInlineBadgesAndText(cleanText, isMe);
        return (
          <div 
            key={lineIdx} 
            className="my-2 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-950 font-semibold flex items-start gap-2 shadow-xs animate-in fade-in duration-200"
          >
            <ShieldCheck size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{lineContent}</div>
          </div>
        );
      }

      // Headers (Markdown ### or ## or Bold title with trailing colon)
      const isHeader3 = line.startsWith("### ");
      const isHeader2 = line.startsWith("## ");
      const isBoldHeader = line.startsWith("**") && line.endsWith("**:");

      if (isHeader3 || isHeader2 || isBoldHeader) {
        let cleanText = line;
        if (isHeader3) cleanText = line.slice(4);
        else if (isHeader2) cleanText = line.slice(3);
        else if (isBoldHeader) cleanText = line.slice(2, -3);

        const lineContent = renderInlineBadgesAndText(cleanText, isMe);
        return (
          <h4 
            key={lineIdx} 
            className={`font-black text-xs uppercase tracking-wider mt-4 mb-2 pb-1 border-b flex items-center gap-1.5 ${
              isMe ? "text-white border-white/10" : "text-indigo-900 border-indigo-100/50"
            }`}
          >
            <Sparkles size={11} className={isMe ? "text-indigo-300" : "text-indigo-500"} />
            <span>{lineContent}</span>
          </h4>
        );
      }

      // Horizontal dividers
      if (line.trim() === "---") {
        return (
          <hr 
            key={lineIdx} 
            className={`my-3 border-t ${isMe ? "border-white/10" : "border-slate-150"}`} 
          />
        );
      }

      // Bullet List elements (Markdown - or * or •)
      const isBullet = line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ");
      if (isBullet) {
        const cleanText = line.substring(2);
        const lineContent = renderInlineBadgesAndText(cleanText, isMe);
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-1.5 pl-1">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
              isMe ? "bg-white/70" : "bg-indigo-500"
            }`} />
            <div className={`text-xs sm:text-[13px] leading-relaxed ${
              isMe ? "text-slate-100" : "text-slate-700 font-medium"
            }`}>
              {lineContent}
            </div>
          </div>
        );
      }

      // Standard paragraphs
      const lineContent = renderInlineBadgesAndText(line, isMe);
      return (
        <div 
          key={lineIdx} 
          className={`text-xs sm:text-[13px] leading-relaxed my-1 min-h-[1.2rem] ${
            isMe ? "text-white" : "text-slate-700 font-medium"
          }`}
        >
          {lineContent}
        </div>
      );
    });

    return (
      <div className="space-y-1">
        <div className="space-y-0.5">{parsedLines}</div>

        {/* Dynamic bottom carousel/grid of tagged products */}
        {matchedProducts.length > 0 && (
          <div className={`mt-3.5 pt-3 border-t space-y-2.5 ${
            isMe ? "border-white/10" : "border-slate-150"
          }`}>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider px-0.5">
              <span className={`flex items-center gap-1.5 ${isMe ? "text-indigo-200" : "text-indigo-600"}`}>
                <Sparkles size={11} className="animate-pulse" />
                <span>{lang === "sw" ? "Bidhaa Zilizopendekezwa" : "Recommended Products"}</span>
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold ${
                isMe ? "bg-white/10 text-white" : "bg-indigo-100 text-indigo-800"
              }`}>
                {matchedProducts.length} {lang === "sw" ? "Bidhaa" : "Items"}
              </span>
            </div>

            {/* Structured CSS Grid layout for premium look */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {matchedProducts.map((p) => {
                const discountPercent = p.oldPrice && p.oldPrice > p.price
                  ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                  : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("view-product-detail", {
                          detail: { productId: p.id },
                        })
                      );
                    }}
                    className={`flex gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer group relative overflow-hidden select-none hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] ${
                      isMe 
                        ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white" 
                        : "bg-white border-slate-150 hover:border-indigo-400 hover:shadow-sm text-slate-800"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 relative">
                      {p.images && p.images[0] ? (
                        <img
                          referrerPolicy="no-referrer"
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-sm">
                          📦
                        </div>
                      )}
                      
                      {discountPercent > 0 && (
                        <span className="absolute top-0.5 left-0.5 bg-rose-500 text-white text-[8px] font-black px-1 rounded">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase truncate max-w-[70px] ${
                            isMe ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"
                          }`}>
                            {p.category || "General"}
                          </span>
                          
                          {p.stock > 0 ? (
                            <span className="text-[8px] text-emerald-500 font-extrabold flex items-center gap-0.5 shrink-0">
                              ● {lang === "sw" ? "Ipo" : "In Stock"}
                            </span>
                          ) : (
                            <span className="text-[8px] text-rose-500 font-extrabold flex items-center gap-0.5 shrink-0">
                              ● {lang === "sw" ? "Imeisha" : "Sold Out"}
                            </span>
                          )}
                        </div>
                        
                        <h5 className={`text-xs font-black truncate ${
                          isMe ? "text-white group-hover:text-indigo-200" : "text-slate-800 group-hover:text-indigo-600"
                        }`}>
                          {lang === "sw" && p.nameSw ? p.nameSw : p.name}
                        </h5>
                      </div>

                      {/* Pricing & Link */}
                      <div className="flex items-baseline justify-between gap-1 mt-1">
                        <div>
                          <p className="text-xs font-black leading-none">
                            TSh {Number(p.price).toLocaleString()}
                          </p>
                          {p.oldPrice && p.oldPrice > p.price && (
                            <p className="text-[9px] text-slate-400 line-through leading-none mt-0.5">
                              TSh {Number(p.oldPrice).toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        <span className={`text-[9px] font-extrabold flex items-center gap-0.5 transition-colors shrink-0 ${
                          isMe ? "text-indigo-300 group-hover:text-indigo-200" : "text-indigo-600 group-hover:text-indigo-700"
                        }`}>
                          <span>{lang === "sw" ? "Tazama" : "View"}</span>
                          <ExternalLink size={8} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative font-sans">
      {/* Header */}
      {!hideHeader && (
        <div className="bg-white/95 backdrop-blur-md px-3 sm:px-5 py-3 sm:py-3.5 border-b border-slate-150 flex items-center justify-between shadow-xs z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-3 sm:mr-4">
            {onOpenMobileInbox && (
              <button 
                onClick={onOpenMobileInbox}
                className="md:hidden p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all active:scale-95 mr-1.5 shrink-0"
                title={lang === "sw" ? "Fungua Inbox" : "Open Inbox"}
              >
                <Menu size={20} />
              </button>
            )}
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-100/80 shadow-xs">
               {otherParticipant?.avatar ? (
                  <img 
                    referrerPolicy="no-referrer" 
                    src={otherParticipant.avatar} 
                    alt="avatar" 
                    className={`w-full h-full object-cover ${
                      otherParticipant.avatar.includes("OrbiShop_Logo_Blue") ? "p-1" : ""
                    }`} 
                  />
               ) : (
                  <User size={20} />
               )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h3 className="font-extrabold text-slate-900 leading-tight text-sm sm:text-base flex items-center gap-1 truncate">
                  <span className="truncate">{otherParticipant?.name || "Unknown User"}</span>
                </h3>
                {otherParticipant?.name?.toLowerCase().includes("support") && (
                  <span className="bg-slate-950 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm leading-none shrink-0 uppercase">
                    STAFF
                  </span>
                )}
                {(otherParticipant?.name?.toLowerCase().includes("orbi shop store") || otherParticipant?.id === "00000000-0000-0000-0000-000000000001") && (
                  <span className="bg-indigo-600 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm leading-none shrink-0 uppercase">
                    {lang === "sw" ? "DUKA RASMI" : "OFFICIAL STORE"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500 capitalize font-bold leading-none">{otherParticipant?.role || "User"}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                  <span className="text-[10px] text-slate-400 font-bold">
                    {isConnected 
                      ? (lang === "sw" ? "Inatumika" : "Active Now") 
                      : (lang === "sw" ? "Inatafuta mtandao..." : "Reconnecting...")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap shrink-0">

            {(currentUserRole === "admin" || currentUserRole === "seller") && (
              <button
                onClick={handleMarkResolved}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title={lang === "sw" ? "Weka alama kuwa Kimesuluhishwa" : "Mark as Resolved"}
              >
                <ShieldCheck size={12} className="text-white animate-pulse" />
                <span>{lang === "sw" ? "Suluhisha Soga" : "Resolve Chat"}</span>
              </button>
            )}

            {currentUserRole === "admin" && (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/65 rounded-xl text-[10px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                  title={lang === "sw" ? "Futa Soga Yote" : "Delete Conversation"}
                >
                  <Trash size={12} className="text-rose-600" />
                  <span>{lang === "sw" ? "Futa Soga" : "Delete"}</span>
                </button>
                {(() => {
                  const customer = conversation.participants.find(p => p.id !== currentUserId);
                  if (customer && customer.id !== "support") {
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleAIOverride(customer.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                            unlockedAIUsers.includes(customer.id)
                              ? "bg-amber-950/20 text-amber-700 border border-amber-300 hover:bg-amber-100"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <Zap size={11} className={unlockedAIUsers.includes(customer.id) ? "text-amber-500 fill-amber-500" : ""} />
                          <span className="hidden sm:inline">
                            {unlockedAIUsers.includes(customer.id)
                              ? (lang === "sw" ? "AI Haijalimika" : "Unlimited AI Enabled")
                              : (lang === "sw" ? "Fungulia Kikomo" : "Bypass AI Limits")}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetAIQuota(customer.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black transition cursor-pointer bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200"
                          title="Reset 10-Msg Quota"
                        >
                          <RefreshCw size={11} className="text-rose-500" />
                          <span className="hidden sm:inline">
                            {lang === "sw" ? "Weka Upya Quota" : "Reset Quota"}
                          </span>
                        </button>
                      </>
                    );
                  }
                  return null;
                })()}
              </>
            )}

            {isAdminPreview && (
                <div className="flex items-center gap-2 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black border border-amber-200 shadow-2xs uppercase tracking-wider shrink-0">
                    <ShieldAlert size={11} />
                    Preview
                </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        style={{
          backgroundImage: "radial-gradient(#e2e8f0 1.2px, transparent 1.2px)",
          backgroundSize: "16px 16px"
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4 max-w-sm mx-auto">
            <div className="w-14 h-14 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
              <MessageSquare size={24} />
            </div>
            <h4 className="font-extrabold text-slate-850 text-base mb-1.5">
              {lang === "sw" ? "Anzisha Mazungumzo" : "Start Conversation"}
            </h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {lang === "sw" 
                ? "Tuma ujumbe hapa chini au chagua maswali ya haraka ili kuanza mazungumzo mara moja. Unaweza kutumia @ kutaja bidhaa!" 
                : "Send a message below or tap one of our quick assistance starters. Type @ to tag products!"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {starters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessageText(starter.text)}
                  disabled={isAdminPreview || isFrozen}
                  className="p-3 text-left border border-slate-200 bg-white hover:border-slate-400 hover:text-slate-900 transition-all shadow-2xs rounded-xl text-xs font-semibold text-slate-700 active:scale-[0.98] disabled:opacity-50 hover:bg-slate-50/50 cursor-pointer"
                >
                  {lang === "sw" ? starter.labelSw : starter.labelEn}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            // Identify if the message is from the special AI Support Bot
            const isAiBot = msg.senderId === "orbi-ai-agent" || msg.senderName === "Orbi AI Support";
            
            let bubbleClasses = isMe
              ? "bg-slate-900 text-white rounded-tr-none shadow-xs border border-slate-800"
              : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-2xs";

            if (isAiBot) {
              bubbleClasses = "bg-indigo-50/85 border border-indigo-100/90 text-slate-850 rounded-tl-none shadow-2xs";
            }

            if (isAdminPreview) {
               if (msg.senderRole === "seller") bubbleClasses = "bg-blue-50 border-blue-200 text-blue-900 rounded-tl-none shadow-2xs";
               else if (msg.senderRole === "customer") bubbleClasses = "bg-emerald-50 border-emerald-200 text-emerald-900 rounded-tr-none shadow-2xs";
               else bubbleClasses = "bg-slate-900 text-white rounded-tr-none shadow-xs";
            }

            if (msg.isSending) {
              bubbleClasses += " opacity-75";
            } else if (msg.isFailed) {
              bubbleClasses += " border-red-200 bg-red-50 text-red-900";
            }

            return (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 24, stiffness: 350 }}
                key={msg.id || idx} 
                className={`flex flex-col ${isMe || (isAdminPreview && msg.senderRole === 'customer') ? "items-end" : "items-start"}`}
              >
                <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[82%]">
                  {(!isMe || isAdminPreview) && msg.senderRole !== 'customer' && (
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 mb-1 flex items-center justify-center overflow-hidden border shadow-2xs ${
                      isAiBot ? "bg-indigo-600 text-white border-indigo-200" : "bg-slate-150 text-slate-600 border-slate-200"
                    }`}>
                      {isAiBot ? (
                        <Bot size={13} />
                      ) : (msg.senderId === "support" || msg.senderId === "00000000-0000-0000-0000-000000000001" || msg.senderName?.toLowerCase().includes("orbi shop") || msg.senderName?.toLowerCase().includes("orbi store") || msg.senderRole === "admin") ? (
                        <img
                          src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                          alt="Orbi Logo"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] font-black">{msg.senderRole ? msg.senderRole[0].toUpperCase() : "S"}</span>
                      )}
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl ${bubbleClasses}`}>
                    {/* Header line inside AI response for premium branding */}
                    {isAiBot && (
                      <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-700 tracking-wider uppercase mb-1.5 pb-1 border-b border-indigo-100/50">
                        <Cpu size={10} />
                        <span>Orbi Support AI Agent</span>
                        <span className="bg-indigo-600 text-white text-[7px] px-1 py-0.2 rounded-sm lowercase font-bold">verified</span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {renderMessageContent(msg.content, isMe)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 mx-9">
                  <span className="text-[9px] text-slate-400 font-bold tracking-tight">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.isSending && (
                    <Loader2 size={10} className="text-slate-400 animate-spin shrink-0" />
                  )}
                  {msg.isFailed && (
                    <span className="flex items-center gap-0.5 text-red-500 text-[9px] font-bold">
                      <AlertCircle size={10} />
                      {lang === "sw" ? "Imeshindwa" : "Failed"}
                    </span>
                  )}
                  {!msg.isSending && !msg.isFailed && (isMe || (isAdminPreview && msg.senderRole === 'customer')) && (
                     <span className={msg.isRead ? "text-indigo-600" : "text-slate-400"}>
                       {msg.isRead ? <CheckCheck size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />}
                     </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        
        {/* Real-time typing visual for active AI operations */}
        {isAiResponding && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[82%]">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex-shrink-0 mb-1 flex items-center justify-center border border-indigo-200 shadow-2xs">
                <Bot size={13} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-indigo-50/85 border border-indigo-100 text-indigo-900 rounded-tl-none flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Suggested Replies rendered INSIDE the messaging history window scroll view */}
        {showSuggestedReplies && (
          <div className="flex flex-col items-start gap-2 pt-3 pb-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-1.5 select-none bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-indigo-700 tracking-wider">
              <span>⚡</span>
              <span>{lang === "sw" ? "Soma Zaidi:" : "Quick Replies:"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 max-w-full">
              {getSuggestedReplies(lastMessage?.content || "").map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAdminPreview || isFrozen}
                  onClick={() => sendMessageText(suggestion.text)}
                  className="px-3.5 py-2 text-[11px] font-bold bg-white text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 hover:bg-indigo-600 rounded-xl shadow-2xs transition-all duration-150 active:scale-95 disabled:opacity-50 inline-flex items-center shrink-0 cursor-pointer"
                >
                  {lang === "sw" ? suggestion.labelSw : suggestion.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>

      {/* Auto-suggest list popover for @ tagging (located above input bar relative) */}
      {showTagDropdown && filteredProducts.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute bottom-[100px] left-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-[9999] overflow-hidden max-h-56 flex flex-col"
        >
          <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-150 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <Tag size={11} />
              {lang === "sw" ? "Taja Bidhaa Kutoka Duka" : "Tag Product From Store"}
            </span>
            <span className="bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-700">{filteredProducts.length} {lang === "sw" ? "Zimepatikana" : "Found"}</span>
          </div>
          <div className="overflow-y-auto divide-y divide-slate-100">
            {filteredProducts.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => selectProductTag(p)}
                className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-all text-left ${
                  idx === selectedTagIndex ? "bg-indigo-50/50 border-l-4 border-indigo-600 pl-2.5" : "hover:bg-slate-50"
                }`}
              >
                {p.images && p.images[0] ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={p.images[0]}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate leading-snug">{p.name}</p>
                  <p className="text-[10px] text-indigo-600 font-extrabold tracking-tight mt-0.5">
                    TSh {Number(p.price).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Input Area */}
      <div className="p-3.5 bg-white border-t border-slate-150 relative z-10 shrink-0">

        {isFrozen ? (
          <div className="p-5 bg-rose-50/70 border border-rose-150 rounded-2xl flex flex-col items-center text-center shadow-xs animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Blocked Animated GIF / Icon */}
            <div className="relative mb-3.5 flex items-center justify-center">
              <div className="absolute inset-0 bg-rose-200/40 rounded-full blur-xl animate-pulse" />
              <img 
                src="https://cdn.pixabay.com/animation/2023/06/13/15/12/15-12-30-710_512.gif" 
                alt="Account Locked" 
                className="w-20 h-20 object-contain relative z-10 drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <Lock size={12} className="animate-bounce" />
              </div>
            </div>

            {/* Title */}
            <h4 className="text-slate-950 font-black tracking-tight text-sm sm:text-base flex items-center gap-1.5 justify-center">
              <ShieldAlert size={16} className="text-rose-600 animate-pulse shrink-0" />
              <span>
                {lang === "sw" 
                  ? "Akaunti yako Imezuiwa" 
                  : "Account Access Blocked"}
              </span>
            </h4>

            {/* Reason */}
            <p className="text-xs font-semibold text-slate-700 mt-2 max-w-md leading-relaxed">
              {lang === "sw" 
                ? `Mawasiliano yako yamefungwa kwa sababu ya ukiukaji mfululizo wa usalama (jaribio la kufanya malipo ya nje ya mfumo wa Orbi PaySafe). Umemaliza majaribio yako ya usalama (${currentUserRole === "seller" ? "3/3" : "5/5"}).` 
                : `Your account messaging is frozen because you have exhausted all your safety warning trials (${currentUserRole === "seller" ? "3/3" : "5/5"}) by attempting off-platform/direct payments instead of using Orbi PaySafe.`}
            </p>

            {/* Actions & Instructions */}
            <div className="mt-4 bg-white/95 border border-rose-100 rounded-xl p-3 max-w-md w-full shadow-2xs">
              <p className="text-[11px] font-bold text-slate-600 leading-normal">
                {lang === "sw"
                  ? "Ikiwa umezuiwa kimakosa au unataka kukata rufaa, tafadhali wasiliana na Huduma kwa Wateja ya Orbi (Orbi Support) au subiri hadi msimamizi (Admin) atakapokagua na kuifungua akaunti yako."
                  : "If you believe you were blocked in error, please contact Orbi Support immediately or wait patiently until an administrator reviews and restores your access."}
              </p>
              
              <div className="mt-3 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: "security" } }));
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black tracking-wider uppercase rounded-lg transition active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Cpu size={12} />
                  <span>{lang === "sw" ? "Soma Sera ya Usalama" : "Read Security Policy"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black tracking-wider uppercase rounded-lg transition active:scale-95 border border-slate-200 cursor-pointer"
                >
                  {lang === "sw" ? "Angalia Hali" : "Check Status"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Image Upload Status & Previews */}
            {(isUploadingImage || attachedImageUrl || uploadError) && (
              <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 relative animate-in fade-in slide-in-from-bottom-2 duration-200">
                {isUploadingImage && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 py-1">
                    <Loader2 size={14} className="text-indigo-600 animate-spin" />
                    <span>{lang === "sw" ? "Inapakia picha kwenye R2..." : "Uploading image to R2..."}</span>
                  </div>
                )}

                {attachedImageUrl && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={attachedImageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedImageUrl(null)}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                {attachedImageUrl && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 truncate">
                      {lang === "sw" ? "Picha imepakiwa!" : "Image uploaded!"}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                      {lang === "sw" ? "Imepakiwa vizuri (chini ya 50MB)" : "Ready to attach (below 50MB)"}
                    </p>
                  </div>
                )}

                {uploadError && (
                  <div className="flex-1 text-xs font-bold text-red-500 flex items-center gap-1.5 py-1">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{uploadError}</span>
                    <button
                      type="button"
                      onClick={() => setUploadError(null)}
                      className="text-slate-400 hover:text-slate-600 ml-auto p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Attachment Button */}
              {!isAdminPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isFrozen}
                  title={lang === "sw" ? "Weka picha (<50MB)" : "Attach image (<50MB)"}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-3xs cursor-pointer"
                >
                  <Image size={16} />
                </button>
              )}

              {/* Emoji Picker Button */}
              {!isAdminPreview && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title={lang === "sw" ? "Fungua emoji" : "Open emojis"}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-3xs ${
                      showEmojiPicker 
                        ? "bg-slate-900 border-slate-900 text-white" 
                        : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                    }`}
                  >
                    <Smile size={16} />
                  </button>

                  {/* Categorized Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div 
                      ref={emojiPickerRef}
                      className="absolute bottom-[52px] left-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] w-64 p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      {/* Category Tabs */}
                      <div className="flex border-b border-slate-100 pb-1.5 gap-1">
                        {(["smileys", "gestures", "hearts", "trade"] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEmojiCategory(cat)}
                            className={`flex-1 text-[10px] font-black uppercase tracking-wider py-1 rounded transition-all ${
                              emojiCategory === cat
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                          >
                            {cat === "smileys" ? "😀" : cat === "gestures" ? "👋" : cat === "hearts" ? "❤️" : "📦"}
                          </button>
                        ))}
                      </div>

                      {/* Emoji Grid */}
                      <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-0.5 text-center">
                        {emojiCategories[emojiCategory].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              insertEmoji(emoji);
                            }}
                            className="text-lg hover:bg-slate-100 p-1 rounded transition-colors active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isAdminPreview || isFrozen}
                placeholder={
                  isFrozen
                    ? (lang === "sw" ? "Akaunti imefungiwa. Huwezi kutuma ujumbe." : "Account frozen. You cannot send messages.")
                    : isAdminPreview 
                    ? (lang === "sw" ? "Hali ya uhakiki tu" : "Read-only preview mode") 
                    : (lang === "sw" ? "Andika ujumbe au weka picha..." : "Type a message or attach image...")
                }
                className="flex-1 border border-slate-200 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition-all font-semibold placeholder-slate-400 shadow-3xs resize-none min-h-[40px] max-h-36 overflow-y-auto"
                rows={1}
              />
              <button
                type="submit"
                disabled={(!inputText.trim() && !attachedImageUrl) || isAdminPreview || isFrozen}
                className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all active:scale-95 shrink-0 shadow-md cursor-pointer"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </form>
          </>
        )}

        {/* Security and Policies Footer */}
        <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-500 font-bold leading-tight flex flex-wrap items-center justify-center md:justify-start gap-x-1.5 gap-y-1 max-w-full">
          {/* E2E badge */}
          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[8px] tracking-tight shrink-0 shadow-2xs">
            <ShieldCheck size={10} className="text-emerald-600" />
            <span>{lang === "sw" ? "Mawasiliano Salama (E2EE)" : "E2E Encrypted & Secure"}</span>
          </span>

          {/* Intro text + Security policy link */}
          <span className="text-slate-600 flex items-center gap-0.5 shrink-0">
            {lang === "sw" ? "Tafadhali fuata " : "Please follow Orbi's official "}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: "security" } }));
              }}
              className="font-extrabold text-slate-700 hover:text-indigo-600 underline cursor-pointer active:scale-95 transition-all inline-block"
            >
              {lang === "sw" ? "sera ya usalama" : "security policy"}
            </button>
          </span>

          {/* List of remaining policies */}
          <span className="text-slate-300 select-none">•</span>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: "buyer" } }));
            }}
            className="hover:text-indigo-600 font-bold underline active:scale-95 transition-all text-slate-500 cursor-pointer"
          >
            {lang === "sw" ? "Ulinzi wa Mnunuzi" : "Buyer Protection"}
          </button>

          <span className="text-slate-300 select-none">•</span>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: "seller" } }));
            }}
            className="hover:text-indigo-600 font-bold underline active:scale-95 transition-all text-slate-500 cursor-pointer"
          >
            {lang === "sw" ? "Ulinzi wa Muuzaji" : "Seller Protection"}
          </button>

          <span className="text-slate-300 select-none">•</span>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: "terms" } }));
            }}
            className="hover:text-indigo-600 underline active:scale-95 transition-all text-slate-500"
          >
            {lang === "sw" ? "Vigezo" : "Terms"}
          </button>

          <span className="text-slate-300 select-none">•</span>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-about-page", { detail: { tab: "privacy" } }));
            }}
            className="hover:text-indigo-600 underline active:scale-95 transition-all text-slate-500"
          >
            {lang === "sw" ? "Sera ya Faragha" : "Privacy Policy"}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={22} />
            </div>
            <h3 className="text-center font-black text-slate-900 text-lg leading-tight mb-2">
              {lang === "sw" ? "Futa Historia?" : "Delete History?"}
            </h3>
            <p className="text-center text-xs text-slate-500 leading-relaxed mb-6">
              {lang === "sw" 
                ? "Je, una uhakika unataka kufuta historia yote ya ujumbe katika mazungumzo haya? Kitendo hiki hakiwezi kurudishwa na kitafuta ujumbe kwa pande zote mbili."
                : "Are you sure you want to delete all message history in this conversation? This action cannot be undone and will clear messages for both of you."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {lang === "sw" ? "Ghairi" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleDeleteAllMessages}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{lang === "sw" ? "Inafuta..." : "Deleting..."}</span>
                  </>
                ) : (
                  <span>{lang === "sw" ? "Ndiyo, Futa" : "Yes, Delete"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
