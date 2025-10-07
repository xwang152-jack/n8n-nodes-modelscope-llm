import type { INodeProperties } from 'n8n-workflow';
import { getModelOptions, IMAGE_SIZE_OPTIONS } from '../../utils/constants';

export const imageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['image'],
			},
		},
		options: [
			{
				name: 'Text to Image',
				value: 'textToImage',
				description: '根据文本描述生成图像',
				action: 'Text to image',
			},
		],
		default: 'textToImage',
	},
];

export const imageFields: INodeProperties[] = [
	// 使用限制提醒
	{
		displayName: 'Usage Notice',
		name: 'usageNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['image'],
			},
		},
		typeOptions: {
			theme: 'warning',
		},
	} as any,
	// 模型选择
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['textToImage'],
			},
		},
		options: getModelOptions('image'),
		default: 'Qwen/Qwen-Image',
		required: true,
		description: '选择要使用的文生图模型',
	},
	// 提示词
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['textToImage'],
			},
		},
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: '图像生成的描述文本',
		placeholder: '一只可爱的小猫坐在花园里，阳光明媚，高质量，4K',
	},
	// 负面提示词
	{
		displayName: 'Negative Prompt',
		name: 'negativePrompt',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['textToImage'],
			},
		},
		typeOptions: {
			rows: 2,
		},
		default: '',
		description: '不希望在图像中出现的内容',
		placeholder: 'blurry, low quality, distorted',
	},
	// 图像尺寸
	{
		displayName: 'Size',
		name: 'size',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['textToImage'],
			},
		},
		options: IMAGE_SIZE_OPTIONS,
		default: '1024x1024',
		description: '生成图像的尺寸',
	},
	// 生成步数
	{
		displayName: 'Steps',
		name: 'steps',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['textToImage'],
			},
		},
		default: 30,
		typeOptions: {
			minValue: 10,
			maxValue: 100,
		},
		description: '生成步数，越高质量越好但耗时更长',
	},
	// 超时设置
	{
		displayName: 'Timeout (Minutes)',
		name: 'timeout',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['image'],
				operation: ['textToImage'],
			},
		},
		default: 5,
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		description: '任务超时时间（分钟）',
	},
];