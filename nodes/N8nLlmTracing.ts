import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { ISupplyDataFunctions } from 'n8n-workflow';
import type { Serialized } from '@langchain/core/load/serializable';

export class N8nLlmTracing extends BaseCallbackHandler {
	name = 'N8nLlmTracing';
	private context: ISupplyDataFunctions;

	constructor(context: ISupplyDataFunctions) {
		super();
		this.context = context;
	}

	async handleLLMStart(
		llm: Serialized,
		prompts: string[],
		runId: string,
		parentRunId?: string,
		extraParams?: Record<string, unknown>,
		tags?: string[],
		metadata?: Record<string, unknown>,
		runName?: string,
	): Promise<void> {
		// 显示LLM开始状态
		const modelName = llm.id?.[llm.id.length - 1] || 'ModelScope LLM';
		const promptText = prompts.join('\n');
		
		this.context.logger.info(`🚀 ModelScope LLM 开始处理请求`, {
			model: modelName,
			runId,
			promptLength: promptText.length,
			prompt: promptText.substring(0, 200) + (promptText.length > 200 ? '...' : ''),
		});

		// 在n8n界面显示状态
		this.context.sendMessageToUI(`🚀 正在调用 ${modelName} 处理请求...`);
	}

	async handleLLMEnd(
		output: any,
		runId: string,
		parentRunId?: string,
		tags?: string[],
	): Promise<void> {
		// 显示LLM完成状态和输出
		let responseText = '';
		
		// 处理不同类型的输出格式
		if (typeof output === 'string') {
			responseText = output;
		} else if (output?.generations?.[0]?.[0]?.text) {
			responseText = output.generations[0][0].text;
		} else if (output?.content) {
			responseText = output.content;
		} else if (output?.text) {
			responseText = output.text;
		} else {
			responseText = JSON.stringify(output, null, 2);
		}

		this.context.logger.info(`✅ ModelScope LLM 请求完成`, {
			runId,
			responseLength: responseText.length,
			response: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
		});

		// 在n8n界面显示完成状态和部分输出
		const previewText = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
		this.context.sendMessageToUI(`✅ ModelScope LLM 响应完成\n📝 输出预览: ${previewText}`);
	}

	async handleLLMError(
		err: Error,
		runId: string,
		parentRunId?: string,
		tags?: string[],
	): Promise<void> {
		// 显示LLM错误状态
		this.context.logger.error(`❌ ModelScope LLM 请求失败`, {
			runId,
			error: err.message,
			stack: err.stack,
		});

		// 在n8n界面显示错误状态
		this.context.sendMessageToUI(`❌ ModelScope LLM 请求失败: ${err.message}`);
	}
}