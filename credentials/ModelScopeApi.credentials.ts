import type {
	IAuthenticateGeneric,
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
}