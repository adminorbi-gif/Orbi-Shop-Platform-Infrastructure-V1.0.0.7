import crypto from "crypto";

// ==========================================
// TYPES & INTERFACES FOR TRA EFDMS SCHEMAS
// ==========================================

export interface TraItem {
  id: string;         // Standard Item Code
  description: string; // Name/description of item
  quantity: number;   // Quantity
  taxCode: 1 | 2 | 3 | 4 | 5; // 1=Standard (18%), 2=Special, 3=Zero, 4=Relief, 5=Exempt
  amount: number;     // Total Amount Inclusive of taxes
}

export type PaymentType = "CASH" | "CHEQUE" | "CCARD" | "EMONEY" | "INVOICE";

export interface TraReceiptData {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM:SS
  tin: string;        // Taxpayer TIN (seller)
  regId: string;      // VFD System Registration ID
  efdSerial: string;  // VFD serial / CERTKEY (e.g. 10TZ...)
  
  // Buyer Details
  customerIdType: 1 | 2 | 3 | 4 | 5 | 6; // 1=TIN, 2=DL, 3=Voters, 4=Passport, 5=NID, 6=NIL
  customerId: string; // ID corresponding to type (required unless type is 6)
  customerName?: string;
  customerMobile?: string; // 255... format

  // Sequences
  receiptNum: number; // Unique sequence, equal to GC
  dc: number;         // Daily counter (resets after midnight)
  gc: number;         // Global counter since day one
  zNum: string;       // YYYYMMDD date format

  // Verification
  receiptCode: string; // From registration, appended to GC to form RCTVNUM

  items: TraItem[];
  paymentType: PaymentType;
}

export interface TraZReportData {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM:SS
  vrn: string;        // VAT Registration Number
  tin: string;
  taxOffice: string;
  regId: string;
  zNumber: number;    // Sequential Z-report number
  efdSerial: string;
  registrationDate: string; // Date of device registration
  
  // Daily tallies
  dailyTotalAmount: number;
  grossTotal: number;
  receiptsFiscalCount: number;
}

// ==========================================
// INTERNAL SECURITY & ESCAPING HELPERS
// ==========================================

/**
 * Escapes characters that are dangerous within XML elements
 */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Computes RSA-SHA1 PKCS#1 v1.5 standard signature base64 string
 */
export function signXmlContent(payloadXml: string, privateKeyPem?: string): string {
  if (!privateKeyPem || privateKeyPem.trim() === "") {
    // Return a structured development-mode signature if no production keys are provided yet
    const h = crypto.createHash("sha1").update(payloadXml).digest("hex");
    return Buffer.from(`DEV_COMPLIANT_SIGN_SHA1_${h}_${Date.now()}`).toString("base64");
  }
  try {
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(payloadXml);
    return sign.sign(privateKeyPem, "base64");
  } catch (err: any) {
    console.error("[TRA XML Utility] Cryptographic signing failed:", err.message);
    const h = crypto.createHash("sha1").update(payloadXml).digest("hex");
    return Buffer.from(`FALLBACK_SIGN_SHA1_${h}_${Date.now()}`).toString("base64");
  }
}

// ==========================================
// CORE TRANSLATION ENGINES
// ==========================================

/**
 * Generates EFDMS registered payload representing a virtual device TIN registration
 */
export function generateRegistrationXml(tin: string, certKey: string, privateKeyPem?: string): string {
  const cleanTin = escapeXml(tin.replace(/[^0-9]/g, ""));
  const cleanCertKey = escapeXml(certKey.trim());

  const regDataSection = `<REGDATA><TIN>${cleanTin}</TIN><CERTKEY>${cleanCertKey}</CERTKEY></REGDATA>`;
  const signature = signXmlContent(regDataSection, privateKeyPem);

  return `<EFDMS>${regDataSection}<EFDMSSIGNATURE>${signature}</EFDMSSIGNATURE></EFDMS>`;
}

/**
 * Transforms receipt payload details into EFDMS structured transaction XML matching TRA spec
 */
