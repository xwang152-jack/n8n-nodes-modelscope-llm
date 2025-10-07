import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { ISupplyDataFunctions } from 'n8n-workflow';
import type { Serialized } from '@langchain/core/load/serializable';

export class N8nLlmTracing extends BaseCallbackHandler {
	name = 'N8nLlmTracing';

	constructor(_context: ISupplyDataFunctions) {
		super();
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
		// Handle LLM start event
		// This can be used for logging, monitoring, or other tracing purposes
	}

	async handleLLMEnd(
		output: any,
		runId: string,
		parentRunId?: string,
		tags?: string[],
	): Promise<void> {
		// Handle LLM end event
		// This can be used for logging, monitoring, or other tracing purposes
	}

	async handleLLMError(
		err: Error,
		runId: string,
		parentRunId?: string,
		tags?: string[],
	): Promise<void> {
		// Handle LLM error event
		// This can be used for error logging, monitoring, or other tracing purposes
	}
}