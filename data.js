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
      name: "Dr. Amara Okonkwo",
      title: "Vice President",
      region: "Nigeria",
      flag: "🇳🇬",
      committee: "Strategy & Chapters",
      joined: "2026-02-01",
      bio: [
        "Dr. Amara Okonkwo oversees WEA's expansion strategy — the chartering of country chapters and the standards each chapter must meet.",
        "A development economist by training, she has spent fifteen years building founder networks across West Africa.",
        "She chairs the chapter chartering committee and reports on membership growth to the Executive Council."
      ],
      focus: ["Chapter expansion", "Membership growth", "Regional strategy"]
    },
    {
      id: "WEA-2026-000003",
      code: "SG03-2026",
      name: "Mr. Kwame Boateng",
      title: "Secretary-General",
      region: "Ghana",
      flag: "🇬🇭",
      committee: "Governance & Secretariat",
      joined: "2026-02-01",
      bio: [
        "Mr. Kwame Boateng runs the day-to-day operations of the Global Secretariat in Accra — records, resolutions and council scheduling.",
        "He ensures every resolution of the Executive Council is documented, communicated and executed across chapters.",
        "A corporate secretary with two decades of association governance experience."
      ],
      focus: ["Council operations", "Records & resolutions", "Policy"]
    },
    {
      id: "WEA-2026-000004",
      code: "TR04-2026",
      name: "Ms. Fatima Al-Rashid",
      title: "Treasurer",
      region: "United Arab Emirates",
      flag: "🇦🇪",
      committee: "Finance & Audit",
      joined: "2026-03-01",
      bio: [
        "Ms. Fatima Al-Rashid stewards WEA's finances — dues, grants, the funding programme and the audit cycle.",
        "A former investment banker, she built the association's financial controls and transparent reporting framework.",
        "She presents the annual financial statement to the Board of Trustees."
      ],
      focus: ["Treasury", "Grants & funding", "Audit"]
    },
    {
      id: "WEA-2026-000005",
      code: "DM05-2026",
      name: "Mr. Thabo Nkosi",
      title: "Director of Marketing & Communications",
      region: "South Africa",
      flag: "🇿🇦",
      committee: "Brand & Communications",
      joined: "2026-03-01",
      bio: [
        "Mr. Thabo Nkosi owns the WEA brand — the identity, the campaigns and every public communication of the association.",
        "He equips members and chapters with the marketing toolkit, brand rules and campaign templates they need to promote themselves.",
        "A brand strategist who has launched pan-African campaigns for consumer and financial brands."
      ],
      focus: ["Brand stewardship", "Campaigns", "Media relations"]
    },
    {
      id: "WEA-2026-000006",
      code: "DM06-2026",
      name: "Ms. Elena Marsh",
      title: "Director of Partnerships",
      region: "United Kingdom",
      flag: "🇬🇧",
      committee: "Partnerships & Alliances",
      joined: "2026-04-01",
      bio: [
        "Ms. Elena Marsh builds the alliances that open markets for members — corporates, institutions and associations worldwide.",
        "She leads WEA's engagement with development partners, industry bodies and the annual conference sponsors.",
        "Previously led strategic partnerships for a European trade body."
      ],
      focus: ["Corporate alliances", "Institutional partners", "Sponsorship"]
    },
    {
      id: "WEA-2026-000007",
      code: "DP07-2026",
      name: "Mr. Rajiv Menon",
      title: "Director of Programs & Education",
      region: "India",
      flag: "🇮🇳",
      committee: "Programmes & Learning",
      joined: "2026-04-01",
      bio: [
        "Mr. Rajiv Menon designs the learning architecture of WEA — the workshops, the curriculum and the future Entrepreneurship University.",
        "He curates the speaker faculty for the Global Entrepreneurs Conference and the chapter education calendar.",
        "An educator and startup operator who has trained thousands of founders across Asia."
      ],
      focus: ["Curriculum", "Conference faculty", "University track"]
    },
    {
      id: "WEA-2026-000008",
      code: "DR08-2026",
      name: "Dr. Sofía Ramírez",
      title: "Director of Membership",
      region: "Mexico",
      flag: "🇲🇽",
      committee: "Membership & Verification",
      joined: "2026-05-01",
      bio: [
        "Dr. Sofía Ramírez owns the member experience — applications, verification and the standards that make a WEA ID meaningful.",
        "She oversees the verification programme that lets anyone confirm a member's standing in seconds.",
        "A former chamber of commerce director who grew a regional membership base to 40,000."
      ],
      focus: ["Member experience", "Verification", "Standards"]
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
    { name: "WEA Deep Green", hex: "#050F0B", note: "Primary background" },
    { name: "Forest", hex: "#0B2018", note: "Surface / cards" },
    { name: "Heritage Gold", hex: "#E3B45B", note: "Accent / action" },
    { name: "Champagne", hex: "#F0CB86", note: "Highlight / hover" },
    { name: "Ivory", hex: "#EFF2EA", note: "Primary text" },
    { name: "Sage", hex: "#A3B5AA", note: "Secondary text" }
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

  global.WEA_DATA = WEA_DATA;
})(window);
