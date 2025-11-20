import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { MODELSCOPE_BASE_URL } from './constants';
import { ModelScopeErrorHandler } from './errorHandler';

export class ModelScopeClient {
    private client: OpenAI;
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
        this.client = new OpenAI({
            apiKey: accessToken,
            baseURL: MODELSCOPE_BASE_URL,
        });
    }

	async chatCompletion(params: {
		model: string;
		messages: ChatCompletionMessageParam[];
		stream?: boolean;
		temperature?: number;
		max_tokens?: number;
	}) {
        try {
            return await this.client.chat.completions.create(params);
        } catch (error: any) {
            throw ModelScopeErrorHandler.handleApiError(error);
        }
    }

	async createEmbedding(params: {
		model: string;
		input: string | string[];
		encoding_format?: 'float' | 'base64';
	}) {
		try {
			return await this.client.embeddings.create(params as any);
		} catch (error: any) {
			throw ModelScopeErrorHandler.handleApiError(error);
		}
	}

    async generateImage(params: {
        model: string;
        prompt: string;
        negative_prompt?: string;
        size?: string;
        num_inference_steps?: number;
        guidance_scale?: number;
    }) {
		// 构建请求参数
		const requestParams: any = {
			model: params.model,
			prompt: params.prompt,
		};

		// 添加可选参数
		if (params.negative_prompt) {
			requestParams.negative_prompt = params.negative_prompt;
		}
		
		if (params.size) {
			requestParams.size = params.size;
		}
		
		if (params.num_inference_steps) {
			requestParams.num_inference_steps = params.num_inference_steps;
		}
		
		if (params.guidance_scale) {
			requestParams.guidance_scale = params.guidance_scale;
		}

        const response = await fetch(`${MODELSCOPE_BASE_URL}/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'X-ModelScope-Async-Mode': 'true',
            },
            body: JSON.stringify(requestParams),
        });

		if (!response.ok) {
			let errorMessage = response.statusText;
			try {
				const errorData = await response.json() as any;
				errorMessage = errorData.error?.message || errorData.message || errorMessage;
			} catch (e) {
				// If response body is not JSON, use status text
			}
			throw new Error(`ModelScope Image API Error: ${response.status} - ${errorMessage}`);
		}

		return await response.json();
	}

    async getTaskStatus(taskId: string) {
        const response = await fetch(`${MODELSCOPE_BASE_URL}/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'X-ModelScope-Task-Type': 'image_generation',
            },
        });

		if (!response.ok) {
			let errorMessage = response.statusText;
			try {
				const errorData = await response.json() as any;
				errorMessage = errorData.error?.message || errorData.message || errorMessage;
			} catch (e) {
				// If response body is not JSON, use status text
			}
			throw new Error(`ModelScope Task API Error: ${response.status} - ${errorMessage}`);
		}

		return await response.json();
	}
}
