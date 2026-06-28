export type Lang = 'sw' | 'en';

export const adminDict = {
  sw: {
    'login.wrong_pwd': 'Nenosiri si sahihi!',
    'login.title': 'Orbi Seller / Admin Portal',
    'login.pwd_label': 'Nenosiri',
    'login.btn': 'Ingia',
    
    'sidebar.title': 'Orbi Admin Portal',
    'sidebar.dashboard': 'Dashibodi',
    'sidebar.products': 'Bidhaa',
    'sidebar.orders': 'Oda',
    'sidebar.promos': 'Promosheni',
    'sidebar.campaigns': 'Kampeni za Kulenga',
    'sidebar.messages': 'Ujumbe',
    'sidebar.customers': 'Wateja',
    'sidebar.invoice': 'Invoice',
    'sidebar.settings': 'Mipangilio',
    'sidebar.logout': 'Toka Akaunti',
    'sidebar.store': 'Rudi Dukani',
    'sidebar.desc': 'Dhibiti Mfumo Wako',
    
    'dash.title': 'Usimamizi (Dashboard)',
    'dash.desc': 'Muhtasari wa mauzo na takwimu za wateja',
    'dash.tot_prod': 'Jumla ya Bidhaa',
    'dash.new_cust': 'Wateja Wapya',
    'dash.tot_ord': 'Jumla ya Oda',
    'dash.tot_sales': 'Mauzo Yote',
    'dash.quick_add_prod': 'Ongeza Bidhaa',
    'dash.quick_add_promo': 'Weka Promosheni',
    'dash.quick_msg': 'Tazama Ujumbe',
    'dash.quick_store': 'Fungua Duka Lako',
    'dash.sales_growth': 'Ukuaji wa Mauzo (Sales)',
    'dash.sales_growth_desc': 'Muhtasari wa mauzo yaliyothibitishwa',
    'dash.cust_reg': 'Usajili wa Wateja',
    'dash.cust_reg_desc': 'Ongezeko la wateja wapya kwenye mfumo',
    'dash.recent_orders': 'Oda za Hivi Karibuni',
    'dash.recent_orders_desc': 'Angalia haraka oda 5 za hivi punde',
    'dash.see_all': 'Tazama Zote',
    'dash.none': 'Hakuna oda yoyote bado.',
    
    'comm.search_prod': 'Tafuta bidhaa (Jina, Kitambulisho, Kategoria)...',
    'comm.search_ord': 'Tafuta oda (ID, Jina, Simu)...',
    'comm.search_cust': 'Tafuta mteja (Jina, Simu, Barua pepe)...',
    
    'prod.title': 'Usimamizi wa Bidhaa',
    'prod.list': 'ORODHA YA BIDHAA',
    'prod.add': 'Ongeza Bidhaa',
    'prod.empty': 'Hakuna bidhaa zilizopatikana.',
    'prod.invalid_stock': 'Tafadhali weka idadi sahihi ya akiba, lazima iwe kubwa kuliko 0.',
    'prod.bulk_delete_confirm': 'Je, una uhakika unataka kufuta bidhaa zote zilizochaguliwa?',
    
    'ord.title': 'Oda za Wateja',
    'ord.list': 'ODA ZOTE',
    'ord.empty': 'Hakuna oda yoyote iliyopatikana.',
    
    'cust.title': 'Wateja Waliojisajili',
    'cust.list': 'ORODHA YA WATEJA',
    'cust.empty': 'Hakuna mteja yeyote bado.',
    
    'word.sales': 'Mauzo',
    'word.customers': 'Wateja',
    'word.id': 'ID',
    'word.name': 'Mteja',
    'word.date': 'Tarehe',
    'word.total': 'Jumla',
    'word.status': 'Hali'
  },
  en: {
    'login.wrong_pwd': 'Password is incorrect!',
    'login.title': 'Orbi Seller / Admin Portal',
    'login.pwd_label': 'Password',
    'login.btn': 'Login',
    
    'sidebar.title': 'Orbi Admin Portal',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.products': 'Products',
    'sidebar.orders': 'Orders',
    'sidebar.promos': 'Promotions',
    'sidebar.campaigns': 'Targeted Broadcasts',
    'sidebar.messages': 'Messages',
    'sidebar.customers': 'Customers',
    'sidebar.invoice': 'Invoice',
    'sidebar.settings': 'Settings',
    'sidebar.logout': 'Logout',
    'sidebar.store': 'Back to Store',
    'sidebar.desc': 'Manage your system',
    
    'dash.title': 'Management (Dashboard)',
    'dash.desc': 'Sales summary and customer statistics',
    'dash.tot_prod': 'Total Products',
    'dash.new_cust': 'New Customers',
    'dash.tot_ord': 'Total Orders',
    'dash.tot_sales': 'Total Sales',
    'dash.quick_add_prod': 'Add Product',
    'dash.quick_add_promo': 'Add Promotion',
    'dash.quick_msg': 'View Messages',
    'dash.quick_store': 'Open Your Store',
    'dash.sales_growth': 'Sales Growth',
    'dash.sales_growth_desc': 'Summary of confirmed sales',
    'dash.cust_reg': 'Customer Registration',
    'dash.cust_reg_desc': 'Increase of new customers in the system',
    'dash.recent_orders': 'Recent Orders',
    'dash.recent_orders_desc': 'Quick look at 5 recent orders',
    'dash.see_all': 'See All',
    'dash.none': 'No orders yet.',
    
    'comm.search_prod': 'Search product (Name, ID, Category)...',
    'comm.search_ord': 'Search order (ID, Name, Phone)...',
    'comm.search_cust': 'Search customer (Name, Phone, Email)...',
    
    'prod.title': 'Product Management',
    'prod.list': 'PRODUCT LIST',
    'prod.add': 'Add Product',
    'prod.empty': 'No products found.',
    'prod.invalid_stock': 'Please enter a valid stock quantity, it must be greater than 0.',
    'prod.bulk_delete_confirm': 'Are you sure you want to delete all selected products?',
    
    'ord.title': 'Customer Orders',
    'ord.list': 'ALL ORDERS',
    'ord.empty': 'No orders found.',
    
    'cust.title': 'Registered Customers',
    'cust.list': 'CUSTOMER LIST',
    'cust.empty': 'No customers yet.',
    
    'word.sales': 'Sales',
    'word.customers': 'Customers',
    'word.id': 'ID',
    'word.name': 'Customer',
    'word.date': 'Date',
    'word.total': 'Total',
    'word.status': 'Status'
  }
};

export function t(lang: Lang, key: keyof typeof adminDict['sw']): string {
  const currentLang = lang || 'sw';
  const dict = adminDict[currentLang] || adminDict['sw'];
  return dict[key] || adminDict['sw'][key] || key;
}
