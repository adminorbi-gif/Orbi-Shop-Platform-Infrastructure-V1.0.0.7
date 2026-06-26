/**
 * Massive Specialized East-African E-Commerce / Retail Bilingual Dictionary
 * Designed for Swahili-English search expansion with robust singular, plural, local slang & misspelling handling.
 * Expanded version with thousands of entries.
 */
const BASE_BILINGUAL_DICTIONARY: Record<string, string[]> = {
  // ==========================================
  // COOLING Systems & Home Air Comfort
  // ==========================================
  "kiyoyozi": ["viyoyozi", "ac", "aircon", "air conditioner", "air conditioning"],
  "viyoyozi": ["kiyoyozi", "ac", "aircon", "air conditioner", "air conditioning"],
  "ac": ["kiyoyozi", "viyoyozi", "aircon", "air conditioner", "air conditioning"],
  "aircon": ["kiyoyozi", "viyoyozi", "ac", "air conditioner", "air conditioning"],
  "air conditioner": ["kiyoyozi", "viyoyozi", "ac", "aircon", "air conditioning"],
  "air conditioning": ["kiyoyozi", "viyoyozi", "ac", "aircon", "air conditioner"],
  "feni": ["fan", "feni", "cooler"],
  "fan": ["feni", "fan", "cooler"],
  "fans": ["feni", "fan", "cooler"],
  "cooler": ["feni", "fan", "cooler"],
  "cooling": ["cooling"],
  "baridi": ["baridi"],

  // ==========================================
  // FASHION, CLOTHING & APPAREL
  // ==========================================
  "nguo": ["nguo", "mavazi", "clothing", "clothes", "apparel", "wear", "dress", "outfit", "shati", "suruali", "skati", "gauni", "koti"],
  "clothes": ["nguo", "mavazi", "clothing", "apparel", "wear", "dress", "outfit", "shati", "suruali", "skati", "gauni", "koti"],
  "clothing": ["nguo", "mavazi", "clothes", "apparel", "wear", "dress", "outfit", "shati", "suruali", "skati", "gauni", "koti"],
  "mavazi": ["nguo", "clothes", "clothing", "apparel", "wear", "dress", "outfit", "suti", "shati", "suruali"],
  "apparel": ["nguo", "clothes", "clothing", "mavazi", "wear", "dress", "outfit"],
  "wear": ["nguo", "clothes", "clothing", "mavazi", "apparel", "dress", "outfit"],
  "outfit": ["nguo", "clothes", "clothing", "mavazi", "apparel", "wear", "dress"],
  "outfits": ["nguo", "clothes", "clothing", "mavazi", "apparel", "wear", "dress"],
  
  "shati": ["shirt", "shirts", "shati", "mashati", "nguo", "clothing", "t-shirt", "tshirt", "top", "tops", "blouse", "blauzi"],
  "mashati": ["shirt", "shirts", "shati", "nguo", "clothing", "t-shirt", "tshirt", "top", "tops"],
  "shirt": ["shati", "mashati", "shirt", "shirts", "nguo", "clothing", "t-shirt", "tshirt", "top", "tops", "blouse"],
  "shirts": ["shati", "mashati", "shirt", "nguo", "clothing", "t-shirt", "tshirt", "top", "tops"],
  
  "tshirt": ["t-shirt", "tshirt", "t-shirts", "tshirts", "shati", "nguo", "clothing", "top", "tops", "casual"],
  "t-shirt": ["t-shirt", "tshirt", "t-shirts", "tshirts", "shati", "nguo", "clothing", "top", "tops"],
  "tshirts": ["t-shirt", "tshirt", "t-shirts", "tshirts", "shati", "nguo", "clothing", "top", "tops"],
  "t-shirts": ["t-shirt", "tshirt", "t-shirts", "tshirts", "shati", "nguo", "clothing", "top", "tops"],
  
  "suruali": ["pants", "trousers", "jeans", "suruali", "nguo", "clothing", "shorts", "kaptula", "shorts"],
  "pants": ["suruali", "pants", "trousers", "jeans", "nguo", "clothing", "shorts", "kaptula"],
  "trousers": ["suruali", "pants", "trousers", "jeans", "nguo", "clothing", "shorts", "kaptula"],
  "jeans": ["suruali", "pants", "trousers", "jeans", "nguo", "clothing", "denim"],
  "kaptula": ["shorts", "shorts", "kaptula", "suruali", "pants", "nguo"],
  "shorts": ["shorts", "kaptula", "suruali", "pants", "nguo"],
  "denim": ["jeans", "suruali", "pants", "trousers", "nguo"],

  "gauni": ["dress", "gown", "gauni", "magauni", "dresses", "nguo", "skirt", "skati", "urembo"],
  "magauni": ["dress", "gown", "gauni", "dresses", "nguo", "skirt", "skati"],
  "dress": ["gauni", "magauni", "dress", "dresses", "gown", "nguo", "skirt", "skati"],
  "dresses": ["gauni", "magauni", "dress", "gown", "nguo", "skirt", "skati"],
  "gown": ["gauni", "dress", "gown", "dresses", "nguo"],
  "gowns": ["gauni", "dress", "gown", "nguo"],
  
  "skati": ["skirt", "skirts", "skati", "nguo", "clothing", "dress", "gauni"],
  "skirt": ["skati", "skirt", "skirts", "nguo", "clothing", "dress", "gauni"],
  "skirts": ["skati", "skirt", "nguo", "clothing", "dress", "gauni"],

  "koti": ["jacket", "coat", "hoodie", "sweater", "koti", "makoti", "nguo", "clothing", "sweta"],
  "makoti": ["jacket", "coat", "hoodie", "sweater", "koti", "nguo", "clothing", "sweta"],
  "jacket": ["koti", "makoti", "jacket", "jackets", "coat", "hoodie", "sweater", "nguo", "sweta"],
  "jackets": ["koti", "makoti", "jacket", "coat", "hoodie", "sweater", "nguo", "sweta"],
  "coat": ["koti", "jacket", "coat", "sweater", "nguo"],
  "coats": ["koti", "jacket", "coat", "sweater", "nguo"],
  "hoodie": ["hoodie", "hoodies", "sweater", "sweta", "koti", "jacket", "nguo"],
  "hoodies": ["hoodie", "sweater", "sweta", "koti", "jacket", "nguo"],
  "sweta": ["sweater", "sweta", "hoodie", "koti", "jacket", "nguo"],
  "sweater": ["sweater", "sweta", "hoodie", "koti", "jacket", "nguo"],
  "sweaters": ["sweater", "sweta", "hoodie", "koti", "jacket", "nguo"],

  "suti": ["suit", "suits", "suti", "mavazi", "official", "formal", "nguo"],
  "suit": ["suti", "suit", "suits", "mavazi", "official", "formal", "nguo"],
  "suits": ["suti", "suit", "formal", "nguo"],

  "soksi": ["socks", "soksi"],
  "socks": ["soksi", "socks"],
  
  "chupi": ["underwear", "panties", "boxers", "chupi", "nguo za ndani", "singlet"],
  "underwear": ["chupi", "underwear", "panties", "boxers", "nguo za ndani"],
  "panties": ["chupi", "underwear", "panties", "nguo za ndani"],
  "boxers": ["chupi", "underwear", "boxers", "nguo za ndani"],
  "boxer": ["chupi", "underwear", "boxers", "nguo za ndani"],
  "singlet": ["chupi", "vest", "sleeveless", "nguo za ndani"],

  "kofia": ["cap", "hat", "kofia", "beanie"],
  "cap": ["kofia", "cap", "hat", "beanie"],
  "hat": ["kofia", "cap", "hat"],
  "hats": ["kofia", "cap", "hat"],

  "miwani": ["glasses", "sunglasses", "miwani", "lenses", "spectacles"],
  "glasses": ["miwani", "glasses", "sunglasses", "spectacles"],
  "sunglasses": ["miwani", "glasses", "sunglasses", "spectacles"],

  "mkanda": ["belt", "belts", "mkanda", "mikanda"],
  "belt": ["mkanda", "belt", "belts"],
  "belts": ["mkanda", "belt"],
  "tai": ["tie", "necktie", "tai"],
  "tie": ["tai", "tie", "necktie"],

  // ==========================================
  // SHOES & FOOTWEAR
  // ==========================================
  "viatu": ["shoes", "shoe", "viatu", "sneakers", "boots", "sandals", "slippers", "ndala", "raba", "clogs", "heels", "vifuniko", "makorofa"],
  "shoes": ["viatu", "shoes", "shoe", "sneakers", "boots", "sandals", "slippers", "ndala", "raba", "clogs", "heels", "makorofa"],
  "shoe": ["viatu", "shoes", "shoe", "sneakers", "boots", "sandals", "slippers", "ndala", "raba", "clogs", "heels"],
  "sneakers": ["viatu", "shoes", "sneakers", "sneaker", "raba", "sport shoes", "canvas"],
  "sneaker": ["viatu", "shoes", "sneakers", "raba"],
  "raba": ["viatu", "shoes", "sneakers", "raba", "michezo"],
  "boots": ["viatu", "shoes", "boots", "boot", "ngozi", "leather"],
  "boot": ["viatu", "shoes", "boots", "leather"],
  "sandals": ["viatu", "shoes", "sandals", "sandal", "ndala", "slippers", "chapati", "makorofa"],
  "sandal": ["viatu", "shoes", "sandals", "ndala", "slippers"],
  "ndala": ["viatu", "shoes", "sandals", "ndala", "slippers", "chapati"],
  "slippers": ["viatu", "shoes", "sandals", "ndala", "slippers", "chapati"],
  "chapati": ["slippers", "ndala", "sandals", "viatu"],
  "clogs": ["viatu", "shoes", "clogs", "crocs", "sandals"],
  "crocs": ["crocs", "clogs", "sandals", "viatu", "shoes"],
  "heels": ["viatu", "shoes", "heels", "high heels", "akina dada", "refu", "makorofa", "gauni"],
  "high heels": ["viatu", "shoes", "heels", "high heels", "makorofa"],
  "makorofa": ["heels", "high heels", "viatu", "shoes"],
  "leather": ["ngozi", "leather", "viatu", "mkanda", "bag"],

  // ==========================================
  // PHONES & MOBILE ACCESSORIES
  // ==========================================
  "simu": ["phone", "phones", "mobile", "smartphone", "cellphone", "android", "iphone", "redmi", "samsung", "kitochi"],
  "phone": ["simu", "phone", "phones", "mobile", "smartphone", "cellphone", "android", "iphone", "redmi", "samsung"],
  "phones": ["simu", "phone", "phones", "mobile", "smartphone", "cellphone", "android", "iphone", "redmi", "samsung"],
  "mobile": ["simu", "phone", "phones", "mobile", "smartphone", "cellphone", "android", "iphone", "redmi", "samsung"],
  "smartphone": ["simu", "phone", "phones", "mobile", "smartphone", "cellphone", "android", "iphone", "redmi", "samsung"],
  "cellphone": ["simu", "phone", "phones", "mobile", "smartphone"],
  "kitochi": ["simu", "phone", "tochi", "tochi", "ndogo"],
  "iphone": ["simu", "phone", "iphone", "iphones", "apple", "ios", "pro max"],
  "samsung": ["simu", "phone", "samsung", "galaxy", "android"],
  "redmi": ["simu", "phone", "redmi", "xiaomi", "android"],
  "android": ["simu", "phone", "android", "smartphone"],
  
  "chaja": ["charger", "chargers", "chaja", "cable", "usb", "power bank", "powerbank", "adapter"],
  "charger": ["chaja", "charger", "chargers", "cable", "usb", "power bank", "powerbank", "adapter"],
  "chargers": ["chaja", "charger", "cable", "usb", "powerbank"],
  "cable": ["cable", "cables", "usb", "waya", "chaja", "charger", "waya wa chaja"],
  "cables": ["cable", "usb", "waya", "chaja", "charger"],
  "usb": ["usb", "cable", "chaja", "charger"],
  "waya": ["cable", "cables", "charger", "chaja", "usb"],
  "powerbank": ["powerbank", "power bank", "powerbanks", "chaja", "charger", "betri", "battery"],
  "power bank": ["powerbank", "power bank", "powerbanks", "chaja", "charger", "betri", "battery"],
  "adapter": ["adapter", "adaptor", "chaja", "charger", "usb", "plug"],
  
  "earphone": ["earphone", "earphones", "headphone", "headphones", "headset", "earbuds", "buds", "bluetooth", "wireless"],
  "earphones": ["earphone", "earphones", "headphone", "headphones", "headset", "earbuds", "buds", "bluetooth", "wireless"],
  "headphone": ["earphone", "earphones", "headphone", "headphones", "headset", "earbuds", "buds", "bluetooth", "wireless"],
  "headphones": ["earphone", "earphones", "headphone", "headphones", "headset", "earbuds", "buds", "bluetooth", "wireless"],
  "earbuds": ["earphone", "earphones", "headphone", "headphones", "headset", "earbuds", "buds", "bluetooth", "wireless"],
  "buds": ["earphone", "earphones", "headphone", "headphones", "earbuds", "buds", "bluetooth"],
  "headset": ["headset", "headphones", "microphone", "microfoni"],
  
  "spika": ["speaker", "speakers", "spika", "subwoofer", "soundbar", "sound", "mziki", "bluetooth speaker", "amplicaya", "amplifier"],
  "speaker": ["speaker", "speakers", "spika", "subwoofer", "soundbar", "sound", "mziki", "bluetooth speaker", "amplifier"],
  "speakers": ["speaker", "speakers", "spika", "subwoofer", "soundbar", "sound", "mziki", "bluetooth speaker"],
  "subwoofer": ["subwoofer", "subwoofers", "spika", "speaker", "soundbar", "mziki", "sound", "bass"],
  "soundbar": ["soundbar", "spika", "speaker", "subwoofer", "tv", "mziki", "sound"],
  "sound": ["spika", "speaker", "subwoofer", "soundbar", "mziki", "sound", "earphones", "headphones"],
  "mziki": ["spika", "speaker", "subwoofer", "soundbar", "mziki", "radio", "guitar"],

  // ==========================================
  // COMPUTERS, LAPTOPS & ELECTRONICS
  // ==========================================
  "kompyuta": ["computer", "computers", "laptop", "laptops", "pakato", "desktop", "pc"],
  "computer": ["kompyuta", "computer", "computers", "laptop", "laptops", "pakato", "desktop", "pc"],
  "computers": ["kompyuta", "computer", "computers", "laptop", "laptops", "pakato", "desktop", "pc"],
  "laptop": ["kompyuta", "computer", "laptop", "laptops", "pakato", "notebook", "hp", "dell", "macbook", "lenovo"],
  "laptops": ["kompyuta", "computer", "laptop", "laptops", "pakato", "notebook"],
  "pakato": ["laptop", "laptops", "kompyuta", "computer", "pakato"],
  "desktop": ["computer", "desktop", "pc", "kompyuta"],
  "pc": ["computer", "pc", "desktop", "kompyuta"],
  
  "monitor": ["skrini", "screen", "monitor", "display"],
  "screen": ["skrini", "screen", "monitor", "display"],
  "skrini": ["skrini", "screen", "monitor"],
  "kioo": ["kioo", "glass", "tempered"],
  "mouse": ["mouse", "panya", "laptop", "computer", "keyboard"],
  "panya": ["mouse", "keyboard", "computer"],
  "keyboard": ["keyboard", "kibodi", "computer", "laptop", "mouse"],
  "kibodi": ["keyboard", "computer"],

  "tv": ["tv", "television", "runinga", "smart tv", "led tv", "flat screen"],
  "television": ["tv", "television", "runinga", "smart tv", "led tv", "flat screen"],
  "runinga": ["tv", "television", "runinga", "flat screen", "smart tv"],
  "king'amuzi": ["decoder", "dekoda", "king'amuzi", "ving'amuzi", "dstv", "startimes", "azam"],
  "ving'amuzi": ["decoder", "dekoda", "king'amuzi", "ving'amuzi", "dstv", "startimes", "azam"],
  "decoder": ["decoder", "dekoda", "king'amuzi", "ving'amuzi"],
  "dekoda": ["decoder", "dekoda", "king'amuzi", "ving'amuzi"],

  // ==========================================
  // TABLETS & E-READERS
  // ==========================================
  "tablet": ["tablet", "tab", "tabuleti", "ipad", "samsung tab", "ereader", "kindle"],
  "tablets": ["tablet", "tab", "tabuleti", "ipad", "samsung tab"],
  "tabuleti": ["tablet", "tab", "tabuleti", "ipad"],
  "ipad": ["tablet", "tabuleti", "ipad", "apple"],

  // ==========================================
  // PRINTERS & SCANNERS
  // ==========================================
  "printa": ["printer", "printa", "scanner", "scana", "ink", "cartridge", "toner"],
  "printer": ["printa", "printer", "scanner", "ink", "cartridge", "toner"],
  "scanner": ["scanner", "scana", "printa", "printer"],
  "ink": ["ink", "wino", "cartridge", "printa"],
  "cartridge": ["cartridge", "kartridge", "ink", "toner", "printa"],
  "toner": ["toner", "cartridge", "printa", "ink"],

  // ==========================================
  // CAMERAS & PHOTOGRAPHY
  // ==========================================
  "kamera": ["camera", "kamera", "photo", "picture", "video camera", "digital camera", "cctv", "security camera"],
  "camera": ["kamera", "camera", "digital camera", "cctv", "photo", "video"],
  "cctv": ["cctv", "security camera", "kamera", "surveillance", "kamera za usalama"],
  "gopro": ["gopro", "action camera", "kamera", "video", "michezo"],

  // ==========================================
  // GAMING & CONSOLES
  // ==========================================
  "mchezo wa video": ["game", "games", "playstation", "ps4", "ps5", "xbox", "nintendo", "joypad", "console"],
  "playstation": ["playstation", "ps4", "ps5", "sony", "game", "console"],
  "xbox": ["xbox", "microsoft", "game", "console"],
  "game": ["game", "video game", "mchezo", "playstation", "xbox", "console", "joystick"],
  "console": ["console", "playstation", "xbox", "game"],
  "joystick": ["joystick", "joypad", "gamepad", "controller"],

  // ==========================================
  // HOME APPLIANCES (KITCHEN & LAUNDRY)
  // ==========================================
  "friji": ["fridge", "freezer", "refrigerator", "jokofu", "friji", "cooling", "kitchen"],
  "fridge": ["fridge", "freezer", "refrigerator", "jokofu", "friji"],
  "refrigerator": ["fridge", "freezer", "refrigerator", "jokofu", "friji"],
  "jokofu": ["fridge", "freezer", "refrigerator", "jokofu", "friji"],
  "freezer": ["freezer", "fridge", "jokofu", "friji"],

  "microwave": ["microwave", "oven", "jiko", "cooker", "heating"],
  "oven": ["oven", "microwave", "jiko", "cooker", "baking"],

  "dishwasher": ["dishwasher", "mashine ya kusafisha vyombo", "jikoni"],
  
  "mashine ya kufulia": ["washing machine", "washer", "mashine ya nguo", "laundry", "samsung", "lg"],
  "washing machine": ["washing machine", "washer", "mashine ya kufulia", "mashine ya nguo", "laundry"],
  "washer": ["washing machine", "washer", "mashine ya kufulia"],

  "kettle": ["kettle", "heater", "birika", "hita", "chaaya", "tea"],
  "birika": ["kettle", "birika", "hita", "tea", "cookware"],
  "thermos": ["thermos", "flaski", "flask", "vikombe"],
  "flaski": ["thermos", "flaski", "flask"],

  "blenda": ["blender", "blenda", "juicer", "mixer", "kitchen", "appliances", "vyombo"],
  "blender": ["blender", "blenda", "juicer", "mixer", "kitchen", "appliances", "vyombo"],
  "juicer": ["juicer", "blender", "juisi", "matunda"],
  "mixer": ["mixer", "blender", "kitchen"],

  "toaster": ["toaster", "tosta", "mkate", "jikoni"],
  "pressure cooker": ["pressure cooker", "jiko la presha", "cooker", "sufuria ya presha"],

  // ==========================================
  // FURNITURE & HOME DECOR
  // ==========================================
  "samani": ["furniture", "samani", "kiti", "chair", "meza", "table", "sofa", "kochi", "kabati", "wardrobe"],
  "furniture": ["furniture", "samani", "kiti", "chair", "meza", "table", "sofa", "kochi", "kabati", "wardrobe"],
  "kiti": ["chair", "chairs", "kiti", "viti", "stool", "sofa", "samani"],
  "viti": ["chair", "chairs", "kiti", "viti", "sofa", "samani"],
  "chair": ["kiti", "viti", "chair", "chairs", "stool", "sofa", "samani"],
  "chairs": ["kiti", "viti", "chair", "chairs", "sofa", "samani"],
  "meza": ["table", "tables", "meza", "desk", "samani"],
  "table": ["meza", "table", "tables", "desk", "desk", "samani"],
  "tables": ["meza", "table", "tables", "desk", "samani"],
  "sofa": ["sofa", "sofas", "kochi", "makochi", "samani", "living room"],
  "kochi": ["sofa", "sofas", "kochi", "makochi", "samani"],
  "makochi": ["sofa", "sofas", "kochi", "makochi", "samani"],
  "kabati": ["cupboard", "wardrobe", "cabinet", "kabati", "makabati", "shuka", "clothes", "samani"],
  "wardrobe": ["kabati", "wardrobe", "cupboard", "samani"],
  "cabinet": ["kabati", "cabinet", "cupboard", "sideboard"],
  "stool": ["stool", "kiti", "samani"],
  "desk": ["desk", "meza", "office", "computer desk", "study table"],
  "bookcase": ["bookcase", "kabati la vitabu", "shelf", "rafu"],
  "shelf": ["shelf", "shelves", "rafu", "kabati"],
  "rafu": ["shelf", "rafu", "bookcase"],
  "dining table": ["dining table", "meza ya kulia", "table"],

  // ==========================================
  // BEDROOM, HOME TEXTILES & MATTRESSES
  // ==========================================
  "shuka": ["bedsheet", "bedsheets", "shuka", "mashuka", "kitanda", "godoro", "blanket", "blanketi", "mto", "pillow", "bedding"],
  "mashuka": ["bedsheet", "bedsheets", "shuka", "mashuka", "kitanda", "godoro", "blanket", "mto", "pillow", "bedding"],
  "bedsheet": ["shuka", "mashuka", "bedsheet", "bedsheets", "kitanda", "godoro", "blanket", "mto", "pillow", "bedding"],
  "bedsheets": ["shuka", "mashuka", "bedsheet", "bedsheets", "kitanda", "godoro", "blanket", "mto", "pillow", "bedding"],
  "bedding": ["shuka", "mashuka", "bedsheet", "bedsheets", "blanket", "pillow", "bedding"],
  
  "kitanda": ["bed", "beds", "kitanda", "vitanda", "godoro", "shuka", "bedroom"],
  "bed": ["bed", "beds", "kitanda", "vitanda", "godoro", "shuka", "bedroom"],
  "beds": ["bed", "beds", "kitanda", "vitanda", "godoro", "shuka"],
  "godoro": ["mattress", "mattresses", "godoro", "magodoro", "kitanda", "shuka"],
  "mattress": ["godoro", "magodoro", "mattress", "mattresses", "kitanda", "shuka"],
  "mattresses": ["godoro", "magodoro", "mattress", "kitanda", "shuka"],
  
  "blanketi": ["blanket", "blankets", "blanketi", "mablanketi", "shuka", "baridi", "bedding"],
  "blanket": ["blanketi", "blanket", "blankets", "shuka", "baridi", "bedding"],
  "blankets": ["blanketi", "blanket", "blankets", "shuka", "baridi", "bedding"],
  
  "mto": ["pillow", "pillows", "mto", "mito", "shuka", "kitanda", "cushion"],
  "mto wa kulalia": ["pillow", "pillows", "mto", "shuka"],
  "pillow": ["pillow", "pillows", "mto", "mito", "shuka", "kitanda"],
  "pillows": ["pillow", "pillows", "mto", "mito", "shuka", "kitanda"],
  "cushion": ["cushion", "mto", "sofa"],
  
  "neti": ["mosquito net", "net", "neti", "chandarua", "chandarua cha neti", "moskito"],
  "chandarua": ["mosquito net", "net", "neti", "chandarua"],
  "mosquito net": ["mosquito net", "net", "neti", "chandarua"],
  "net": ["mosquito net", "net", "neti", "chandarua"],

  // ==========================================
  // COSMETICS, BEAUTY & PERSONAL CARE
  // ==========================================
  "urembo": ["beauty", "cosmetics", "makeup", "perfume", "vipodozi", "mafuta", "salon", "lotion", "wanja", "poda", "wigi"],
  "vipodozi": ["beauty", "cosmetics", "makeup", "perfume", "vipodozi", "mafuta", "lotion", "wanja", "poda", "cream", "shampoo"],
  "beauty": ["urembo", "beauty", "cosmetics", "makeup", "perfume", "vipodozi", "mafuta"],
  "cosmetics": ["urembo", "beauty", "cosmetics", "makeup", "perfume", "vipodozi", "mafuta", "lotion"],
  "makeup": ["urembo", "beauty", "cosmetics", "makeup", "vipodozi", "lipstick", "foundation", "wanja", "poda"],
  
  "mafuta": ["oil", "lotion", "cream", "jelly", "body oil", "skincare", "mafuta", "lipshine", "shampoo", "nywele", "hair"],
  "lotion": ["mafuta", "body lotion", "cream", "skincare", "lotion", "moisturizer", "vaseline"],
  "cream": ["mafuta", "cream", "lotion", "skincare", "moisturizer", "face cream", "shave"],
  "oil": ["mafuta", "oil", "body oil", "hair oil", "skincare"],
  
  "pafyum": ["perfume", "pafyum", "cologne", "marashi", "deodorant", "body spray", "smell", "scent", "urembo"],
  "perfume": ["perfume", "pafyum", "cologne", "marashi", "deodorant", "body spray", "scent", "urembo"],
  "cologne": ["perfume", "pafyum", "cologne", "marashi", "deodorant", "scent"],
  "marashi": ["perfume", "pafyum", "cologne", "marashi", "scent"],
  "deodorant": ["perfume", "deodorant", "body spray", "rollon", "roll-on", "anti-perspirant"],
  "rollon": ["rollon", "deodorant", "roll-on"],
  
  "sabuni": ["soap", "sabuni", "shower gel", "body wash", "shampoo", "cleaning", "povu"],
  "soap": ["soap", "sabuni", "shower gel", "body wash", "shampoo", "cleaning"],
  "shampoo": ["shampoo", "soap", "sabuni", "hair", "nywele", "conditioner"],
  "conditioner": ["conditioner", "shampoo", "nywele"],
  
  "nywele": ["hair", "nywele", "wig", "wigi", "weave", "braids", "shampoo", "mafuta", "clipper", "mashine ya kusafisha"],
  "hair": ["hair", "nywele", "wig", "wigi", "weave", "braids", "shampoo", "mafuta"],
  "wigi": ["wig", "wigi", "weave", "hair", "nywele", "urembo"],
  "wig": ["wig", "wigi", "weave", "hair", "nywele", "urembo"],
  "weave": ["wig", "wigi", "weave", "hair", "nywele"],
  "braids": ["braids", "nywele", "hair", "weave"],
  "clipper": ["clipper", "mashine ya kunyolea", "nywele", "kinyozi"],
  "mashine ya kunyolea": ["clipper", "hair clipper", "kinyozi"],
  
  "wanja": ["mascara", "eyeliner", "makeup", "wanja"],
  "poda": ["powder", "poda", "face powder", "makeup"],
  "lipstick": ["lipstick", "gloss", "midomo", "makeup"],
  "foundation": ["foundation", "makeup", "cream"],
  "moisturizer": ["moisturizer", "lotion", "cream"],

  "shave": ["razor", "shaving cream", "kemikali za kunyoa", "nywele", "kinyozi"],
  "razor": ["razor", "shaving", "kunyoa"],
  "shaving cream": ["shaving cream", "shave", "kunyoa"],

  // ==========================================
  // JEWELRY & ACCESSORIES
  // ==========================================
  "vito": ["jewelry", "jewellery", "vito", "mkufu", "pete", "kidani", "bangili", "earrings"],
  "jewelry": ["jewelry", "jewellery", "vito", "mkufu", "pete", "kidani", "bangili", "earrings"],
  "mkufu": ["necklace", "chain", "mkufu", "mikufu", "vito", "dhahabu"],
  "necklace": ["necklace", "mkufu", "chain", "jewelry"],
  "pete": ["ring", "rings", "pete", "vito", "dhahabu"],
  "ring": ["ring", "pete", "rings", "jewelry"],
  "bangili": ["bracelet", "bangle", "bangili", "vito", "mikono"],
  "bracelet": ["bangili", "bracelet", "bangle", "jewelry"],
  "earrings": ["earrings", "earring", "helem", "vito", "masikio"],
  "helem": ["earrings", "helem", "vito"],

  // ==========================================
  // WATCHES & TIME PIECES
  // ==========================================
  "saa": ["watch", "watches", "clock", "saa", "smartwatch", "mkononi", "ukutani"],
  "watch": ["watch", "watches", "clock", "saa", "smartwatch", "mkononi"],
  "watches": ["watch", "watches", "clock", "saa", "smartwatch"],
  "smartwatch": ["smartwatch", "watch", "saa", "apple watch", "fitbit"],
  "clock": ["clock", "saa", "ukutani"],
  "wall clock": ["wall clock", "saa ya ukutani", "clock"],

  // ==========================================
  // BAGS & LUGGAGE
  // ==========================================
  "pochi": ["bag", "bags", "handbag", "purse", "backpack", "mkoba", "mikoba", "pochi", "wallet", "walleti", "urembo"],
  "mkoba": ["bag", "bags", "handbag", "purse", "backpack", "mkoba", "mikoba", "pochi", "wallet"],
  "mikoba": ["bag", "bags", "handbag", "purse", "backpack", "mkoba", "mikoba", "pochi"],
  "bag": ["bag", "bags", "handbag", "purse", "backpack", "mkoba", "mikoba", "pochi", "wallet", "briefcase"],
  "bags": ["bag", "bags", "handbag", "purse", "backpack", "mkoba", "mikoba", "pochi"],
  "handbag": ["handbag", "handbags", "pochi", "mkoba", "bag"],
  "handbags": ["handbag", "pochi", "mkoba", "bag"],
  "purse": ["purse", "pochi", "mkoba", "bag", "wallet"],
  "backpack": ["backpack", "backpacks", "mkoba", "bag", "shule", "school bag", "safari"],
  "backpacks": ["backpack", "mkoba", "bag", "school bag"],
  "wallet": ["wallet", "walleti", "pochi", "pesa", "card holder"],
  "walleti": ["wallet", "pochi", "card holder"],
  "briefcase": ["briefcase", "mkoba wa kazi", "bag", "office"],
  "suitcase": ["suitcase", "suti ya safari", "luggage", "safari bag"],
  "luggage": ["luggage", "suitcase", "safari bag", "bag"],
  "school bag": ["school bag", "mkoba wa shule", "backpack", "shule"],

  // ==========================================
  // KITCHENWARE & HOUSEHOLD UTENSILS
  // ==========================================
  "vyombo": ["kitchenware", "plates", "cups", "utensils", "dishes", "pans", "pot", "sufuria", "sahani", "vikombe", "vijiko", "jiko", "houseware"],
  "utensils": ["vyombo", "sufuria", "sahani", "cooking", "kitchenware", "plates", "cups", "spoons"],
  "kitchenware": ["vyombo", "sufuria", "sahani", "vikombe", "utensils", "appliances", "cookware", "plates"],
  "sufuria": ["sufuria", "masufuria", "pot", "pots", "cookware", "utensils", "vyombo", "pan", "pans", "frying pan", "cooking"],
  "masufuria": ["sufuria", "masufuria", "pot", "cookware", "utensils", "vyombo", "pan"],
  "pot": ["sufuria", "pot", "pots", "cookware", "utensils", "vyombo", "pan"],
  "pots": ["sufuria", "pot", "pots", "cookware", "utensils", "vyombo", "pan"],
  "pan": ["frying pan", "pan", "pans", "sufuria", "vyombo", "cookware"],
  "pans": ["frying pan", "pan", "pans", "sufuria", "vyombo"],
  "frying pan": ["frying pan", "pan", "sufuria", "cookware"],
  
  "sahani": ["plate", "plates", "dishes", "sahani", "vyombo", "bakuli", "bowl"],
  "plate": ["sahani", "plate", "plates", "dishes", "vyombo", "bakuli", "bowl"],
  "plates": ["sahani", "plate", "plates", "dishes", "vyombo", "bakuli"],
  "bakuli": ["bowl", "bowls", "bakuli", "sahani", "vyombo"],
  "bowl": ["bowl", "bakuli", "sahani", "vyombo"],
  "bowls": ["bowl", "bakuli", "sahani", "vyombo"],
  
  "vikombe": ["cup", "cups", "glass", "glasses", "vikombe", "kikombe", "mug", "mugs", "vyombo", "thermos"],
  "kikombe": ["cup", "kikombe", "vikombe", "mug", "vyombo"],
  "cup": ["vikombe", "kikombe", "cup", "cups", "mug", "vyombo"],
  "cups": ["vikombe", "kikombe", "cup", "cups", "mug", "vyombo"],
  "mug": ["mug", "mugs", "kikombe", "vikombe", "cup", "vyombo"],
  "mugs": ["mug", "kikombe", "vikombe", "cup", "vyombo"],
  "glass": ["glass", "glasses", "glasi", "vikombe", "vyombo"],
  "glasi": ["glass", "glasses", "glasi", "vikombe", "vyombo"],
  
  "vijiko": ["spoon", "spoons", "vijiko", "kijiko", "uma", "fork", "kisu", "knife", "vyombo"],
  "kijiko": ["spoon", "kijiko", "vijiko", "uma", "vyombo"],
  "spoon": ["vijiko", "kijiko", "spoon", "spoons", "uma", "fork", "vyombo"],
  "spoons": ["vijiko", "kijiko", "spoon", "spoons", "uma", "fork", "vyombo"],
  "uma": ["fork", "forks", "uma", "kijiko", "vijiko", "vyombo"],
  "fork": ["uma", "fork", "forks", "spoon", "vyombo"],
  "forks": ["uma", "fork", "spoon", "vyombo"],
  "kisu": ["knife", "knives", "kisu", "vyombo"],
  "knife": ["kisu", "knife", "knives", "vyombo"],
  "knives": ["kisu", "knife", "vyombo"],

  "jiko": ["cooker", "stove", "jiko", "majiko", "gas", "gesi", "oven", "microwave", "pressure cooker"],
  "cooker": ["cooker", "stove", "jiko", "majiko", "gas", "gesi", "oven"],
  "stove": ["cooker", "stove", "jiko", "gas", "gesi"],
  "gas": ["gas", "gesi", "jiko", "cooker", "stove", "cylinder", "mtungi"],
  "gesi": ["gas", "gesi", "jiko", "cooker", "stove", "mtungi wa gesi"],
  "cylinder": ["cylinder", "mtungi", "gesi", "gas"],
  "mtungi wa gesi": ["gas cylinder", "mtungi", "gesi"],
  
  // ==========================================
  // GROCERIES, FOOD & BEVERAGES
  // ==========================================
  "chakula": ["food", "groceries", "chakula", "mchele", "unga", "sukari", "mafuta ya kupikia", "biskuti", "vinywaji"],
  "food": ["food", "groceries", "chakula", "rice", "flour", "sugar", "cooking oil", "snack"],
  "groceries": ["food", "groceries", "chakula", "supermarket", "unga", "mchele", "sukari", "sabuni"],
  
  "mchele": ["rice", "mchele", "wali", "chakula", "grocery"],
  "rice": ["rice", "mchele", "wali", "chakula", "grocery"],
  "unga": ["flour", "unga", "sembe", "ngano", "chakula", "ugali", "mkate"],
  "flour": ["flour", "unga", "sembe", "ngano", "chakula"],
  "sembe": ["sembe", "flour", "unga", "ugali"],
  "ngano": ["ngano", "flour", "wheat", "unga"],
  
  "sukari": ["sugar", "sukari", "chai", "grocery"],
  "sugar": ["sugar", "sukari", "chai", "grocery"],
  "chumvi": ["salt", "chumvi", "chakula"],
  "salt": ["salt", "chumvi"],
  
  "mafuta ya kupikia": ["cooking oil", "mafuta ya kula", "mafuta ya kupikia", "salit", "korie", "grocery"],
  "cooking oil": ["cooking oil", "mafuta ya kula", "mafuta ya kupikia", "salit", "korie", "grocery"],
  "mafuta ya kula": ["cooking oil", "mafuta ya kula", "mafuta ya kupikia", "salit", "korie", "grocery"],
  "salit": ["salit", "cooking oil", "mafuta"],
  "korie": ["korie", "cooking oil", "mafuta"],
  
  "maziwa": ["milk", "maziwa", "mgando", "yoghurt", "chai", "grocery"],
  "milk": ["milk", "maziwa", "grocery", "yoghurt"],
  "yoghurt": ["yoghurt", "mgando", "maziwa"],
  
  "chai": ["tea", "chai", "majani ya chai", "sukari", "kikombe", "birika"],
  "tea": ["tea", "chai", "majani ya chai", "sukari"],
  "kahawa": ["coffee", "kahawa", "vinywaji", "kikombe", "mug"],
  "coffee": ["coffee", "kahawa", "vinywaji", "kikombe"],
  
  "vinywaji": ["drinks", "beverages", "vinywaji", "soda", "maji", "juisi", "juice", "water", "beer", "bia"],
  "drinks": ["drinks", "beverages", "vinywaji", "soda", "maji", "juisi", "juice", "water"],
  "beverages": ["drinks", "beverages", "vinywaji", "soda", "juisi", "coffee", "tea"],
  "soda": ["soda", "drinks", "vinywaji", "coke", "fanta", "pepsi"],
  "maji": ["water", "maji", "drinks", "vinywaji", "uhai", "kilimanjaro"],
  "water": ["water", "maji", "drinks", "vinywaji"],
  "juisi": ["juice", "juisi", "drinks", "vinywaji", "matunda"],
  "juice": ["juice", "juisi", "drinks", "vinywaji", "matunda"],
  "bia": ["beer", "beer", "pombe", "drinks"],
  "beer": ["beer", "bia", "drinks"],
  
  "biskuti": ["biscuit", "biscuits", "cookies", "biskuti", "vitafunio"],
  "biscuit": ["biscuit", "biscuits", "cookies", "biskuti"],
  "biscuits": ["biscuit", "biscuits", "cookies", "biskuti"],
  "mkate": ["bread", "mkate", "vitafunio", "chai"],
  "bread": ["bread", "mkate", "vitafunio", "chai"],

  "matunda": ["fruits", "matunda", "ndizi", "machungwa", "maembe", "juisi"],
  "mboga": ["vegetables", "mboga", "mbogamboga", "spinach", "kabeji"],
  "nyama": ["meat", "nyama", "beef", "kuku", "fish", "samaki"],
  "samaki": ["fish", "samaki", "seafood", "nyama"],
  "kuku": ["chicken", "kuku", "nyama", "poultry"],

  "spices": ["spices", "vikolezo", "binzari", "pilipili", "kitunguu", "chakula"],
  "binzari": ["binzari", "spices", "curry powder"],
  "pilipili": ["pilipili", "pepper", "spices"],
  "kitunguu": ["onion", "kitunguu", "vegetables"],
  "kitunguu saumu": ["garlic", "kitunguu saumu", "spices"],
  "tangawizi": ["ginger", "tangawizi", "spices"],

  // ==========================================
  // SPORTS, GYM & FITNESS
  // ==========================================
  "michezo": ["sports", "michezo", "mpira", "ball", "fitness", "gym", "jezi", "jersey", "t-shirt", "raba", "sneakers"],
  "sports": ["sports", "michezo", "mpira", "ball", "fitness", "gym", "jezi", "jersey", "raba", "sneakers"],
  "mpira": ["ball", "football", "soccer", "basketball", "mpira", "michezo", "kandanda"],
  "ball": ["ball", "football", "soccer", "basketball", "mpira", "michezo"],
  "football": ["ball", "football", "soccer", "mpira", "michezo", "jezi"],
  "soccer": ["ball", "football", "soccer", "mpira", "michezo", "jezi"],
  "jezi": ["jersey", "jerseys", "jezi", "nguo za michezo", "t-shirt", "football", "mpira"],
  "jersey": ["jersey", "jerseys", "jezi", "t-shirt", "football"],
  "jerseys": ["jersey", "jerseys", "jezi", "t-shirt", "football"],
  
  "gym": ["gym", "fitness", "mazoezi", "dumbbells", "treadmill", "yoga mat", "kamba", "skipping rope", "michezo", "weights"],
  "fitness": ["gym", "fitness", "mazoezi", "dumbbells", "yoga mat", "kamba", "michezo", "weights"],
  "mazoezi": ["gym", "fitness", "mazoezi", "dumbbells", "yoga mat", "weights"],
  "dumbbells": ["dumbbells", "weights", "gym", "fitness", "mazoezi", "vyuma"],
  "weights": ["dumbbells", "weights", "gym", "fitness", "mazoezi", "vyuma"],
  "yoga mat": ["yoga mat", "mkeka", "gym", "fitness", "mazoezi"],
  "mkeka wa yoga": ["yoga mat", "mkeka", "gym", "fitness"],
  "kamba ya kuruka": ["skipping rope", "kamba", "skipping", "gym", "fitness"],
  "skipping rope": ["skipping rope", "kamba", "skipping", "gym", "fitness"],
  "treadmill": ["treadmill", "gym", "fitness", "running machine"],
  "baiskeli": ["bicycle", "bike", "cycling", "michezo", "gym"],
  "bicycle": ["bicycle", "bike", "baiskeli", "cycling"],
  "bike": ["bicycle", "bike", "baiskeli", "michezo"],
  "cycling": ["bicycle", "bike", "baiskeli", "michezo"],

  // ==========================================
  // BABY, INFANT & KIDS
  // ==========================================
  "watoto": ["baby", "kids", "child", "watoto", "mtoto", "pampers", "nepi", "diapers", "vifaa vya watoto", "nguo za watoto", "toys", "michezo"],
  "baby": ["baby", "kids", "child", "watoto", "mtoto", "pampers", "nepi", "diapers", "toys"],
  "kids": ["baby", "kids", "child", "watoto", "mtoto", "pampers", "toys", "nguo za watoto"],
  "mtoto": ["baby", "kids", "child", "watoto", "mtoto", "pampers", "nepi", "diapers", "toys"],
  
  "pampers": ["pampers", "diapers", "nepi", "watoto", "baby", "diaper"],
  "diapers": ["pampers", "diapers", "nepi", "watoto", "baby", "diaper"],
  "diaper": ["pampers", "diapers", "nepi", "watoto", "baby", "diaper"],
  "nepi": ["pampers", "diapers", "nepi", "watoto", "baby", "diaper"],
  
  "toys": ["toys", "michezo ya watoto", "doll", "gari la mtoto", "watoto", "michezo"],
  "michezo ya watoto": ["toys", "michezo ya watoto", "doll", "watoto"],
  "stroller": ["stroller", "gari la mtoto", "watoto", "baby stroller"],
  "gari la mtoto": ["stroller", "gari la mtoto", "watoto", "baby stroller"],
  "baby bottle": ["baby bottle", "chupa ya maziwa", "chupa ya mtoto", "baby", "watoto"],
  "chupa ya mtoto": ["baby bottle", "chupa ya maziwa", "chupa ya mtoto", "baby", "watoto"],
  "baby clothes": ["nguo za watoto", "baby", "clothes", "watoto"],
  "nguo za watoto": ["baby clothes", "nguo za watoto", "watoto", "kids"],
  "cradle": ["cradle", "kitanda cha mtoto", "baby", "watoto"],
  "baby cot": ["baby cot", "cradle", "kitanda cha mtoto"],
  "baby food": ["baby food", "chakula cha mtoto", "cerelac", "mtoto"],

  // ==========================================
  // AUTOMOTIVE & MOTORCYCLE ACCESSORIES
  // ==========================================
  "gari": ["car", "cars", "gari", "magari", "engine oil", "mafuta ya injini", "tairi", "tire", "tyres", "boda", "pikipiki", "vifaa"],
  "car": ["car", "cars", "gari", "magari", "engine oil", "mafuta ya injini", "tairi", "tire", "tyres"],
  "cars": ["car", "cars", "gari", "magari", "engine oil", "tairi", "tire"],
  "pikipiki": ["motorcycle", "pikipiki", "boda", "bodaboda", "vifaa", " helmet", "kofia", "gari"],
  "motorcycle": ["motorcycle", "pikipiki", "boda", "bodaboda", "helmet"],
  "boda": ["motorcycle", "pikipiki", "boda", "bodaboda", "helmet"],
  "bodaboda": ["motorcycle", "pikipiki", "boda", "bodaboda", "helmet"],
  
  "tairi": ["tire", "tires", "tyre", "tyres", "tairi", "gari", "pikipiki"],
  "tire": ["tire", "tires", "tyre", "tyres", "tairi", "gari"],
  "tyre": ["tire", "tires", "tyre", "tyres", "tairi", "gari"],
  "tyres": ["tire", "tires", "tyre", "tyres", "tairi", "gari"],
  "tires": ["tire", "tires", "tyre", "tyres", "tairi", "gari"],
  
  "engine oil": ["engine oil", "mafuta ya injini", "mafuta ya gari", "mobil", "shell", "total", "gari", "pikipiki"],
  "mafuta ya injini": ["engine oil", "mafuta ya injini", "mafuta ya gari", "mobil", "shell", "total", "gari", "pikipiki"],
  "helmet": ["helmet", "kofia ya pikipiki", "boda", "pikipiki"],
  "car battery": ["car battery", "betri ya gari", "battery", "gari"],
  "battery": ["battery", "betri", "car battery", "power bank", "aa", "aaa", "umeme"],
  "betri": ["battery", "betri", "car battery", "power bank", "aa", "aaa", "umeme"],
  "spark plug": ["spark plug", "plugi", "gari", "pikipiki"],
  "plugi": ["spark plug", "plugi", "gari", "pikipiki"],
  "oil filter": ["oil filter", "filter", "engine oil"],
  "brake pads": ["brake pads", "brake", "gari", "pikipiki"],
  "car wash": ["car wash", "shampoo ya gari", "gari"],
  "floor mat": ["floor mat", "mat", "gari", "car mat"],

  // ==========================================
  // HARDWARE, BUILDING & TOOLS
  // ==========================================
  "vifaa": ["tools", "hardware", "vifaa", "vifaa vya ujenzi", "spana", "kufuli", "rangi", "sementi"],
  "tools": ["tools", "hardware", "vifaa", "spana", "wrench", "screwdriver", "hammer", "nyundo"],
  "hardware": ["tools", "hardware", "vifaa", "cement", "sementi", "paint", "rangi", "nondo"],
  
  "sementi": ["cement", "sementi", "ujenzi", "twiga", "dangote", "nyanza", "nondo", "vifaa vya ujenzi"],
  "cement": ["cement", "sementi", "ujenzi", "twiga", "dangote", "nondo", "vifaa vya ujenzi"],
  "nondo": ["nondo", "iron bars", "ujenzi", "vifaa vya ujenzi", "cement"],
  
  "rangi": ["paint", "paints", "rangi", "brashi", "brush", "wall paint", "goldstar", "berger"],
  "paint": ["paint", "paints", "rangi", "brashi", "brush", "wall paint"],
  "paints": ["paint", "rangi", "brashi", "brush"],
  "brashi": ["brush", "brashi", "rangi", "paint brush"],
  "brush": ["brush", "brashi", "rangi", "paint brush"],
  
  "spana": ["spana", "spanner", "wrench", "tools", "screwdriver", "screwdriver", "nyundo"],
  "spanner": ["spana", "spanner", "wrench", "tools", "screwdriver", "nyundo"],
  "wrench": ["spana", "spanner", "wrench", "tools"],
  "nyundo": ["hammer", "nyundo", "tools", "vifaa"],
  "hammer": ["hammer", "nyundo", "tools", "vifaa"],
  "screwdriver": ["screwdriver", "bisibisi", "screwdriver", "tools", "vifaa"],
  "bisibisi": ["screwdriver", "bisibisi", "tools", "vifaa"],
  
  "kufuli": ["lock", "locks", "kufuli", "padlock", "padlocks", "ufunguo", "key", "keys", "gate", "mlango"],
  "lock": ["lock", "locks", "kufuli", "padlock", "ufunguo", "key"],
  "locks": ["lock", "locks", "kufuli", "padlock", "ufunguo", "key"],
  "padlock": ["lock", "kufuli", "padlock", "ufunguo", "key"],
  "ufunguo": ["key", "keys", "ufunguo", "funguo", "kufuli", "lock"],
  "key": ["key", "keys", "ufunguo", "funguo", "kufuli", "lock"],
  "keys": ["key", "keys", "ufunguo", "funguo", "kufuli", "lock"],
  
  "electrical": ["electrical", "umeme", "waya", "switch", "socket", "plug", "bulb", "balbu"],
  "switch": ["switch", "socket", "plug", "umeme", "electrical"],
  "socket": ["socket", "switch", "plug", "extension"],
  "extension": ["extension", "extention", "kamba", "power strip"],
  "bulb": ["bulb", "balbu", "light", "taa", "umeme"],
  "balbu": ["bulb", "balbu", "taa", "umeme"],
  "taa": ["light", "lamp", "taa", "bulb", "balbu", "solar"],
  "lamp": ["lamp", "taa", "light", "desk lamp"],
  "solar": ["solar", "jua", "panel", "solar panel", "taa"],
  "solar panel": ["solar panel", "solar", "jua", "umeme"],

  // ==========================================
  // BOOKS & STATIONERY
  // ==========================================
  "vitabu": ["books", "book", "vitabu", "riwaya", "kamusi", "biblia", "shule"],
  "book": ["book", "vitabu", "riwaya", "kamusi", "biblia", "shule", "stationery"],
  "books": ["vitabu", "book", "riwaya", "kamusi", "biblia", "stationery"],
  "biblia": ["bible", "biblia", "book", "dini"],
  "kamusi": ["dictionary", "kamusi", "book"],
  "riwaya": ["novel", "riwaya", "book"],
  "shajara": ["diary", "notebook", "daftari", "stationery"],
  "daftari": ["notebook", "exercise book", "daftari", "shule"],
  "kalamu": ["pen", "kalamu", "pencil", "penseli", "stationery", "shule"],
  "pen": ["kalamu", "pen", "penseli", "pencil", "stationery"],
  "pencil": ["pencil", "penseli", "kalamu", "stationery"],
  "penseli": ["pencil", "penseli", "kalamu"],
  "eraser": ["eraser", "raba", "stationery"],
  "ruler": ["ruler", "rula", "stationery", "shule"],
  "rula": ["ruler", "rula", "stationery"],
  "stationery": ["stationery", "kalamu", "daftari", "ruler", "eraser"],

  // ==========================================
  // MUSICAL INSTRUMENTS
  // ==========================================
  "gitaa": ["guitar", "gitaa", "acoustic", "electric", "mziki"],
  "guitar": ["guitar", "gitaa", "acoustic", "electric", "mziki"],
  "piano": ["piano", "kinanda", "keyboard", "mziki"],
  "kinanda": ["piano", "kinanda", "keyboard"],
  "drum": ["drum", "drums", "ngoma", "mziki"],
  "ngoma": ["drum", "ngoma", "mziki", "traditional"],

  // ==========================================
  // PET SUPPLIES
  // ==========================================
  "mbwa": ["dog", "mbwa", "pet", "chakula cha mbwa", "collar"],
  "paka": ["cat", "paka", "pet", "chakula cha paka"],
  "pet food": ["pet food", "chakula cha wanyama", "mbwa", "paka"],
  "chakula cha mbwa": ["dog food", "chakula cha mbwa", "pet food"],
  "chakula cha paka": ["cat food", "chakula cha paka", "pet food"],
  "collar": ["collar", "kamba ya mbwa", "pet"],
  "aquarium": ["aquarium", "fish tank", "samaki", "pet"],

  // ==========================================
  // HEALTH & MEDICAL
  // ==========================================
  "dawa": ["medicine", "dawa", "tablets", "syrup", "first aid", "bandage", "hospital"],
  "medicine": ["medicine", "dawa", "painkiller", "antibiotics", "pharmacy"],
  "first aid": ["first aid", "first aid kit", "bendeji", "bandage"],
  "bandage": ["bandage", "bendeji", "first aid"],
  "bendeji": ["bandage", "bendeji", "first aid"],
  "mask": ["mask", "barakoa", "surgical mask", "afya"],
  "barakoa": ["mask", "barakoa", "afya"],
  "sanitizer": ["sanitizer", "sanitizer", "hand sanitizer", "afya"],
  "thermometer": ["thermometer", "kipimajoto", "afya"],
  "painkiller": ["painkiller", "panadol", "aspirin", "dawa"],
  "vitamins": ["vitamins", "virutubisho", "supplement", "afya"],
  "supplement": ["supplement", "virutubisho", "vitamins"],

  // ==========================================
  // GARDEN & OUTDOOR
  // ==========================================
  "bustani": ["garden", "bustani", "maua", "shamba", "jembe", "watering can"],
  "garden": ["garden", "bustani", "maua", "jembe", "mfuko wa maua"],
  "maua": ["flowers", "maua", "garden", "bustani", "vase"],
  "jembe": ["hoe", "jembe", "garden", "shamba"],
  "shamba": ["farm", "shamba", "garden", "mbegu", "fertilizer"],
  "mbegu": ["seeds", "mbegu", "shamba", "garden"],
  "fertilizer": ["fertilizer", "mbolea", "shamba"],
  "watering can": ["watering can", "dumu ya kumwagilia", "garden"],
  "hose": ["hose", "mipira ya maji", "garden"],
  
  "camping": ["camping", "kambi", "tent", "hema", "safari", "outdoor"],
  "tent": ["tent", "hema", "camping", "safari"],
  "hema": ["tent", "hema", "camping", "safari"],
  "sleeping bag": ["sleeping bag", "mfuko wa kulalia", "camping"],

  // ==========================================
  // MISC & CATCH-ALL SYNONYMS
  // ==========================================
  "offer": ["offer", "sale", "discount", "punguzo", "promo", "deal"],
  "punguzo": ["discount", "sale", "offer", "punguzo"],
  "discount": ["discount", "sale", "punguzo", "offer"],
  "new": ["new", "mpya", "arrival", "latest", "fresh"],
  "mpya": ["new", "mpya", "latest", "fresh"],
  "mitumba": ["second hand", "mitumba", "used", "secondhand", "chakavu"],
  "second hand": ["second hand", "mitumba", "used", "secondhand"],
  "used": ["second hand", "mitumba", "used", "secondhand"],
  "free delivery": ["free delivery", "bure", "delivery", "usafirishaji bure"],
  "delivery": ["delivery", "usafirishaji", "shipping"],
  "usafirishaji": ["delivery", "usafirishaji", "shipping"],
  "quality": ["quality", "bora", "standard", "high quality"],
  "bora": ["best", "bora", "quality", "excellent"],
  "brand": ["brand", "chapa", "original", "genuine"],
  "chapa": ["brand", "chapa", "original", "genuine"],
  "original": ["original", "asili", "genuine", "brand"],
  "genuine": ["original", "genuine", "chapa", "brand"]
};

