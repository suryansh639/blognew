import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to check if the API key is valid and has quota
async function isOpenAIKeyValid(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) return false;
  
  try {
    // Simple lightweight request to check API key validity
    const response = await openai.models.list();
    return Array.isArray(response.data);
  } catch (error: any) {
    console.error("OpenAI API key check failed:", error.message);
    return false;
  }
}

/**
 * Generate a summary for an article using OpenAI
 */
export async function generateArticleSummary(content: string): Promise<string> {
  // Check if API key is valid before making the expensive request
  const isValid = await isOpenAIKeyValid();
  if (!isValid) {
    return "AI features are currently unavailable due to API configuration issues.";
  }
  
  try {
    const prompt = `Summarize the following article in 2-3 sentences. Make it engaging and capture the essence of the content:
    
    ${content.slice(0, 4000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "Summary not available";
  } catch (error: any) {
    console.error("Error generating article summary:", error);
    
    // Provide more specific error messages based on the error type
    if (error.code === 'insufficient_quota') {
      return "Unable to generate summary: API quota exceeded. Please try again later.";
    } else if (error.status === 429) {
      return "Unable to generate summary: Rate limit exceeded. Please try again later.";
    }
    
    return "Summary could not be generated at this time.";
  }
}

/**
 * Generate suggestions for related articles based on content
 */
export async function generateRelatedTopics(content: string): Promise<string[]> {
  // Check if API key is valid before making the expensive request
  const isValid = await isOpenAIKeyValid();
  if (!isValid) {
    return ["AI features currently unavailable"];
  }
  
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
  } catch (error: any) {
    console.error("Error generating related topics:", error);
    
    if (error.code === 'insufficient_quota' || error.status === 429) {
      return ["API rate limit exceeded. Please try again later."];
    }
    
    return ["Unable to generate related topics at this time"];
  }
}

/**
 * Generate text-to-speech audio for an article
 */
export async function generateAudioFromText(text: string): Promise<Buffer | null> {
  // Check if API key is valid before making the request
  const isValid = await isOpenAIKeyValid();
  if (!isValid) {
    console.error("OpenAI API key invalid or quota exceeded");
    return null;
  }
  
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1", // TTS model
      voice: "alloy", // Voice type
      input: text.slice(0, 4000), // Limit input size
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error: any) {
    console.error("Error generating audio:", error);
    
    if (error.code === 'insufficient_quota' || error.status === 429) {
      console.error("OpenAI API quota or rate limit exceeded");
    }
    
    return null;
  }
}

/**
 * Generate AI feedback on writing quality
 */
export async function analyzeWritingQuality(text: string): Promise<{ score: number; feedback: string }> {
  // Check if API key is valid before making the expensive request
  const isValid = await isOpenAIKeyValid();
  if (!isValid) {
    return { 
      score: 0, 
      feedback: "AI analysis features are currently unavailable due to API configuration issues." 
    };
  }
  
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
  } catch (error: any) {
    console.error("Error analyzing writing quality:", error);
    
    if (error.code === 'insufficient_quota') {
      return { 
        score: 0, 
        feedback: "Unable to analyze: API quota exceeded. Please try again later." 
      };
    } else if (error.status === 429) {
      return { 
        score: 0, 
        feedback: "Unable to analyze: Rate limit exceeded. Please try again later." 
      };
    }
    
    return { 
      score: 0, 
      feedback: "Analysis could not be completed at this time." 
    };
  }
}