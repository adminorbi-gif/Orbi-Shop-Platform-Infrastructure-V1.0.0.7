import React, { useState } from 'react';
import { 
  ChevronLeft, Info, ShieldCheck, Mail, MapPin, Phone, CheckCircle2, 
  XCircle, Building2, Globe, HeartHandshake, Lock,
  Scale, FileText, UserCheck, Eye, Truck, MessageSquare, Clock
} from 'lucide-react';
import { Lang } from '../lib/i18nClient';

interface AboutUsPageProps {
  onClose: () => void;
  lang: Lang;
  initialPage?: string;
}

export default function AboutUsPage({ onClose, lang, initialPage = 'about' }: AboutUsPageProps) {
  const [activePage, setActivePage] = useState(initialPage);

  const navItems = [
    { id: 'about', label: lang === "sw" ? "Kuhusu ORBI Shop" : "About ORBI Shop", icon: <Building2 size={18} /> },
    { id: 'how', label: lang === "sw" ? "Jinsi Inavyofanya Kazi" : "How ORBI Shop Works", icon: <Info size={18} /> },
    { id: 'security', label: lang === "sw" ? "Kituo cha Usalama" : "Security Center", icon: <Lock size={18} /> },
    { id: 'buyer', label: lang === "sw" ? "Ulinzi wa Mnunuzi" : "Buyer Protection", icon: <UserCheck size={18} /> },
    { id: 'seller', label: lang === "sw" ? "Ulinzi wa Muuzaji" : "Seller Protection", icon: <ShieldCheck size={18} /> },
    { id: 'contact', label: lang === "sw" ? "Wasiliana Nasi" : "Contact Us", icon: <Phone size={18} /> },
    { id: 'escrow', label: lang === "sw" ? "Sera ya Malipo & Escrow" : "Payment & Escrow Policy", icon: <ShieldCheck size={18} /> },
    { id: 'terms', label: lang === "sw" ? "Vigezo na Masharti" : "Terms & Conditions", icon: <Scale size={18} /> },
    { id: 'privacy', label: lang === "sw" ? "Sera ya Faragha" : "Privacy Policy", icon: <FileText size={18} /> }
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'about':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Kuhusu ORBI Shop" : "About ORBI Shop"}
              </h1>
              <p className="text-slate-500 text-sm">{lang === "sw" ? "Pata kujua zaidi kuhusu sisi" : "Get to know more about us"}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                 <Building2 className="text-amber-500" />
                 {lang === "sw" ? "Karibu ORBI Shop" : "Welcome to ORBI Shop"}
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                {lang === "sw" 
                  ? "ORBI Shop ni jukwaa salama la biashara mtandaoni linalounganisha wanunuzi na wauzaji katika mazingira yenye ulinzi wa hali ya juu. Tunalenga kuondoa changamoto za utapeli mtandaoni kwa kutumia mfumo wa "
                  : "ORBI Shop is a secure e-commerce platform that connects buyers and sellers in a highly protected environment. We aim to eliminate online fraud challenges by utilizing an "}
                <button onClick={() => setActivePage('security')} className="text-amber-600 font-semibold hover:underline">Orbi PaySafe</button>
                {lang === "sw"
                  ? " unaohakikisha kuwa malipo yanalindwa hadi mnunuzi apokee na kuthibitisha bidhaa au huduma aliyoiagiza."
                  : " system that ensures payments are protected until the buyer receives and confirms their order."}
              </p>
              <p className="text-slate-600 leading-relaxed text-sm">
                {lang === "sw"
                  ? "ORBI Shop ni huduma inayomilikiwa na ORBI Financial Corp, kampuni inayojihusisha na maendeleo ya mifumo ya kifedha na teknolojia za kisasa zinazolenga kujenga uaminifu, uwazi na usalama katika miamala ya kidijitali."
                  : "ORBI Shop is a service owned by ORBI Financial Corp, a company specializing in the development of modern financial systems and technologies aimed at building trust, transparency, and security in digital transactions."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50">
                <h3 className="text-lg font-bold text-amber-900 mb-3">{lang === "sw" ? "Dhamira Yetu" : "Our Mission"}</h3>
                <p className="text-amber-800/80 text-sm leading-relaxed">
                  {lang === "sw"
                    ? "Kujenga jukwaa salama zaidi la biashara mtandaoni barani Afrika ambapo kila muamala unafanyika kwa uaminifu, uwazi na usalama."
                    : "To build the most secure e-commerce platform in Africa where every transaction is conducted with trust, transparency, and safety."}
                </p>
              </div>
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                <h3 className="text-lg font-bold text-blue-900 mb-3">{lang === "sw" ? "Maono Yetu" : "Our Vision"}</h3>
                <p className="text-blue-800/80 text-sm leading-relaxed">
                  {lang === "sw"
                    ? "Kuwa jukwaa linaloaminika zaidi kwa biashara za mtandaoni Afrika kwa kulinda wanunuzi na wauzaji kupitia teknolojia za kisasa za kifedha."
                    : "To be the most trusted platform for online business in Africa by protecting buyers and sellers through modern financial technologies."}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <h3 className="text-lg font-bold text-slate-800 mb-4">{lang === "sw" ? "Kwa Nini Uchague ORBI Shop?" : "Why Choose ORBI Shop?"}</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 size={16} className="text-emerald-500" />
                     {lang === "sw" ? "Ulinzi wa malipo kupitia " : "Payment protection with "}
                     <button onClick={() => setActivePage('security')} className="text-amber-600 font-semibold hover:underline">Orbi PaySafe</button>.
                  </div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> <button onClick={() => setActivePage('seller')} className="hover:text-amber-600 transition">{lang === "sw" ? "Wauzaji waliothibitishwa." : "Verified sellers."}</button></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> {lang === "sw" ? "Ufuatiliaji wa oda kwa wakati halisi." : "Real-time order tracking."}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> <button onClick={() => setActivePage('contact')} className="hover:text-amber-600 transition">{lang === "sw" ? "Msaada wa wateja wa haraka." : "Fast customer support."}</button></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> <button onClick={() => setActivePage('security')} className="hover:text-amber-600 transition">{lang === "sw" ? "Mfumo wa kisasa wa kugundua udanganyifu." : "Modern fraud detection system."}</button></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> <button onClick={() => setActivePage('buyer')} className="hover:text-amber-600 transition">{lang === "sw" ? "Mazingira salama kwa wanunuzi." : "Safe business environment for buyers."}</button></div>
               </div>
            </div>
          </div>
        );

      case 'how':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Jinsi Inavyofanya Kazi" : "How ORBI Shop Works"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw"
                    ? "ORBI Shop hutumia mfumo wa "
                    : "ORBI Shop uses an "}
                 <button onClick={() => setActivePage('security')} className="text-amber-600 font-semibold hover:underline">Orbi PaySafe</button>
                 {lang === "sw"
                    ? " ambao hulinda fedha za mnunuzi hadi pale bidhaa au huduma itakapopokelewa na kuthibitishwa."
                    : " system that protects the buyer's funds until the product or service is received and verified."}
              </p>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-slate-100">
               {[
                 { no: 1, title: lang === "sw" ? "Tafuta Bidhaa" : "Find a Product", desc: lang === "sw" ? "Mnunuzi huchagua bidhaa au huduma kutoka kwa muuzaji aliyesajiliwa ndani ya ORBI Shop." : "The buyer selects a product or service from a registered seller on ORBI Shop." },
                 { no: 2, title: lang === "sw" ? "Weka Oda" : "Place Order", desc: lang === "sw" ? "Mnunuzi huweka oda kupitia mfumo rasmi wa ORBI Shop." : "The buyer places an order through the official ORBI Shop system." },
                 { no: 3, title: lang === "sw" ? "Fanya Malipo" : "Make Payment", desc: lang === "sw" ? "Malipo huwekwa kwenye akaunti salama ya Orbi PaySafe ya ORBI Shop. Muuzaji hapokei fedha moja kwa moja katika hatua hii." : "Payment is placed in the secure ORBI Shop Orbi PaySafe account. The seller does not receive the funds directly at this stage." },
                 { no: 4, title: lang === "sw" ? "Muuzaji Atume Bidhaa" : "Seller Ships Item", desc: lang === "sw" ? "Baada ya oda kuthibitishwa, muuzaji hutuma bidhaa kwa mnunuzi." : "Once the order is confirmed, the seller ships the item to the buyer." },
                 { no: 5, title: lang === "sw" ? "Mnunuzi Akague Bidhaa" : "Buyer Inspects Product", desc: lang === "sw" ? "Mnunuzi hupokea bidhaa na kupewa muda wa kukagua ubora, hali na uhalisia wake." : "The buyer receives the product and is given time to inspect its quality, condition, and authenticity." },
                 { no: 6, title: lang === "sw" ? "Fedha Kutolewa kwa Muuzaji" : "Funds Released to Seller", desc: lang === "sw" ? "Mnunuzi akiridhika, ORBI Shop huachilia malipo kwa muuzaji." : "If the buyer is satisfied, ORBI Shop releases the payment to the seller." },
                 { no: 7, title: lang === "sw" ? "Utatuzi wa Migogoro" : "Dispute Resolution", desc: lang === "sw" ? "Iwapo kutatokea tatizo, timu ya ORBI Shop itachunguza ushahidi uliopo na kusaidia kupata suluhisho la haki kwa pande zote mbili." : "If an issue arises, the ORBI Shop team investigates available evidence and helps find a fair resolution for both parties." }
               ].map(step => (
                  <div key={step.no} className="relative pl-10">
                     <span className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-amber-500 text-amber-600 flex items-center justify-center font-black text-sm z-10 shadow-sm">{step.no}</span>
                     <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-500">{step.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Kituo cha Usalama" : "Security Center"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Usalama wako ni kipaumbele chetu" : "Your security is our priority"}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-slate-600 leading-relaxed text-sm mb-6">
                 {lang === "sw" 
                    ? "ORBI Shop imejengwa kwa kuzingatia viwango vya juu vya usalama ili kulinda akaunti, mawasiliano na miamala ya watumiaji."
                    : "ORBI Shop is built with high-security standards to protect user accounts, communications, and transactions."}
               </p>

               <div className="space-y-4">
                  <div className="flex gap-4">
                     <div className="shrink-0 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><Lock size={20} /></div>
                     <div>
                        <h4 className="font-bold text-slate-800 mb-1">{lang === "sw" ? "Mfumo wa Orbi PaySafe" : "Orbi PaySafe System"}</h4>
                        <p className="text-sm text-slate-500">{lang === "sw" ? "Malipo yote yanayofanyika ndani ya ORBI Shop hulindwa hadi mnunuzi athibitishe kupokea bidhaa au huduma." : "All payments made within ORBI Shop are protected until the buyer confirms receipt of the product or service."}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="shrink-0 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><UserCheck size={20} /></div>
                     <div>
                        <h4 className="font-bold text-slate-800 mb-1">{lang === "sw" ? "Wauzaji Waliothibitishwa" : "Verified Sellers"}</h4>
                        <p className="text-sm text-slate-500">{lang === "sw" ? "Wauzaji hupitia mchakato wa uhakiki kabla ya kuruhusiwa kuuza kupitia jukwaa." : "Sellers undergo a verification process before being allowed to sell on the platform."}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="shrink-0 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><ShieldCheck size={20} /></div>
                     <div>
                        <h4 className="font-bold text-slate-800 mb-1">{lang === "sw" ? "Ulinzi wa Akaunti" : "Account Protection"}</h4>
                        <p className="text-sm text-slate-500">
                           {lang === "sw" ? "• Nenosiri salama." : "• Secure password."}<br/>
                           {lang === "sw" ? "• Uthibitishaji wa hatua mbili (2FA) pale inapopatikana." : "• Two-Factor Authentication (2FA) where available."}<br/>
                           {lang === "sw" ? "• Ufuatiliaji wa vifaa vinavyotumika kuingia kwenye akaunti." : "• Device logging and monitoring."}
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="shrink-0 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><Eye size={20} /></div>
                     <div>
                        <h4 className="font-bold text-slate-800 mb-1">{lang === "sw" ? "Ufuatiliaji wa Hatari" : "Risk Monitoring"}</h4>
                        <p className="text-sm text-slate-500">{lang === "sw" ? "Mifumo ya usalama ya ORBI Shop hufuatilia shughuli za jukwaa ili kugundua na kuzuia vitendo vya udanganyifu." : "ORBI Shop's security systems monitor platform activities to detect and prevent fraudulent activities."}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Do's */}
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500"/>
                  {lang === "sw" ? "Mambo ya Kufanya (DO)" : "What To Do"}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Fanya malipo yote ndani ya ORBI Shop." : "Make all payments within ORBI Shop."}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Weka mawasiliano yote ya biashara ndani ya mfumo wa ORBI Shop." : "Keep all business communication within the ORBI Shop system."}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Ripoti shughuli zozote zinazotia shaka." : "Report any suspicious activities."}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Hakikisha taarifa zako za akaunti zinalindwa." : "Ensure your account information is protected."}
                  </li>
                </ul>
              </div>

              {/* Don'ts */}
              <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                <h3 className="text-rose-800 font-bold mb-4 flex items-center gap-2">
                  <XCircle size={18} className="text-rose-500"/>
                  {lang === "sw" ? "Mambo ya Kuepuka (DON'T)" : "What NOT To Do"}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-rose-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Usifanye malipo nje ya mfumo wa ORBI Shop." : "Do not make payments outside the ORBI Shop system."}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-rose-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Usitume fedha moja kwa moja kwa muuzaji bila kutumia Orbi PaySafe." : "Do not send money directly to the seller without using Orbi PaySafe."}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-rose-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Usihamishe mazungumzo ya biashara kwenye majukwaa mengine kabla ya oda kukamilika." : "Do not move business conversations to other platforms before the order is complete."}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-rose-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    {lang === "sw" ? "Usitoe nywila au taarifa za akaunti kwa mtu mwingine yeyote." : "Do not share passwords or account details with anyone else."}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'buyer':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Ulinzi wa Mnunuzi" : "Buyer Protection"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Jinsi tunavyokulinda kama mnunuzi" : "How we protect you as a buyer"}
              </p>
            </div>
            
            <div className="grid gap-4">
               {[
                  { icon: <Lock size={20} />, title: lang === "sw" ? "Ulinzi wa Orbi PaySafe" : "Orbi PaySafe Protection", desc: lang === "sw" ? "Pesa yako inashikiliwa salama nasi mpaka mzigo uthibitishwe kufika." : "Your money is held safely by us until the item is confirmed delivered." },
                  { icon: <Scale size={20} />, title: lang === "sw" ? "Sera ya Kurejeshewa Pesa" : "Refund Policy", desc: lang === "sw" ? "Ikiwa bidhaa tofauti ililetwa au haikufika kabisa, unastahili kurudishiwa pesa asilimia 100." : "If a different item was delivered or it wasn't delivered at all, you get a 100% refund." },
                  { icon: <MessageSquare size={20} />, title: lang === "sw" ? "Utatuzi wa Migogoro" : "Dispute Resolution", desc: lang === "sw" ? "Timu yetu huingilia kati endapo muuzaji atakiuka makubaliano ili kutoa haki." : "Our team intervenes to provide justice if a seller breaches an agreement." },
                  { icon: <CheckCircle2 size={20} />, title: lang === "sw" ? "Udhibitishaji wa Oda" : "Order Verification", desc: lang === "sw" ? "Unapewa muda wa kutosha kukagua kama mzigo ndio uliouagiza." : "You are given ample time to verify if the received item matches your order." },
                  { icon: <Truck size={20} />, title: lang === "sw" ? "Ufuatiliaji Mzigo" : "Delivery Tracking", desc: lang === "sw" ? "Mifumo yetu hukupa taarifa za hatua kwa hatua hadi unapopokea mzigo wako." : "Our systems provide step-by-step updates until you receive your delivery." }
               ].map((item, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                     <div className="shrink-0 w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">{item.icon}</div>
                     <div>
                        <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        );

      case 'seller':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Ulinzi wa Muuzaji" : "Seller Protection"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Jinsi tunavyokulinda kama muuzaji" : "How we protect you as a seller"}
              </p>
            </div>
            
            <div className="grid gap-4">
               {[
                  { icon: <UserCheck size={20} />, title: lang === "sw" ? "Miamala kwa Wanunuzi Waliothibitika" : "Verified Buyer Transactions", desc: lang === "sw" ? "Zuia hasara kwa kuuza kwa wanunuzi waliothibitishwa kweli." : "Prevent losses by selling to authentic and verified buyers." },
                  { icon: <Lock size={20} />, title: lang === "sw" ? "Dhamana ya Malipo ya Orbi PaySafe" : "Orbi PaySafe Payment Guarantee", desc: lang === "sw" ? "Fedha ishahifadhiwa kwenye Orbi PaySafe kabla hujaagizwa kutuma mzigo. Uhakika wa kulipwa." : "Funds are secured in Orbi PaySafe before you're instructed to ship. Guaranteed payment." },
                  { icon: <MessageSquare size={20} />, title: lang === "sw" ? "Msaada Kwenye Migogoro" : "Dispute Support", desc: lang === "sw" ? "Ikiwa mteja analeta utata usio na msingi, ushahidi wako unakutea usipate hasara." : "If a buyer creates a baseless dispute, your evidence shields you from unwarranted losses." },
                  { icon: <ShieldCheck size={20} />, title: lang === "sw" ? "Uzuiaji wa Utapeli" : "Fraud Prevention", desc: lang === "sw" ? "Tunatumia akili mnemba kuzuia watapeli wasitumie jukwaa letu kama chambo." : "We use AI to prevent scammers from using our platform to bait you." },
                  { icon: <CheckCircle2 size={20} />, title: lang === "sw" ? "Beji ya Uaminifu na Viwango" : "Seller Performance & Trust Badge", desc: lang === "sw" ? "Pata alama maalumu (Badges) kadiri unavyofanya biashara nzuri na kupata mapitio mazuri." : "Earn Trust Badges to grow your reputation and sales based on good performance." }
               ].map((item, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                     <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">{item.icon}</div>
                     <div>
                        <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Wasiliana Nasi" : "Contact Us"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Tunapatikana kukupa msaada muda wote" : "We are available to support you at all times"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                  { icon: <MapPin size={24} className="text-rose-500" />, title: lang === "sw" ? "Makao Makuu" : "Head Office Address", val: "Kariakoo Alikoma na Magira Street, Dar es Salaam, Tanzania" },
                  { icon: <Phone size={24} className="text-emerald-500" />, title: lang === "sw" ? "Namba za Simu" : "Phone Numbers", val: "+255 764 258 114" },
                  { icon: <Mail size={24} className="text-amber-500" />, title: lang === "sw" ? "Barua Pepe ya Usaidizi" : "Email Support", val: "shop@orbifinancial.com" },
                  { icon: <MessageSquare size={24} className="text-blue-500" />, title: lang === "sw" ? "Msaada wa Moja kwa Moja" : "Live Chat", val: lang === "sw" ? "Inapatikana ndani ya App" : "Available in-app 24/7" },
                  { icon: <Clock size={24} className="text-purple-500" />, title: lang === "sw" ? "Muda wa Kazi" : "Business Hours", val: lang === "sw" ? "Jumatatu - Jumamosi (Saa 2 Asubuhi ~ 12 Jioni)" : "Mon - Sat (8 AM ~ 6 PM)" }
               ].map((item, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                     <div>{item.icon}</div>
                     <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4>
                        <p className="text-sm font-medium text-slate-600">{item.val}</p>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        );

      case 'escrow':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Sera ya Malipo & Escrow" : "Payment & Escrow Policy"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Jinsi Orbi Pay inavyoshikilia na kulinda fedha. Mfumo letu unafanya kazi kwa mtindo wa Escrow kulinda malipo yako." : "How Orbi Pay holds and protects funds. Our system operates as an Escrow service to protect your payments."}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
               {[
                  { title: lang === "sw" ? "Kuachilia Pesa Baada ya Mzigo Kupokelewa" : "Release After Delivery Confirmation", desc: lang === "sw" ? "Pesa itaachiliwa (release) kwa muuzaji mara tu mnunuzi anapothibitisha kuwa amepokea mzigo salama." : "Funds are released to the seller as soon as the buyer confirms they have safely received the delivery." },
                  { title: lang === "sw" ? "Kuzuia Pesa Wakati wa Mgogoro" : "Hold on Dispute", desc: lang === "sw" ? "Ikiwa mnunuzi atafungua mgogoro (dispute) kutokana na kasoro au mizigo isiyofika, pesa itazuiliwa na haitaenda kwa muuzaji hadi tatizo litatuliwe." : "If a buyer opens a dispute due to defects or undelivered items, the funds will be put on hold and won't go to the seller until the issue is resolved." },
                  { title: lang === "sw" ? "Kurejesha Pesa" : "Refund Policy", desc: lang === "sw" ? "Pesa yote itarejeshwa kwa mnunuzi iwapo mgogoro utaamuliwa kwa faida ya mnunuzi (k.m. mzigo bandia au umepotea)." : "A full refund is issued to the buyer if the dispute is resolved in the buyer's favor (e.g., fake item or lost delivery)." },
                  { title: lang === "sw" ? "Marejesho ya Kiasi" : "Partial Refund", desc: lang === "sw" ? "Kunaweza kufanyika marejesho ya kiasi fulani iwapo kutakuwa na makubaliano rasmi kati ya muuzaji na mnunuzi kupitia jukwaa letu." : "A partial refund may be issued if there is an official negotiated agreement between the seller and buyer through our platform." },
                  { title: lang === "sw" ? "Wajibu wa Upatanishi" : "Release After Arbitration", desc: lang === "sw" ? "Katika migogoro tata, admin wa ORBI Shop watafanya upatanishi na wana haki ya kuachilia ama kurejesha malipo kulingana na ushahidi." : "In complex disputes, ORBI Shop admins will arbitrate and reserve the right to either release or refund payment based on provided evidence." }
               ].map((item, i) => (
                  <div key={i}>
                     <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
               ))}
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Vigezo na Masharti" : "Terms & Conditions"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Sheria na taratibu za matumizi" : "Rules and usage guidelines"}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
               {[
                  { title: lang === "sw" ? "Sheria za Akaunti" : "Account Rules", desc: lang === "sw" ? "Watumiaji wanapaswa kutoa taarifa halisi tu na kudumisha usalama wa nenosiri. Akaunti yoyote inayohusika na utapeli inafungiwa moja kwa moja." : "Users must provide authentic information and maintain password security. Any account linked to fraud is permanently banned." },
                  { title: lang === "sw" ? "Sheria za Soko" : "Marketplace Rules", desc: lang === "sw" ? "Miamala yote na mawasiliano yanapaswa kubaki ndani ya mfumo wa ORBI Shop pekee. Kuhamisha wateja nje kunaadhibiwa." : "All transactions and communications must remain strictly within ORBI Shop. Circumventing our system results in penalties." },
                  { title: lang === "sw" ? "Bidhaa Zilizopigwa Marufuku" : "Prohibited Products", desc: lang === "sw" ? "Hairuhusiwi kuuza bidhaa bandia, dawa za kulevya, silaha, au vitu vyovyote vilivyokatazwa na sheria za jamhuri." : "Sale of counterfeits, illegal drugs, weapons, or any legally prohibited items is strictly forbidden." },
                  { title: lang === "sw" ? "Malipo & Kurejeshewa" : "Payments & Refunds", desc: lang === "sw" ? "Refund hutolewa kama mzigo haujafika kama ulivyoagizwa. Pesa inaachiliwa kwa muuzaji mara tu mzigo unapopitishwa na mnunuzi." : "Refunds are processed if the item isn't delivered as described. Funds unlock to the seller once the buyer accepts delivery." },
                  { title: lang === "sw" ? "Wajibu wa Muuzaji" : "Seller Obligations", desc: lang === "sw" ? "Kuwa mnyoofu kuhusu asili na sifa ya bidhaa. Kutuma mizigo kwa wakati uliokubaliwa." : "Must be truthful about product conditions. Items must be shipped within the agreed timeline." },
                  { title: lang === "sw" ? "Wajibu wa Mnunuzi" : "Buyer Obligations", desc: lang === "sw" ? "Kukagua mzigo kwa wakati, kujibu taarifa na kukamilisha mapitio inavyotakiwa. Kuweka malipo Orbi PaySafe kabla." : "Inspect deliveries efficiently, respond promptly, and submit funds into Orbi PaySafe before dispatch." },
                  { title: lang === "sw" ? "Ukomo wa Dhima" : "Limitation of Liability", desc: lang === "sw" ? "ORBI Shop hufanya kama muamuzi tu wa Orbi PaySafe na dhamana, kampuni haiwajibikii makosa ya kibinafsi au udanganyifu uliofanywa na mtumiaji iwapo alienda kinyume cha miongozo yetu." : "ORBI acts primarily as the Orbi PaySafe arbiter. The company lacks liability for personal errors if users violate established guidelines." }
               ].map((item, i) => (
                  <div key={i}>
                     <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
               ))}
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {lang === "sw" ? "Sera ya Faragha" : "Privacy Policy"}
              </h1>
              <p className="text-slate-500 text-sm">
                 {lang === "sw" ? "Jinsi tunavyolinda na kutumia taarifa zako" : "How we protect and use your data"}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
               {[
                  { title: lang === "sw" ? "Ukusanyaji wa Taarifa (Data Collection)" : "Data Collection", desc: lang === "sw" ? "Tunakusanya taarifa zako za kimsingi (jina, simu, barua pepe) na shughuli za manunuzi unazofanya ndani ya app." : "We collect basic profile information (name, phone, email) and transaction logs made inside the app." },
                  { title: lang === "sw" ? "Matumizi ya Taarifa (Data Usage)" : "Data Usage", desc: lang === "sw" ? "Taarifa zako zitatumika kuboresha mfumo wa usalama wetu, kuwezesha Orbi PaySafe, na kutambua shughuli za kitengo cha msaada." : "Your data helps us improve security accuracy, power Orbi PaySafe, and personalize your support experience." },
                  { title: lang === "sw" ? "Kushiriki Taarifa (Data Sharing)" : "Data Sharing", desc: lang === "sw" ? "Hatutauza taarifa zako kwa washirika wa tatu yeyote. Taarifa kama namba yako zitaonekana tu kwa muuzaji unapofanikisha oda." : "We never sell data. Specific info like contact methods only becomes visible to a seller upon a finalized order routing." },
                  { title: lang === "sw" ? "Hatua Zetu za Usalama (Security Measures)" : "Security Measures", desc: lang === "sw" ? "Taarifa zimehifadhiwa kwa njia ficha (encryption) katika seva zetu zenye ulizi thabiti kuzuia wadukuzi." : "Information is securely encrypted inside high-grade servers defending against intrusion." },
                  { title: lang === "sw" ? "Kuki (Cookies & Tracking)" : "Cookies & Tracking", desc: lang === "sw" ? "Tunatumia cookies ndogo kukumbuka lugha uliyochagua na kikao chako cha kuingia katika mfumo ili kukupa urahisi." : "We utilize minimal cookies strictly for remembering your language settings and session states." },
                  { title: lang === "sw" ? "Haki za Mtumiaji (User Rights)" : "User Rights", desc: lang === "sw" ? "Unayo haki ya kusasisha, kurekebisha, na kuomba kufutwa kwa akaunti yako muda wote kwa kufuata utaratibu ndani ya app." : "You have the right to edit, modify, or seamlessly request account deletion through built-in support mechanisms." },
                  { title: lang === "sw" ? "Mawasiliano kwa Faharagha (Contact for Privacy Requests)" : "Contact for Privacy Requests", desc: lang === "sw" ? "Kwa masuala yanayohusiana na haki za taarifa zako binafsi zinazomilikiwa nasi, tuma barua pepe kupitia privacy@orbifinancial.com." : "For queries related to your personal data footprints, email directly at privacy@orbifinancial.com." },
               ].map((item, i) => (
                  <div key={i}>
                     <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
               ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-50 flex flex-col font-sans animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Top Navigation */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="hidden sm:flex flex-col ml-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{lang === "sw" ? "Kituo cha Msaada" : "Help Center"}</span>
             <h2 className="text-sm font-bold text-slate-800 leading-none">ORBI Shop</h2>
          </div>
        </div>
        <img 
          src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" 
          alt="Orbi Shop" 
          className="h-16 md:h-20 object-contain"
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-[280px] bg-white border-r border-slate-200 hidden lg:flex flex-col overflow-y-auto shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 p-4">
           <div className="space-y-1">
              {navItems.map(item => (
                 <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                       activePage === item.id 
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                 >
                    <span className={activePage === item.id ? "text-amber-500" : "text-slate-400"}>
                       {item.icon}
                    </span>
                    {item.label}
                 </button>
              ))}
           </div>
           
           <div className="mt-auto pt-6 border-t border-slate-100/80">
              <p className="text-xs font-bold text-slate-400 text-center">
                 © {new Date().getFullYear()} ORBI Financial Corp.
              </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col items-center">
           {/* Mobile Horizontal Navigation */}
           <div className="w-full lg:hidden bg-white border-b border-slate-200 overflow-x-auto no-scrollbar shadow-sm z-10 sticky top-0">
              <div className="flex p-3 gap-2 w-max min-w-full px-4">
                 {navItems.map(item => (
                    <button
                       key={item.id}
                       onClick={() => setActivePage(item.id)}
                       className={`flex-none flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                          activePage === item.id 
                             ? "bg-slate-900 text-white shadow-sm" 
                             : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                       }`}
                    >
                       <span className={`${activePage === item.id ? "text-amber-500" : "text-slate-400"} scale-90`}>
                          {item.icon}
                       </span>
                       {item.label}
                    </button>
                 ))}
              </div>
           </div>

           <div className="w-full max-w-4xl p-4 sm:p-6 lg:p-8 xl:p-10 pb-20">
             {renderContent()}
           </div>
        </div>
      </div>
      
    </div>
  );
}
