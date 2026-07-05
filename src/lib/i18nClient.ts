export type Lang = 'sw' | 'en';

export const clientDict = {
  sw: {
    'nav.search': 'Tafuta TV, Friji...',
    'nav.select_store': 'Chagua Duka',
    'nav.login': 'Ingia',
    'nav.logout': 'Toka',
    
    'hero.title': 'Shop na Orbi',
    'hero.subtitle': 'Wauzaji Walioidhinishwa na Wanaoaminika',
    'hero.desc': 'Biashara na wauzaji waliopimwa na kuidhinishwa pekee ndio wanaouza hapa. Tunahakikisha ubora, uhalisi, na viwango vya huduma pamoja na usalama wa malipo (PaySafe) chini ya mwavuli wa Orbi.',
    'hero.shop_now': 'Nunua Sasa',
    
    'feat.niche1': 'Elektroniki & Simu',
    'feat.niche2': 'Mavazi & Mitindo',
    'feat.niche3': 'Samani & Nyumbani',
    'feat.niche4': 'Afya & Urembo',
    'feat.niche5': 'Magari & Vipuri',
    'feat.niche6': 'Chakula & Vinywaji',
    
    'filter.sort': 'Panga:',
    'filter.default': 'Kawaida',
    'filter.asc': 'Bei (Ndogo - Kubwa)',
    'filter.desc': 'Bei (Kubwa - Ndogo)',
    'filter.newest': 'Vya Karibuni (Newest)',
    'filter.popular': 'Maarufu Zaidi (Most Popular)',
    
    'filter.categories': 'Kategoria',
    
    'form.login': 'Ingia / Jisajili',
    
    'prod.top_selling': 'Vifaa Vinavyouzwa Sana',
    'prod.top_selling_desc': 'Kutoka kwa wauzaji wetu walioidhinishwa',
    'prod.recommended': 'Vifaa Vilivyopendekezwa',
    'prod.recommended_desc': 'Kulingana na hitaji lako',
    'prod.recent': 'Historia ya Utafutaji',
    'prod.recent_desc': 'Bidhaa ulizozitazama hivi karibuni',
    'prod.discount': 'Punguzo',
    'prod.out_of_stock': 'Imeisha Stoku',
    'prod.buy_now': 'Nunua Sasa',
    'prod.wa_inquiry': 'Habari Orbi! Ningependa kuulizia kuhusu:',
    
    'cart.title': 'Kikapu Chako',
    'cart.empty_title': 'Kikapu kiko tupu',
    'cart.empty_desc': 'Ongeza vifaa kwenye kikapu ili kuendelea',
    'cart.continue': 'Endelea Kununua',
    'cart.checkout': 'Endelea Kulipa',
    'cart.total': 'Jumla:',
    'cart.items': 'Vifaa:',
    'cart.remove': 'Ondoa',

    'checkout.title': 'Malizia Oda',
    'checkout.total': 'Jumla Inayolipwa:',
    'checkout.form.name': 'Jina Kamili',
    'checkout.form.phone': 'Namba ya Simu',
    'checkout.form.address': 'Anwani ya Kufikisha (Location)',
    'checkout.form.payment': 'Njia ya Kulipia',
    'checkout.form.btn': 'Kamilisha Oda',
    'checkout.form.btn_confirm': 'Thibitisha Oda',
    'checkout.loading': 'Inatuma oda yako...',
    'checkout.loading_init': 'Inapakia...',
    'checkout.success': 'Oda Imepokelewa!',
    'checkout.success_desc': 'Asante kwa manunuzi. Fedha zako zitashikiliwa salama na Orbi Pay (Escrow) na hawatapewa muuzaji hadi uthibitishe kupokea mzigo wako.',
    'checkout.success_btn': 'Nimeelewa, Funga',
    'checkout.payment_inst': 'Maelekezo ya Malipo',
    'checkout.total_b': 'Jumla:',

    'hero.trust': 'Imethibitishwa na Orbi',
    
    'prod.none': 'Hakuna bidhaa iliyopatikana.',
    
    'contact.title': 'Una Swali Lolote?',
    'contact.desc': 'Tutumie ujumbe hapa, tutakujibu mapema iwezekanavyo kuhusu masuala yako yoyote.',
    'contact.wa_support': 'WhatsApp Support Inapatikana',
    'contact.form.name': 'Jina Lako',
    'contact.form.phone': 'Namba ya Simu',
    'contact.form.msg': 'Ujumbe Wako',
    'contact.form.btn': 'Tuma Ujumbe',
    'contact.success': 'Ujumbe umetumwa! Tutakutafuta hivi punde.',
    
    'footer.desc': 'Duka la kimtandao la kuaminika ambalo linawaleta pamoja wauzaji waliothibitishwa (Verified Sellers) na kulinda malipo yako.',
    'footer.contact': 'Mawasiliano (Contact)',
    'footer.location': 'Mahali (Location)',
    'footer.rights': 'Orbi Shop. Haki zote zimehifadhiwa.',
    'footer.admin': 'Admin / Seller Login',
  },
  en: {
    'nav.search': 'Search items...',
    'nav.select_store': 'Select Store',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    
    'hero.title': 'Shop with Orbi',
    'hero.subtitle': 'Curated Marketplace of Trusted Sellers',
    'hero.desc': 'Only pre-approved, vetted businesses and sellers. Every product carries an implicit Orbi guarantee of trust, with full payment protection and PaySafe services ensuring a safe and verified shopping experience.',
    'hero.shop_now': 'Shop Now',
    
    'feat.niche1': 'Electronics & Tech',
    'feat.niche2': 'Fashion & Apparel',
    'feat.niche3': 'Home & Furniture',
    'feat.niche4': 'Health & Beauty',
    'feat.niche5': 'Auto & Motors',
    'feat.niche6': 'Supermarket & Food',
    
    'filter.sort': 'Sort:',
    'filter.default': 'Default',
    'filter.asc': 'Price (Low - High)',
    'filter.desc': 'Price (High - Low)',
    'filter.newest': 'Newest First',
    'filter.popular': 'Most Popular',
    
    'filter.categories': 'Categories',
    
    'form.login': 'Login / Register',
    
    'prod.top_selling': 'Top Selling Products',
    'prod.top_selling_desc': 'From our curated verified sellers',
    'prod.recommended': 'Recommended Products',
    'prod.recommended_desc': 'Based on your needs',
    'prod.recent': 'Recently Viewed',
    'prod.recent_desc': 'Products you have viewed recently',
    'prod.discount': 'OFF',
    'prod.out_of_stock': 'Out of Stock',
    'prod.buy_now': 'Buy Now',
    'prod.wa_inquiry': 'Hello Orbi! I would like to inquire about:',
    
    'cart.title': 'Your Cart',
    'cart.empty_title': 'Cart is empty',
    'cart.empty_desc': 'Add products to your cart to continue',
    'cart.continue': 'Continue Shopping',
    'cart.checkout': 'Go to Checkout',
    'cart.total': 'Total:',
    'cart.items': 'Items:',
    'cart.remove': 'Remove',

    'checkout.title': 'Checkout',
    'checkout.total': 'Total Pending:',
    'checkout.form.name': 'Full Name',
    'checkout.form.phone': 'Phone Number',
    'checkout.form.address': 'Delivery Address',
    'checkout.form.payment': 'Payment Method',
    'checkout.form.btn': 'Complete Order',
    'checkout.form.btn_confirm': 'Confirm Order',
    'checkout.loading': 'Submitting your order...',
    'checkout.loading_init': 'Loading...',
    'checkout.success': 'Order Received!',
    'checkout.success_desc': 'Thank you for shopping. Your funds are held securely in Orbi Pay (Escrow) and will not be released to the seller until you confirm delivery.',
    'checkout.success_btn': 'I understand, Close',
    'checkout.payment_inst': 'Payment Instructions',
    'checkout.total_b': 'Total:',

    'hero.trust': 'Orbi Verified & Protected',

    'prod.none': 'No products found.',
    
    'contact.title': 'Have Any Questions?',
    'contact.desc': 'Send us a message here, we will reply as soon as possible. Orbi guarantees your safety and handles all dispute resolutions.',
    'contact.wa_support': 'WhatsApp Support Available',
    'contact.form.name': 'Your Name',
    'contact.form.phone': 'Phone Number',
    'contact.form.msg': 'Your Message',
    'contact.form.btn': 'Send Message',
    'contact.success': 'Message sent! We will contact you shortly.',
    
    'footer.desc': 'A curated marketplace of trusted sellers backed by Orbi’s fintech infrastructure, providing PaySafe and payment protection for every transaction.',
    'footer.contact': 'Contact',
    'footer.location': 'Location',
    'footer.rights': 'Orbi Shop. All rights reserved.',
    'footer.admin': 'Admin / Seller Login',
  }
};

export function t(lang: Lang, key: keyof typeof clientDict['sw']): string {
  return clientDict[lang][key] || clientDict['sw'][key] || key;
}
