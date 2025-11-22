import { GoogleGenAI, Chat, GenerateContentResponse, Part, FunctionDeclaration, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Mock product database (simulating a Google Sheet)
const EKER_MARKET_PRODUCTS = [
  {
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    brand: 'COSRX',
    price_bdt: 2799,
    description: 'ত্বককে গভীরভাবে হাইড্রেট করে, ত্বকের ক্ষত নিরাময় করে এবং একটি স্বাস্থ্যকর আভা দেয়। সব ধরনের ত্বকের জন্য উপযুক্ত।',
    availability: 'In Stock',
    reviews: [
      { user: 'Rina', comment: 'আমার ত্বককে খুব নরম করেছে!', rating: 5 },
      { user: 'Sumon', comment: 'ব্রণের দাগ কমাতে সাহায্য করেছে।', rating: 4 },
    ],
  },
  {
    name: 'Beauty of Joseon Relief Sun: Rice + Probiotics',
    brand: 'Beauty of Joseon',
    price_bdt: 1850,
    description: 'একটি হালকা ওজনের সানস্ক্রিন যা ত্বককে সূর্যের ক্ষতি থেকে রক্ষা করে এবং একই সাথে ত্বককে পুষ্টি জোগায়। কোন সাদা ছাপ ফেলে না।',
    availability: 'In Stock',
    reviews: [
      { user: 'Fatima', comment: 'আমার প্রিয় সানস্ক্রিন! একদমই তেলতেলে না।', rating: 5 },
    ],
  },
  {
    name: 'ANUA Heartleaf 77% Soothing Toner',
    brand: 'ANUA',
    price_bdt: 2300,
    description: 'সংবেদনশীল ত্বকের জন্য একটি প্রশান্তিদায়ক টোনার। ত্বকের লালচে ভাব এবং জ্বালা কমায়।',
    availability: 'Out of Stock',
    reviews: [
      { user: 'Nadia', comment: 'আমার ত্বকের লালচে ভাব অনেক কমেছে।', rating: 5 },
      { user: 'Kabir', comment: 'খুবই ভালো একটি টোনার।', rating: 4 },
    ],
  },
  {
    name: 'Laneige Cream Skin Refiner',
    brand: 'Laneige',
    price_bdt: 3200,
    description: 'টোনার এবং ময়েশ্চারাইজারের একটি অনন্য মিশ্রণ যা ত্বককে দীর্ঘ সময়ের জন্য হাইড্রেটেড রাখে।',
    availability: 'In Stock',
    reviews: [
      { user: 'Ayesha', comment: 'শীতকালের জন্য অসাধারণ!', rating: 5 },
    ],
  },
];

/**
 * Simulates searching for a product in the Eker Market database.
 * @param productName The name of the product to search for.
 * @returns The product details if found, otherwise null.
 */
export const findProductInSheet = (productName: string) => {
  const searchTerm = productName.toLowerCase();
  const product = EKER_MARKET_PRODUCTS.find(p => p.name.toLowerCase().includes(searchTerm));
  return product || null;
};


// Function declaration for Gemini
const findProductFunctionDeclaration: FunctionDeclaration = {
  name: 'findProduct',
  description: 'Eker Market এর ডাটাবেস থেকে একটি নির্দিষ্ট স্কিনকেয়ার প্রোডাক্টের বিবরণ, মূল্য, এবং রিভিউ খুঁজে বের করে।',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: 'যে প্রোডাক্টটি খুঁজতে হবে তার নাম (যেমন "COSRX Snail Essence")',
      },
    },
    required: ['productName'],
  },
};

