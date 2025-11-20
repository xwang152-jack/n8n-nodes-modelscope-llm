import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ModelScopeClient } from '../../utils/apiClient';
import { ModelScopeErrorHandler } from '../../utils/errorHandler';

export async function executeCreateEmbedding(
    this: IExecuteFunctions,
    itemIndex: number,
) {
    const startTime = Date.now();
    try {
        const credentials = await this.getCredentials('modelScopeApi');
        const client = new ModelScopeClient(credentials.accessToken as string);

        const model = this.getNodeParameter('model', itemIndex) as string;
        const batch = this.getNodeParameter('batch', itemIndex, false) as boolean;
        const input = this.getNodeParameter('input', itemIndex, '') as string;
        const inputsData = this.getNodeParameter('inputs', itemIndex, { item: [] }) as { item: Array<{ text: string }> };
        const encodingFormat = this.getNodeParameter('encodingFormat', itemIndex, 'float') as 'float' | 'base64';

        if (!batch) {
            if (!input.trim()) {
                throw new NodeOperationError(this.getNode(), '输入文本不能为空');
            }
        } else {
            const texts = (inputsData.item || []).map(x => x.text).filter(t => typeof t === 'string' && t.trim());
            if (!texts.length) {
                throw new NodeOperationError(this.getNode(), '批量输入至少需要一条非空文本');
            }
        }

        const payloadInput = batch
            ? (inputsData.item || []).map(x => x.text).filter(t => typeof t === 'string' && t.trim())
            : input;

        const response = await client.createEmbedding({
            model,
            input: payloadInput,
            encoding_format: encodingFormat,
        }) as any;

        const processingTime = Math.round((Date.now() - startTime) / 1000);
        return {
            id: response.id,
            object: response.object,
            model: response.model,
            data: response.data,
            usage: response.usage,
            status: 'completed',
            processing_time: `${processingTime}秒`,
            completed_at: new Date().toISOString(),
            encoding_format: encodingFormat,
            batch,
        };
    } catch (error: any) {
        const processingTime = Math.round((Date.now() - startTime) / 1000);
        this.logger.error(`向量化失败 - 用时: ${processingTime}秒, 错误: ${error.message}`);
        throw ModelScopeErrorHandler.handleApiError(error);
    }
}
