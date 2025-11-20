export class ModelScopeErrorHandler {
	static handleApiError(error: any): Error {
		if (error.response) {
			const status = error.response.status;
			const message =
				error.response.data?.error?.message ||
				error.response.data?.message ||
				error.response.statusText ||
				error.message;

			switch (status) {
				case 401:
					return new Error('认证失败: 请检查Access Token是否正确');
				case 429:
					return new Error('请求频率超限: 请稍后重试或检查每日配额');
				case 400:
					return new Error(`请求参数错误: ${message}`);
				case 500:
					return new Error('ModelScope服务内部错误，请稍后重试');
				default:
					return new Error(`API调用失败 (${status}): ${message || '无详细错误信息'}`);
			}
		}

		return new Error(`网络错误: ${error.message}`);
	}

	static validateModel(model: string, supportedModels: string[]): void {
		if (!supportedModels.includes(model)) {
			throw new Error(`不支持的模型: ${model}`);
		}
	}

	static validateRateLimit(dailyUsage: number, modelUsage: number): void {
		if (dailyUsage >= 2000) {
			throw new Error('已达到每日总调用限制(2000次)');
		}

		if (modelUsage >= 500) {
			throw new Error('已达到单模型每日调用限制(500次)');
		}
	}
}
