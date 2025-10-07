import type { IExecuteFunctions } from 'n8n-workflow';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ModelScopeClient } from '../../utils/apiClient';
import { ModelScopeErrorHandler } from '../../utils/errorHandler';

export async function executeChatCompletion(
	this: IExecuteFunctions,
	itemIndex: number,
) {
	try {
		const credentials = await this.getCredentials('modelScopeApi');
		const client = new ModelScopeClient(credentials.accessToken as string);

		const model = this.getNodeParameter('model', itemIndex) as string;
		const messagesData = this.getNodeParameter('messages', itemIndex) as {
			message: Array<{ role: string; content: string }>;
		};
		const temperature = this.getNodeParameter('temperature', itemIndex, 0.7) as number;
		const maxTokens = this.getNodeParameter('maxTokens', itemIndex, 2048) as number;
		const stream = this.getNodeParameter('stream', itemIndex, false) as boolean;

		// 处理消息格式
		const messages: ChatCompletionMessageParam[] = messagesData.message.map(msg => ({
			role: msg.role as 'system' | 'user' | 'assistant',
			content: msg.content,
		}));

		// 验证消息不为空
		if (!messages.length || !messages.some(msg => typeof msg.content === 'string' && msg.content.trim())) {
			throw new Error('至少需要一条非空消息');
		}

		const response = await client.chatCompletion({
			model,
			messages,
			temperature,
			max_tokens: maxTokens,
			stream,
		});

		// 处理流式和非流式响应
		if (stream) {
			return { stream: true, response };
		}

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