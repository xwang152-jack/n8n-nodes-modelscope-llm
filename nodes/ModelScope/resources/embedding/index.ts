import type { INodeProperties } from 'n8n-workflow';
import { getModelOptions } from '../../utils/constants';

export const embeddingOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['embedding'],
            },
        },
        options: [
            {
                name: 'Create Embedding',
                value: 'createEmbedding',
                description: '生成文本向量',
                action: 'Create embedding',
            },
        ],
        default: 'createEmbedding',
    },
];

export const embeddingFields: INodeProperties[] = [
    {
        displayName: 'Batch Mode',
        name: 'batch',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['embedding'],
                operation: ['createEmbedding'],
            },
        },
        default: false,
        description: 'Whether to enable batch embedding',
    },
    {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['embedding'],
                operation: ['createEmbedding'],
            },
        },
        options: getModelOptions('embedding'),
        default: 'Qwen/Qwen3-Embedding-8B',
        required: true,
        description: '选择向量化模型',
    },
    {
        displayName: 'Input',
        name: 'input',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['embedding'],
                operation: ['createEmbedding'],
                batch: [false],
            },
        },
        typeOptions: {
            rows: 3,
        },
        default: '',
        required: true,
        description: '要进行向量化的文本',
    },
    {
        displayName: 'Inputs',
        name: 'inputs',
        type: 'fixedCollection',
        displayOptions: {
            show: {
                resource: ['embedding'],
                operation: ['createEmbedding'],
                batch: [true],
            },
        },
        typeOptions: {
            multipleValues: true,
        },
        default: {
            item: [
                {
                    text: '',
                },
            ],
        },
        options: [
            {
                name: 'item',
                displayName: 'Item',
                values: [
                    {
                        displayName: 'Text',
                        name: 'text',
                        type: 'string',
                        typeOptions: {
                            rows: 2,
                        },
                        default: '',
                        description: '要进行向量化的文本条目',
                    },
                ],
            },
        ],
        description: '批量向量化文本列表',
    },
    {
        displayName: 'Encoding Format',
        name: 'encodingFormat',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['embedding'],
                operation: ['createEmbedding'],
            },
        },
        options: [
            { name: 'Float', value: 'float' },
            { name: 'Base64', value: 'base64' },
        ],
        default: 'float',
        description: '向量编码格式',
    },
];
