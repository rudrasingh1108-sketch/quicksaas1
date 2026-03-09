export class AIProgressEngine {
    /**
     * Basic logic-based calculation (fallback)
     */
    static calculateProjectProgress(modules: any[]): number {
        if (!modules || modules.length === 0) return 0;
        const weights = { queued: 0, assigned: 0.1, in_progress: 0.4, handoff: 0.8, review: 0.9, completed: 1, blocked: 0.3, reassigned: 0.1 };
        let totalProgress = 0, totalWeight = 0;
        for (const m of modules) {
            const weight = m.module_weight || 1;
            totalProgress += (Number(weights[m.module_status as keyof typeof weights] || 0)) * weight;
            totalWeight += weight;
        }
        return totalWeight === 0 ? 0 : Math.round((totalProgress / totalWeight) * 100);
    }

    /**
     * Advanced LLM-based analysis via OpenRouter
     */
    static async getAIProgressAnalysis(projectTitle: string, modules: any[]): Promise<{ progress: number; summary: string }> {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const model = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';

        if (!apiKey) {
            return { progress: this.calculateProjectProgress(modules), summary: "AI analysis unavailable (Missing API Key)." };
        }

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://gigzs.io", // Optional
                    "X-Title": "Gigzs AI Planner"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert Project Manager AI. Analyze the project modules and determine the overall progress percentage (0-100) and a brief summary."
                        },
                        {
                            role: "user",
                            content: `Project: ${projectTitle}\nModules: ${JSON.stringify(modules.map(m => ({ name: m.module_name, status: m.module_status, weight: m.module_weight })))}`
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);

            return {
                progress: typeof result.progress === 'number' ? result.progress : this.calculateProjectProgress(modules),
                summary: result.summary || "Progress calculated based on module statuses."
            };
        } catch (e) {
            console.error("AI Progress Analysis failed:", e);
            return { progress: this.calculateProjectProgress(modules), summary: "Fallback to logic-based progress calculation." };
        }
    }
}
