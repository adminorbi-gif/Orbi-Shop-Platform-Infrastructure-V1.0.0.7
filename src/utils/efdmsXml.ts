/**
 * TRA EFDMS XML Schema Utility Module (Client-Side / Shared)
 * Handles transforming order & receipt objects into regulatory compliant TRA EFDMS XML schemas.
 * 
 * Supports escaping, item matching, VAT category distribution (rate 'A' at 18%, etc.),
 * and envelope generation for EFDMS verification.
 */

export interface EfdmsItemInput {
  id: string;          // Product/Item identifier
  description: string; // Plain-text description (will be capitalized and special chars escaped)
  quantity: number;    // Multiplier quantity
  amount: number;      // Item total sum/amount INCLUSIVE of tax
  taxCode?: number;    // EFDMS Tax Category (1 = 18% standard, 2 = Special, 3 = 0%, 4 = Relief, 5 = Exempt)
}

export interface EfdmsReceiptInput {
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM:SS
  tin: string;           // Seller TIN
  regId: string;         // Device Registered ID (issued during handshake)
  efdSerial: string;     // EFD virtual/physical Serial
  customerIdType: number;// 1=TIN, 2=DL, 3=VoterID, 4=Passport, 5=NationalID, 6=NIL / No ID
  customerId: string;    // ID text matching customerIdType (or "NIL")
  customerName: string;  // Customer name
  customerMobile: string;// Mobile telephone contact in 255XXXXXXXXX format
  receiptNum: number;    // Receipt counter serial / Global Counter
  dc: number;            // Daily Counter
  gc: number;            // Global Counter
  zNum: string;          // Z-Number (usually YYYYMMDD based on current session)
  receiptCode: string;   // Receipt code prefix from registration
  paymentType?: "CASH" | "CHEQUE" | "CCARD" | "EMONEY" | "INVOICE";
  items: EfdmsItemInput[];
}

export interface EfdmsZReportInput {
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM:SS
  vrn: string;           // VAT registration number
  tin: string;           // Taxpayer TIN
  taxOffice: string;     // Respective tax authority office
  regId: string;         // Handshake registration key
  zNumber: number;       // Sequential Z-report index
  efdSerial: string;     // Device serial string
  registrationDate: string; // Initial handshake date
  dailyTotalAmount: number; // Total receipts sum accumulated today
  grossTotal: number;    // Lifecycle gross aggregate sum
  receiptsFiscalCount: number; // Tally of tax verified receipts issued today
}

/**
 * Safely escape characters that disrupt XML structural interpretation.
 */
