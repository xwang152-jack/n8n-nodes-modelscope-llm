import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ModelScopeClient } from '../../utils/apiClient';
import { ModelScopeErrorHandler } from '../../utils/errorHandler';

export async function executeTextToImage(
	this: IExecuteFunctions,
	itemIndex: number,
) {
	try {
        const credentials = await this.getCredentials('modelScopeApi');
        const client = new ModelScopeClient(credentials.accessToken as string);

		const model = this.getNodeParameter('model', itemIndex) as string;
		const prompt = this.getNodeParameter('prompt', itemIndex) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', itemIndex, '') as string;
		const size = this.getNodeParameter('size', itemIndex, '1024x1024') as string;
		const steps = this.getNodeParameter('steps', itemIndex, 30) as number;
		const timeout = this.getNodeParameter('timeout', itemIndex, 5) as number;

		// 验证输入
        if (!prompt.trim()) {
            throw new NodeOperationError(this.getNode(), '提示词不能为空');
        }

		// 提交异步任务
        const submitResponse = await client.generateImage({
            model,
            prompt,
            negative_prompt: negativePrompt,
            size: size,
            num_inference_steps: steps,
            guidance_scale: 7.5,
        }) as any;

		const taskId = submitResponse.task_id;
		if (!taskId) {
			throw new Error('任务提交失败，未获取到任务ID');
		}

		// 轮询任务状态
		let attempts = 0;
		const maxAttempts = timeout * 12; // 每5秒检查一次，timeout分钟内完成
        let pollInterval = 5000;
		const startTime = Date.now();

		while (attempts < maxAttempts) {
            const statusResponse = await client.getTaskStatus(taskId) as any;
			
			// 记录轮询状态
			const progress = Math.round((attempts / maxAttempts) * 100);
			const elapsedTime = Math.round((Date.now() - startTime) / 1000);
			
            this.logger.info(`图像生成进度: ${progress}% - 状态: ${statusResponse.task_status} (尝试 ${attempts + 1}/${maxAttempts}, 已用时: ${elapsedTime}秒)`);

			if (statusResponse.task_status === 'SUCCEED') {
				const processingTime = Math.round((Date.now() - startTime) / 1000);
				return {
					task_id: taskId,
					status: 'completed',
					progress: 100,
					model,
					prompt,
					negative_prompt: negativePrompt,
					size,
					steps,
					images: statusResponse.output_images || [],
					created_at: new Date().toISOString(),
					processing_time: `${processingTime}秒`,
					attempts_used: attempts + 1,
				};
			} else if (statusResponse.task_status === 'FAILED') {
				throw new Error(`图像生成失败: ${statusResponse.error_message || '未知错误'}`);
			} else if (statusResponse.task_status === 'RUNNING') {
				// 返回进度状态（如果需要中间状态）
                this.logger.info(`任务正在处理中... 进度: ${progress}%, 已用时: ${elapsedTime}秒`);
			} else if (statusResponse.task_status === 'PENDING') {
                this.logger.info(`任务排队中... 进度: ${progress}%, 已用时: ${elapsedTime}秒`);
			}

			// 等待后重试
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            attempts++;
            pollInterval = Math.min(15000, Math.round(pollInterval * 1.3));
		}

        throw new NodeOperationError(this.getNode(), `图像生成超时 (${timeout}分钟)，任务ID: ${taskId}`);
	} catch (error: any) {
		throw ModelScopeErrorHandler.handleApiError(error);
	}
}