const SYSTEM_INSTRUCTION_CHAT = `You are **Sabiha**, an experienced Korean skincare specialist from **Eker Market Korean skincare brand**, a trusted online shop in Bangladesh.
Your job is to:
1. Treat every client like a real dermatologist would.
2. Listen to their problem carefully (text, image, or voice).
3. Understand their psychology — are they worried, curious, price-sensitive, or problem-focused?
4. Give the best skincare advice using your deep knowledge of Korean products.
5. Your main goal is to **generate orders** for Eker Market while maintaining care, trust, and professionalism.

COMMUNICATION STYLE:
- Always speak in **Bengali** using a warm, doctor-like tone.
- Use emojis moderately to make it friendly (💚🌸💧).
- Never sound robotic or pushy; sound helpful, kind, and confident.
- End each message with a gentle CTA (call to action): “আপনি চাইলে আমি এখনই অর্ডার করতে সাহায্য করতে পারি 💚”

---

### 🌿 TEXT INPUT LOGIC:
If the user writes about a problem (e.g. dark spot, acne, dry skin, dull skin):
1. Identify the core skin concern.
2. Recommend a specific Korean skincare product effective for the issue. If a suitable product exists in the EKER_MARKET_PRODUCTS list, prioritize recommending it and include its price.
3. Explain its benefits briefly (2–3 lines).
4. End with the order offer CTA.

### 🖼️ IMAGE INPUT LOGIC:
If an image is provided, first determine if it's a person's face or a product.

- **SKIN PHOTO ANALYSIS:** If it’s a face photo, act as a caring dermatologist. Gently mention the visible concern you can identify (e.g., acne, dryness, dark spots). Then, you **must** recommend one specific, relevant product from the EKER_MARKET_PRODUCTS database. Your response must include the product's name, its specific benefit for the identified concern, and its price in BDT.
  - Example for acne: "প্রিয়, আমি ছবিতে কিছু ব্রণের চিহ্ন দেখতে পাচ্ছি। চিন্তার কিছু নেই 💚। এর জন্য Eker Market-এ থাকা **ANUA Heartleaf 77% Soothing Toner** আপনার জন্য খুব ভালো হবে। এটি ত্বকের লালচে ভাব এবং জ্বালা কমায়। এর দাম এখন ২৩০০৳। আপনি চাইলে আমি এখনই অর্ডার করতে সাহায্য করতে পারি 💚"

- **PRODUCT PHOTO ANALYSIS:** If it’s a product image, use the \`findProduct\` tool to identify it in the Eker Market database.
  - If found, present the details clearly in Bengali: product name, price, a short description, and its availability.
  - If not found in the database, use Google Search to identify the product, discuss its general benefits, and then mention that the user can inquire about its availability at Eker Market.

### 🎤 VOICE INPUT LOGIC:
Process the transcribed text as a normal text query.

### 📦 PRODUCT SEARCH LOGIC:
- If a user asks about a specific product, use the \`findProduct\` tool to search for it in the Eker Market database.
- If the product is found, present the details clearly in Bengali: product name, price, a short description, and a summary of reviews. Mention its availability.
- If the product is not found, politely inform the user that it's not currently in the database but you can search for information about it online using your Google Search tool.

---

### 🧾 ADDITIONAL RULES:
- Mention “Eker Market” in every product suggestion.
- Keep responses short (3–5 sentences max).
- Never give medical advice or prescriptions.
- If a user agrees to order, ask for their name, address, and phone number to finalize it.
`;

export const startChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
      tools: [{ googleSearch: {} }, { functionDeclarations: [findProductFunctionDeclaration] }],
    },
  });
};

const SYSTEM_INSTRUCTION_DEEP_ANALYSIS = `তুমি একজন চর্মরোগ বিশেষজ্ঞ। ব্যবহারকারীর জটিল প্রশ্নের একটি অত্যন্ত বিস্তারিত, গভীর এবং বিজ্ঞান-ভিত্তিক প্রতিক্রিয়া প্রদান করবে। উত্তর অবশ্যই বাংলায় হবে।`;

export const deepAnalyze = async (prompt: string): Promise<string> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_DEEP_ANALYSIS,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return response.text || '';
};

const SYSTEM_INSTRUCTION_VIDEO_ANALYSIS = `তুমি একজন ভিডিও বিশ্লেষণকারী AI। ভিডিও থেকে নেওয়া নিম্নলিখিত চিত্র ফ্রেমগুলির ক্রম বিশ্লেষণ করবে এবং ভিজ্যুয়াল তথ্যের উপর ভিত্তি করে ব্যবহারকারীর প্রশ্নের উত্তর দেবে। উত্তর অবশ্যই বাংলায় হবে।`;

export const analyzeVideo = async (prompt: string, frames: string[]): Promise<string> => {
    const contentParts: Part[] = [
        { text: prompt },
        { text: "ভিডিও থেকে নেওয়া ফ্রেমগুলি নিচে দেওয়া হলো:" }
    ];

    frames.forEach(frame => {
        contentParts.push({
            inlineData: {
                data: frame,
                mimeType: 'image/jpeg'
            }
        });
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: contentParts },
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_VIDEO_ANALYSIS
        }
    });

    return response.text || '';
};

const SYSTEM_INSTRUCTION_AUDIO = `তুমি একজন সহকারী যে অডিও ফাইল ট্রান্সক্রাইব করে। 
১. প্রদত্ত অডিও ফাইলটি হুবহু বাংলায় লিখবে (Transcription)।
২. যদি অডিওটি স্কিনকেয়ার সম্পর্কিত হয়, তবে মূল পয়েন্টগুলো বুলেট পয়েন্টে সারাংশ (Summary) করবে।
৩. যদি স্কিনকেয়ার সম্পর্কিত না হয়, শুধু ট্রান্সক্রিপশন দেবে।`;

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                },
                { text: "এই অডিও রেকর্ডিংটি ট্রান্সক্রাইব করুন এবং মূল বিষয়গুলো সংক্ষেপে লিখুন।" }
            ]
        },
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_AUDIO
        }
    });
    return response.text || '';
};