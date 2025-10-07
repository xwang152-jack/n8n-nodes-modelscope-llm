import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { SerializedFields } from '@langchain/core/dist/load/map_keys';
import { getModelNameForTiktoken } from '@langchain/core/language_models/base';
import type {
	Serialized,
	SerializedNotImplemented,
	SerializedSecret,
} from '@langchain/core/load/serializable';
import type { BaseMessage } from '@langchain/core/messages';
import type { LLMResult } from '@langchain/core/outputs';
import pick from 'lodash/pick';
import type { IDataObject, ISupplyDataFunctions, JsonObject } from 'n8n-workflow';
import { NodeConnectionTypes, NodeError, NodeOperationError } from 'n8n-workflow';

// 注意：这些工具函数可能需要根据项目实际情况调整
// import { logAiEvent } from '@utils/helpers';
// import { estimateTokensFromStringList } from '@utils/tokenizer/token-estimator';

type TokensUsageParser = (result: LLMResult) => {
	completionTokens: number;
	promptTokens: number;
	totalTokens: number;
};

type RunDetail = {
	index: number;
	messages: BaseMessage[] | string[] | string;
	options: SerializedSecret | SerializedNotImplemented | SerializedFields;
};

const TIKTOKEN_ESTIMATE_MODEL = 'gpt-4o';

// 简化的令牌估算函数（如果没有外部依赖）
async function estimateTokensFromStringList(list: string[], model?: string): Promise<number> {
	// 简单的令牌估算：大约每4个字符为1个令牌
	const totalChars = list.join('').length;
	return Math.ceil(totalChars / 4);
}

// 简化的日志事件函数（如果没有外部依赖）
function logAiEvent(executionFunctions: ISupplyDataFunctions, eventType: string, data: any) {
	executionFunctions.logger.info(`🤖 AI事件: ${eventType}`, data);
}

export class N8nLlmTracing extends BaseCallbackHandler {
	name = 'N8nLlmTracing';

	// This flag makes sure that LangChain will wait for the handlers to finish before continuing
	// This is crucial for the handleLLMError handler to work correctly (it should be called before the error is propagated to the root node)
	awaitHandlers = true;

	connectionType = NodeConnectionTypes.AiLanguageModel;

	promptTokensEstimate = 0;

	completionTokensEstimate = 0;

	#parentRunIndex?: number;

	/**
	 * A map to associate LLM run IDs to run details.
	 * Key: Unique identifier for each LLM run (run ID)
	 * Value: RunDetails object
	 *
	 */
	runsMap: Record<string, RunDetail> = {};

	options = {
		// Default(OpenAI format) parser
		tokensUsageParser: (result: LLMResult) => {
			const completionTokens = (result?.llmOutput?.tokenUsage?.completionTokens as number) ?? 0;
			const promptTokens = (result?.llmOutput?.tokenUsage?.promptTokens as number) ?? 0;

			return {
				completionTokens,
				promptTokens,
				totalTokens: completionTokens + promptTokens,
			};
		},
		errorDescriptionMapper: (error: NodeError) => error.description,
	};

	constructor(
		private executionFunctions: ISupplyDataFunctions,
		options?: {
			tokensUsageParser?: TokensUsageParser;
			errorDescriptionMapper?: (error: NodeError) => string;
		},
	) {
		super();
		this.options = { ...this.options, ...options };
	}

	async estimateTokensFromGeneration(generations: LLMResult['generations']) {
		const messages = generations.flatMap((gen) => gen.map((g) => g.text));
		return await this.estimateTokensFromStringList(messages);
	}

	async estimateTokensFromStringList(list: string[]) {
		const embeddingModel = getModelNameForTiktoken(TIKTOKEN_ESTIMATE_MODEL);
		return await estimateTokensFromStringList(list, embeddingModel);
	}