export function generateReceiptXml(data: TraReceiptData, privateKeyPem?: string): {
  bodyXml: string;
  signature: string;
  fullXml: string;
  rctvnum: string;
} {
  const cleanTin = escapeXml(data.tin.replace(/[^0-9]/g, ""));
  const cleanRegId = escapeXml(data.regId.trim());
  const cleanEfdSerial = escapeXml(data.efdSerial.trim());
  
  // Format buyer profile correctly
  const buyerName = escapeXml((data.customerName || "MTEJA").toUpperCase().trim());
  const buyerId = data.customerIdType === 6 ? "NIL" : escapeXml(data.customerId.replace(/[^A-Za-z0-9-]/g, "").trim());
  
  // format mobile to 255XXXXXXXXX or standard format, no space/signs
  const cleanMobile = escapeXml((data.customerMobile || "255764258114").replace(/[^0-9]/g, ""));

  // Check unique counter sequence
  const rctNum = data.receiptNum;
  const dc = data.dc;
  const gc = data.gc;
  const zNum = escapeXml(data.zNum.replace(/[^0-9]/g, ""));
  const rctvnum = `${data.receiptCode.trim()}${gc}`;

  // Process items record set
  let itemsXml = "";
  let totalExclTax = 0;
  let totalInclTax = 0;
  let standardRateNett = 0;
  let standardRateTax = 0;

  data.items.forEach((item) => {
    const qty = Number(item.quantity);
    const amt = Number(item.amount); // total inclusive
    const cleanId = escapeXml((item.id || "1").trim());
    const cleanDesc = escapeXml(item.description.toUpperCase().trim());

    itemsXml += `<ITEM>` +
                  `<ID>${cleanId}</ID>` +
                  `<DESC>${cleanDesc}</DESC>` +
                  `<QTY>${qty}</QTY>` +
                  `<TAXCODE>${item.taxCode}</TAXCODE>` +
                  `<AMT>${amt.toFixed(2)}</AMT>` +
                `</ITEM>`;

    totalInclTax += amt;

    if (item.taxCode === 1) {
      // 18% Standard rate math
      const nett = amt / 1.18;
      const tax = amt - nett;
      standardRateNett += nett;
      standardRateTax += tax;
      totalExclTax += nett;
    } else {
      // Exempt or zero rated
      totalExclTax += amt;
    }
  });

  // Totals formatting
  const totalTaxExclFormatted = totalExclTax.toFixed(2);
  const totalTaxInclFormatted = totalInclTax.toFixed(2);

  // Vatted totals summary
  let vatTotalsXml = "";
  if (standardRateTax > 0) {
    vatTotalsXml = `<VATTOTAL>` +
                     `<VATRATE>A</VATRATE>` +
                     `<NETTAMOUNT>${standardRateNett.toFixed(2)}</NETTAMOUNT>` +
                     `<TAXAMOUNT>${standardRateTax.toFixed(2)}</TAXAMOUNT>` +
                   `</VATTOTAL>`;
  } else {
    vatTotalsXml = `<VATTOTAL>` +
                     `<VATRATE>E</VATRATE>` +
                     `<NETTAMOUNT>${totalTaxInclFormatted}</NETTAMOUNT>` +
                     `<TAXAMOUNT>0.00</TAXAMOUNT>` +
                   `</VATTOTAL>`;
  }

  // Construct XML body (strictly between <RCT> and </RCT> represents the signed text)
  const xmlBody = `<RCT>` +
                    `<DATE>${escapeXml(data.date)}</DATE>` +
                    `<TIME>${escapeXml(data.time)}</TIME>` +
                    `<TIN>${cleanTin}</TIN>` +
                    `<REGID>${cleanRegId}</REGID>` +
                    `<EFDSERIAL>${cleanEfdSerial}</EFDSERIAL>` +
                    `<CUSTIDTYPE>${data.customerIdType}</CUSTIDTYPE>` +
                    `<CUSTID>${buyerId}</CUSTID>` +
                    `<CUSTNAME>${buyerName}</CUSTNAME>` +
                    `<MOBILENUM>${cleanMobile}</MOBILENUM>` +
                    `<RCTNUM>${rctNum}</RCTNUM>` +
                    `<DC>${dc}</DC>` +
                    `<GC>${gc}</GC>` +
                    `<ZNUM>${zNum}</ZNUM>` +
                    `<RCTVNUM>${rctvnum}</RCTVNUM>` +
                    `<ITEMS>${itemsXml}</ITEMS>` +
                    `<TOTALS>` +
                      `<TOTALTAXEXCL>${totalTaxExclFormatted}</TOTALTAXEXCL>` +
                      `<TOTALTAXINCL>${totalTaxInclFormatted}</TOTALTAXINCL>` +
                      `<DISCOUNT>0.00</DISCOUNT>` +
                    `</TOTALS>` +
                    `<PAYMENTS>` +
                      `<PMTTYPE>${escapeXml(data.paymentType)}</PMTTYPE>` +
                      `<PMTAMOUNT>${totalTaxInclFormatted}</PMTAMOUNT>` +
                    `</PAYMENTS>` +
                    `<VATTOTALS>${vatTotalsXml}</VATTOTALS>` +
                  `</RCT>`;

  const signature = signXmlContent(xmlBody, privateKeyPem);
  const fullEnvelope = `<EFDMS>${xmlBody}<EFDMSSIGNATURE>${signature}</EFDMSSIGNATURE></EFDMS>`;

  return {
    bodyXml: xmlBody,
    signature,
    fullXml: fullEnvelope,
    rctvnum
  };
}

