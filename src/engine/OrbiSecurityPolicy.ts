/**
 * Orbi Shop Security Policy & Anti-Scam Guidelines
 * 
 * This policy document serves as the ground truth for the AI/Bot Engine
 * when monitoring platform activity, verifying transactions, and responding to user queries.
 */

export const OrbiSecurityPolicy = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  coreMission: "To be the ultimate trusted e-commerce platform by eliminating online scams and ensuring 100% secure transactions for all buyers and sellers.",
  
  rules: [
    {
      id: "SEC-001",
      category: "Payments",
      title: "Strictly On-Platform Payments",
      description: "Any attempt to request, offer, or accept payments outside of the Orbi secure payment gateway is strictly prohibited. This is to ensure buyer protection and Orbi PaySafe security.",
      botAction: "Block message, send warning to the sender. Flag the account for manual review on repeated offenses.",
      keywordsTriggers: ["tuma hela", "lipia nje", "pay me directly", "whatsapp me for payment", "tuma kwenye namba", "send money to", "pay via mpesa directly"],
    },
    {
      id: "SEC-002",
      category: "Communication",
      title: "Off-Platform Communication Limitations",
      description: "For security and record-keeping, all product and transaction-related communications must happen within the Orbi Chat. Moving conversations to untracked platforms before a confirmed order is highly discouraged.",
      botAction: "Warn user about the risks of off-platform communication. Provide the 'Trust & Safety' tip in the chat automatically.",
      keywordsTriggers: ["njoo whatsapp", "chat me on tg", "nipigie kwenye namba", "call me directly"],
    },
    {
      id: "SEC-003",
      category: "Fraud",
      title: "Counterfeit & Misleading Products",
      description: "Listing fake, counterfeit, or misleading items damages platform trust. Product images and descriptions must accurately represent the item being sold.",
      botAction: "Auto-scan product images and descriptions. If a high discrepancy or reported counterfeit is detected, auto-hide the product and alert the Admin.",
      keywordsTriggers: ["fake", "replica", "copy", "original 1:1"],
    },
    {
      id: "SEC-004",
      category: "User Conduct",
      title: "Harassment & Abusive Language",
      description: "Orbi maintains a zero-tolerance policy for hate speech, harassment, threats, or abusive language between sellers and buyers.",
      botAction: "Mask the offensive text. Issue an immediate suspension warning. Freeze account if severe or repeated.",
      keywordsTriggers: ["stupid", "scam you", "mjinga", "tapeli", "thief"],
    }
  ],

  getGuidelinesForBot: () => {
    return `
      ORBI TRUST & SAFETY BOT GUIDELINES:
      - You are the Orbi Security Warden. Your supreme duty is to protect users from scams.
      - Never allow off-platform payment requests. If detected, intercept the message.
      - If a user asks how to pay securely, instruct them to ONLY use the 'Checkout' button inside the app.
      - If a user reports a scam, thank them, assure them their funds (if in Orbi PaySafe) are safe, and automatically flag the seller's account for Admin review.
      - Enforce all Orbi Security Policy Rules rigorously.
    `;
  }
};
