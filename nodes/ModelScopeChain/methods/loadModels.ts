import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { SUPPORTED_MODELS } from '../../ModelScope/utils/constants';

export async function searchModels(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {

    const mockModels = SUPPORTED_MODELS.llm.map((id) => ({ id, name: id }));

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