/**
 * Transforms comprehensive tallies to ZREPORT XML structure required for daily endpoint
 */
export function generateZReportXml(data: TraZReportData, privateKeyPem?: string): {
  bodyXml: string;
  signature: string;
  fullXml: string;
} {
  const cleanTin = escapeXml(data.tin.replace(/[^0-9]/g, ""));
  const cleanVrn = escapeXml(data.vrn.toUpperCase().trim());
  const cleanRegId = escapeXml(data.regId.trim());
  const cleanEfdSerial = escapeXml(data.efdSerial.trim());
  const cleanTaxOffice = escapeXml(data.taxOffice.trim());

  const dailyTotalFormatted = data.dailyTotalAmount.toFixed(2);
  const grossTotalFormatted = data.grossTotal.toFixed(2);
  
  // Tax calculations at 18% standard rate
  const nettTotal = data.dailyTotalAmount / 1.18;
  const taxTotal = data.dailyTotalAmount - nettTotal;

  const xmlBody = `<ZREPORT>` +
                    `<DATE>${escapeXml(data.date)}</DATE>` +
                    `<TIME>${escapeXml(data.time)}</TIME>` +
                    `<VRN>${cleanVrn}</VRN>` +
                    `<TIN>${cleanTin}</TIN>` +
                    `<TAXOFFICE>${cleanTaxOffice}</TAXOFFICE>` +
                    `<REGID>${cleanRegId}</REGID>` +
                    `<ZNUMBER>${data.zNumber}</ZNUMBER>` +
                    `<EFDSERIAL>${cleanEfdSerial}</EFDSERIAL>` +
                    `<REGISTRATIONDATE>${escapeXml(data.registrationDate)}</REGISTRATIONDATE>` +
                    `<USER>webapi</USER>` +
                    `<SIMIMSI>webapi</SIMIMSI>` +
                    `<TOTALS>` +
                      `<DAILYTOTALAMOUNT>${dailyTotalFormatted}</DAILYTOTALAMOUNT>` +
                      `<GROSSTOTAL>${grossTotalFormatted}</GROSSTOTAL>` +
                      `<TOTALCORRECTION>0.00</TOTALCORRECTION>` +
                      `<TOTALDISCOUNTS>0.00</TOTALDISCOUNTS>` +
                      `<TOTALSURCHARGE>0.00</TOTALSURCHARGE>` +
                      `<TICKETSVOID>0</TICKETSVOID>` +
                      `<TOTALVOIDRECEIPTS>0.00</TOTALVOIDRECEIPTS>` +
                      `<RECEIPTSFISCAL>${data.receiptsFiscalCount}</RECEIPTSFISCAL>` +
                      `<RECEIPTSNONFISCAL>0</RECEIPTSNONFISCAL>` +
                    `</TOTALS>` +
                    `<VATTOTALS>` +
                      `<VATTOTAL>` +
                        `<VATRATE>A</VATRATE>` +
                        `<NETTAMOUNT>${nettTotal.toFixed(2)}</NETTAMOUNT>` +
                        `<TAXAMOUNT>${taxTotal.toFixed(2)}</TAXAMOUNT>` +
                      `</VATTOTAL>` +
                    `</VATTOTALS>` +
                    `<CHANGES>` +
                      `<VATCHANGENUM>0</VATCHANGENUM>` +
                      `<HEADCHANGENUM>0</HEADCHANGENUM>` +
                      `<FMCHANGENUM>0</FMCHANGENUM>` +
                    `</CHANGES>` +
                  `</ZREPORT>`;

  const signature = signXmlContent(xmlBody, privateKeyPem);
  const fullEnvelope = `<EFDMS>${xmlBody}<EFDMSSIGNATURE>${signature}</EFDMSSIGNATURE></EFDMS>`;

  return {
    bodyXml: xmlBody,
    signature,
    fullXml: fullEnvelope
  };
}
