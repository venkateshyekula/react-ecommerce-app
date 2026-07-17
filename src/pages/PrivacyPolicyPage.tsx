import { useMemo, useState } from "react";
import LegalLanguageDropdown from "../components/legal/LegalLanguageDropdown";
import type { LegalLanguageCode } from "../types/legal";

interface LegalSection {
  heading: string;
  body: string;
  points?: string[];
}

interface LegalPageContent {
  title: string;
  subtitle: string;
  sections: LegalSection[];
}

const privacyPolicyContent: Record<LegalLanguageCode, LegalPageContent> = {
  en: {
    title: "Privacy Policy",
    subtitle:
      "This policy explains how ShopEase collects, uses and protects information in this demo marketplace application.",
    sections: [
      {
        heading: "1. Introduction",
        body:
          "ShopEase is an e-commerce marketplace application that allows customers to browse products, place orders, manage saved addresses, track deliveries, use wallet credits, reward points, coupons, reviews, questions, returns and refunds."
      },
      {
        heading: "2. Information We Collect",
        body:
          "We may collect information that helps us provide shopping, account, checkout, delivery, support and marketplace features.",
        points: [
          "Account details such as name, email, mobile number and role.",
          "Saved addresses used for checkout, delivery and return workflows.",
          "Cart, wishlist, recently viewed products and order activity.",
          "Wallet transactions, reward transactions and coupon redemption history.",
          "Reviews, ratings, product questions and support interactions.",
          "Notifications related to orders, wallet expiry, rewards, refunds and account activity."
        ]
      },
      {
        heading: "3. How We Use Information",
        body:
          "ShopEase uses information to provide and improve the marketplace experience.",
        points: [
          "To process orders, returns, refunds and delivery updates.",
          "To manage wallet credits, reward points, coupons and savings activity.",
          "To personalize product recommendations and shopping preferences.",
          "To support customer, admin, seller and support workflows.",
          "To maintain account security, access control and operational reliability."
        ]
      },
      {
        heading: "4. Saved Addresses and Delivery Data",
        body:
          "Saved addresses are used for checkout, delivery estimates, fulfillment, order shipment and return/refund processing. Users can add, edit, delete and set default addresses from the Address Book page."
      },
      {
        heading: "5. Wallet, Rewards and Coupons",
        body:
          "Wallet credits, reward points, coupon redemptions and savings activity are stored to provide ledger visibility, checkout redemption, expiry alerts, savings summaries and account history."
      },
      {
        heading: "6. Reviews, Questions and Public Content",
        body:
          "Product reviews, ratings and product questions may be visible to other users depending on the feature. Users should avoid posting sensitive personal information in public-facing content."
      },
      {
        heading: "7. Personalization and Recommendations",
        body:
          "ShopEase may use browsing activity, wishlist activity, cart items, orders, preferred categories, preferred brands and price preferences to show personalized recommendations."
      },
      {
        heading: "8. Cookies and Local Storage",
        body:
          "ShopEase may use browser storage for sessions, recently viewed products, cart behavior and UI preferences. Clearing browser data may remove locally stored preferences."
      },
      {
        heading: "9. Data Sharing and Role-Based Access",
        body:
          "Information may be visible to authorized role-based users such as admins, sellers and support users where required for product management, fulfillment, customer support, refunds, returns or operational workflows."
      },
      {
        heading: "10. Security",
        body:
          "ShopEase uses role-based routing and application-level access controls. Users are responsible for keeping login credentials secure and logging out from shared devices."
      },
      {
        heading: "11. Data Retention",
        body:
          "Order, wallet, rewards, coupons, refunds, reviews and support records may be retained for operational, audit, reporting and troubleshooting purposes within the application."
      },
      {
        heading: "12. User Choices",
        body:
          "Users can manage profile details, saved addresses, wallet activity, reward activity, coupon history, orders and preferences through available account pages."
      },
      {
        heading: "13. Contact",
        body:
          "For privacy-related questions, users can visit the Help Center or contact ShopEase support through the available support workflow."
      }
    ]
  },

  te: {
    title: "గోప్యతా విధానం",
    subtitle:
      "ShopEase డెమో మార్కెట్‌ప్లేస్ అప్లికేషన్‌లో సమాచారం ఎలా సేకరించబడుతుంది, ఉపయోగించబడుతుంది మరియు రక్షించబడుతుంది అనే విషయాన్ని ఈ విధానం వివరిస్తుంది.",
    sections: [
      {
        heading: "1. పరిచయం",
        body:
          "ShopEase అనేది ఉత్పత్తులను చూడడం, ఆర్డర్లు పెట్టడం, సేవ్ చేసిన చిరునామాలు నిర్వహించడం, డెలివరీలను ట్రాక్ చేయడం, వాలెట్ క్రెడిట్లు, రివార్డ్ పాయింట్లు, కూపన్లు, రివ్యూలు, ప్రశ్నలు, రిటర్న్స్ మరియు రీఫండ్స్ ఉపయోగించడానికి సహాయపడే ఈ-కామర్స్ మార్కెట్‌ప్లేస్ అప్లికేషన్."
      },
      {
        heading: "2. మేము సేకరించే సమాచారం",
        body:
          "షాపింగ్, ఖాతా, చెక్అవుట్, డెలివరీ, సపోర్ట్ మరియు మార్కెట్‌ప్లేస్ ఫీచర్లను ఇవ్వడానికి అవసరమైన సమాచారాన్ని మేము సేకరించవచ్చు.",
        points: [
          "పేరు, ఇమెయిల్, మొబైల్ నంబర్ మరియు రోల్ వంటి ఖాతా వివరాలు.",
          "చెక్అవుట్, డెలివరీ మరియు రిటర్న్‌ల కోసం సేవ్ చేసిన చిరునామాలు.",
          "కార్ట్, విష్‌లిస్ట్, ఇటీవల చూసిన ఉత్పత్తులు మరియు ఆర్డర్ కార్యకలాపాలు.",
          "వాలెట్ ట్రాన్సాక్షన్లు, రివార్డ్ ట్రాన్సాక్షన్లు మరియు కూపన్ వినియోగ చరిత్ర.",
          "రివ్యూలు, రేటింగ్స్, ఉత్పత్తి ప్రశ్నలు మరియు సపోర్ట్ ఇంటరాక్షన్లు."
        ]
      },
      {
        heading: "3. సమాచారం వినియోగం",
        body:
          "ShopEase మార్కెట్‌ప్లేస్ అనుభవాన్ని అందించడానికి మరియు మెరుగుపరచడానికి సమాచారాన్ని ఉపయోగిస్తుంది.",
        points: [
          "ఆర్డర్లు, రిటర్న్స్, రీఫండ్స్ మరియు డెలివరీ అప్‌డేట్స్ ప్రాసెస్ చేయడానికి.",
          "వాలెట్, రివార్డ్స్, కూపన్లు మరియు సేవింగ్స్ యాక్టివిటీ నిర్వహించడానికి.",
          "వ్యక్తిగతీకరించిన ఉత్పత్తి సిఫార్సులు చూపించడానికి.",
          "కస్టమర్, అడ్మిన్, సెల్లర్ మరియు సపోర్ట్ వర్క్‌ఫ్లోలకు సహాయం చేయడానికి."
        ]
      },
      {
        heading: "4. సేవ్ చేసిన చిరునామాలు మరియు డెలివరీ డేటా",
        body:
          "సేవ్ చేసిన చిరునామాలు చెక్అవుట్, డెలివరీ అంచనాలు, ఫల్ఫిల్మెంట్, షిప్‌మెంట్ మరియు రిటర్న్/రీఫండ్ ప్రాసెసింగ్ కోసం ఉపయోగించబడతాయి."
      },
      {
        heading: "5. వాలెట్, రివార్డ్స్ మరియు కూపన్లు",
        body:
          "వాలెట్ క్రెడిట్లు, రివార్డ్ పాయింట్లు, కూపన్ వినియోగం మరియు సేవింగ్స్ యాక్టివిటీ లెడ్జర్, చెక్అవుట్ రిడెంప్షన్ మరియు ఎక్స్‌పైరీ అలర్ట్స్ కోసం నిల్వ చేయబడతాయి."
      },
      {
        heading: "6. రివ్యూలు మరియు ప్రశ్నలు",
        body:
          "ఉత్పత్తి రివ్యూలు, రేటింగ్స్ మరియు ప్రశ్నలు ఇతర వినియోగదారులకు కనిపించవచ్చు. సున్నితమైన వ్యక్తిగత సమాచారాన్ని పబ్లిక్ కంటెంట్‌లో పోస్ట్ చేయకూడదు."
      },
      {
        heading: "7. వ్యక్తిగతీకరణ మరియు సిఫార్సులు",
        body:
          "ShopEase బ్రౌజింగ్, విష్‌లిస్ట్, కార్ట్, ఆర్డర్స్, క్యాటగిరీలు, బ్రాండ్స్ మరియు ధర ప్రాధాన్యతల ఆధారంగా సిఫార్సులు చూపవచ్చు."
      },
      {
        heading: "8. కుకీలు మరియు లోకల్ స్టోరేజ్",
        body:
          "సెషన్లు, ఇటీవల చూసిన ఉత్పత్తులు, కార్ట్ ప్రవర్తన మరియు UI ప్రాధాన్యతల కోసం బ్రౌజర్ స్టోరేజ్ ఉపయోగించబడవచ్చు."
      },
      {
        heading: "9. భద్రత",
        body:
          "ShopEase రోల్-బేస్డ్ రూటింగ్ మరియు యాక్సెస్ కంట్రోల్స్ ఉపయోగిస్తుంది. వినియోగదారులు తమ లాగిన్ వివరాలను సురక్షితంగా ఉంచాలి."
      },
      {
        heading: "10. సంప్రదింపు",
        body:
          "గోప్యతా సంబంధిత ప్రశ్నల కోసం Help Center లేదా ShopEase support workflow ఉపయోగించండి."
      }
    ]
  },

  hi: {
    title: "गोपनीयता नीति",
    subtitle:
      "यह नीति बताती है कि ShopEase इस demo marketplace application में जानकारी कैसे collect, use और protect करता है.",
    sections: [
      {
        heading: "1. परिचय",
        body:
          "ShopEase एक e-commerce marketplace application है जो customers को products browse करने, orders place करने, saved addresses manage करने, deliveries track करने, wallet credits, reward points, coupons, reviews, questions, returns और refunds use करने की सुविधा देता है."
      },
      {
        heading: "2. हम कौन-सी जानकारी collect करते हैं",
        body:
          "हम shopping, account, checkout, delivery, support और marketplace features provide करने के लिए information collect कर सकते हैं.",
        points: [
          "Name, email, mobile number और role जैसी account details.",
          "Checkout, delivery और returns के लिए saved addresses.",
          "Cart, wishlist, recently viewed products और order activity.",
          "Wallet transactions, reward transactions और coupon redemption history.",
          "Reviews, ratings, product questions और support interactions."
        ]
      },
      {
        heading: "3. जानकारी का उपयोग",
        body:
          "ShopEase marketplace experience provide और improve करने के लिए information use करता है.",
        points: [
          "Orders, returns, refunds और delivery updates process करने के लिए.",
          "Wallet credits, rewards, coupons और savings activity manage करने के लिए.",
          "Personalized product recommendations show करने के लिए.",
          "Customer, admin, seller और support workflows support करने के लिए."
        ]
      },
      {
        heading: "4. Saved Addresses और Delivery Data",
        body:
          "Saved addresses checkout, delivery estimates, fulfillment, shipment और return/refund processing के लिए use होते हैं."
      },
      {
        heading: "5. Wallet, Rewards और Coupons",
        body:
          "Wallet credits, reward points, coupon redemptions और savings activity ledger visibility, checkout redemption और expiry alerts के लिए store की जाती है."
      },
      {
        heading: "6. Reviews और Questions",
        body:
          "Product reviews, ratings और questions अन्य users को दिखाई दे सकते हैं. Users को public content में sensitive personal information post नहीं करनी चाहिए."
      },
      {
        heading: "7. Personalization और Recommendations",
        body:
          "ShopEase browsing activity, wishlist, cart, orders, categories, brands और price preferences के आधार पर recommendations show कर सकता है."
      },
      {
        heading: "8. Cookies और Local Storage",
        body:
          "ShopEase sessions, recently viewed products, cart behavior और UI preferences के लिए browser storage use कर सकता है."
      },
      {
        heading: "9. Security",
        body:
          "ShopEase role-based routing और application-level access controls use करता है. Users को login credentials secure रखने चाहिए."
      },
      {
        heading: "10. Contact",
        body:
          "Privacy questions के लिए Help Center या ShopEase support workflow use करें."
      }
    ]
  },

  ta: {
    title: "தனியுரிமைக் கொள்கை",
    subtitle:
      "ShopEase demo marketplace பயன்பாட்டில் தகவல் எவ்வாறு சேகரிக்கப்படுகிறது, பயன்படுத்தப்படுகிறது மற்றும் பாதுகாக்கப்படுகிறது என்பதை இந்த கொள்கை விளக்குகிறது.",
    sections: [
      {
        heading: "1. அறிமுகம்",
        body:
          "ShopEase என்பது customers products browse செய்ய, orders place செய்ய, saved addresses manage செய்ய, deliveries track செய்ய, wallet credits, reward points, coupons, reviews, questions, returns மற்றும் refunds பயன்படுத்த உதவும் e-commerce marketplace application."
      },
      {
        heading: "2. எங்கள் சேகரிக்கும் தகவல்",
        body:
          "Shopping, account, checkout, delivery, support மற்றும் marketplace features வழங்க தேவையான தகவல் சேகரிக்கப்படலாம்.",
        points: [
          "Name, email, mobile number மற்றும் role போன்ற account details.",
          "Checkout, delivery மற்றும் returns க்கான saved addresses.",
          "Cart, wishlist, recently viewed products மற்றும் order activity.",
          "Wallet transactions, reward transactions மற்றும் coupon redemption history.",
          "Reviews, ratings, product questions மற்றும் support interactions."
        ]
      },
      {
        heading: "3. தகவல் பயன்பாடு",
        body:
          "ShopEase marketplace experience ஐ வழங்கவும் மேம்படுத்தவும் தகவலை பயன்படுத்துகிறது.",
        points: [
          "Orders, returns, refunds மற்றும் delivery updates process செய்ய.",
          "Wallet, rewards, coupons மற்றும் savings activity manage செய்ய.",
          "Personalized product recommendations காட்ட.",
          "Customer, admin, seller மற்றும் support workflows ஆதரிக்க."
        ]
      },
      {
        heading: "4. Saved Addresses மற்றும் Delivery Data",
        body:
          "Saved addresses checkout, delivery estimates, fulfillment, shipment மற்றும் return/refund processing க்காக பயன்படுத்தப்படுகின்றன."
      },
      {
        heading: "5. Wallet, Rewards மற்றும் Coupons",
        body:
          "Wallet credits, reward points, coupon redemptions மற்றும் savings activity ledger visibility, checkout redemption மற்றும் expiry alerts க்காக சேமிக்கப்படுகின்றன."
      },
      {
        heading: "6. Reviews மற்றும் Questions",
        body:
          "Product reviews, ratings மற்றும் questions மற்ற users க்கு தெரிவிக்கப்படலாம். Sensitive personal information public content இல் post செய்ய வேண்டாம்."
      },
      {
        heading: "7. Personalization மற்றும் Recommendations",
        body:
          "ShopEase browsing activity, wishlist, cart, orders, categories, brands மற்றும் price preferences அடிப்படையில் recommendations காட்டலாம்."
      },
      {
        heading: "8. Cookies மற்றும் Local Storage",
        body:
          "Sessions, recently viewed products, cart behavior மற்றும் UI preferences க்காக browser storage பயன்படுத்தப்படலாம்."
      },
      {
        heading: "9. Security",
        body:
          "ShopEase role-based routing மற்றும் application-level access controls பயன்படுத்துகிறது. Users login credentials பாதுகாப்பாக வைத்திருக்க வேண்டும்."
      },
      {
        heading: "10. Contact",
        body:
          "Privacy தொடர்பான கேள்விகளுக்கு Help Center அல்லது ShopEase support workflow பயன்படுத்தவும்."
      }
    ]
  },

  ml: {
    title: "സ്വകാര്യതാ നയം",
    subtitle:
      "ShopEase demo marketplace application-ൽ വിവരം എങ്ങനെ ശേഖരിക്കുന്നു, ഉപയോഗിക്കുന്നു, സംരക്ഷിക്കുന്നു എന്ന് ഈ നയം വിശദീകരിക്കുന്നു.",
    sections: [
      {
        heading: "1. പരിചയം",
        body:
          "ShopEase ഒരു e-commerce marketplace application ആണ്. Customers products browse ചെയ്യാനും orders place ചെയ്യാനും saved addresses manage ചെയ്യാനും deliveries track ചെയ്യാനും wallet credits, reward points, coupons, reviews, questions, returns, refunds എന്നിവ ഉപയോഗിക്കാനും സഹായിക്കുന്നു."
      },
      {
        heading: "2. ഞങ്ങൾ ശേഖരിക്കുന്ന വിവരങ്ങൾ",
        body:
          "Shopping, account, checkout, delivery, support, marketplace features നൽകുന്നതിനായി information collect ചെയ്യാം.",
        points: [
          "Name, email, mobile number, role പോലുള്ള account details.",
          "Checkout, delivery, returns എന്നിവയ്ക്കുള്ള saved addresses.",
          "Cart, wishlist, recently viewed products, order activity.",
          "Wallet transactions, reward transactions, coupon redemption history.",
          "Reviews, ratings, product questions, support interactions."
        ]
      },
      {
        heading: "3. വിവരങ്ങളുടെ ഉപയോഗം",
        body:
          "ShopEase marketplace experience നൽകാനും മെച്ചപ്പെടുത്താനും information ഉപയോഗിക്കുന്നു.",
        points: [
          "Orders, returns, refunds, delivery updates process ചെയ്യാൻ.",
          "Wallet, rewards, coupons, savings activity manage ചെയ്യാൻ.",
          "Personalized product recommendations കാണിക്കാൻ.",
          "Customer, admin, seller, support workflows support ചെയ്യാൻ."
        ]
      },
      {
        heading: "4. Saved Addresses and Delivery Data",
        body:
          "Saved addresses checkout, delivery estimates, fulfillment, shipment, return/refund processing എന്നിവയ്ക്ക് ഉപയോഗിക്കുന്നു."
      },
      {
        heading: "5. Wallet, Rewards and Coupons",
        body:
          "Wallet credits, reward points, coupon redemptions, savings activity ledger visibility, checkout redemption, expiry alerts എന്നിവയ്ക്കായി store ചെയ്യുന്നു."
      },
      {
        heading: "6. Reviews and Questions",
        body:
          "Product reviews, ratings, questions മറ്റു users കാണാൻ സാധ്യതയുണ്ട്. Sensitive personal information public content-ൽ post ചെയ്യരുത്."
      },
      {
        heading: "7. Personalization and Recommendations",
        body:
          "ShopEase browsing activity, wishlist, cart, orders, categories, brands, price preferences അടിസ്ഥാനത്തിൽ recommendations കാണിക്കാം."
      },
      {
        heading: "8. Cookies and Local Storage",
        body:
          "Sessions, recently viewed products, cart behavior, UI preferences എന്നിവയ്ക്കായി browser storage ഉപയോഗിക്കാം."
      },
      {
        heading: "9. Security",
        body:
          "ShopEase role-based routing, application-level access controls ഉപയോഗിക്കുന്നു. Users login credentials secure ആയി സൂക്ഷിക്കണം."
      },
      {
        heading: "10. Contact",
        body:
          "Privacy ചോദ്യങ്ങൾക്ക് Help Center അല്ലെങ്കിൽ ShopEase support workflow ഉപയോഗിക്കുക."
      }
    ]
  },

  kn: {
    title: "ಗೌಪ್ಯತಾ ನೀತಿ",
    subtitle:
      "ಈ ನೀತಿ ShopEase ಡೆಮೋ ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಮಾಹಿತಿಯನ್ನು ಹೇಗೆ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ, ಬಳಸಲಾಗುತ್ತದೆ ಮತ್ತು ರಕ್ಷಿಸಲಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ವಿವರಿಸುತ್ತದೆ.",
    sections: [
      {
        heading: "1. ಪರಿಚಯ",
        body:
          "ShopEase ಎನ್ನುವುದು ಇ-ಕಾಮರ್ಸ್ ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ಅಪ್ಲಿಕೇಶನ್ ಆಗಿದ್ದು, ಗ್ರಾಹಕರು ಉತ್ಪನ್ನಗಳನ್ನು ವೀಕ್ಷಿಸಲು, ಆರ್ಡರ್‌ಗಳನ್ನು ಸಲ್ಲಿಸಲು, ಉಳಿಸಿದ ವಿಳಾಸಗಳನ್ನು ನಿರ್ವಹಿಸಲು, ಡೆಲಿವರಿಗೆ ಕಾಣಿಕೆ, ವಾಲೆಟ್ ಕ್ರೆಡಿಟ್‌ಗಳು, ರಿವಾರ್ಡ್ ಪಾಯಿಂಟ್‌ಗಳು, ಕೂಪನ್‌ಗಳು, ವಿಮರ್ಶೆಗಳು, ಪ್ರಶ್ನೆಗಳು, ವಾಪಸಾತಿ ಮತ್ತು ಮರುಪಾವತಿಗಳನ್ನು ಬಳಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ."
      },
      {
        heading: "2. ನಾವು ಸಂಗ್ರಹಿಸುವ ಮಾಹಿತಿ",
        body:
          "ಶಾಪಿಂಗ್, ಖಾತೆ, ಚೆಕ್‌ಔಟ್, ಡೆಲಿವರಿ, ಬೆಂಬಲ ಮತ್ತು ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಒದಗಿಸಲು ಸಹಾಯಕ ಮಾಹಿತಿಯನ್ನು ನಾವು ಸಂಗ್ರಹಿಸಬಹುದು.",
        points: [
          "ಹೆಸರು, ಇಮೇಲ್, ಮೊಬೈಲ್ ನಂಬರ್, ಪಾತ್ರದಂತಹ ಖಾತೆ ವಿವರಗಳು.",
          "ಚೆಕ್‌ಔಟ್, ಡೆಲಿವರಿ ಮತ್ತು ವಾಪಸಾತಿಗಾಗಿ ಉಳಿಸಿದ ವಿಳಾಸಗಳು.",
          "ಕಾರ್ಟ್, ಇಚ್ಛೆಯ ಪಟ್ಟಿ, ಇತ್ತೀಚೆಗೆ ನೋಡಿದ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಆರ್ಡರ್ ಚಟುವಟಿಕೆ.",
          "ವಾಲೆಟ್ ಲೆಂಡಿನಗಳು, ರಿವಾರ್ಡ್ ಲೆಂಡಿನಗಳು ಮತ್ತು ಕೂಪನ್ ರಿಡೆಂಪ್ಷನ್ ಇತಿಹಾಸ.",
          "ವಿಮರ್ಶೆಗಳು, ರೇಟ್‌ಗಳು, ಉತ್ಪನ್ನ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಬೆಂಬಲ ಸಂವಹನಗಳು."
        ]
      },
      {
        heading: "3. ಮಾಹಿತಿ ಬಳಕೆ",
        body:
          "ShopEase ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ಅನುಭವವನ್ನು ಒದಗಿಸಲು ಮತ್ತು ಸುಧಾರಿಸಲು ಮಾಹಿತಿಯನ್ನು ಬಳಸುತ್ತದೆ.",
        points: [
          "ಆರ್ಡರ್‌ಗಳು, ವಾಪಸಾತಿಗಳು, ಮರುಪಾವತಿಗಳು ಮತ್ತು ಡೆಲಿವರಿ ನವೀಕರಣಗಳನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು.",
          "ವಾಲೆಟ್ ಕ್ರೆಡಿಟ್‌ಗಳು, ರಿವಾರ್ಡ್‌ಗಳು, ಕೂಪನ್‌ಗಳು ಮತ್ತು ಉಳಿಸುವ ಚಟುವಟಿಕೆಯನ್ನು ನಿರ್ವಹಿಸಲು.",
          "ವೈಯಕ್ತಿಕೃತ ಉತ್ಪನ್ನ ಶಿಫಾರಸುಗಳನ್ನು ತೋರಿಸಲು.",
          "ಗ್ರಾಹಕ, ನಿರ್ವಾಹಕ, ವಿತರಕ ಮತ್ತು ಬೆಂಬಲ ವರ್ತನೆಗಳನ್ನು ಬೆಂಬಲಿಸಲು."
        ]
      },
      {
        heading: "4. ಉಳಿಸಿದ ವಿಳಾಸಗಳು ಮತ್ತು ಡೆಲಿವರಿ ಡೇಟಾ",
        body:
          "ಉಳಿಸಿದ ವಿಳಾಸಗಳನ್ನು ಚೆಕ್‌ಔಟ್, ಡೆಲಿವರಿ ಅಂದಾಜು, ಫುಲ್‌ಫಿಲ್‌ಮೆಂಟ್, ಶಿಪ್‌ಮೆಂಟ್ ಮತ್ತು ವಾಪಸಾತಿ/ಮರುಪಾವತಿ ಪ್ರಕ್ರಿಯೆಗೆ ಬಳಸಲಾಗುತ್ತದೆ."
      },
      {
        heading: "5. ವಾಲೆಟ್, ರಿವಾರ್ಡ್ಸ್ ಮತ್ತು ಕೂಪನ್‌ಗಳು",
        body:
          "ವಾಲೆಟ್ ಕ್ರೆಡಿಟ್‌ಗಳು, ರಿವಾರ್ಡ್ ಪಾಯಿಂಟ್‌ಗಳು, ಕೂಪನ್ ರಿಡೆಂಪ್ಷನ್‌ಗಳು ಮತ್ತು ಉಳಿಸುವ ಚಟುವಟಿಕೆಗಳನ್ನು ಲೆಡ್ಜರ್ ಗೋಚರತೆ, ಚೆಕ್‌ಔಟ್ ರಿಡೆಂಪ್ಷನ್ ಮತ್ತು ಅವಧಿ ಎಚ್ಚರಿಕೆಗಳಿಗಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ."
      },
      {
        heading: "6. ವಿಮರ್ಶೆಗಳು ಮತ್ತು ಪ್ರಶ್ನೆಗಳು",
        body:
          "ಉತ್ಪನ್ನ ವಿಮರ್ಶೆಗಳು, ರೇಟ್‌ಗಳು ಮತ್ತು ಪ್ರಶ್ನೆಗಳು ಇತರ ಬಳಕೆದಾರರಿಗೆ ಗೋಚರಿಸಬಹುದು. ಸೂಕ್ಷ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಸಾರ್ವಜನಿಕ ವಿಷಯದಲ್ಲಿ ಪೋಸ್ಟ್ ಮಾಡಬೇಡಿ."
      },
      {
        heading: "7. ವೈಯಕ್ತೀಕರಣ ಮತ್ತು ಶಿಫಾರಸುಗಳು",
        body:
          "ShopEase ಬ್ರೌಸ್‌ಮಾಡುವ ಚಟುವಟಿಕೆ, ಇಚ್ಛೆಯ ಪಟ್ಟಿ, ಕಾರ್ಟ್, ಆರ್ಡರ್‌ಗಳು, ವರ್ಗಗಳು, ಬ್ರ್ಯಾಂಡ್ಗಳು ಮತ್ತು ಬೆಲೆ ಆದ್ಯತೆಗಳ ಆಧಾರದಲ್ಲಿ ಶಿಫಾರಸುಗಳನ್ನು ತೋರಿಸಬಹುದು."
      },
      {
        heading: "8. ಕೂಕೀಸ್ ಮತ್ತು ಸ್ಥಳೀಯ ಸ್ಟೋರೆಜ್",
        body:
          "ಸೆಶನ್‌ಗಳು, ಇತ್ತೀಚೆಗೆ ನೋಡಿದ ಉತ್ಪನ್ನಗಳು, ಕಾರ್ಟ್ ನಡವಳಿಕೆ ಮತ್ತು UI ಆದ್ಯತೆಗಳಿಗಾಗಿ ಬ್ರೌಸರ್ ಸ್ಟೋರೆಜ್ ಬಳಸಬಹುದು."
      },
      {
        heading: "9. ಭದ್ರತೆ",
        body:
          "ShopEase ರೋಲ್-ಆಧಾರಿತ ರೂಟಿಂಗ್ ಮತ್ತು ಅಪ್ಲಿಕೇಶನ್-ಮಟ್ಟದ ಪ್ರವೇಶ ನಿಯಂತ್ರಣಗಳನ್ನು ಬಳಸುತ್ತದೆ. ಬಳಕೆದಾರರು ತಮ್ಮ ಲಾಗಿನ್ ಕ್ರೆಡೆನ್ಷಿಯಲ್‌ಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ வைத்திருக்க வேண்டும்."
      },
      {
        heading: "10. ಸಂಪರ್ಕ",
        body:
          "ಗೌಪ್ಯತೆ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳಿಗೆ Help Center ಅಥವಾ ShopEase ಬೆಂಬಲ ವರ್ತನೆಯನ್ನು ಬಳಸಿರಿ."
      }
    ]
  }
};

const PrivacyPolicyPage = () => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<LegalLanguageCode>("en");

  const content = useMemo(() => {
    return privacyPolicyContent[selectedLanguage];
  }, [selectedLanguage]);

  return (
    <main className="legal-page bg-light shopease-brand-page">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4 legal-page-header-content">
          <div className="legal-language-wrapper">
            <LegalLanguageDropdown
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>

          <p className="fw-bold mb-2 text-center">{content.title}</p>
          <p className="text-muted fw-small mb-0 text-center">{content.subtitle}</p>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-xl">
            <div className="card">
              <div className="card-body p-3 legal-content">
                {selectedLanguage !== "en" ? (
                  <div
                    className="alert legal-translation-disclaimer"
                    role="alert"
                  >
                    <strong>Disclaimer</strong>
                    <br />
                    This translation is provided for convenience. In case of any
                    discrepancy or difference, the English version will take
                    precedence.
                  </div>
                ) : null}

                {content.sections.map((section) => (
                  <section key={section.heading}>
                    <h4>{section.heading}</h4>
                    <p>{section.body}</p>

                    {section.points ? (
                      <ul>
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}

                <p className="text-muted small mb-0 mt-4">
                  Last updated: July 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPolicyPage;