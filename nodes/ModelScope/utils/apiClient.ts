import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class ModelScopeClient {
	private client: OpenAI;

	constructor(accessToken: string) {
		this.client = new OpenAI({
			apiKey: accessToken,
			baseURL: 'https://api-inference.modelscope.cn/v1',
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
			// Enhanced error handling for Vision models
			if (error.response?.data) {
				throw new Error(`ModelScope API Error: ${JSON.stringify(error.response.data)}`);
			}
			throw new Error(`ModelScope API Error: ${error.message || error}`);
		}
	}

	async generateImage(params: {
		model: string;
		prompt: string;
		negative_prompt?: string;
		size?: string;
		num_inference_steps?: number;
		guidance_scale?: number;
	}, accessToken: string) {
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

		const response = await fetch('https://api-inference.modelscope.cn/v1/images/generations', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
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

	async getTaskStatus(taskId: string, accessToken: string) {
		const response = await fetch(`https://api-inference.modelscope.cn/v1/tasks/${taskId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
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