	async handleLLMEnd(output: LLMResult, runId: string) {
		// The fallback should never happen since handleLLMStart should always set the run details
		// but just in case, we set the index to the length of the runsMap
		const runDetails = this.runsMap[runId] ?? { index: Object.keys(this.runsMap).length };

		output.generations = output.generations.map((gen) =>
			gen.map((g) => pick(g, ['text', 'generationInfo'])),
		);

		const tokenUsageEstimate = {
			completionTokens: 0,
			promptTokens: 0,
			totalTokens: 0,
		};
		const tokenUsage = this.options.tokensUsageParser(output);

		if (output.generations.length > 0) {
			tokenUsageEstimate.completionTokens = await this.estimateTokensFromGeneration(
				output.generations,
			);

			tokenUsageEstimate.promptTokens = this.promptTokensEstimate;
			tokenUsageEstimate.totalTokens =
				tokenUsageEstimate.completionTokens + this.promptTokensEstimate;
		}
		const response: {
			response: { generations: LLMResult['generations'] };
			tokenUsageEstimate?: typeof tokenUsageEstimate;
			tokenUsage?: typeof tokenUsage;
		} = {
			response: { generations: output.generations },
		};

		// If the LLM response contains actual tokens usage, otherwise fallback to the estimate
		if (tokenUsage.completionTokens > 0) {
			response.tokenUsage = tokenUsage;
		} else {
			response.tokenUsageEstimate = tokenUsageEstimate;
		}

		const parsedMessages =
			typeof runDetails.messages === 'string'
				? runDetails.messages
				: runDetails.messages.map((message) => {
						if (typeof message === 'string') return message;
						if (typeof message?.toJSON === 'function') return message.toJSON();

						return message;
					});

		const sourceNodeRunIndex =
			this.#parentRunIndex !== undefined ? this.#parentRunIndex + runDetails.index : undefined;

		this.executionFunctions.addOutputData(
			this.connectionType,
			runDetails.index,
			[[{ json: { ...response } }]],
			undefined,
			sourceNodeRunIndex,
		);

		// 中文友好的日志记录
		const responseText = output.generations.flatMap(gen => gen.map(g => g.text)).join('\n');
		this.executionFunctions.logger.info(`✅ ModelScope LLM处理完成 - 响应长度: ${responseText.length}字符`, {
			runId,
			responseLength: responseText.length,
			tokenUsage: response.tokenUsage || response.tokenUsageEstimate,
			response: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
			timestamp: new Date().toISOString(),
		});

		logAiEvent(this.executionFunctions, 'ai-llm-generated-output', {
			messages: parsedMessages,
			options: runDetails.options,
			response,
		});
	}

	async handleLLMStart(llm: Serialized, prompts: string[], runId: string) {
		const estimatedTokens = await this.estimateTokensFromStringList(prompts);
		const sourceNodeRunIndex =
			this.#parentRunIndex !== undefined
				? this.#parentRunIndex + this.executionFunctions.getNextRunIndex()
				: undefined;

		const options = llm.type === 'constructor' ? llm.kwargs : llm;
		const { index } = this.executionFunctions.addInputData(
			this.connectionType,
			[
				[
					{
						json: {
							messages: prompts,
							estimatedTokens,
							options,
						},
					},
				],
			],
			sourceNodeRunIndex,
		);

		// Save the run details for later use when processing `handleLLMEnd` event
		this.runsMap[runId] = {
			index,
			options,
			messages: prompts,
		};
		this.promptTokensEstimate = estimatedTokens;

		// 中文友好的日志记录
		const modelName = llm.id?.[llm.id.length - 1] || 'ModelScope LLM';
		const promptText = prompts.join('\n');
		
		this.executionFunctions.logger.info(`🚀 ModelScope LLM开始处理 - 模型: ${modelName}`, {
			model: modelName,
			runId,
			promptLength: promptText.length,
			estimatedTokens,
			prompt: promptText.substring(0, 300) + (promptText.length > 300 ? '...' : ''),
			timestamp: new Date().toISOString(),
		});
	}

	async handleLLMError(error: IDataObject | Error, runId: string, parentRunId?: string) {
		const runDetails = this.runsMap[runId] ?? { index: Object.keys(this.runsMap).length };

		// Filter out non-x- headers to avoid leaking sensitive information in logs
		if (typeof error === 'object' && error?.hasOwnProperty('headers')) {
			const errorWithHeaders = error as { headers: Record<string, unknown> };

			Object.keys(errorWithHeaders.headers).forEach((key) => {
				if (!key.startsWith('x-')) {
					delete errorWithHeaders.headers[key];
				}
			});
		}

		if (error instanceof NodeError) {
			if (this.options.errorDescriptionMapper) {
				error.description = this.options.errorDescriptionMapper(error);
			}

			this.executionFunctions.addOutputData(this.connectionType, runDetails.index, error);
		} else {
			// If the error is not a NodeError, we wrap it in a NodeOperationError
			this.executionFunctions.addOutputData(
				this.connectionType,
				runDetails.index,
				new NodeOperationError(this.executionFunctions.getNode(), error as JsonObject, {
					functionality: 'configuration-node',
				}),
			);
		}

		// 中文友好的错误日志
		const errorMessage = error instanceof Error ? error.message : String(error);
		this.executionFunctions.logger.error(`❌ ModelScope LLM处理失败 - ${errorMessage}`, {
			runId,
			error: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});

		logAiEvent(this.executionFunctions, 'ai-llm-errored', {
			error: Object.keys(error).length === 0 ? error.toString() : error,
			runId,
			parentRunId,
		});
	}

	// Used to associate subsequent runs with the correct parent run in subnodes of subnodes
	setParentRunIndex(runIndex: number) {
		this.#parentRunIndex = runIndex;
	}
}