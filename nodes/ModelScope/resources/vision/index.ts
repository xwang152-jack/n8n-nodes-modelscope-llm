import type { INodeProperties } from 'n8n-workflow';
import { getModelOptions } from '../../utils/constants';

export const visionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['vision'],
			},
		},
		options: [
			{
				name: 'Vision Chat',
				value: 'visionChat',
				description: '与视觉模型进行图像对话',
				action: 'Vision chat',
			},
		],
		default: 'visionChat',
	},
];

export const visionFields: INodeProperties[] = [
	// 使用限制提醒
	{
		displayName: 'Usage Notice',
		name: 'usageNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['vision'],
			},
		},
		typeOptions: {
			theme: 'info',
		},
	} as any,
	// 模型选择
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['vision'],
				operation: ['visionChat'],
			},
		},
		options: getModelOptions('vision'),
		default: 'Qwen/QVQ-72B-Preview',
		required: true,
		description: '选择要使用的视觉模型',
	},
	// 图像URL
	{
		displayName: 'Image URL',
		name: 'imageUrl',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['vision'],
				operation: ['visionChat'],
			},
		},
		default: '',
		required: true,
		description: '要分析的图像URL地址',
		placeholder: 'https://example.com/image.jpg',
	},
	// 提示词
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['vision'],
				operation: ['visionChat'],
			},
		},
		typeOptions: {
			rows: 3,
		},
		default: '请描述这张图片的内容',
		required: true,
		description: '对图像的提问或指令',
	},
	// 温度参数
	{
		displayName: 'Temperature',
		name: 'temperature',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['vision'],
				operation: ['visionChat'],
			},
		},
		default: 0.7,
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberStepSize: 0.1,
		},
		description: '控制输出的随机性，范围0-2',
	},
	// 最大令牌数
	{
		displayName: 'Max Tokens',
		name: 'maxTokens',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['vision'],
				operation: ['visionChat'],
			},
		},
		default: 2048,
		typeOptions: {
			minValue: 1,
			maxValue: 8192,
		},
		description: '生成的最大令牌数',
	},
];