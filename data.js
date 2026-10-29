/* ============================================================
   WEA — Seed data
   NOTE: Executive names/bios and sample members below are
   placeholder content. Replace with real records before launch.
   ============================================================ */

(function (global) {
  "use strict";

  var WEA_DATA = {};

  /* ---------- Site configuration ----------
     baseUrl: absolute origin used for Open Graph links, share links,
     QR codes and JSON-LD. Change this one value when the site goes
     live on its real domain. */

  WEA_DATA.site = {
    name: "World Entrepreneurs Association",
    shortName: "WEA",
    baseUrl: "https://www.worldentrepreneursassociation.org",
    tagline: "One World. One Business Family.",
    description:
      "A global network of entrepreneurs — verified membership, country chapters, funding, mentorship and market access. One world. One business family.",
    whatsapp: "233533507112",
    email: "secretariat@worldentrepreneursassociation.org",
    address: { city: "Accra", country: "Ghana", region: "Greater Accra" },
    founded: "2026"
  };

  /* ---------- Secretariat register (Google Sheet) ----------
     Applications are mirrored to a Google Sheet so the Secretariat
     keeps a real ledger, independent of any one visitor's browser.

     Leave endpoint empty and the site works exactly as before —
     applications simply stay local to the browser.

     To switch it on: see apps-script/README.md. Paste the web app
     URL from your Apps Script deployment between the quotes below. */

  WEA_DATA.sheet = {
    endpoint: ""
  };

  /* ---------- Executive Council ---------- */

  WEA_DATA.executives = [
    {
      id: "WEA-2026-000001",
      code: "FDN1-2026",
      name: "Amb. Prof. Dr. Jerry Success",
      title: "Founder & President",
      region: "Ghana",
      flag: "🌍",
      committee: "Office of the Founder",
      joined: "2026-01-15",
      photo: "images/Amb.%20Prof.%20Dr.%20Jerry%20Success.jpeg",
      bio: [
        "Amb. Prof. Dr. Jerry Success founded the World Entrepreneurs Association in Accra in 2026 with one conviction: no entrepreneur should have to build alone.",
        "He leads the association's global secretariat, its ten-year blueprint and the founding membership drive spanning twenty countries.",
        "His office sets WEA's strategic direction and convenes the Board of Trustees and Executive Council."
      ],
      focus: ["Global strategy", "Board & governance", "Public partnerships"]
    },
    {
      id: "WEA-2026-000002",
      code: "VP02-2026",
      name: "Dr. Bernardo Javalquinto Lagos",
      title: "Vice President",
      region: "Chile",
      flag: "🇨🇱",
      committee: "Strategy & Chapters",
      joined: "2026-02-01",
      photo: "images/Dr%20BERNARDO%20%20JAVALQUINTO%20LAGOS.jpeg",
      bio: [
        "Dr. Bernardo Javalquinto Lagos is an economist and former World Bank and IFC staff member who advises governments and enterprises on sustainable finance, M&A and emerging markets.",
        "He supports WEA's expansion strategy — the chartering of country chapters and the standards each chapter must meet.",
        "He chairs the chapter chartering committee and reports on membership growth to the Executive Council."
      ],
      focus: ["Chapter expansion", "Sustainable finance", "Regional strategy"]
    },
    {
      id: "WEA-2026-000003",
      code: "SG03-2026",
      name: "Dr. Oludare Tunde Fasomo",
      title: "Secretary-General",
      region: "Nigeria",
      flag: "🇳🇬",
      committee: "Governance & Secretariat",
      joined: "2026-02-01",
      photo: "images/Dr%20Oludare%20Tunde%20Fasomo.jpeg",
      bio: [
        "Dr. Oludare Tunde Fasomo runs the day-to-day operations of the Global Secretariat — records, resolutions and council scheduling.",
        "An operations and human-resource professional, he ensures every resolution of the Executive Council is documented, communicated and executed across chapters.",
        "He holds an MBA in Business Administration and advanced qualifications in banking and finance."
      ],
      focus: ["Council operations", "Records & resolutions", "Administration"]
    },
    {
      id: "WEA-2026-000004",
      code: "TR04-2026",
      name: "HRH Dr. Gary Sum",
      title: "Treasurer",
      region: "Hong Kong",
      flag: "🇭🇰",
      committee: "Finance & Audit",
      joined: "2026-03-01",
      photo: "images/GARY%20SUM.jpeg",
      bio: [
        "HRH Dr. Gary Sum stewards WEA's finances — dues, grants, the funding programme and the audit cycle.",
        "Group Chairman & CEO of Swiss Capital Group, he brings decades of banking, fintech and sovereign finance experience to the council.",
        "He presents the annual financial statement to the Board of Trustees."
      ],
      focus: ["Treasury", "Grants & funding", "Audit"]
    },
    {
      id: "WEA-2026-000005",
      code: "DM05-2026",
      name: "Dr. Sarah Noet",
      title: "Director of Partnerships",
      region: "United States",
      flag: "🇺🇸",
      committee: "Partnerships & Alliances",
      joined: "2026-03-01",
      photo: "images/Dr%20Sarah%20Noet.jpeg",
      bio: [
        "Dr. Sarah Noet builds the alliances that open markets for members — corporates, institutions and associations worldwide.",
        "Founder & CEO of Be The Change: Global Goals Unity Initiative and a Senior Fellow at the SDG Centre in Geneva, she leads WEA's engagement with development partners and industry bodies.",
        "She is a patented inventor and a recognised voice on entrepreneurship, sustainability and youth leadership."
      ],
      focus: ["Corporate alliances", "Institutional partners", "Global impact"]
    },
    {
      id: "WEA-2026-000006",
      code: "DM06-2026",
      name: "Apostle Dr. Asravor Dzigbordi Aku Selasi",
      title: "Director of Ethics & Member Welfare",
      region: "Ghana",
      flag: "🇬🇭",
      committee: "Ethics & Member Welfare",
      joined: "2026-04-01",
      photo: "images/Apostle%20Dr%20Asravor%20Dzigbordi%20Aku%20Selasi.jpeg",
      bio: [
        "Apostle Dr. Asravor Dzigbordi Aku Selasi leads WEA's ethics and member-welfare portfolio, keeping the association's charter of values at the centre of its work.",
        "A faith and community leader, he guides chapters on integrity, inclusion and the pastoral care of members and their families.",
        "He convenes the ethics review panel and advises the Executive Council on matters of conduct and values."
      ],
      focus: ["Ethics & conduct", "Member welfare", "Community values"]
    }
  ];

  /* ---------- Membership classes ---------- */

  WEA_DATA.tiers = [
    {
      slug: "associate",
      name: "Associate",
      price: "$25",
      per: "per year",
      for: "Aspiring & early-stage entrepreneurs",
      featured: false,
      benefits: [
        "Listing in the WEA member directory",
        "Access to community events & meetups",
        "Monthly WEA newsletter & insights",
        "Member learning library"
      ]
    },
    {
      slug: "professional",
      name: "Professional",
      price: "$75",
      per: "per year",
      for: "Active founders & professionals",
      featured: true,
      benefits: [
        "Everything in Associate",
        "Verified digital membership ID card",
        "Country chapter membership",
        "Funding & grant programme eligibility",
        "Discounted conference & workshop passes",
        "Business directory feature listing"
      ]
    },
    {
      slug: "corporate",
      name: "Corporate",
      price: "$250",
      per: "per year",
      for: "Registered businesses & teams",
      featured: false,
      benefits: [
        "Everything in Professional, for 5 seats",
        "Company profile in the directory",
        "Priority partner & investor matching",
        "Promotional slots on WEA platforms",
        "Deal-flow & tender notifications"
      ]
    },
    {
      slug: "patron",
      name: "Legacy Patron",
      price: "$1,000",
      per: "per year",
      for: "Founding circle — first 100 seats",
      featured: false,
      benefits: [
        "Everything in Corporate, for 10 seats",
        "Invitations to Executive Council salons",
        "Named recognition in the annual report",
        "Advisory input on WEA programmes",
        "Priority seating at the Global Conference"
      ]
    }
  ];

  /* ---------- Sample directory members (verified) ---------- */

  WEA_DATA.sampleMembers = [
    {
      id: "WEA-2026-10001", code: "SMP1-2026", name: "Ama Mensah",
      email: "ama@example.com", phone: "+233 20 000 0001",
      country: "Ghana", city: "Accra",
      company: "Kente Labs", role: "Founder", industry: "Technology",
      tier: "professional", status: "verified", joined: "2026-06-12"
    },
    {
      id: "WEA-2026-10002", code: "SMP2-2026", name: "Samuel Adeyemi",
      email: "samuel@example.com", phone: "+234 80 0000 0002",
      country: "Nigeria", city: "Lagos",
      company: "Lagos Freight", role: "CEO", industry: "Logistics",
      tier: "corporate", status: "verified", joined: "2026-06-20"
    },
    {
      id: "WEA-2026-10003", code: "SMP3-2026", name: "Priya Sharma",
      email: "priya@example.com", phone: "+91 98 0000 0003",
      country: "India", city: "Bengaluru",
      company: "Sharma Advisory", role: "Consultant", industry: "Professional Services",
      tier: "associate", status: "verified", joined: "2026-07-02"
    },
    {
      id: "WEA-2026-10004", code: "SMP4-2026", name: "John Carter",
      email: "john@example.com", phone: "+1 415 000 0004",
      country: "United States", city: "San Francisco",
      company: "Carter Capital", role: "Managing Partner", industry: "Finance",
      tier: "patron", status: "verified", joined: "2026-07-15"
    },
    {
      id: "WEA-2026-10005", code: "SMP5-2026", name: "María Santos",
      email: "maria@example.com", phone: "+55 11 0000 0005",
      country: "Brazil", city: "São Paulo",
      company: "Santos & Co.", role: "Founder", industry: "Retail",
      tier: "professional", status: "verified", joined: "2026-08-01"
    },
    {
      id: "WEA-2026-10006", code: "SMP6-2026", name: "Yuki Tanaka",
      email: "yuki@example.com",
      phone: "+65 8000 0006",
      country: "Singapore", city: "Singapore",
      company: "Tanaka Systems", role: "Managing Director", industry: "Manufacturing",
      tier: "corporate", status: "verified", joined: "2026-08-19"
    },
    /* members introduced by the Founder — drive the referral dashboard */
    {
      id: "WEA-2026-10007", code: "SMP7-2026", name: "Nadia Haddad",
      email: "nadia@example.com", phone: "+971 50 000 0007",
      country: "United Arab Emirates", city: "Dubai",
      company: "Haddad Ventures", role: "Founder", industry: "Technology",
      tier: "professional", status: "verified", joined: "2026-08-24",
      ref: "WEA-2026-000001"
    },
    {
      id: "WEA-2026-10008", code: "SMP8-2026", name: "Daniel Osei",
      email: "daniel@example.com", phone: "+233 24 000 0008",
      country: "Ghana", city: "Kumasi",
      company: "Ashanti Agro", role: "CEO", industry: "Agriculture",
      tier: "associate", status: "verified", joined: "2026-09-03",
      ref: "WEA-2026-000001"
    },
    {
      id: "WEA-2026-10009", code: "SMP9-2026", name: "Lucia Ferrari",
      email: "lucia@example.com", phone: "+39 340 000 0009",
      country: "Italy", city: "Milan",
      company: "Ferrari Design Studio", role: "Principal", industry: "Creative",
      tier: "professional", status: "pending", joined: "2026-09-21",
      ref: "WEA-2026-000001"
    }
  ];

  /* ---------- FAQ ---------- */

  WEA_DATA.faq = [
    {
      q: "How do I become a WEA member?",
      a: "Complete the online application in about five minutes. The Secretariat reviews your application, confirms your class of membership, and issues you a verified digital membership ID that you can share and anyone can verify instantly."
    },
    {
      q: "What does membership give me?",
      a: "A place in a borderless network of entrepreneurs: a verified ID, a directory listing, chapter access, funding and grant eligibility, discounted conferences, partner and investor matching — and the marketing tools to promote your business across the network."
    },
    {
      q: "Is there a membership fee?",
      a: "Yes. Annual dues depend on your class — Associate ($25), Professional ($75), Corporate ($250) and Legacy Patron ($1,000). Dues are confirmed by the Secretariat during review, and founding members are grandfathered as the association scales."
    },
    {
      q: "How does membership verification work?",
      a: "Every member receives a unique ID in the format WEA-2026-000000. Anyone can enter that ID on our Verify page to confirm the member's name, class and standing in seconds — ideal for partners, investors and clients doing due diligence."
    },
    {
      q: "Can my company join as a team?",
      a: "Yes — the Corporate class covers five seats under one company profile, with partnership matching and promotional slots. Larger teams can be arranged with the Secretariat."
    },
    {
      q: "Where is WEA based?",
      a: "The Global Secretariat is in Accra, Ghana, with country chapters being chartered across twenty countries in Phase I of our blueprint and one hundred countries by 2036."
    }
  ];

  /* ---------- Events & news ----------
     Placeholder programme. Replace with the real calendar and
     announcements before launch. `kind` drives the badge label,
     `status` drives whether an item reads as upcoming or past. */

  WEA_DATA.events = [
    {
      kind: "Conference",
      status: "upcoming",
      date: "2026-11-19",
      endDate: "2026-11-21",
      location: "Accra International Conference Centre · Ghana",
      region: "Africa",
      title: "WEA Global Launch Summit",
      summary:
        "Three days to charter the first twenty country chapters, sign the founding Charter of Values and seat the inaugural Executive Council.",
      href: "register.html",
      cta: "Reserve a founder's seat",
      featured: true
    },
    {
      kind: "Workshop",
      status: "upcoming",
      date: "2027-01-22",
      location: "Online · Chapters worldwide",
      region: "Global",
      title: "Funding Readiness Clinic",
      summary:
        "A working session on investor-ready financials, valuation basics and the documentation lenders actually ask for.",
      href: "register.html",
      cta: "Join the session"
    },
    {
      kind: "Announcement",
      status: "new",
      date: "2026-12-05",
      location: "Global Secretariat · Accra",
      region: "Global",
      title: "Membership portal now open to founding members",
      summary:
        "Founding members can now access the brand kit, campaign assets, ambassador programme and self-service record editing from the portal.",
      href: "portal.html",
      cta: "Open the portal"
    },
    {
      kind: "Chapter",
      status: "upcoming",
      date: "2027-03-11",
      location: "Nairobi · Kenya",
      region: "East Africa",
      title: "East Africa Chapter Charter",
      summary:
        "The formal chartering of our East Africa chapter, with an open forum on cross-border trade within the region.",
      href: "members.html#directory",
      cta: "Meet the chapter"
    },
    {
      kind: "Report",
      status: "past",
      date: "2026-07-02",
      location: "Global Secretariat · Accra",
      region: "Global",
      title: "Phase I progress report published",
      summary:
        "Where the association stands against the ten-year blueprint: chapters chartered, members verified and the road to one million by 2030.",
      href: "index.html#blueprint",
      cta: "Read the blueprint"
    }
  ];

  /* ---------- Social platforms ----------
     Single source of truth for member social handles. `url` builds the
     profile link from a bare handle, so members type "@ama" rather than
     a full URL. `pattern` validates the handle for that platform.
     `icon` is a Phosphor class already loaded by every page. */

  WEA_DATA.socials = [
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: "ph-linkedin-logo",
      placeholder: "ama-boateng",
      hint: "Your LinkedIn profile name",
      url: "https://www.linkedin.com/in/",
      pattern: "^[A-Za-z0-9\\-_%]{3,100}$"
    },
    {
      key: "x",
      label: "X (Twitter)",
      icon: "ph-x-logo",
      placeholder: "amaboateng",
      hint: "Your X handle, without the @",
      url: "https://x.com/",
      pattern: "^[A-Za-z0-9_]{1,15}$"
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "ph-instagram-logo",
      placeholder: "ama.boateng",
      hint: "Your Instagram handle, without the @",
      url: "https://www.instagram.com/",
      pattern: "^[A-Za-z0-9._]{1,30}$"
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: "ph-facebook-logo",
      placeholder: "amaboateng",
      hint: "Your Facebook profile name",
      url: "https://www.facebook.com/",
      pattern: "^[A-Za-z0-9.]{5,50}$"
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: "ph-youtube-logo",
      placeholder: "amaboateng",
      hint: "Your channel handle, without the @",
      url: "https://www.youtube.com/@",
      pattern: "^[A-Za-z0-9._\\-]{3,50}$"
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: "ph-tiktok-logo",
      placeholder: "amaboateng",
      hint: "Your TikTok handle, without the @",
      url: "https://www.tiktok.com/@",
      pattern: "^[A-Za-z0-9._]{2,24}$"
    }
  ];

  /* ---------- Marketing portal content ---------- */

  WEA_DATA.palette = [
    { name: "Paper", hex: "#F6F2E9", note: "Primary background" },
    { name: "Bone", hex: "#EFE8DB", note: "Surface / cards" },
    { name: "Deep Ink", hex: "#111A2B", note: "Primary text / footer" },
    { name: "Cobalt", hex: "#1F45C9", note: "Accent / action" },
    { name: "Vermillion", hex: "#CF4520", note: "Secondary accent" },
    { name: "Slate", hex: "#4F5866", note: "Secondary text" }
  ];

  WEA_DATA.templates = [
    {
      title: "Join announcement",
      tag: "X / LinkedIn",
      body: "I'm proud to be a verified member of the World Entrepreneurs Association 🌍\n\nOne World. One Business Family. — connecting entrepreneurs across 100 countries for wealth, impact & legacy.\n\nCheck my verified profile: [WEA ID]\n#WEA #OneWorldOneBusinessFamily #Entrepreneurs"
    },
    {
      title: "Milestone post",
      tag: "X / LinkedIn",
      body: "Big news from the WEA network 👏\n\n[Your update — funding raised, partnership signed, product launched]\n\nProud to build alongside founders in 100 countries as a member of the World Entrepreneurs Association.\n\n#WEA #WealthImpactLegacy"
    },
    {
      title: "Event invitation",
      tag: "WhatsApp / Email",
      body: "Hello [Name],\n\nI'd love to have you at our next WEA chapter event on [date] in [city].\n\nWe'll be covering [topic] with founders from across the network — expect practical sessions, real deals and new partnerships.\n\nKindly confirm your seat and I'll send the details.\n\n— [Your name], WEA member"
    },
    {
      title: "Referral message",
      tag: "WhatsApp",
      body: "Hi [Name] 👋\n\nI'm a member of the World Entrepreneurs Association — a global network of entrepreneurs getting access to funding, partners, knowledge and markets.\n\nI think you'd gain a lot from it. Apply here and mention my ID when you register: [your referral link]\n\nOne World. One Business Family."
    },
    {
      title: "Product spotlight",
      tag: "Directory / Social",
      body: "[Your business] is spotlighted in the WEA business directory 📇\n\nWe help [who] to [what you do] — now open to partners and clients across the WEA network in 100 countries.\n\nDM me or reply to connect.\n\n#WEA #BusinessDirectory"
    },
    {
      title: "Chapter welcome",
      tag: "Email",
      body: "Subject: Welcome to the WEA [City] chapter\n\nHello [Name],\n\nWelcome to the World Entrepreneurs Association — your seat in [City] chapter is now confirmed.\n\nHere's what happens next:\n1. Your verified membership ID is live\n2. Chapter meetups happen [cadence]\n3. Your directory profile is published\n\nReply to this message with any questions. Let's build.\n\n— WEA [City] Chapter"
    }
  ];

  WEA_DATA.hashtags = [
    "#WEA",
    "#OneWorldOneBusinessFamily",
    "#WealthImpactLegacy",
    "#WorldEntrepreneursAssociation",
    "#EntrepreneursWithoutBorders",
    "#BuildGlobal"
  ];

  /* ---------- Book library ---------- */

  WEA_DATA.bookCategories = [
    "Entrepreneurship",
    "Business & Strategy",
    "Finance & Investment",
    "Leadership",
    "Marketing & Sales",
    "Technology",
    "Personal Development",
    "Other"
  ];

  WEA_DATA.bookLanguages = [
    "English",
    "French",
    "Arabic",
    "Portuguese",
    "Swahili",
    "Spanish",
    "Other"
  ];

  /* Books shipped with the site. They are read straight from the
     books/ folder and are always available, even without a backend. */

  WEA_DATA.bookSeeds = [
    {
      id: "book-seed-board-trustees",
      title: "Book Management in English",
      author: "Bernardo Javalquinto-Lagos",
      category: "Business & Strategy",
      language: "English",
      year: "2026",
      description: "A 27-page guide to book management, prepared for the Board Trustees and shared with the WEA library.",
      coverUrl: "books/book-management-in-english-cover.jpg",
      pdfUrl: "books/book%20management%20in%20english%20-%20Board%20Trustees.pdf",
      pdfName: "book management in english - Board Trustees.pdf",
      size: 690313,
      createdAt: "2026-07-14T13:49:16.000Z"
    }
  ];

  global.WEA_DATA = WEA_DATA;
})(window);
