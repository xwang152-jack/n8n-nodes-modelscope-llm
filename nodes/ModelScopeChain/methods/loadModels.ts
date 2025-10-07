import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

export async function searchModels(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {

	// ModelScope AI model data
	const mockModels = [
		{ id: 'ZhipuAI/GLM-4.6', name: 'GLM-4.6' },
		{ id: 'ZhipuAI/GLM-4.5', name: 'GLM-4.5' },
		{ id: 'deepseek-ai/DeepSeek-V3.1', name: 'DeepSeek-V3.1' },
		{ id: 'deepseek-ai/DeepSeek-R1-0528', name: 'DeepSeek-R1-0528' },
		{ id: 'Qwen/Qwen3-235B-A22B-Instruct-2507', name: 'Qwen3-235B-A22B-Instruct-2507' },
		{ id: 'Qwen/Qwen3-235B-A22B-Thinking-2507', name: 'Qwen3-235B-A22B-Thinking-2507' },
		{ id: 'Qwen/Qwen3-Next-80B-A3B-Instruct', name: 'Qwen3-Next-80B-A3B-Instruct' },
		{ id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', name: 'Qwen3-Coder-480B-A35B-Instruct' },
		{ id: 'Qwen/Qwen3-Next-80B-A3B-Thinking', name: 'Qwen3-Next-80B-A3B-Thinking' }
	];

	// Filter models based on filter conditions
	const filteredModels = mockModels.filter((model) => {
		if (!filter) return true;
		return model.id.toLowerCase().includes(filter.toLowerCase()) ||
			   model.name.toLowerCase().includes(filter.toLowerCase());
	});

	// Sort by name
	filteredModels.sort((a, b) => a.name.localeCompare(b.name));

	return {
		results: filteredModels.map((model) => ({
			name: model.name,
			value: model.id,
		})),
	};
}