const DICTIONARY_ADDITIONS: [string, string[]][] = [
  // ==========================================
  // EXPANSIONS: ELECTRICAL & POWER
  // ==========================================
  ["umeme", ["umeme", "electricity", "power", "solar", "jenereta", "generator", "inverter", "batari", "betri", "cable", "plug", "socket", "switch", "fuse"]],
  ["solar", ["solar", "jua", "solar panel", "solar system", "panel", "betri", "inverter", "umeme"]],
  ["inverter", ["inverter", "inverta", "power backup", "umeme", "solar", "betri"]],
  ["jenereta", ["generator", "jenereta", "power", "umeme", "petrol generator", "dizel"]],
  ["betri", ["betri", "battery", "battery", "aa", "aaa", "9v", "solar battery", "car battery", "betri ya gari", "betri ya solar"]],
  ["battery", ["betri", "battery", "aa", "aaa", "car battery"]],
  ["solar panel", ["solar panel", "panel", "jua", "solar", "solar power", "miale ya jua"]],
  ["power bank", ["power bank", "powerbank", "chaja ya dharura", "betri ya mkononi", "charger"]],
  ["powerbank", ["power bank", "powerbank", "chaja ya dharura", "betri ya mkononi", "charger"]],
  ["extension", ["extension", "extension cable", "kamba", "power strip", "socket multiplug"]],
  ["multiplug", ["multiplug", "extension", "power strip", "kamba"]],
  ["fuse", ["fuse", "fyuzi", "kinga", "umeme"]],
  ["light bulb", ["light bulb", "balbu", "taa", "led", "bulb", "bulb ya umeme"]],
  ["led", ["led", "light", "bulb", "taa", "energy saving", "saving bulb"]],
  ["chaja", ["charger", "chaja", "adapter", "usb charger", "fast charger", "wireless charger"]],
  ["adapter", ["adapter", "adaptor", "chaja", "usb adapter", "travel adapter"]],
  ["socket", ["socket", "soketi", "plug", "power point", "switch", "wall socket"]],
  ["plug", ["plug", "plagi", "socket", "adapter"]],
  ["wire", ["wire", "waya", "cable", "electric wire", "cable wire", "nyaya"]],
  ["cable", ["cable", "kebo", "wire", "waya", "usb cable", "extension", "charger cable", "data cable"]],

  // ==========================================
  // EXPANSIONS: AGRICULTURE & GARDEN
  // ==========================================
  ["kilimo", ["kilimo", "farming", "agriculture", "mbegu", "fertilizer", "mbolea", "shamba", "mashine za kilimo", "trekta", "irrigation"]],
  ["mbegu", ["mbegu", "seeds", "mbegu za mboga", "mbegu za mahindi", "mbegu za maua", "seedlings"]],
  ["mbolea", ["mbolea", "fertilizer", "mbolea ya chumvi", "dap", "can", "npk", "urea"]],
  ["fertilizer", ["fertilizer", "mbolea", "dap", "npk", "urea"]],
  ["shamba", ["shamba", "farm", "garden", "bustani", "mazao", "ufugaji"]],
  ["trekta", ["trekta", "tractor", "power tiller", "plough", "jembe la kukokotwa"]],
  ["irrigation", ["irrigation", "umwagiliaji", "sprinkler", "drip irrigation", "maji", "kilimo"]],
  ["kifaa cha umwagiliaji", ["sprinkler", "irrigation", "umwagiliaji", "drip kit"]],
  ["jembe", ["jembe", "hoe", "jembe la mkono", "plough", "kilimo"]],
  ["panga", ["panga", "machete", "shoka", "kisu cha shamba"]],
  ["shoka", ["shoka", "axe", "panga", "kisu"]],
  ["kisima", ["kisima", "well", "maji", "pampu ya maji", "borehole"]],
  ["pampu ya maji", ["pampu ya maji", "water pump", "pump", "kisima", "irrigation"]],
  ["mashine ya kupura", ["mashine ya kupura", "thresher", "kipepeo", "nafaka", "mchele"]],
  ["kipepeo", ["kipepeo", "winnower", "nafaka"]],
  ["nafaka", ["nafaka", "grains", "mahindi", "mchele", "ngano", "mtama"]],
  ["mahindi", ["mahindi", "maize", "corn", "nafaka", "mbegu"]],
  ["mpunga", ["mpunga", "paddy", "mchele", "nafaka"]],

  // ==========================================
  // EXPANSIONS: OFFICE FURNITURE & EQUIPMENT
  // ==========================================
  ["ofisi", ["ofisi", "office", "furniture", "desk", "chair", "kabati la faili", "computer", "printa", "stationery"]],
  ["meza ya ofisi", ["office desk", "desk", "meza", "ofisi", "computer desk", "workstation"]],
  ["kiti cha ofisi", ["office chair", "chair", "kiti", "ergonomic", "revolving chair", "kiti cha ofisi"]],
  ["kabati la faili", ["filing cabinet", "kabati la faili", "cabinet", "ofisi", "stationery"]],
  ["whiteboard", ["whiteboard", "board", "marker", "white board", "ofisi", "meeting"]],
  ["marker", ["marker", "marker pen", "whiteboard marker", "pen", "stationery"]],
  ["projector", ["projector", "projecta", "screen", "ofisi", "presentation"]],
  ["screen ya projekta", ["projector screen", "screen", "projector"]],
  ["printa", ["printer", "printa", "laser printer", "inkjet", "all-in-one", "scanner", "ofisi"]],
  ["scanner", ["scanner", "scana", "printa", "document scanner"]],
  ["document scanner", ["document scanner", "scanner", "ofisi"]],
  ["shredder", ["shredder", "mashine ya kusaga karatasi", "paper shredder", "ofisi"]],
  ["laminator", ["laminator", "machine ya laminating", "ofisi"]],
  ["stationery", ["stationery", "vifaa vya ofisi", "karatasi", "kalamu", "daftari", "faili", "glue", "stapler"]],
  ["karatasi", ["karatasi", "paper", "printing paper", "a4", "a3", "ofisi"]],
  ["kalamu", ["kalamu", "pen", "ballpoint", "gel pen", "stationery"]],
  ["penseli", ["penseli", "pencil", "stationery"]],
  ["daftari", ["daftari", "notebook", "exercise book", "diary", "stationery"]],
  ["stapler", ["stapler", "staple", "stappler", "ofisi"]],
  ["staples", ["staples", "staple pin", "staple", "stapler"]],
  ["faili", ["faili", "file", "folder", "binder", "ofisi", "stationery"]],
  ["glue", ["glue", "gundi", "super glue", "glue stick", "stationery"]],
  ["gundi", ["glue", "gundi", "super glue", "glue stick", "stationery"]],
  ["calculator", ["calculator", "kikokotoo", "solar calculator", "ofisi", "stationery"]],
  ["kikokotoo", ["calculator", "kikokotoo"]],

  // ==========================================
  // EXPANSIONS: PERSONAL & HOME HYGIENE
  // ==========================================
  ["usafi", ["usafi", "cleaning", "hygiene", "detergent", "sabuni", "bleach", "disinfectant", "wipes", "mop"]],
  ["sabuni ya unga", ["detergent", "sabuni ya unga", "omo", "ariel", "wash", "nguo"]],
  ["sabuni ya maji", ["liquid soap", "sabuni ya maji", "hand wash", "shower gel"]],
  ["bleach", ["bleach", "blechi", "jik", "whitener", "dawa ya usafi"]],
  ["disinfectant", ["disinfectant", "dawa ya kuua viini", "detol", "savlon"]],
  ["wipes", ["wipes", "vitambaa vya kusafisha", "baby wipes", "disinfecting wipes", "wet wipes"]],
  ["mop", ["mop", "mopu", "deki", "cleaning", "sakafu"]],
  ["deki", ["deki", "mop", "squeegee", "sakafu"]],
  ["brashi ya kusafisha", ["scrubbing brush", "brush", "cleaning", "sakafu", "bathroom"]],
  ["hand wash", ["hand wash", "sabuni ya mikono", "liquid soap"]],
  ["sanitizer", ["sanitizer", "hand sanitizer", "sanitizer ya mikono", "afya"]],
  ["sabuni ya kipande", ["bar soap", "sabuni ya kipande", "sabuni", "bathing soap"]],
  ["taulo", ["taulo", "towel", "bath towel", "face towel"]],
  ["kitambaa", ["kitambaa", "cloth", "leso", "kanga", "cleaning cloth"]],
  ["kanga", ["kanga", "leso", "kitambaa", "nguo", "mavazi"]],
  ["leso", ["leso", "kanga", "kitambaa"]],

  // ==========================================
  // EXPANSIONS: PET FOOD & ACCESSORIES
  // ==========================================
  ["chakula cha mbwa", ["dog food", "chakula cha mbwa", "pet food", "mbwa", "pedigree", "dog chow"]],
  ["chakula cha paka", ["cat food", "chakula cha paka", "paka", "pet food", "whiskas", "friskies"]],
  ["pet food", ["pet food", "chakula cha wanyama", "mbwa", "paka", "bird seed", "fish food"]],
  ["bird seed", ["bird seed", "chakula cha ndege", "mbegu za ndege", "pet"]],
  ["fish food", ["fish food", "chakula cha samaki", "aquarium", "pet"]],
  ["collar", ["collar", "kamba ya mbwa", "kamba ya paka", "pet", "leash"]],
  ["leash", ["leash", "collar", "kamba ya mbwa", "kamba ya paka"]],
  ["aquarium", ["aquarium", "fish tank", "samaki", "pet", "water"]],
  ["cage", ["cage", "kizimba", "ndege", "hamster", "pet"]],
  ["kizimba", ["kizimba", "cage", "pet"]],
  ["bed ya mbwa", ["dog bed", "bed ya mbwa", "pet bed"]],
  ["toys za mbwa", ["dog toys", "toys za mbwa", "pet toys", "chew toy"]],

  // ==========================================
  // EXPANSIONS: TRAVEL & LUGGAGE
  // ==========================================
  ["safari", ["safari", "travel", "luggage", "suitcase", "begi", "backpack", "passport holder", "travel pillow"]],
  ["begi", ["begi", "bag", "mkoba", "travel bag", "duffel bag", "suitcase"]],
  ["suitcase", ["suitcase", "sanduku la safari", "hard case", "luggage", "kizimba cha safari"]],
  ["travel bag", ["travel bag", "begi ya safari", "duffel", "gym bag"]],
  ["passport holder", ["passport holder", "mfuko wa pasipoti", "wallet ya pasipoti"]],
  ["travel pillow", ["travel pillow", "mto wa safari", "neck pillow"]],
  ["luggage lock", ["luggage lock", "kufuli ya mzigo", "travel lock", "tsa lock"]],
  ["luggage tag", ["luggage tag", "lebo ya mzigo", "travel tag"]],
  ["money belt", ["money belt", "mkanda wa pesa", "travel security"]],

  // ==========================================
  // EXPANSIONS: BABY FEEDING & NURSING
  // ==========================================
  ["baby bottle", ["baby bottle", "chupa ya mtoto", "feeding bottle", "chupa ya maziwa"]],
  ["chupa ya maziwa", ["baby bottle", "chupa ya mtoto", "feeding bottle"]],
  ["nipple", ["nipple", "chuchu", "baby bottle"]],
  ["breast pump", ["breast pump", "pampu ya maziwa", "maziwa ya mama"]],
  ["baby food", ["baby food", "chakula cha mtoto", "cerelac", "uji", "puree"]],
  ["cerelac", ["cerelac", "baby food", "chakula cha mtoto"]],
  ["uji", ["uji", "baby food", "chakula cha mtoto"]],
  ["baby bib", ["baby bib", "kitambaa cha mtoto", "mtoto", "feeding"]],
  ["high chair", ["high chair", "kiti cha juu", "watoto"]],
  ["sterilizer", ["sterilizer", "stailiza", "baby bottle sterilizer", "chupa"]],

  // ==========================================
  // EXPANSIONS: MORE SLANG & LOCAL TERMS
  // ==========================================
  ["dula", ["dula", "kitengo cha pesa", "dollar", "fedha", "usd"]],
  ["kasheshe", ["kasheshe", "fujo", "gumzo", "michezo"]],
  ["mabox", ["mabox", "speaker", "spika", "mziki", "woofer"]],
  ["gari la mtaani", ["gari la mtaani", "car", "used car", "gari", "mitumba"]],
  ["bajaji", ["bajaji", "tricycle", "tuktuk", "motorcycle", "pikipiki"]],
  ["tuktuk", ["tuktuk", "bajaji", "tricycle", "pikipiki"]],
  ["boda", ["boda", "motorcycle", "pikipiki", "bajaji", "helmet"]],
  ["piki", ["piki", "pikipiki", "motorcycle"]],
  ["mzinga", ["mzinga", "pipe", "bomba", "mabomba", "plumbing"]],
  ["bomba", ["bomba", "pipe", "tap", "maji", "plumbing"]],
  ["plumbing", ["plumbing", "mabomba", "pipe", "bomba", "tap", "sinki"]],
  ["sinki", ["sinki", "sink", "karo", "jikoni", "bathroom"]],
  ["karo", ["karo", "sinki", "sink", "bathroom"]],
  ["dereva", ["dereva", "driver", "chauffeur", "gari"]],
  ["askari", ["askari", "guard", "security", "polisi", "watchman"]],
  ["mlinzi", ["mlinzi", "guard", "askari", "security"]],
  ["cctv", ["cctv", "kamera", "security camera", "dvr", "surveillance"]],
  ["dvr", ["dvr", "cctv", "kamera", "recorder"]],
  ["alarm", ["alarm", "kengele", "security alarm", "car alarm"]],

  // ==========================================
  // EXPANSIONS: MUSIC & ENTERTAINMENT
  // ==========================================
  ["gitaa", ["guitar", "gitaa", "acoustic", "electric guitar", "bass guitar", "mziki"]],
  ["piano", ["piano", "kinanda", "keyboard", "grand piano", "digital piano"]],
  ["kinanda", ["piano", "kinanda", "keyboard"]],
  ["drum", ["drum", "ngoma", "drum set", "bass drum", "snare", "mziki"]],
  ["ngoma", ["ngoma", "drum", "traditional drum", "mziki"]],
  ["mic", ["mic", "microphone", "maikrofoni", "wireless mic", "kondoo"]],
  ["microphone", ["microphone", "mic", "maikrofoni", "kondoo", "wireless mic"]],
  ["amplifier", ["amplifier", "amp", "amplicaya", "spika", "guitar amp", "mziki"]],
  ["mixer", ["mixer", "sound mixer", "audio mixer", "dj mixer", "mziki"]],
  ["dj", ["dj", "dj mixer", "controller", "party", "mziki"]],
  ["radio", ["radio", "redio", "fm", "bluetooth radio", "transistor"]],
  ["redio", ["radio", "redio", "fm"]],

  // ==========================================
  // EXPANSIONS: MORE PHONE & COMPUTER ACCESSORIES
  // ==========================================
  ["screen protector", ["screen protector", "kioo cha simu", "tempered glass", "kinga ya skrini", "kinga"]],
  ["tempered glass", ["tempered glass", "screen protector", "kioo cha simu", "kinga ya skrini"]],
  ["case ya simu", ["phone case", "cover ya simu", "simu", "pouch", "flip cover", "back cover"]],
  ["pouch", ["pouch", "case ya simu", "wallet case", "simu"]],
  ["flip cover", ["flip cover", "case ya simu", "book cover", "simu"]],
  ["memory card", ["memory card", "memori kadi", "sd card", "micro sd", "flash memory"]],
  ["sd card", ["sd card", "memory card", "micro sd", "camera", "phone"]],
  ["flash disk", ["flash disk", "flash drive", "usb stick", "memory", "computer"]],
  ["external hard disk", ["external hard disk", "hard disk", "storage", "backup", "computer"]],
  ["mouse pad", ["mouse pad", "panya", "mouse", "computer"]],
  ["laptop bag", ["laptop bag", "begi ya laptop", "bag", "computer", "backpack"]],
  ["laptop stand", ["laptop stand", "stand", "holder", "cooling pad", "computer"]],
  ["cooling pad", ["cooling pad", "laptop stand", "cooler", "fan"]],
  ["webcam", ["webcam", "camera", "video call", "computer"]],
  ["usb hub", ["usb hub", "hub", "multiport", "adapter", "laptop"]],
  ["hdmi cable", ["hdmi cable", "hdmi", "tv cable", "monitor cable", "video cable"]]
];

// Dynamically construct and export the final dictionary containing no duplicates!
export const BILINGUAL_DICTIONARY: Record<string, string[]> = { ...BASE_BILINGUAL_DICTIONARY };

for (const [key, synonyms] of DICTIONARY_ADDITIONS) {
  const lowKey = key.toLowerCase();
  const existing = BILINGUAL_DICTIONARY[lowKey] || [];
  const merged = Array.from(new Set([
    ...existing.map(s => s.toLowerCase()),
    ...synonyms.map(s => s.toLowerCase())
  ]));
  BILINGUAL_DICTIONARY[lowKey] = merged;
}