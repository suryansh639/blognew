import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a summary for an article using OpenAI
 */
export async function generateArticleSummary(content: string): Promise<string> {
  try {
    const prompt = `Summarize the following article in 2-3 sentences. Make it engaging and capture the essence of the content:
    
    ${content.slice(0, 4000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "Summary not available";
  } catch (error) {
    console.error("Error generating article summary:", error);
    return "Summary could not be generated at this time.";
  }
}

/**
 * Generate suggestions for related articles based on content
 */
export async function generateRelatedTopics(content: string): Promise<string[]> {
  try {
    const prompt = `Based on this article content, suggest 5 related topic ideas for future articles. Return only the titles as a JSON array.
    
    ${content.slice(0, 4000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return Array.isArray(result.topics) ? result.topics : [];
  } catch (error) {
    console.error("Error generating related topics:", error);
    return [];
  }
}

/**
 * Generate text-to-speech audio for an article
 */
export async function generateAudioFromText(text: string): Promise<Buffer | null> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1", // TTS model
      voice: "alloy", // Voice type
      input: text.slice(0, 4000), // Limit input size
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
}

/**
 * Generate AI feedback on writing quality
 */
export async function analyzeWritingQuality(text: string): Promise<{ score: number; feedback: string }> {
  try {
    const prompt = `Analyze this article for writing quality. Rate it on a scale of 1-10 and provide brief, constructive feedback focusing on strengths and areas for improvement:
    
    ${text.slice(0, 4000)}
    
    Respond with a JSON object in this format: { "score": number, "feedback": "feedback text" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      score: result.score || 0,
      feedback: result.feedback || "Analysis not available"
    };
  } catch (error) {
    console.error("Error analyzing writing quality:", error);
    return { score: 0, feedback: "Analysis could not be completed at this time." };
  }
}