// AI Service - Tích hợp Gemini API
// API key được lấy từ file .env để bảo mật
// Lấy API key tại: https://aistudio.google.com/apikey

const API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY || ''
].filter(key => key !== '');

// Model mới nhất hỗ trợ image
const API_MODELS = [
  'gemini-2.5-flash'
];

// ==================== CACHE SYSTEM ====================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class AICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 phút

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
    // Lưu vào localStorage để persist
    try {
      const cacheData = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem('ai_search_cache', cacheData);
    } catch (e) {
      console.warn('Không thể lưu cache vào localStorage');
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  // Load cache từ localStorage khi khởi tạo
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai_search_cache');
      if (stored) {
        const entries = JSON.parse(stored);
        const now = Date.now();
        entries.forEach(([key, entry]: [string, CacheEntry<any>]) => {
          if (entry.expiresAt > now) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (e) {
      console.warn('Không thể load cache từ localStorage');
    }
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem('ai_search_cache');
  }
}

export const aiCache = new AICache();
aiCache.loadFromStorage();

// ==================== SEARCH HISTORY ====================
const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  const history = getSearchHistory();
  // Xóa nếu đã tồn tại
  const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
  // Thêm vào đầu
  filtered.unshift({ query, timestamp: Date.now() });
  // Giới hạn số lượng
  const trimmed = filtered.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ==================== POPULAR SEARCHES ====================
export const popularSearches = [
  'Chai nhựa', 'Pin cũ', 'Thức ăn thừa', 'Giấy báo', 
  'Lon nhôm', 'Túi nilon', 'Chai thủy tinh', 'Vỏ hộp sữa',
  'Khẩu trang', 'Điện thoại cũ', 'Quần áo cũ', 'Hộp xốp'
];

export interface RecyclingItem {
  name: string;
  category: 'recycle' | 'organic' | 'hazardous' | 'other';
  categoryColor: string;
  confidence: number;
  steps: { icon: string; text: string; description: string }[];
  points: number;
  co2Reduction: number;
  binType: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Hàm nhận diện vật phẩm tái chế từ hình ảnh
export async function recognizeRecyclingItem(imageBase64: string): Promise<RecyclingItem> {
  console.log('🔍 Bắt đầu phân tích ảnh với AI...');
  console.log('📷 Độ dài base64:', imageBase64.length);
  
  let lastError: Error | null = null;
  
  // Thử từng API key và model
  for (const apiKey of API_KEYS) {
    for (const model of API_MODELS) {
      try {
        console.log(`🔑 Thử API key: ${apiKey.slice(-8)}... với model: ${model}`);
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        
        const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Phân loại rác trong ảnh. Trả về JSON thuần (KHÔNG bọc trong markdown):
{"name":"tên tiếng Việt","category":"organic/recycle/hazardous/other","categoryColor":"green/blue/red/gray","confidence":85,"steps":[{"icon":"Droplet","text":"Bước 1","description":"Mô tả"}],"points":10,"co2Reduction":0.5,"binType":"Thùng","reason":"Lý do"}

organic=thực phẩm; recycle=nhựa,giấy,kim loại,thủy tinh; hazardous=pin,thuốc; other=còn lại. CHỈ TRẢ JSON THUẦN, KHÔNG CÓ \`\`\`json.`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (response.status === 429) {
        console.warn(`⚠️ API key ...${apiKey.slice(-8)} với model ${model} bị rate limit, thử tiếp...`);
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        continue;
      }

      const data = await response.json();
      console.log('📥 API Response:', JSON.stringify(data, null, 2));
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('📝 Raw text:', text);
      
      if (!text) {
        console.warn('⚠️ Empty response, thử tiếp...');
        continue;
      }
      
      // Parse JSON
      let jsonStr = text;
      
      // Loại bỏ markdown code blocks nếu có
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        // Nếu không có code block, tìm JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      // Loại bỏ các ký tự markdown còn sót
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      
      console.log('🧹 Clean JSON string:', jsonStr);
      
      const result = JSON.parse(jsonStr);
      console.log('✅ Kết quả phân tích:', result);
      return result;
      
    } catch (error) {
      console.error(`❌ Lỗi với API key ...${apiKey.slice(-8)} model ${model}:`, error);
      lastError = error as Error;
      continue;
    }
  }
  }
  
  // Tất cả đều thất bại
  console.error('❌ Tất cả API key và model đều thất bại:', lastError);
  return {
    name: 'Không nhận diện được',
    category: 'other',
    categoryColor: 'gray',
    confidence: 0,
    steps: [
      { icon: 'Trash2', text: 'Thử lại', description: 'API đang bận. Vui lòng đợi vài giây và thử lại.' },
    ],
    points: 0,
    co2Reduction: 0,
    binType: 'Không xác định',
    reason: 'API bị giới hạn. Vui lòng thử lại sau.'
  };
}

// Hàm chat với AI về phân loại rác
export async function chatWithAI(
  message: string, 
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    const historyText = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${msg.content}`
    ).join('\n');

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const response = await fetch(`${API_URL}?key=${API_KEYS[0]}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là EcoBot - trợ lý AI thông minh về phân loại rác và bảo vệ môi trường tại Việt Nam. 

Nhiệm vụ của bạn:
1. Trả lời các câu hỏi về cách phân loại rác đúng cách
2. Hướng dẫn xử lý các loại rác thải
3. Chia sẻ kiến thức về bảo vệ môi trường
4. Khuyến khích người dùng tái chế và giảm rác thải
5. Cung cấp thông tin về các điểm thu gom rác tại Đà Lạt

Quy tắc:
- Trả lời ngắn gọn, thân thiện, dễ hiểu
- Sử dụng emoji phù hợp để sinh động hơn
- Nếu không chắc chắn, hãy nói rõ
- Luôn khuyến khích hành động bảo vệ môi trường

${historyText ? `Lịch sử hội thoại:\n${historyText}\n\n` : ''}

Người dùng: ${message}

Trợ lý:`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Xin lỗi, tôi không thể xử lý yêu cầu này. Bạn có thể hỏi lại không?';
  } catch (error) {
    console.error('Lỗi chat:', error);
    return 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau!';
  }
}

// Hàm tìm kiếm thông tin về vật phẩm (có cache)
export async function searchRecyclingInfo(query: string): Promise<string> {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search_${normalizedQuery}`;
  
  console.log('🔍 Bắt đầu tìm kiếm:', query);
  
  // Kiểm tra cache trước
  const cached = aiCache.get<string>(cacheKey);
  if (cached) {
    console.log('📦 Trả về kết quả từ cache cho:', query);
    return cached;
  }

  // Lưu vào lịch sử tìm kiếm
  addToSearchHistory(query.trim());
  
  // Thử từng API key
  for (const apiKey of API_KEYS) {
    try {
      console.log(`🔑 Thử API key: ...${apiKey.slice(-8)}`);
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
      
      const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Bạn là chuyên gia về phân loại rác và tái chế tại Việt Nam. Hãy cung cấp thông tin về "${query}".

LUÔN trả lời theo format sau (bắt buộc):
📦 **Tên vật phẩm**: ${query}
🏷️ **Phân loại**: [Tái chế / Hữu cơ / Nguy hại / Rác thường]
🗑️ **Thùng rác**: [màu thùng và loại]
📝 **Cách xử lý**:
1. [bước đầu tiên]
2. [bước tiếp theo]
3. [bước cuối]
🌍 **Lợi ích môi trường**: [mô tả ngắn gọn]
💡 **Mẹo**: [lời khuyên thực tế]

Nếu không biết chính xác, hãy đưa ra gợi ý hợp lý nhất.`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.7
          }
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (response.status === 429) {
        console.warn('⚠️ Rate limit, thử API key tiếp theo...');
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        continue;
      }

      const data = await response.json();
      console.log('📥 API Response:', JSON.stringify(data, null, 2));
      
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!result) {
        console.warn('⚠️ Empty response từ API');
        continue;
      }
      
      // Lưu vào cache
      aiCache.set(cacheKey, result);
      console.log('✅ Tìm kiếm thành công cho:', query);
      
      return result;
    } catch (error) {
      console.error('❌ Lỗi tìm kiếm với API key:', error);
      continue;
    }
  }
  
  // Fallback response khi tất cả API fail
  const fallbackResult = `📦 **Tên vật phẩm**: ${query}
🏷️ **Phân loại**: Chưa xác định
🗑️ **Thùng rác**: Vui lòng kiểm tra hướng dẫn địa phương
📝 **Cách xử lý**:
1. Kiểm tra xem vật phẩm có thể tái chế không
2. Rửa sạch nếu cần thiết
3. Phân loại vào thùng rác phù hợp
🌍 **Lợi ích môi trường**: Phân loại đúng giúp bảo vệ môi trường
💡 **Mẹo**: Liên hệ cơ quan môi trường địa phương để được hướng dẫn cụ thể

⚠️ *Lưu ý: Kết quả này là gợi ý chung do không thể kết nối AI. Vui lòng thử lại sau.*`;
  
  return fallbackResult;
}
