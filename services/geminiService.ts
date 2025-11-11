import { GoogleGenAI, FunctionDeclaration, Type, Chat, GenerateContentResponse, Part } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION_CHAT = `তুমি একজন বন্ধুত্বপূর্ণ এবং জ্ঞানী AI স্কিনকেয়ার সহকারী এবং তোমার মূল কাজ হলো পণ্য বিক্রি করে অর্ডার জেনারেট করা। তুমি শুধু বাংলায় কথা বলবে এবং একজন ডাক্তারের মতো করে ক্লায়েন্টদের সাথে কথা বলবে। ব্যবহারকারীর বার্তার মনস্তত্ত্ব (psychology) বুঝে তাকে পণ্য কিনতে উৎসাহিত করবে। তোমার কাছে থাকা প্রোডাক্ট তালিকা দেখতে এবং অর্ডার তৈরি করার জন্য বিশেষ টুল আছে। যখন কোনো ব্যবহারকারী পণ্যের তালিকা দেখতে চায়, তখন 'getProductList' ফাংশনটি ব্যবহার করবে। যখন ব্যবহারকারী অর্ডার দিতে রাজি হয়, তখন তার নাম, ঠিকানা এবং ফোন নম্বর জিজ্ঞেস করবে এবং 'createOrder' ফাংশনটি ব্যবহার করে অর্ডার তৈরি করবে।`;

const tools: FunctionDeclaration[] = [
  {
    name: 'getProductList',
    description: 'Get the list of available Korean skincare products from the Google Sheet.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'createOrder',
    description: 'Create a new order and add it to the Google Sheet.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING, description: 'The name of the product being ordered.' },
        quantity: { type: Type.INTEGER, description: 'The quantity of the product being ordered.' },
        customerName: { type: Type.STRING, description: 'The full name of the customer.' },
        customerAddress: { type: Type.STRING, description: 'The shipping address for the order.' },
        customerPhone: { type: Type.STRING, description: 'The contact phone number for the customer.' },
      },
      required: ['productName', 'quantity', 'customerName', 'customerAddress', 'customerPhone'],
    },
  },
];

export const mockProductList = [
    { name: "COSRX Low pH Good Morning Gel Cleanser", brand: "COSRX", ml: 150, quantity: 20, price: 850 },
    { name: "Innisfree Green Tea Seed Serum", brand: "Innisfree", ml: 80, quantity: 15, price: 1800 },
    { name: "Laneige Water Sleeping Mask", brand: "Laneige", ml: 70, quantity: 10, price: 2200 },
    { name: "The Face Shop Rice Water Bright Cleansing Foam", brand: "The Face Shop", ml: 150, quantity: 25, price: 700 },
    { name: "Beauty of Joseon Relief Sun: Rice + Probiotics", brand: "Beauty of Joseon", ml: 50, quantity: 30, price: 1350 },
];

export const startChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
      tools: [{ functionDeclarations: tools }],
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

  return response.text;
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

    return response.text;
};
