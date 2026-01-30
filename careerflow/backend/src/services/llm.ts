import OpenAI from 'openai';
import { z, ZodSchema } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";
import Logger from './logger.js';
import fetch from 'node-fetch';

// Polyfill fetch for Node.js environments that don't have it globally
if (!globalThis.fetch) {
    globalThis.fetch = fetch as any;
}

export class LLMService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Extracts structured data from text using an LLM and a Zod schema.
     */
    public async extractStructuredData<T>(
        text: string,
        schema: ZodSchema<T>,
        schemaName: string,
        systemPrompt: string = "You are a helpful assistant that extracts structured data from text."
    ): Promise<T> {
        try {
            const completion = await this.client.chat.completions.create({
                model: "gpt-4o-2024-08-06",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text },
                ],
                response_format: zodResponseFormat(schema, schemaName),
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error("LLM returned empty content.");
            }

            const parsed = JSON.parse(content);
            // Verify with Zod just in case
            return schema.parse(parsed);

        } catch (error) {
            Logger.error(`LLM Structure Extraction Failed for ${schemaName}:`, error);
            throw error;
        }
    }

    /**
     * Generates a text completion for a given prompt.
     * Used for tasks like bullet point enhancement, resume tailoring, etc.
     */
    public async generateCompletion(
        userPrompt: string,
        systemPrompt: string = "You are a professional resume writer and career coach."
    ): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 500,
                temperature: 0.7,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error("LLM returned empty content.");
            }

            return content.trim();

        } catch (error) {
            Logger.error('LLM Completion Failed:', error);
            throw error;
        }
    }
}

export default new LLMService();
