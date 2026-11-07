/**
 * Journal & lookbook posts, written in OOLU's voice from the brand copy on ooluclothing.shop.
 * Swap in real campaign stories and photography as they come.
 *
 * Block types: p (paragraph), h2 (heading), quote, image, products (shop-the-look, by product slug),
 * list (labelled points, e.g. fit notes or care).
 */
export type JournalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "image"; src: string; alt: string; caption?: string; position?: string }
  | { type: "products"; title?: string; slugs: string[] }
  | { type: "list"; title?: string; items: { label: string; text: string }[] };

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Lookbook" | "Story" | "Process";
  date: string; // ISO
  cover: string;
  coverPosition?: string;
  blocks: JournalBlock[];
  /** Dutch version (title, excerpt and blocks; images and product slugs are reused when omitted). */
  nl?: { title: string; excerpt: string; blocks: JournalBlock[] };
};

export const JOURNAL: JournalPost[] = [
  {
    slug: "oolu-means-trust",
    title: "OOLU means trust",
    excerpt: "Born from West African roots and built with a global vision. What the name stands for, and why we wear it.",
    category: "Story",
    date: "2026-10-18",
    cover: "/images/brand/story-roots.jpg",
    nl: {
      title: "OOLU betekent vertrouwen",
      excerpt: "Geboren uit West-Afrikaanse wortels, gebouwd met een wereldwijde visie. Waar de naam voor staat, en waarom we hem dragen.",
      blocks: [
        { type: "p", text: "OOLU staat voor vertrouwen. Vertrouwen in jezelf, in je eigen pad en in waar je vandaan komt. Het begon als een woord en werd een manier van in het leven staan, en uiteindelijk een merk." },
        { type: "p", text: "Wie zijn wortels ergens anders heeft dan de stad waar hij opgroeit, kent het gevoel: je draagt twee werelden met je mee. Thuis klinkt anders dan op straat. De verhalen van je ouders spelen zich af op plekken die je misschien maar een paar keer hebt gezien. OOLU komt uit precies die ruimte, tussen West-Afrika en Amsterdam, en maakt er iets van om trots op te zijn in plaats van iets om uit te leggen." },
        { type: "image", src: "/images/brand/story-roots.jpg", alt: "Drie vrienden in OOLU “Your Roots.” t-shirts lopen door een straat", caption: "Draag je wortels. Vertel je verhaal." },
        { type: "h2", text: "Geworteld in Afrika. Gemaakt in Amsterdam." },
        { type: "p", text: "De wortels zijn West-Afrikaans; de stad is Amsterdam. Het een zonder het ander zou OOLU niet zijn. Uit Afrika komen de warmte, de kleur, het belang van familie en van je woord houden. Amsterdam geeft de snelheid, de straat en het idee dat je hier alles kunt worden wat je wilt, zolang je jezelf niet vergeet." },
        { type: "p", text: "Daarom maken we kleding voor mensen die met zelfvertrouwen bewegen, trouw blijven aan zichzelf en hun identiteit met trots dragen. Geen kostuum, geen verkleedpartij: gewoon de dingen die je elke dag aantrekt, met een boodschap die van jou is." },
        { type: "quote", text: "Het staat voor loyaliteit, verbinding, ambitie en de moed om in je eigen pad te geloven.", by: "OOLU" },
        { type: "h2", text: "Vier woorden, één naam" },
        {
          type: "list",
          items: [
            { label: "Loyaliteit", text: "Aan je mensen, aan waar je vandaan komt en aan wat je hebt beloofd. Vertrouwen bouw je met wat je doet als niemand kijkt." },
            { label: "Verbinding", text: "Met familie hier en daar, met vrienden die familie zijn geworden, met iedereen die hetzelfde verhaal herkent." },
            { label: "Ambitie", text: "Groot denken zonder te vergeten waar je begon. Je wortels houden je overeind; ze houden je niet tegen." },
            { label: "Moed", text: "In je eigen pad geloven, ook als het nog niet af is. Vooral dan." },
          ],
        },
        { type: "h2", text: "Your Roots. Your Journey. Your Story." },
        { type: "p", text: "Op de achterkant van veel van onze stukken staan drie korte zinnen. Ze zijn bewust zo simpel gehouden. Your Roots: waar je vandaan komt, wat je hebt meegekregen. Your Journey: de weg die je nu aflegt, met alle omwegen. Your Story: wat je ervan maakt, en wat je doorgeeft. Wie het shirt draagt, vult het zelf in." },
        { type: "p", text: "De Gambia Edition is daar het meest letterlijke voorbeeld van: een zwart shirt met details die geïnspireerd zijn op de Gambiaanse vlag op de mouw en bij de zoom, en de volledige boodschap op de rug. Het is een eerbetoon, maar het is ook een uitnodiging: iedereen heeft een plek waar het begon." },
        { type: "products", title: "De boodschap op je rug", slugs: ["oolu-gambia-edition-t-shirt", "oolu-t-shirt", "oolu-sleeveless-tee"] },
        { type: "h2", text: "Vertrouwen, ook in wat je koopt" },
        { type: "p", text: "Een naam als OOLU verplicht. Als we vertrouwen zeggen, moet je dat ook merken als je bij ons bestelt: eerlijke productinformatie, duidelijke maten, verzending die je kunt volgen en retourneren zonder gedoe. Klopt er iets niet, laat het ons weten. We lezen elk bericht." },
        { type: "image", src: "/images/brand/look-friends.jpg", alt: "Drie lachende vrienden op betonnen trappen in OOLU-shirts", caption: "Gemaakt voor de mensen om wie het draait." },
        { type: "p", text: "Uiteindelijk is OOLU niet van ons alleen. Het is van iedereen die het draagt en er een eigen verhaal aan toevoegt. Dat is het vertrouwen waar de naam om vraagt, en het vertrouwen dat we terug willen geven." },
        { type: "products", title: "Begin met de basics", slugs: ["oolu-t-shirt", "oolu-everyday-t-shirt", "oolu-washed-t-shirt-purple-green-gray"] },
      ],
    },
    blocks: [
      { type: "p", text: "OOLU means trust. Trust in yourself, trust in your journey and trust in where you come from. It started as a word, became a way of carrying ourselves, and eventually became a brand." },
      { type: "p", text: "If your roots are somewhere other than the city you grew up in, you know the feeling: you carry two worlds with you. Home sounds different from the street. Your parents' stories happen in places you may only have seen a handful of times. OOLU comes from exactly that space, between West Africa and Amsterdam, and turns it into something to be proud of instead of something to explain." },
      { type: "image", src: "/images/brand/story-roots.jpg", alt: "Three friends in OOLU “Your Roots.” t-shirts walking down a street", caption: "Wear your roots. Tell your story." },
      { type: "h2", text: "Rooted in Africa. Created in Amsterdam." },
      { type: "p", text: "The roots are West African; the city is Amsterdam. Without either one, OOLU wouldn't be OOLU. Africa gives the warmth, the colour, the weight of family and of keeping your word. Amsterdam gives the pace, the street, and the idea that you can become anything here, as long as you don't forget who you are." },
      { type: "p", text: "That's why we make clothing for people who move with confidence, stay true to themselves and carry their identity with pride. Not a costume, not a statement for one night: the things you put on every day, with a message that belongs to you." },
      { type: "quote", text: "It represents loyalty, connection, ambition and the courage to believe in your own path.", by: "OOLU" },
      { type: "h2", text: "Four words, one name" },
      {
        type: "list",
        items: [
          { label: "Loyalty", text: "To your people, to where you come from and to what you promised. Trust is built by what you do when nobody is watching." },
          { label: "Connection", text: "With family here and there, with friends who became family, with everyone who recognises the same story." },
          { label: "Ambition", text: "Thinking big without forgetting where you started. Your roots hold you up; they don't hold you back." },
          { label: "Courage", text: "Believing in your own path, even when it isn't finished yet. Especially then." },
        ],
      },
      { type: "h2", text: "Your Roots. Your Journey. Your Story." },
      { type: "p", text: "Many of our pieces carry three short lines on the back. They're kept that simple on purpose. Your Roots: where you come from, what you were given. Your Journey: the road you're on now, detours and all. Your Story: what you make of it, and what you pass on. Whoever wears the shirt fills in the rest." },
      { type: "p", text: "The Gambia Edition is the most literal example: a black tee with Gambian flag-inspired details on the sleeve and near the hem, and the full message across the back. It's a tribute, but it's also an invitation, because everyone has a place where it began." },
      { type: "products", title: "The message on your back", slugs: ["oolu-gambia-edition-t-shirt", "oolu-t-shirt", "oolu-sleeveless-tee"] },
      { type: "h2", text: "Trust, in what you buy too" },
      { type: "p", text: "A name like OOLU comes with a responsibility. If we say trust, you should feel it when you order from us: honest product information, clear sizing, shipping you can track and returns without the hassle. If something isn't right, tell us. We read every message." },
      { type: "image", src: "/images/brand/look-friends.jpg", alt: "Three friends laughing on concrete steps in OOLU t-shirts", caption: "Made for the people it's all about." },
      { type: "p", text: "In the end, OOLU isn't only ours. It belongs to everyone who wears it and adds their own story to it. That's the trust the name asks for, and the trust we want to give back." },
      { type: "products", title: "Start with the essentials", slugs: ["oolu-t-shirt", "oolu-everyday-t-shirt", "oolu-washed-t-shirt-purple-green-gray"] },
    ],
  },
  {
    slug: "the-tracksuit-lookbook",
    title: "The tracksuit — a lookbook",
    excerpt: "Tunnels, parks and late nights in the city: the OOLU tracksuit set, shot around Amsterdam.",
    category: "Lookbook",
    date: "2026-09-12",
    cover: "/images/brand/hero.jpg",
    coverPosition: "center 30%",
    nl: {
      title: "Het trainingspak — een lookbook",
      excerpt: "Tunnels, parken en late avonden in de stad: de OOLU-trainingspakset, geschoten in en rond Amsterdam.",
      blocks: [
        { type: "p", text: "In het trainingspak voelt OOLU het meest als zichzelf: makkelijk aan te trekken, scherp genoeg om gezien te worden. Jas en broek, samen of los te dragen. We namen hem mee de stad in, van een betonnen tunnel om middernacht tot een park in de middagzon, om te zien hoe hij zich houdt waar je echt leeft." },
        { type: "image", src: "/images/brand/hero.jpg", alt: "Model in het zwarte OOLU-trainingspak loopt door een tunnel", caption: "Look 01 — De tunnel. OOLU-trainingspakset, zwart.", position: "center 30%" },
        { type: "h2", text: "Look 01 — De tunnel" },
        { type: "p", text: "Laat op de avond, natte stenen, één rij lampen. Hier doet de windbreaker waarvoor hij gemaakt is: licht en ademend, met een waterafstotende buitenkant die een bui buiten houdt, en een broek die meebeweegt in plaats van tegen te werken. De witte piping vangt het licht precies genoeg. Draag de set compleet, rits tot boven, en houd de rest simpel: witte sneakers, niets aan je handen." },
        { type: "quote", text: "Leef in het nu.", by: "OOLU" },
        { type: "image", src: "/images/brand/tracksuit-duo.jpg", alt: "Twee modellen in bijpassende OOLU-trainingspakken", caption: "Look 02 — Samen. Twee sets, dezelfde energie." },
        { type: "h2", text: "Look 02 — Samen" },
        { type: "p", text: "Een trainingspak is op z'n best met twee. Bijpassende sets zonder dat het een uniform wordt: dezelfde set, ieder op z'n eigen manier gedragen. Het logo met de paarse onderstreping op de borst maakt de match; de rest is houding." },
        { type: "products", title: "Shop de look", slugs: ["oolu-tracksuit", "oolu-tracksuit-jacket", "oolu-tracksuit-pants"] },
        { type: "image", src: "/images/brand/made-to-move.jpg", alt: "Stel in OOLU-trainingspakken in een zonnig park", caption: "Look 03 — Het park. Gemaakt om te bewegen." },
        { type: "h2", text: "Look 03 — Het park" },
        { type: "p", text: "Dezelfde set, ander licht. Overdag in het park blijkt waarom het trainingspak bij OOLU het hart van de collectie is: je loopt, je zit op het gras, je fietst naar huis, en er hoeft niets anders. Draag de broek met een OOLU-shirt als het warmer wordt en knoop de jas om je middel." },
        { type: "image", src: "/images/brand/tracksuit-duo-2.jpg", alt: "Twee modellen in OOLU-trainingspakken, van voren en van achteren", caption: "Voor- en achterkant: het OOLU-teken over de schouders." },
        { type: "h2", text: "Hoe draag je hem" },
        {
          type: "list",
          items: [
            { label: "Compleet", text: "Jas en broek samen met schone witte sneakers. De makkelijkste look die er is, en de scherpste." },
            { label: "Alleen de jas", text: "Over een OOLU-shirt met jeans of cargo's. Licht genoeg om onder een grotere jas te dragen als het koud is." },
            { label: "Alleen de broek", text: "Met een oversized shirt of de Sleeveless Tee voor de sportschool, of met een hoodie voor de bank." },
            { label: "Pasvorm", text: "De set valt ontspannen. Twijfel je tussen twee maten, kijk dan in de maattabel op de productpagina." },
          ],
        },
        { type: "h2", text: "Hoodie of windbreaker?" },
        { type: "p", text: "Naast de windbreaker is er de Hoodie Tracksuit Set, in zwart en grijs: een zip-hoodie met kangoeroezak en geribde boorden, met een wijde sweatpants. Zachter, warmer en meer voor binnen en de koude maanden. De windbreaker is voor onderweg en voor als het weer niet meewerkt." },
        { type: "products", title: "Meer sets", slugs: ["oolu-windbreaker-tracksuit-set-black-grey", "oolu-hoodie-tracksuit-set-black", "oolu-hoodie-tracksuit-set-grey"] },
        { type: "h2", text: "Verzorging" },
        { type: "p", text: "Was de windbreaker binnenstebuiten op lage temperatuur met de ritsen dicht, zonder wasverzachter (die maakt de waterafstotende laag minder effectief) en laat hem aan de lucht drogen. Zo blijft hij licht en blijft de piping wit." },
      ],
    },
    blocks: [
      { type: "p", text: "The tracksuit is where OOLU feels most like itself: easy to throw on, sharp enough to be seen in. Jacket and pants, made to be worn together or apart. We took it out into the city, from a concrete tunnel at midnight to a park in the afternoon sun, to see how it holds up where you actually live." },
      { type: "image", src: "/images/brand/hero.jpg", alt: "Model in the black OOLU tracksuit walking through a tunnel", caption: "Look 01 — The tunnel. OOLU tracksuit set, black.", position: "center 30%" },
      { type: "h2", text: "Look 01 — The tunnel" },
      { type: "p", text: "Late night, wet stone, one row of lights. This is where the windbreaker does what it was made for: light and breathable, with a water-resistant shell that keeps a shower out, and pants that move with you instead of against you. The white piping catches just enough of the light. Wear the full set, zip it to the top, and keep everything else simple: white sneakers, nothing in your hands." },
      { type: "quote", text: "Live in the present.", by: "OOLU" },
      { type: "image", src: "/images/brand/tracksuit-duo.jpg", alt: "Two models in matching OOLU tracksuits", caption: "Look 02 — Together. Two sets, same energy." },
      { type: "h2", text: "Look 02 — Together" },
      { type: "p", text: "A tracksuit is at its best in twos. Matching sets without it turning into a uniform: the same set, each worn their own way. The logo with its purple underline on the chest makes the match; the rest is attitude." },
      { type: "products", title: "Shop the look", slugs: ["oolu-tracksuit", "oolu-tracksuit-jacket", "oolu-tracksuit-pants"] },
      { type: "image", src: "/images/brand/made-to-move.jpg", alt: "Couple in OOLU tracksuits in a sunlit park", caption: "Look 03 — The park. Made to move." },
      { type: "h2", text: "Look 03 — The park" },
      { type: "p", text: "Same set, different light. A day in the park shows why the tracksuit sits at the heart of OOLU: you walk, you sit on the grass, you cycle home, and nothing else is needed. When it warms up, wear the pants with an OOLU tee and tie the jacket around your waist." },
      { type: "image", src: "/images/brand/tracksuit-duo-2.jpg", alt: "Two models in OOLU tracksuits, seen from the front and the back", caption: "Front and back: the OOLU mark across the shoulders." },
      { type: "h2", text: "How to wear it" },
      {
        type: "list",
        items: [
          { label: "Full set", text: "Jacket and pants together with clean white sneakers. The easiest look there is, and the sharpest." },
          { label: "Jacket only", text: "Over an OOLU tee with jeans or cargos. Light enough to layer under a bigger coat when it's cold." },
          { label: "Pants only", text: "With an oversized tee or the Sleeveless Tee for the gym, or a hoodie for the sofa." },
          { label: "Fit", text: "The set has a relaxed fit. Between two sizes? Check the size guide on the product page." },
        ],
      },
      { type: "h2", text: "Hoodie or windbreaker?" },
      { type: "p", text: "Next to the windbreaker there's the Hoodie Tracksuit Set, in black and grey: a zip hoodie with a kangaroo pocket and ribbed cuffs, with wide-leg sweatpants. Softer, warmer and more for indoors and the cold months. The windbreaker is for being out and about, and for when the weather doesn't play along." },
      { type: "products", title: "More sets", slugs: ["oolu-windbreaker-tracksuit-set-black-grey", "oolu-hoodie-tracksuit-set-black", "oolu-hoodie-tracksuit-set-grey"] },
      { type: "h2", text: "Care" },
      { type: "p", text: "Wash the windbreaker inside out on a low temperature with the zips closed, skip the fabric softener (it weakens the water-resistant finish) and let it air-dry. That keeps it light and keeps the piping white." },
    ],
  },
  {
    slug: "easy-comfort-always",
    title: "Easy comfort, always",
    excerpt: "Soft fabrics and relaxed fits, from morning commute to late-night hangout. A closer look at the OOLU tee.",
    category: "Process",
    date: "2026-07-21",
    cover: "/images/brand/look-friends.jpg",
    nl: {
      title: "Altijd makkelijk comfort",
      excerpt: "Zachte stoffen en een relaxte pasvorm, van de ochtendspits tot laat op de avond. Een kijkje bij het OOLU-shirt.",
      blocks: [
        { type: "p", text: "Elk OOLU-shirt begint met dezelfde opdracht: het moet op dag één goed voelen en op dag honderd nog beter. Ruim in de body, strak aan de hals, het logo klein gehouden. Klinkt simpel. Dat is ook de bedoeling, maar simpel goed krijgen kost de meeste moeite." },
        { type: "image", src: "/images/brand/look-friends.jpg", alt: "Drie lachende vrienden op betonnen trappen in OOLU-shirts", caption: "Washed en everyday tees." },
        { type: "h2", text: "Begint bij de stof" },
        { type: "p", text: "Onze shirts zijn van 100% katoen. Zacht tegen je huid, ademend als het warm is en sterk genoeg om week na week in de was te gaan. Het Classic Cotton T-Shirt gaat nog een stap verder: zwaarder katoen dat voorgekrompen is, zodat het na het wassen zijn vorm houdt." },
        { type: "h2", text: "Pasvormen, uitgelegd" },
        {
          type: "list",
          items: [
            { label: "Oversized", text: "Het OOLU T-Shirt: ruim en ontspannen. Neem je normale maat voor de bedoelde look, een maat kleiner voor iets strakkers." },
            { label: "Everyday", text: "Een schoon, klassiek silhouet in beige, washed gray, crème en zwart. Het shirt dat je zonder nadenken pakt." },
            { label: "Cropped", text: "Korter in de body, voor hoge broeken en rokken. Los dragen, half instoppen of onder een jas." },
            { label: "Sleeveless", text: "Een muscle tee-cut voor de sportschool en warme dagen, met de boodschap groot op de rug." },
          ],
        },
        { type: "h2", text: "Washed, met karakter" },
        { type: "p", text: "Het washed-shirt in paars, groen en grijs heeft een gewassen look met diepte in de kleur, waardoor het vanaf de eerste keer aanvoelt als je favoriete oude shirt. Achterop: YOUR JOURNEY." },
        { type: "products", title: "Shop de tees", slugs: ["oolu-t-shirt-coral-red", "oolu-t-shirt-hot-pink", "oolu-version-2-t-shirt"] },
        { type: "h2", text: "Ingetogen, met opzet" },
        { type: "p", text: "Langdurig comfort, ingetogen stijl en stil zelfvertrouwen onderweg. Geen ruis: een klein logo op de borst, de boodschap op de rug voor wie het wil lezen. Het shirt hoeft niet te schreeuwen; jij draagt het verhaal." },
        { type: "quote", text: "Het shirt dat je pakt als je niet wilt nadenken, en dat je toch het gevoel geeft dat je klaar bent.", by: "OOLU" },
        { type: "h2", text: "Van ochtend tot laat" },
        { type: "p", text: "Ochtendspits met jeans en sneakers. Een middag in de stad met de trainingsbroek. 's Avonds onder de windbreaker als het afkoelt. Een goed shirt doet al die dingen zonder dat je je hoeft om te kleden." },
        { type: "image", src: "/images/brand/tile-t-shirts.jpg", alt: "Het OOLU washed-shirt in paars", caption: "Kies je kleur. Draag het vaak." },
        { type: "h2", text: "Zo blijft hij mooi" },
        {
          type: "list",
          items: [
            { label: "Wassen", text: "Binnenstebuiten op 30°C met vergelijkbare kleuren. Zo blijven de prints langer scherp." },
            { label: "Drogen", text: "Liefst aan de lijn of liggend. De droger laat katoen sneller krimpen en slijten." },
            { label: "Strijken", text: "Binnenstebuiten op een gemiddelde stand, nooit direct over de print." },
          ],
        },
        { type: "products", title: "De essentials", slugs: ["oolu-everyday-t-shirt", "oolu-classic-cotton-t-shirt", "oolu-washed-t-shirt-purple-green-gray"] },
      ],
    },
    blocks: [
      { type: "p", text: "Every OOLU t-shirt starts with the same brief: it has to feel good on day one and better on day one hundred. Relaxed through the body, clean at the neck, logo kept small. It sounds simple. That's the point, but getting simple right takes the most effort." },
      { type: "image", src: "/images/brand/look-friends.jpg", alt: "Three friends laughing on concrete steps in OOLU t-shirts", caption: "Washed and everyday tees." },
      { type: "h2", text: "It starts with the fabric" },
      { type: "p", text: "Our tees are 100% cotton. Soft on your skin, breathable when it's warm and strong enough to go through the wash week after week. The Classic Cotton T-Shirt goes a step further: heavier cotton that's pre-shrunk, so it keeps its shape after washing." },
      { type: "h2", text: "Fits, explained" },
      {
        type: "list",
        items: [
          { label: "Oversized", text: "The OOLU T-Shirt: roomy and relaxed. Take your usual size for the intended look, or size down for something closer." },
          { label: "Everyday", text: "A clean, classic silhouette in beige, washed gray, cream and black. The tee you grab without thinking." },
          { label: "Cropped", text: "Shorter in the body, made for high-waisted trousers and skirts. Wear it loose, half-tucked or under a jacket." },
          { label: "Sleeveless", text: "A muscle-tee cut for the gym and warm days, with the message large across the back." },
        ],
      },
      { type: "h2", text: "Washed, with character" },
      { type: "p", text: "The washed tee in purple, green and gray has a washed finish with depth in the colour, so it feels like your favourite old shirt from the first wear. On the back: YOUR JOURNEY." },
      { type: "products", title: "Shop the tees", slugs: ["oolu-t-shirt-coral-red", "oolu-t-shirt-hot-pink", "oolu-version-2-t-shirt"] },
      { type: "h2", text: "Pared-back, on purpose" },
      { type: "p", text: "Long-lasting comfort, pared-back style and quiet confidence on the go. No noise: a small logo on the chest, the message on the back for whoever wants to read it. The shirt doesn't need to shout; you carry the story." },
      { type: "quote", text: "The tee you reach for when you don't want to think, and that still makes you feel ready.", by: "OOLU" },
      { type: "h2", text: "From morning to late" },
      { type: "p", text: "The morning commute with jeans and sneakers. An afternoon in the city with the tracksuit pants. Under the windbreaker in the evening when it cools down. A good tee does all of that without you having to change." },
      { type: "image", src: "/images/brand/tile-t-shirts.jpg", alt: "The OOLU washed tee in purple", caption: "Pick your colour. Wear it often." },
      { type: "h2", text: "Keep it looking good" },
      {
        type: "list",
        items: [
          { label: "Wash", text: "Inside out at 30°C with similar colours. The prints stay sharp for longer." },
          { label: "Dry", text: "On the line or flat, ideally. A tumble dryer makes cotton shrink and wear faster." },
          { label: "Iron", text: "Inside out on a medium setting, never directly over the print." },
        ],
      },
      { type: "products", title: "The essentials", slugs: ["oolu-everyday-t-shirt", "oolu-classic-cotton-t-shirt", "oolu-washed-t-shirt-purple-green-gray"] },
    ],
  },
];

/** The post in the given language (falls back to English). */
export const localizePost = (p: JournalPost, locale: string): JournalPost => (locale === "nl" && p.nl ? { ...p, ...p.nl } : p);
export const getPost = (slug: string, locale = "en") => {
  const p = JOURNAL.find((x) => x.slug === slug);
  return p ? localizePost(p, locale) : null;
};
export const latestPosts = (n = 3, locale = "en") =>
  [...JOURNAL].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n).map((p) => localizePost(p, locale));

/** Rough reading time in minutes (200 words per minute, images count as ~12 s). */
export function readingMinutes(p: JournalPost) {
  let words = p.excerpt.split(/\s+/).length;
  let images = 0;
  for (const b of p.blocks) {
    if (b.type === "p" || b.type === "h2" || b.type === "quote") words += b.text.split(/\s+/).length;
    if (b.type === "list") for (const it of b.items) words += `${it.label} ${it.text}`.split(/\s+/).length;
    if (b.type === "image") images++;
  }
  return Math.max(1, Math.round(words / 200 + images / 5));
}
