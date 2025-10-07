import type { IExecuteFunctions } from 'n8n-workflow';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ModelScopeClient } from '../../utils/apiClient';
import { ModelScopeErrorHandler } from '../../utils/errorHandler';

export async function executeVisionChat(
	this: IExecuteFunctions,
	itemIndex: number,
) {
	try {
		const credentials = await this.getCredentials('modelScopeApi');
		const client = new ModelScopeClient(credentials.accessToken as string);

		const model = this.getNodeParameter('model', itemIndex) as string;
		const imageUrl = this.getNodeParameter('imageUrl', itemIndex) as string;
		const prompt = this.getNodeParameter('prompt', itemIndex) as string;
		const temperature = this.getNodeParameter('temperature', itemIndex, 0.7) as number;
		const maxTokens = this.getNodeParameter('maxTokens', itemIndex, 2048) as number;

		// 验证输入
		if (!imageUrl.trim()) {
			throw new Error('图片URL不能为空');
		}
		if (!prompt.trim()) {
			throw new Error('提示词不能为空');
		}

		// 构建视觉聊天消息
		const messages: ChatCompletionMessageParam[] = [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: prompt,
					},
					{
						type: 'image_url',
						image_url: {
							url: imageUrl,
						},
					},
				],
			},
		];

		const response = await client.chatCompletion({
			model,
			messages,
			temperature,
			max_tokens: maxTokens,
		});

		// 非流式响应
		const chatResponse = response as any;
		return {
			id: chatResponse.id,
			object: chatResponse.object,
			created: chatResponse.created,
			model: chatResponse.model,
			choices: chatResponse.choices,
			usage: chatResponse.usage,
		};
	} catch (error: any) {
		throw ModelScopeErrorHandler.handleApiError(error);
	}
}