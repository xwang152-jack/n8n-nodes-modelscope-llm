import type { IExecuteFunctions } from 'n8n-workflow';
import { ModelScopeClient } from '../../utils/apiClient';
import { ModelScopeErrorHandler } from '../../utils/errorHandler';

export async function executeTextToImage(
	this: IExecuteFunctions,
	itemIndex: number,
) {
	try {
		const credentials = await this.getCredentials('modelScopeApi');
		const accessToken = credentials.accessToken as string;
		const client = new ModelScopeClient(accessToken);

		const model = this.getNodeParameter('model', itemIndex) as string;
		const prompt = this.getNodeParameter('prompt', itemIndex) as string;
		const negativePrompt = this.getNodeParameter('negativePrompt', itemIndex, '') as string;
		const size = this.getNodeParameter('size', itemIndex, '1024x1024') as string;
		const steps = this.getNodeParameter('steps', itemIndex, 30) as number;
		const timeout = this.getNodeParameter('timeout', itemIndex, 5) as number;

		// 验证输入
		if (!prompt.trim()) {
			throw new Error('提示词不能为空');
		}

		// 提交异步任务
		const submitResponse = await client.generateImage({
			model,
			prompt,
			negative_prompt: negativePrompt,
			width: parseInt(size.split('x')[0]),
			height: parseInt(size.split('x')[1]),
			num_inference_steps: steps,
			guidance_scale: 7.5,
		}, accessToken) as any;

		const taskId = submitResponse.task_id;
		if (!taskId) {
			throw new Error('任务提交失败，未获取到任务ID');
		}

		// 轮询任务状态
		let attempts = 0;
		const maxAttempts = timeout * 12; // 每5秒检查一次，timeout分钟内完成
		const pollInterval = 5000; // 5秒

		while (attempts < maxAttempts) {
			const statusResponse = await client.getTaskStatus(taskId, accessToken) as any;

			if (statusResponse.task_status === 'SUCCEED') {
				return {
					task_id: taskId,
					status: 'completed',
					model,
					prompt,
					negative_prompt: negativePrompt,
					size,
					steps,
					images: statusResponse.output_images || [],
					created_at: new Date().toISOString(),
				};
			} else if (statusResponse.task_status === 'FAILED') {
				throw new Error(`图像生成失败: ${statusResponse.error_message || '未知错误'}`);
			}

			// 等待后重试
			await new Promise((resolve) => setTimeout(resolve, pollInterval));
			attempts++;
		}

		throw new Error(`图像生成超时 (${timeout}分钟)，任务ID: ${taskId}`);
	} catch (error: any) {
		throw ModelScopeErrorHandler.handleApiError(error);
	}
}