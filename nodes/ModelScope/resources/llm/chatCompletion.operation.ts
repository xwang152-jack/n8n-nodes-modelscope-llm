import type { IExecuteFunctions } from 'n8n-workflow';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ModelScopeClient } from '../../utils/apiClient';
import { ModelScopeErrorHandler } from '../../utils/errorHandler';

export async function executeChatCompletion(
	this: IExecuteFunctions,
	itemIndex: number,
) {
	const startTime = Date.now();
	
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

		console.log(`[${new Date().toISOString()}] 开始LLM对话完成 - 模型: ${model}, 消息数: ${messages.length}`);

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
		const processingTime = Math.round((Date.now() - startTime) / 1000);
		
		console.log(`[${new Date().toISOString()}] LLM对话完成 - 用时: ${processingTime}秒, tokens: ${chatResponse.usage?.total_tokens || 0}`);
		
		return {
			id: chatResponse.id,
			object: chatResponse.object,
			created: chatResponse.created,
			model: chatResponse.model,
			choices: chatResponse.choices,
			usage: chatResponse.usage,
			// 添加状态和元数据信息
			status: 'completed',
			processing_time: `${processingTime}秒`,
			input_tokens: chatResponse.usage?.prompt_tokens || 0,
			output_tokens: chatResponse.usage?.completion_tokens || 0,
			total_tokens: chatResponse.usage?.total_tokens || 0,
			completed_at: new Date().toISOString(),
		};
	} catch (error: any) {
		const processingTime = Math.round((Date.now() - startTime) / 1000);
		console.error(`[${new Date().toISOString()}] LLM对话失败 - 用时: ${processingTime}秒, 错误: ${error.message}`);
		throw ModelScopeErrorHandler.handleApiError(error);
	}
}