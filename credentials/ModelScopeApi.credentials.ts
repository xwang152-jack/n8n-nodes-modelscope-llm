import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ModelScopeApi implements ICredentialType {
	name = 'modelScopeApi';

	displayName = 'ModelScope API';

	documentationUrl = 'https://modelscope.cn/my/myaccesstoken';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'ModelScope Access Token. 获取地址: https://modelscope.cn/my/myaccesstoken',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.accessToken}}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api-inference.modelscope.cn',
			url: '/v1/models',
			method: 'GET',
			headers: {
				'Authorization': '=Bearer {{$credentials.accessToken}}',
				'Content-Type': 'application/json',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					message: 'ModelScope API 连接测试成功',
					key: 'data',
					value: 'array',
				},
			},
		],
	};
}