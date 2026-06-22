import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  imageBase64: z.string().min(50),
});

export const analyzeFood = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENROUTER_API_KEY tidak ditemukan");

    // 🔥 FIX BASE64 FORMAT (WAJIB)
    const imageUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:image/jpeg;base64,${data.imageBase64}`;

    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Kcal AI",
          },
          body: JSON.stringify({
            // ✅ MENGGUNAKAN MODEL VISION TERBARU
            model: "google/gemini-2.5-flash",

            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `
Kamu adalah AI ahli nutrisi profesional yang sangat akurat.

TUGAS:
Analisa gambar makanan dan pecah menjadi beberapa item makanan.

ATURAN WAJIB:
- Output HARUS JSON VALID.
- TANPA penjelasan, TANPA markdown, HANYA JSON.
- Fokus pada OBJEK FISIK makanan. Abaikan jika ada tulisan tangan atau label yang mengatakan itu bukan makanan jika secara visual itu JELAS adalah makanan.

KETENTUAN ANALISA:
- Pisahkan SEMUA komponen makanan (nasi, lauk, sayur, topping, saus).
- Setiap item WAJIB punya estimasi kalori realistis.
- Jika ada nasi + ayam + tahu -> pisahkan menjadi 3 item.

FORMAT OUTPUT:
{
  "recognized": true,
  "name": "ringkasan menu",
  "total_calories": number,
  "portion": "deskripsi porsi",
  "items": [
    { "name": "item 1", "calories": number },
    { "name": "item 2", "calories": number }
  ]
}

JIKA BENAR-BENAR TIDAK ADA OBJEK MAKANAN (misal: hanya foto tembok atau orang):
{
  "recognized": false
}
`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],

            temperature: 0.2,
            max_tokens: 500,
          }),
        }
      );

      // 🔥 HANDLE RATE LIMIT
      if (res.status === 429) {
        throw new Error("Terlalu banyak request, tunggu sebentar.");
      }

      // 🔥 HANDLE ERROR DETAIL
      if (!res.ok) {
        const t = await res.text();
        console.error("AI RAW ERROR:", t);
        throw new Error("AI gagal memproses gambar");
      }

      const json = await res.json();

      let text = json.choices?.[0]?.message?.content;
      if (!text) throw new Error("AI tidak mengembalikan respon");

      // 🔥 CLEAN RESPONSE (ANTI ERROR JSON)
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.error("RAW AI RESPONSE:", text);
        throw new Error("Format JSON dari AI tidak valid");
      }

      // 🔥 VALIDASI OUTPUT
      if (!parsed.recognized) {
        return { recognized: false as const };
      }

      const totalCalories = parsed.total_calories || parsed.calories || 0;

      if (!parsed.name || !totalCalories) {
        return { recognized: false as const };
      }

      return {
        recognized: true as const,
        name: parsed.name,
        calories: Math.round(totalCalories),
        portion: parsed.portion || "1 porsi",
        items:
          parsed.items?.map((i: any) => ({
            name: i.name,
            calories: Math.round(i.calories),
          })) || [
            {
              name: parsed.name,
              calories: Math.round(totalCalories),
            },
          ],
      };
    } catch (err: any) {
      console.error("SERVER ERROR:", err.message);
      throw new Error(err.message || "Terjadi kesalahan pada server");
    }
  });