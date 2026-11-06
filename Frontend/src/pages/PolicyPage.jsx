import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { STORE_INFO } from '../data/products';
import {
  ShieldAlert,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Store,
  FileText,
  Truck,
  HelpCircle,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Scale,
  CreditCard,
  Eye,
  Mail,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function PolicyPage({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine active tab from URL path or query parameter
  const getInitialTab = () => {
    if (defaultTab) return defaultTab;
    const tabParam = searchParams.get('tab');
    if (tabParam && ['returns', 'terms', 'privacy'].includes(tabParam)) return tabParam;
    if (location.pathname.includes('terms')) return 'terms';
    if (location.pathname.includes('privacy')) return 'privacy';
    return 'returns';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync tab with route changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname.includes('terms')) {
      setActiveTab('terms');
    } else if (location.pathname.includes('privacy')) {
      setActiveTab('privacy');
    } else {
      const tabParam = searchParams.get('tab');
      if (tabParam && ['returns', 'terms', 'privacy'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [location.pathname, searchParams, defaultTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'returns') {
      navigate('/return-refund-policy');
    } else if (tabId === 'terms') {
      navigate('/terms');
    } else if (tabId === 'privacy') {
      navigate('/privacy');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 14 Return, Exchange & Warranty Sections (Exact from official Pharsyde store policy)
  const returnSections = [
    {
      num: "01",
      id: "sec-01",
      title: "General Returns — 7 Days",
      paragraphs: [
        "Eligible non-cannabis products may be returned within 7 days of the original purchase date.",
        "To be eligible for a return:",
      ],
      list: [
        "The item must be unused, unopened, and unaltered.",
        "The item must be in its original packaging and in the same condition in which it was purchased.",
        "A valid receipt or proof of purchase must be provided.",
        "The item must not be designated as Final Sale, Clearance, or As-Is.",
        "The return must be made within 7 days of purchase.",
        "All returns are subject to inspection and approval by Pharsyde."
      ],
      closingParagraphs: [
        "After the 7-day return period has expired, change-of-mind returns will not be accepted.",
        "This 7-day return policy applies only to eligible merchandise and does not override the separate rules governing cannabis products, defective merchandise, warranties, recalls, or any rights provided by applicable law."
      ]
    },
    {
      num: "02",
      id: "sec-02",
      title: "Cannabis Products — Final Sale",
      paragraphs: [
        "All cannabis products are final sale and cannot be returned or exchanged, except where the cannabis is the subject of an official recall.",
        "This includes, but is not limited to:"
      ],
      list: [
        "Dried cannabis flower",
        "Pre-rolls",
        "Cannabis vapes",
        "Cannabis cartridges",
        "Edibles",
        "Cannabis beverages",
        "Concentrates",
        "Oils",
        "Capsules",
        "Cannabis topicals"
      ],
      subsections: [
        {
          subtitle: "Manitoba Law",
          paragraphs: [
            "Pharsyde is required to comply with Manitoba's Cannabis Regulation, M.R. 120/2018.",
            "Section 31 states:"
          ],
          quote: "“A licensee must not accept a return of cannabis, except in the case of cannabis that is the subject of a recall.”",
          followupParagraph: "Accordingly, Pharsyde cannot accept cannabis returns due to:",
          followupList: [
            "Change of mind;",
            "Customer dissatisfaction;",
            "Product preference;",
            "Accidental purchase;",
            "Damage occurring after purchase;",
            "Packaging concerns raised after purchase; or",
            "Other customer-requested returns."
          ],
          finalParagraphs: [
            "Unless the cannabis is the subject of an applicable official recall.",
            "Cannabis that cannot be sold because of damaged packaging or quality-control issues must be handled in accordance with Manitoba's regulatory requirements.",
            "For recalled cannabis products, customers must follow the instructions provided by Pharsyde, the applicable producer, or the appropriate regulatory authority."
          ]
        }
      ]
    },
    {
      num: "03",
      id: "sec-03",
      title: "Vape Products & E-Liquids",
      paragraphs: [
        "E-liquids and consumable vape products are Final Sale and cannot be returned or exchanged once sold, except where an applicable warranty, confirmed defect, recall, or other legal requirement applies.",
        "This includes, but is not limited to:"
      ],
      list: [
        "E-liquid / vape juice",
        "Disposable vapes",
        "Vape cartridges",
        "Pods",
        "Coils",
        "Replacement atomizers",
        "Drip tips",
        "Other consumable vape components"
      ],
      subsections: [
        {
          subtitle: "Disposable Vape Concerns (24-Hour Protocol)",
          paragraphs: [
            "However, an eligible vape device or hardware product that is defective or malfunctioning may qualify for warranty service or an exchange, subject to inspection and the applicable warranty.",
            "Customers have 24 hours from the time of purchase for in-store purchases, or 24 hours from the time of delivery for online purchases, to contact Pharsyde if they experience any concerns, suspected defect, malfunction, leakage, performance issue, or other product-related issue with a disposable vape.",
            "Customers experiencing a concern must:"
          ],
          list: [
            "Stop using the product immediately once the issue is identified.",
            "Keep the product, packaging, and any included components.",
            "Contact or visit Pharsyde within the applicable 24-hour reporting period.",
            "Provide their original receipt, order confirmation, or other valid proof of purchase where available."
          ],
          finalParagraphs: [
            "Continuing to use the product after identifying a concern may affect our ability to determine whether the issue was present at the time of purchase or resulted from continued use.",
            "During inspection, Pharsyde may assess the condition and remaining contents of the product. This may include checking for signs of continued use, physical damage, leakage, tampering, or a significant reduction in the product's remaining e-liquid/juice level.",
            "If a customer continues to use a disposable vape after identifying a concern, the product may be considered used upon inspection. This may include consideration of any reduction in the product's e-liquid/juice level that occurred after the concern was identified.",
            "Customers should therefore stop using the product immediately and contact Pharsyde within 24 hours of the applicable purchase or delivery time if they believe there is a problem.",
            "Pharsyde will inspect the product and determine the appropriate resolution based on the nature of the reported issue, the condition of the product, applicable manufacturer warranty requirements, and applicable consumer protection laws."
          ]
        },
        {
          subtitle: "Flavour Burn / Burnt Taste Claims",
          paragraphs: [
            "In the event of a flavour burn, burnt taste, or similar flavour-related claim, Pharsyde may contact the brand/manufacturer of the device or product in question for assessment or guidance.",
            "Because flavour perception and burnt-taste claims can be subjective, the brand/manufacturer's assessment and decision will be taken into consideration when determining whether the product is defective and whether an exchange or other resolution is appropriate.",
            "Pharsyde cannot be held responsible for a product that is determined to be working as intended, even if the customer does not enjoy or agree with the flavour, taste, vapour production, or other subjective characteristics of the product.",
            "Customers must stop using the product immediately once a flavour-burn or burnt-taste concern is identified and contact Pharsyde within the applicable reporting period.",
            "A flavour-burn or burnt-taste claim does not automatically qualify for a refund, exchange, or replacement. The product may be inspected by Pharsyde and, where applicable, referred to the manufacturer for further assessment."
          ]
        }
      ]
    },
    {
      num: "04",
      id: "sec-04",
      title: "Defective Products & Warranty",
      paragraphs: [
        "Nothing in this policy is intended to limit any rights a customer may have under applicable Manitoba consumer protection law.",
        "For eligible defective or malfunctioning merchandise, Pharsyde may, depending on the circumstances and applicable warranty, repair, replace, exchange, refund, or provide store credit for the defective product.",
        "A product must be inspected by Pharsyde before a warranty resolution is approved.",
        "Customers should bring:"
      ],
      list: [
        "The defective product.",
        "Original packaging, where applicable.",
        "All relevant components/accessories.",
        "A valid receipt or proof of purchase."
      ],
      subsections: [
        {
          subtitle: "Vape Device Warranty",
          paragraphs: [
            "Unless a manufacturer provides a different warranty, eligible vape devices purchased from Pharsyde are covered by a 7-day store warranty from the date of purchase.",
            "For online purchases, the warranty period begins on the date the order is delivered and remains valid for 7 days from the delivery date.",
            "A warranty claim does not automatically guarantee a refund or replacement. The product must first be inspected by Pharsyde to determine whether the issue is a manufacturing defect or customer-caused damage.",
            "All warranty concerns must be reported to Pharsyde within the applicable 7-day warranty period."
          ]
        },
        {
          subtitle: "Faulty Product Exchange",
          paragraphs: [
            "If a product is confirmed by Pharsyde to be faulty or defective, it will be exchanged for the same brand-new product, provided the same product is available.",
            "If the exact same product is unavailable, Pharsyde may provide an exchange for a similar product of comparable type and value, where available.",
            "Faulty-product exchanges are intended to replace the defective product and are not an opportunity to change the product's flavour, colour, style, model, or other preferences.",
            "Any replacement product will be determined based on the original product purchased and the nature of the confirmed defect."
          ]
        }
      ]
    },
    {
      num: "05",
      id: "sec-05",
      title: "What Is Not Covered Under Warranty",
      paragraphs: [
        "Warranty coverage does not apply to damage or failure caused by:"
      ],
      list: [
        "Dropping or physical impact;",
        "Accidental damage;",
        "Abuse or misuse;",
        "Water or liquid damage;",
        "E-liquid leakage or spillage;",
        "Improper charging;",
        "Use of incompatible chargers or accessories;",
        "Failure to follow manufacturer instructions;",
        "Unauthorized repairs;",
        "Unauthorized modifications;",
        "Over-tightening tanks or connections;",
        "Stripped or damaged threads;",
        "Broken glass;",
        "Damage caused by excessive heat or extreme temperatures;",
        "Cosmetic damage or scratches;",
        "Normal wear and tear;",
        "Any other damage resulting from customer negligence or misuse."
      ],
      closingParagraphs: [
        "Modifying a product may void the applicable manufacturer or Pharsyde warranty."
      ]
    },
    {
      num: "06",
      id: "sec-06",
      title: "Sale, Clearance & As-Is Products",
      paragraphs: [
        "Products marked Sale, Clearance, Final Sale, or As-Is are final sale and are not eligible for change-of-mind returns or exchanges.",
        "However, this policy does not eliminate any rights or remedies that may apply to defective merchandise under applicable law or an applicable manufacturer warranty."
      ]
    },
    {
      num: "07",
      id: "sec-07",
      title: "Wrong or Missing Items",
      paragraphs: [
        "If Pharsyde sends you an incorrect or incomplete order, please contact us within 5 days of receiving your order.",
        "If the error was made by Pharsyde, we will work with you to correct the issue.",
        "Incorrect merchandise may need to be returned to Pharsyde before a replacement or other resolution is provided."
      ]
    },
    {
      num: "08",
      id: "sec-08",
      title: "Online Purchases & Mandatory In-Store Venue",
      paragraphs: [
        "All online purchases are subject to the same return, exchange, warranty, and Final Sale conditions outlined in this policy."
      ],
      subsections: [
        {
          subtitle: "Online Purchases Must Be Returned In-Store",
          paragraphs: [
            "All eligible online returns must be brought to a Pharsyde store in person at 117 Regent Ave W, Winnipeg.",
            "Pharsyde does not provide:"
          ],
          list: [
            "Return shipping labels;",
            "Return pickup services;",
            "Prepaid return shipping; or",
            "Reimbursement for customer return shipping costs."
          ],
          finalParagraphs: [
            "Customers are responsible for bringing eligible merchandise to a Pharsyde location.",
            "The original order confirmation, receipt, or other proof of purchase must be provided."
          ]
        },
        {
          subtitle: "Online Order Delivery & ID Verification",
          paragraphs: [
            "For online orders containing age-restricted products, Pharsyde requires the recipient to provide a valid form of official government-issued identification at the time of delivery.",
            "The identification may be checked to verify:"
          ],
          list: [
            "The recipient's identity;",
            "That the person receiving the order is the same person who placed the online order;",
            "That the recipient meets the applicable minimum legal age for the products being delivered; and",
            "That the order is being received by an authorized purchaser."
          ],
          finalParagraphs: [
            "Pharsyde reserves the right to refuse or not complete delivery if the recipient: cannot provide acceptable identification; provides identification that is expired, invalid, altered, or otherwise unacceptable; is not the person who placed the order; does not meet the applicable minimum legal age (19+ in Manitoba); appears to be attempting to receive an order placed by another person without authorization; or is otherwise unable to satisfy Pharsyde's identity or age-verification requirements."
          ]
        },
        {
          subtitle: "Undeliverable Orders Due to ID or Authorization Verification",
          paragraphs: [
            "If an online order cannot be delivered because the required identity or age verification cannot be completed, including situations involving an unauthorized order placement or an attempt by another person to receive the order, the order may be cancelled and not released for delivery.",
            "In these circumstances, Pharsyde will not provide a refund or exchange, except where a refund or other remedy is required by applicable law.",
            "Customers are responsible for ensuring that online orders are placed by the authorized purchaser and that the purchaser is available at the delivery address with valid identification when required.",
            "Pharsyde is not responsible for an unsuccessful delivery resulting from the customer or recipient's inability or refusal to complete the required identity or age-verification process."
          ]
        }
      ]
    },
    {
      num: "09",
      id: "sec-09",
      title: "Incorrect Shipping Information",
      paragraphs: [
        "Customers are responsible for providing a complete and accurate shipping address.",
        "Pharsyde is not responsible for orders that are delayed, returned, or undeliverable because of:"
      ],
      list: [
        "An incorrect address;",
        "An incomplete address;",
        "Incorrect recipient information;",
        "Failure to provide required delivery information; or",
        "Failure to claim or accept a delivery."
      ],
      closingParagraphs: [
        "If an order is returned to Pharsyde because of incorrect or incomplete information provided by the customer, any refund or reshipment will be handled at Pharsyde's discretion and may be subject to applicable shipping costs."
      ]
    },
    {
      num: "10",
      id: "sec-10",
      title: "Shipping Delays & Lost Packages",
      paragraphs: [
        "Pharsyde does not issue refunds solely because a package is delayed or has not arrived within the customer's expected timeframe.",
        "If a package appears to be lost, Pharsyde may work with the applicable carrier to investigate the shipment.",
        "A refund or replacement may be considered once the carrier officially confirms that the package has been lost.",
        "Shipping delays caused by the carrier, weather, missed delivery attempts, incorrect customer information, or circumstances outside Pharsyde's control do not automatically qualify for a refund."
      ]
    },
    {
      num: "11",
      id: "sec-11",
      title: "Refunds",
      paragraphs: [
        "Approved refunds will generally be issued to the original method of payment, where possible.",
        "All returned merchandise must be inspected before a refund, exchange, or store credit is approved.",
        "Original shipping charges are generally non-refundable unless:"
      ],
      list: [
        "The issue resulted from an error made by Pharsyde; or",
        "A refund of those charges is otherwise required by applicable law."
      ],
      closingParagraphs: [
        "Where appropriate, Pharsyde may provide store credit instead of a refund."
      ]
    },
    {
      num: "12",
      id: "sec-12",
      title: "Proof of Purchase",
      paragraphs: [
        "A valid receipt or other acceptable proof of purchase is required for returns, exchanges, warranty claims, and refund requests.",
        "Without proof of purchase, Pharsyde may be unable to process the request."
      ]
    },
    {
      num: "13",
      id: "sec-13",
      title: "Product Recalls",
      paragraphs: [
        "If a product purchased from Pharsyde is subject to an official recall, Pharsyde will provide customers with applicable instructions regarding the return, replacement, refund, or other required resolution.",
        "Cannabis products may only be returned in accordance with applicable Manitoba requirements and official recall procedures."
      ]
    },
    {
      num: "14",
      id: "sec-14",
      title: "Customer Responsibility",
      paragraphs: [
        "Customers are responsible for inspecting products at the time of purchase and following all manufacturer instructions and applicable safety requirements.",
        "Pharsyde is not responsible for damage caused by improper use, misuse, modification, neglect, or failure to follow manufacturer instructions.",
        "Pharsyde reserves the right to update this policy from time to time to reflect changes in applicable laws, regulations, manufacturer warranty requirements, or store procedures."
      ]
    }
  ];

  // 15 Comprehensive Manitoba & Canadian Terms & Conditions Sections
  const termsSections = [
    {
      num: "01",
      id: "tc-01",
      title: "Acceptance of Terms & Mandatory 19+ Legal Age",
      paragraphs: [
        "Welcome to Pharsyde (operated by Pharsyde Inc., Winnipeg, Manitoba). By visiting our website (pharsyde.jeenhost.in / pharsyde.ca), registering an online account, placing an order, or utilizing our pickup or delivery services, you explicitly agree to be legally bound by these Terms and Conditions of Service, our Return & Refund Policy, and our Privacy Policy.",
        "STRICT AGE REQUIREMENT (19+): In strict compliance with the Manitoba Liquor, Gaming and Cannabis Control Act (C.C.S.M. c. L153) and federal cannabis legislation, you MUST be at least 19 years of age to enter our premises, view age-restricted catalog products, create an account, or purchase any cannabis, nicotine, or vaporizer products. Misrepresenting your age or attempting to purchase age-restricted goods for minors is illegal and constitutes a direct breach of these Terms."
      ]
    },
    {
      num: "02",
      id: "tc-02",
      title: "Provincial Jurisdiction & Authorized Delivery Boundaries",
      paragraphs: [
        "Pharsyde operates under retail cannabis and lifestyle licenses issued in the Province of Manitoba. In strict adherence to provincial regulations, home delivery of cannabis and nicotine products is exclusively available to residential addresses located within designated licensed delivery zones in the greater Winnipeg metropolitan area.",
        "We do NOT ship or deliver cannabis, nicotine, or controlled consumables outside the Province of Manitoba, across provincial borders, or internationally under any circumstances. Any order placed requesting delivery outside our authorized municipal delivery perimeter will be immediately cancelled."
      ]
    },
    {
      num: "03",
      id: "tc-03",
      title: "Account Registration, Security & Accuracy",
      paragraphs: [
        "When registering an account with Pharsyde, you agree to provide truthful, accurate, and complete information, including your full legal name, date of birth, delivery address, phone number, and email.",
        "You are solely responsible for maintaining the confidentiality of your account credentials, login password, and authentication tokens. You agree to notify Pharsyde immediately of any suspected unauthorized access. Pharsyde reserves the right to suspend or terminate accounts that provide fraudulent information, breach statutory age requirements, or demonstrate abusive behavior."
      ]
    },
    {
      num: "04",
      id: "tc-04",
      title: "Mandatory Government Photo ID Verification at Delivery & Pickup",
      paragraphs: [
        "In accordance with Section 30 of Manitoba's Cannabis Regulation (M.R. 120/2018), physical, valid, unexpired government-issued photo identification demonstrating 19+ age is mandatory upon delivery or in-store order pickup.",
        "The recipient's identity must directly match the full legal name on the order and the credit card used for payment. Acceptable forms of ID include: Manitoba Driver's Licence, Canadian Passport, Manitoba Identification Card, Canadian Armed Forces Identity Card, or Secure Certificate of Indian Status. Digital photos, expired IDs, student cards, or photocopies are strictly refused.",
        "If acceptable identification is not produced, our bonded couriers will NOT release the order. The parcel will be returned to our retail storefront and cancelled without a delivery refund."
      ]
    },
    {
      num: "05",
      id: "tc-05",
      title: "Statutory Possession Limits (Cannabis Act Equivalencies)",
      paragraphs: [
        "Under Section 8(1) of the federal Cannabis Act (S.C. 2018, c. 16), the maximum statutory public possession and single-transaction purchase limit is 30 grams of dried cannabis or its legal equivalent:",
      ],
      list: [
        "150 grams of fresh cannabis flower;",
        "450 grams of edible cannabis products;",
        "2,100 grams of liquid cannabis beverages;",
        "7.5 grams of cannabis concentrates (solid or liquid extracts, vape cartridges, rosin, or wax);",
        "30 viable cannabis seeds."
      ],
      closingParagraphs: [
        "Our digital checkout system enforces strict automated cannabis equivalency calculators. Any order structured or attempted to circumvent statutory possession limits will be immediately blocked or cancelled."
      ]
    },
    {
      num: "06",
      id: "tc-06",
      title: "Pricing, Product Availability & Point-of-Sale Synchronization",
      paragraphs: [
        "All prices on Pharsyde are listed in Canadian Dollars (CAD) and exclude applicable provincial Retail Sales Tax (RST 7%), federal Goods and Services Tax (GST 5%), and statutory excise duties, which are calculated and itemized at checkout.",
        "Our online storefront synchronizes directly with our physical Point-of-Sale (TechPOS) at 117 Regent Ave W. While inventory updates continuously, simultaneous physical sales may occasionally cause an item to become sold out. In such cases, our staff will contact you to offer an equivalent substitute or issue an immediate refund.",
        "Pharsyde reserves the right to correct typographical errors, misprints, or inadvertent pricing inaccuracies at any time prior to order fulfillment."
      ]
    },
    {
      num: "07",
      id: "tc-07",
      title: "Payment Processing & Cardholder Verification (Moneris)",
      paragraphs: [
        "Payments for online orders are processed through encrypted, PCI-DSS Level 1 compliant financial gateways powered by Moneris Solutions. Pharsyde's servers never store, log, or maintain full credit card numbers or security CVV codes.",
        "By placing an order, you represent and warrant that you are the lawful cardholder or authorized user of the designated payment method. Orders flagged by Moneris Address Verification System (AVS) or fraud risk algorithms are subject to manual verification or immediate cancellation."
      ]
    },
    {
      num: "08",
      id: "tc-08",
      title: "Intellectual Property & Brand Assets",
      paragraphs: [
        "All visual designs, logotypes, brand icons, product descriptions, photography, page layouts, scripts, and software on this website are the proprietary property of Pharsyde Inc. or its licensors and are protected under Canadian and international copyright and trademark laws.",
        "You may not scrape, copy, modify, republish, distribute, or create derivative works from any website materials without prior express written authorization from Pharsyde Inc."
      ]
    },
    {
      num: "09",
      id: "tc-09",
      title: "Prohibited Uses & Unlawful Conduct",
      paragraphs: [
        "You agree not to use our website, services, or products for any unlawful purpose, including but not limited to:",
      ],
      list: [
        "Reselling, distributing, or transferring regulated cannabis or nicotine products to secondary parties;",
        "Purchasing or attempting to procure products for individuals under the legal age of 19;",
        "Circumventing age-gate verification, geographic IP fencing, or security controls;",
        "Injecting malicious code, viruses, or deploying automated scraping bots or scrapers against our platform;",
        "Impersonating another person or utilizing fraudulent payment methods."
      ]
    },
    {
      num: "10",
      id: "tc-10",
      title: "Health Warnings, Impairment & Consumer Responsibility",
      paragraphs: [
        "Cannabis and nicotine products are strictly for adult consumption (19+) by individuals aware of their personal tolerance and health considerations.",
        "HEALTH CANADA WARNING: Cannabis consumption may impair motor skills and judgment. Do NOT drive, operate motor vehicles, or handle heavy machinery while impaired. Nicotine is a highly addictive substance. Keep all cannabis, e-liquids, and accessories in child-resistant packaging and securely out of reach of children and pets.",
        "Pharsyde does not provide medical advice or make therapeutic health claims regarding cannabis. Consult a licensed physician for medical guidance."
      ]
    },
    {
      num: "11",
      id: "tc-11",
      title: "Disclaimer of Warranties & Limitation of Liability",
      paragraphs: [
        "Except as explicitly provided in our 7-Day Store Warranty or statutory warranties under the Manitoba Consumer Protection Act, this website and all products and services are provided on an 'AS-IS' and 'AS-AVAILABLE' basis without representations or warranties of any kind.",
        "To the fullest extent permitted by applicable law, Pharsyde Inc., its directors, officers, employees, and agents shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or inability to use this platform, shipping delays caused by weather or carriers, or the misuse or consumption of purchased products."
      ]
    },
    {
      num: "12",
      id: "tc-12",
      title: "Indemnification",
      paragraphs: [
        "You agree to indemnify, defend, and hold harmless Pharsyde Inc., its affiliates, officers, directors, staff, and partners against any claims, liabilities, damages, losses, costs, and legal fees arising from your violation of these Terms, unlawful purchase or distribution of age-restricted goods, or misrepresentation of identity or age."
      ]
    },
    {
      num: "13",
      id: "tc-13",
      title: "Severability & Entire Agreement",
      paragraphs: [
        "If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction in Manitoba, such provision shall be enforced to the maximum extent permissible, and the remaining provisions shall continue in full force and effect.",
        "These Terms, along with our Return & Refund Policy and Privacy Policy, constitute the entire agreement between you and Pharsyde regarding the use of our services."
      ]
    },
    {
      num: "14",
      id: "tc-14",
      title: "Governing Law & Legal Jurisdiction",
      paragraphs: [
        "These Terms of Service and any contractual relationships arising from the purchase of goods or services from Pharsyde shall be governed by, interpreted, and construed in accordance with the laws of the Province of Manitoba and the federal laws of Canada applicable therein.",
        "You irrevocably agree that any dispute, claim, or proceeding arising out of or related to these Terms shall be instituted exclusively in the Courts of Manitoba sitting in the City of Winnipeg."
      ]
    },
    {
      num: "15",
      id: "tc-15",
      title: "Contact & Corporate Notices",
      paragraphs: [
        "For legal notices, inquiries regarding these Terms of Service, or corporate matters, please contact:",
        "Pharsyde Inc. | 117 Regent Ave W, Winnipeg, MB R2C 1R1 | Phone: (204) 222-4753 | Email: cannabis@pharsyde.ca"
      ]
    }
  ];

  // 13 Comprehensive Canadian PIPEDA & CASL Privacy Policy Sections
  const privacySections = [
    {
      num: "01",
      id: "pv-01",
      title: "Commitment to Your Privacy",
      paragraphs: [
        "Pharsyde Inc. ('Pharsyde', 'we', 'us', or 'our') is deeply committed to safeguarding the privacy and security of your personal information. This Privacy Policy outlines how we collect, use, store, protect, and disclose personal data when you visit our storefront at 117 Regent Ave W, Winnipeg, access our digital portal, or purchase goods through our website.",
        "We adhere strictly to the Personal Information Protection and Electronic Documents Act (PIPEDA), applicable Manitoba privacy regulations, and the Canadian Anti-Spam Legislation (CASL)."
      ]
    },
    {
      num: "02",
      id: "pv-02",
      title: "Personal Information We Collect",
      paragraphs: [
        "We collect personal information necessary to deliver authentic retail service, verify compliance with Manitoba age laws, and fulfill orders:",
      ],
      list: [
        "Account & Identification Data: Full legal name, date of birth (for 19+ age gate qualification), email address, telephone number, and residential delivery address;",
        "Age & Identity Verification: Visual confirmation of government photo ID (Manitoba Driver's Licence, Passport, or Provincial ID) upon delivery or pickup. We do NOT store biometric facial scans or permanent images of your ID cards on our web servers;",
        "Order & Transaction History: Items ordered, timestamps, order amounts, and fulfillment method (in-store pickup or local delivery), synchronized with our Point-of-Sale (TechPOS);",
        "Payment Data: Cardholder billing address, card brand, and masked last 4 digits tokenized securely via Moneris. We never store or log full 16-digit credit card numbers or CVV codes;",
        "Device & Technical Data: IP address, browser type, operating system, approximate geographic location, session duration, and cookies."
      ]
    },
    {
      num: "03",
      id: "pv-03",
      title: "How We Collect Information",
      paragraphs: [
        "We gather data directly when you create an account, complete our 19+ age gate, submit an order, subscribe to updates, or communicate with our staff in-store or by email/phone.",
        "Technical metrics and session cookies are gathered automatically through secure browser protocols as you navigate our catalog."
      ]
    },
    {
      num: "04",
      id: "pv-04",
      title: "Purposes for Which We Process Your Data",
      paragraphs: [
        "Your personal data is used solely for legitimate business and regulatory purposes:",
      ],
      list: [
        "Processing, verifying, and dispatching in-store pickup and Winnipeg local delivery orders;",
        "Verifying legal 19+ adult age compliance under Manitoba Liquor, Gaming and Cannabis Authority (LGCA) regulations;",
        "Synchronizing inventory and transaction records with our retail Point-of-Sale (TechPOS);",
        "Enforcing federal cannabis 30-gram public possession purchase thresholds per transaction;",
        "Delivering operational notifications, dispatch alerts, tracking links, and digital receipts;",
        "Detecting and preventing payment fraud, identity spoofing, and unauthorized account access;",
        "Sending opt-in marketing announcements in compliance with CASL (with an immediate one-click unsubscribe option at any time)."
      ]
    },
    {
      num: "05",
      id: "pv-05",
      title: "Payment Card Security (Moneris PCI-DSS Level 1)",
      paragraphs: [
        "Payment processing is conducted through Moneris Solutions, Canada's leading certified PCI-DSS Level 1 payment processor. Sensitive financial information is encrypted end-to-end via 256-bit SSL/TLS encryption.",
        "Pharsyde employees and administrators do not have access to your full credit card numbers or CVV security codes at any point during checkout."
      ]
    },
    {
      num: "06",
      id: "pv-06",
      title: "Age & ID Verification Protocols",
      paragraphs: [
        "Under Manitoba law, retail cannabis licensees must verify that every customer is at least 19 years old. When you order delivery or pickup, our staff or bonded couriers visually inspect your physical, original government photo ID at the time of handover.",
        "This verification is completed visually to confirm identity and age. We do not sell, rent, or commercialize age verification information to third parties."
      ]
    },
    {
      num: "07",
      id: "pv-07",
      title: "Third-Party Service Providers & Zero Sale of Data",
      paragraphs: [
        "WE DO NOT SELL, RENT, OR TRADE YOUR PERSONAL INFORMATION TO THIRD PARTIES OR MARKETING BROKERS UNDER ANY CIRCUMSTANCES.",
        "We disclose data strictly to essential service providers who support our core retail operations under confidentiality agreements:",
      ],
      list: [
        "Payment Gateway: Moneris Solutions (for payment processing and fraud screening);",
        "Point of Sale & Inventory: TechPOS (for local store inventory sync and accounting);",
        "Local Delivery Couriers: Recipient name, address, and delivery instructions (for fulfillment);",
        "Hosting & Infrastructure: Secure Canadian/cloud servers with encrypted storage."
      ],
      closingParagraphs: [
        "Regulatory Disclosures: We may disclose personal records when required by law, subpoena, or official audit by Health Canada or the Manitoba Liquor, Gaming and Cannabis Authority (LGCA)."
      ]
    },
    {
      num: "08",
      id: "pv-08",
      title: "Canadian Anti-Spam Legislation (CASL) Compliance",
      paragraphs: [
        "We strictly abide by CASL. You will only receive promotional marketing messages or text alerts from Pharsyde if you have provided express consent.",
        "You can withdraw your consent at any time by clicking the 'Unsubscribe' link in any email or replying 'STOP' to SMS communications. Transactional emails regarding order status, receipts, and delivery updates will continue as necessary for active purchases."
      ]
    },
    {
      num: "09",
      id: "pv-09",
      title: "Cookies, Web Storage & Tracking Technologies",
      paragraphs: [
        "Our website utilizes essential session cookies and local storage tokens to retain your shopping cart contents, maintain your 19+ age gate confirmation during browsing, and secure your login session.",
        "We do not utilize invasive cross-site tracking cookies. You may disable cookies in your browser settings, though doing so may prevent adding items to your cart or completing online checkout."
      ]
    },
    {
      num: "10",
      id: "pv-10",
      title: "Data Safeguards & Retention Periods",
      paragraphs: [
        "We implement physical, administrative, and technological security controls—including role-based access restrictions, firewall monitoring, and encryption—to safeguard your data against unauthorized access, alteration, or disclosure.",
        "Personal records are retained only as long as necessary to fulfill the transactional purpose for which they were collected, or to satisfy legal, tax, and cannabis regulatory recordkeeping mandates under Manitoba law."
      ]
    },
    {
      num: "11",
      id: "pv-11",
      title: "Your Rights & Access to Personal Information",
      paragraphs: [
        "Under PIPEDA, you have the right to request access to the personal data Pharsyde holds concerning you, and to request corrections if any information is inaccurate or outdated.",
        "To submit a privacy inquiry or access request, please contact our Privacy Officer in writing using the details provided below."
      ]
    },
    {
      num: "12",
      id: "pv-12",
      title: "Policy Amendments & Updates",
      paragraphs: [
        "Pharsyde reserves the right to revise this Privacy Policy periodically to reflect changes in regulatory standards, technology, or retail operations. Any updates will be posted to this page with an updated revision date."
      ]
    },
    {
      num: "13",
      id: "pv-13",
      title: "Contact Our Privacy Officer",
      paragraphs: [
        "For questions, access requests, or feedback regarding our privacy practices, please contact:",
        "Privacy Officer | Pharsyde Inc. | 117 Regent Ave W, Winnipeg, MB R2C 1R1 | Phone: (204) 222-4753 | Email: cannabis@pharsyde.ca"
      ]
    }
  ];

  // Pick sections for active tab
  const getActiveSections = () => {
    if (activeTab === 'terms') return termsSections;
    if (activeTab === 'privacy') return privacySections;
    return returnSections;
  };

  const currentSections = getActiveSections();

  // Search filter
  const filteredSections = searchQuery.trim()
    ? currentSections.filter(sec => {
        const query = searchQuery.toLowerCase();
        const inTitle = sec.title.toLowerCase().includes(query);
        const inPara = sec.paragraphs?.some(p => p.toLowerCase().includes(query));
        const inList = sec.list?.some(l => l.toLowerCase().includes(query));
        const inSub = sec.subsections?.some(sub => 
          sub.subtitle?.toLowerCase().includes(query) ||
          sub.paragraphs?.some(p => p.toLowerCase().includes(query)) ||
          sub.list?.some(l => l.toLowerCase().includes(query))
        );
        return inTitle || inPara || inList || inSub;
      })
    : currentSections;

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Page Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#0166dc] text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>CONSUMER PROTECTION & POLICIES</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight uppercase mb-4">
            LEGAL & POLICY CENTER
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Pharsyde is Winnipeg's premier licensed craft dispensary and lifestyle boutique. 
            Review our official return guidelines, terms of service, and privacy policies below.
          </p>
        </div>

        {/* Tab Selection Hub */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl sm:rounded-full shadow-xs mb-10 mx-auto">
          <button
            onClick={() => handleTabChange('returns')}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'returns'
                ? 'bg-[#0166dc] text-white shadow-md shadow-[#0166dc]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return & Warranty</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'returns' ? 'bg-black/10 text-black' : 'bg-slate-100 text-slate-500'}`}>
              14
            </span>
          </button>

          <button
            onClick={() => handleTabChange('terms')}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-[#0166dc] text-white shadow-md shadow-[#0166dc]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'terms' ? 'bg-black/10 text-black' : 'bg-slate-100 text-slate-500'}`}>
              15
            </span>
          </button>

          <button
            onClick={() => handleTabChange('privacy')}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-[#0166dc] text-white shadow-md shadow-[#0166dc]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Policy</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'privacy' ? 'bg-black/10 text-black' : 'bg-slate-100 text-slate-500'}`}>
              PIPEDA
            </span>
          </button>
        </div>

        {/* Search & Jump Navigator */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'returns' ? 'Return' : activeTab === 'terms' ? 'Terms' : 'Privacy'} sections...`}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#0166dc] focus:ring-2 focus:ring-[#0166dc]/20 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            <span className="text-slate-400 shrink-0 font-medium">Quick Jump:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {currentSections.slice(0, 5).map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                >
                  {sec.num}
                </a>
              ))}
              {currentSections.length > 5 && (
                <span className="text-slate-400 text-xs px-1">...</span>
              )}
            </div>
          </div>
        </div>

        {/* Top Feature Highlights based on Active Tab */}
        {activeTab === 'returns' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  Cannabis: Final Sale
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Per Manitoba Regulation M.R. 120/2018 Sec. 31, all cannabis products are strictly final sale unless subject to official recall.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-lime-50 border border-lime-200 text-[#0166dc] shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  7-Day General Returns
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Eligible unopened, unused non-cannabis hardware and lifestyle goods may be returned within 7 days with original receipt.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  24-Hour Vape Protocol
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Suspected disposable vape defects or leaks must be reported within 24 hours of purchase or delivery with packaging preserved.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  Strictly 19+ Age Gate
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manitoba law strictly prohibits the sale or transfer of cannabis and nicotine to minors under 19.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-lime-50 border border-lime-200 text-[#0166dc] shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  Winnipeg Delivery Only
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deliveries are strictly restricted to authorized Winnipeg municipal zones. We never ship across provincial borders.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  30g Possession Limit
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every transaction strictly enforces the federal 30-gram public dried cannabis possession threshold.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  Moneris Level 1 Security
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All transactions are tokenized via Moneris Solutions. We never store complete credit card numbers on our servers.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-lime-50 border border-lime-200 text-[#0166dc] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  Zero Data Selling
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We never sell, rent, or trade your personal information or contact details to third-party marketing brokers.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                  CASL Compliance
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Marketing emails and SMS are strictly opt-in with immediate one-click unsubscribe available at all times.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Policy Section Cards */}
        <div className="space-y-6">
          {filteredSections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-[#0166dc] font-black text-xs font-mono">
                  {sec.num}
                </span>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 uppercase">
                  {sec.title}
                </h2>
              </div>

              {/* Main Paragraphs */}
              {sec.paragraphs?.map((para, pIdx) => (
                <p key={pIdx} className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  {para}
                </p>
              ))}

              {/* Main List */}
              {sec.list && (
                <ul className="my-3 space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {sec.list.map((item, lIdx) => (
                    <li key={lIdx}>{item}</li>
                  ))}
                </ul>
              )}

              {/* Subsections if present */}
              {sec.subsections?.map((sub, sIdx) => (
                <div key={sIdx} className="mt-6 pt-5 border-t border-slate-100">
                  <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 uppercase mb-3 text-slate-800">
                    {sub.subtitle}
                  </h3>
                  
                  {sub.paragraphs?.map((p, spIdx) => (
                    <p key={spIdx} className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                      {p}
                    </p>
                  ))}

                  {/* Manitoba Law Quote Callout */}
                  {sub.quote && (
                    <div className="my-4 p-4 rounded-2xl bg-amber-50/70 border-l-4 border-amber-500 text-amber-950 font-medium text-xs sm:text-sm italic leading-relaxed">
                      {sub.quote}
                    </div>
                  )}

                  {sub.followupParagraph && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                      {sub.followupParagraph}
                    </p>
                  )}

                  {sub.followupList && (
                    <ul className="my-2 space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {sub.followupList.map((item, fIdx) => (
                        <li key={fIdx}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {sub.list && (
                    <ul className="my-3 space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {sub.list.map((item, slIdx) => (
                        <li key={slIdx}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {sub.finalParagraphs?.map((fp, fpIdx) => (
                    <p key={fpIdx} className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                      {fp}
                    </p>
                  ))}
                </div>
              ))}

              {/* Closing Paragraphs */}
              {sec.closingParagraphs?.map((cp, cIdx) => (
                <p key={cIdx} className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {cp}
                </p>
              ))}
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h3 className="font-heading text-base font-bold text-slate-800 uppercase mb-1">
                No Matching Sections Found
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                No policy items matched "{searchQuery}". Try a different keyword or reset your search.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Bottom Contact & Storefront Card */}
        <div className="mt-14 p-8 rounded-3xl bg-white border border-slate-200 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0166dc] block">
                PHARSYDE CUSTOMER CARE
              </span>
              <h3 className="font-heading text-xl font-bold text-slate-900 uppercase">
                Questions Regarding Policies or an Active Order?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our knowledgeable staff at 117 Regent Ave W, Winnipeg are available during store hours to guide you through warranty claims, returns, and order verifications.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href={`tel:${STORE_INFO.phone}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#0166dc]/20 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call {STORE_INFO.phone}</span>
              </a>
              <a
                href={`mailto:${STORE_INFO.email}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Email Customer Support</span>
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0166dc]" />
              <span>{STORE_INFO.address}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Mon–Fri: 7am–10pm</span>
              <span>•</span>
              <span>Sat: 8am–10pm</span>
              <span>•</span>
              <span>Sun: 9am–9pm</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