export function escapeXmlValue(value: string): string {
  if (!value) return "";
  return value
    .substring(0, 100) // Prevent extreme buffer loads
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a standard TRA registration XML envelope.
 */
export function buildRegistrationXml(tin: string, certKey: string, signatureValue?: string): string {
  const safeTin = escapeXmlValue(tin.replace(/[^0-9]/g, ""));
  const safeCertKey = escapeXmlValue(certKey.trim());
  const sig = signatureValue || `EMULATED_REG_SIGN_SHA1_${Math.random().toString(36).substring(2).toUpperCase()}`;

  const regData = `<REGDATA><TIN>${safeTin}</TIN><CERTKEY>${safeCertKey}</CERTKEY></REGDATA>`;
  return `<EFDMS>${regData}<EFDMSSIGNATURE>${sig}</EFDMSSIGNATURE></EFDMS>`;
}

/**
 * Formats a clean, compliant <RCT> body and envelopes it inside a signed <EFDMS> string.
 */
export function buildReceiptXml(data: EfdmsReceiptInput, signatureValue?: string): {
  rctBody: string;
  rctvnum: string;
  envelopeXml: string;
} {
  const safeDate = escapeXmlValue(data.date);
  const safeTime = escapeXmlValue(data.time);
  const safeTin = escapeXmlValue(data.tin.replace(/[^0-9]/g, ""));
  const safeRegId = escapeXmlValue(data.regId.trim());
  const safeEfdSerial = escapeXmlValue(data.efdSerial.trim());
  const safeCustIdType = data.customerIdType;
  const safeCustId = data.customerIdType === 6 ? "NIL" : escapeXmlValue(data.customerId.replace(/[^A-Za-z0-9-]/g, "").trim());
  const safeCustName = escapeXmlValue(data.customerName.toUpperCase().trim());
  const safeMobile = escapeXmlValue(data.customerMobile.replace(/[^0-9]/g, ""));
  const rctNum = data.receiptNum;
  const dc = data.dc;
  const gc = data.gc;
  const safeZNum = escapeXmlValue(data.zNum.replace(/[^0-9]/g, ""));
  const rctvnum = `${data.receiptCode.trim()}${gc}`;
  const safePaymentType = escapeXmlValue(data.paymentType || "EMONEY");

  let itemsSection = "";
  let accumTotalPreTax = 0;
  let accumTotalTaxed = 0;
  let standardTaxableNett = 0;
  let standardTaxableVat = 0;

  data.items.forEach((item, index) => {
    const qty = Number(item.quantity) || 1;
    const amt = Number(item.amount) || 0;
    const cleanId = escapeXmlValue(item.id || String(index + 1));
    const cleanDesc = escapeXmlValue(item.description.toUpperCase().trim());
    const taxCat = item.taxCode || 1; // Default to standard VAT rate 'A'

    itemsSection += `<ITEM>` +
                      `<ID>${cleanId}</ID>` +
                      `<DESC>${cleanDesc}</DESC>` +
                      `<QTY>${qty}</QTY>` +
                      `<TAXCODE>${taxCat}</TAXCODE>` +
                      `<AMT>${amt.toFixed(2)}</AMT>` +
                    `</ITEM>`;

    accumTotalTaxed += amt;

    if (taxCat === 1) {
      // 18% standard VAT division
      const nett = amt / 1.18;
      const vat = amt - nett;
      standardTaxableNett += nett;
      standardTaxableVat += vat;
      accumTotalPreTax += nett;
    } else {
      // Zero/Exempt rates do not count standard 18% inclusive
      accumTotalPreTax += amt;
    }
  });

  const totalTaxExclStr = accumTotalPreTax.toFixed(2);
  const totalTaxInclStr = accumTotalTaxed.toFixed(2);

  let vatGroupXml = "";
  if (standardTaxableVat > 0) {
    vatGroupXml = `<VATTOTAL>` +
                    `<VATRATE>A</VATRATE>` +
                    `<NETTAMOUNT>${standardTaxableNett.toFixed(2)}</NETTAMOUNT>` +
                    `<TAXAMOUNT>${standardTaxableVat.toFixed(2)}</TAXAMOUNT>` +
                  `</VATTOTAL>`;
  } else {
    vatGroupXml = `<VATTOTAL>` +
                    `<VATRATE>E</VATRATE>` +
                    `<NETTAMOUNT>${totalTaxInclStr}</NETTAMOUNT>` +
                    `<TAXAMOUNT>0.00</TAXAMOUNT>` +
                  `</VATTOTAL>`;
  }

  // Pure XML string, no unnecessary line returns to guarantee precise parsing signatures
  const rctBody = `<RCT>` +
                    `<DATE>${safeDate}</DATE>` +
                    `<TIME>${safeTime}</TIME>` +
                    `<TIN>${safeTin}</TIN>` +
                    `<REGID>${safeRegId}</REGID>` +
                    `<EFDSERIAL>${safeEfdSerial}</EFDSERIAL>` +
                    `<CUSTIDTYPE>${safeCustIdType}</CUSTIDTYPE>` +
                    `<CUSTID>${safeCustId}</CUSTID>` +
                    `<CUSTNAME>${safeCustName}</CUSTNAME>` +
                    `<MOBILENUM>${safeMobile}</MOBILENUM>` +
                    `<RCTNUM>${rctNum}</RCTNUM>` +
                    `<DC>${dc}</DC>` +
                    `<GC>${gc}</GC>` +
                    `<ZNUM>${safeZNum}</ZNUM>` +
                    `<RCTVNUM>${rctvnum}</RCTVNUM>` +
                    `<ITEMS>${itemsSection}</ITEMS>` +
                    `<TOTALS>` +
                      `<TOTALTAXEXCL>${totalTaxExclStr}</TOTALTAXEXCL>` +
                      `<TOTALTAXINCL>${totalTaxInclStr}</TOTALTAXINCL>` +
                      `<DISCOUNT>0.00</DISCOUNT>` +
                    `</TOTALS>` +
                    `<PAYMENTS>` +
                      `<PMTTYPE>${safePaymentType}</PMTTYPE>` +
                      `<PMTAMOUNT>${totalTaxInclStr}</PMTAMOUNT>` +
                    `</PAYMENTS>` +
                    `<VATTOTALS>${vatGroupXml}</VATTOTALS>` +
                  `</RCT>`;

  const sig = signatureValue || `EMULATED_RCT_SIGN_SHA1_${Math.random().toString(36).substring(2).toUpperCase()}`;
  const envelopeXml = `<EFDMS>${rctBody}<EFDMSSIGNATURE>${sig}</EFDMSSIGNATURE></EFDMS>`;

  return {
    rctBody,
    rctvnum,
    envelopeXml
  };
}

/**
 * Builds Z Report EFDMS Compliant XML elements.
 */
export function buildZReportXml(data: EfdmsZReportInput, signatureValue?: string): {
  zReportBody: string;
  envelopeXml: string;
} {
  const safeDate = escapeXmlValue(data.date);
  const safeTime = escapeXmlValue(data.time);
  const safeVrn = escapeXmlValue(data.vrn.toUpperCase().trim());
  const safeTin = escapeXmlValue(data.tin.replace(/[^0-9]/g, ""));
  const safeTaxOffice = escapeXmlValue(data.taxOffice.trim());
  const safeRegId = escapeXmlValue(data.regId.trim());
  const safeEfdSerial = escapeXmlValue(data.efdSerial.trim());
  const safeRegDate = escapeXmlValue(data.registrationDate);

  const totalAmountStr = data.dailyTotalAmount.toFixed(2);
  const grossTotalStr = data.grossTotal.toFixed(2);

  const standardNett = data.dailyTotalAmount / 1.18;
  const standardVat = data.dailyTotalAmount - standardNett;

  const zReportBody = `<ZREPORT>` +
                        `<DATE>${safeDate}</DATE>` +
                        `<TIME>${safeTime}</TIME>` +
                        `<VRN>${safeVrn}</VRN>` +
                        `<TIN>${safeTin}</TIN>` +
                        `<TAXOFFICE>${safeTaxOffice}</TAXOFFICE>` +
                        `<REGID>${safeRegId}</REGID>` +
                        `<ZNUMBER>${data.zNumber}</ZNUMBER>` +
                        `<EFDSERIAL>${safeEfdSerial}</EFDSERIAL>` +
                        `<REGISTRATIONDATE>${safeRegDate}</REGISTRATIONDATE>` +
                        `<USER>webapi</USER>` +
                        `<SIMIMSI>webapi</SIMIMSI>` +
                        `<TOTALS>` +
                          `<DAILYTOTALAMOUNT>${totalAmountStr}</DAILYTOTALAMOUNT>` +
                          `<GROSSTOTAL>${grossTotalStr}</GROSSTOTAL>` +
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
                            `<NETTAMOUNT>${standardNett.toFixed(2)}</NETTAMOUNT>` +
                            `<TAXAMOUNT>${standardVat.toFixed(2)}</TAXAMOUNT>` +
                          `</VATTOTAL>` +
                        `</VATTOTALS>` +
                        `<CHANGES>` +
                          `<VATCHANGENUM>0</VATCHANGENUM>` +
                          `<HEADCHANGENUM>0</HEADCHANGENUM>` +
                          `<FMCHANGENUM>0</FMCHANGENUM>` +
                        `</CHANGES>` +
                      `</ZREPORT>`;

  const sig = signatureValue || `EMULATED_Z_SIGN_SHA1_${Math.random().toString(36).substring(2).toUpperCase()}`;
  const envelopeXml = `<EFDMS>${zReportBody}<EFDMSSIGNATURE>${sig}</EFDMSSIGNATURE></EFDMS>`;

  return {
    zReportBody,
    envelopeXml
  };
}
