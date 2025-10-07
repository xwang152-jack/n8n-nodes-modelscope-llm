# n8n-nodes-modelscope-llm

[![npm version](https://badge.fury.io/js/n8n-nodes-modelscope-llm.svg)](https://badge.fury.io/js/n8n-nodes-modelscope-llm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

这是一个用于 [n8n](https://n8n.io/) 的 ModelScope API 集成节点，支持大语言模型、视觉模型和文生图模型的调用。

## 功能特性

- 🤖 **大语言模型 (LLM)**: 支持对话完成，包括 Qwen、ChatGLM 等主流模型
- 👁️ **视觉模型 (Vision)**: 支持图像理解和视觉问答
- 🎨 **文生图模型 (Image)**: 支持文本到图像的生成，包括 FLUX、SDXL 等模型
- 🔐 **安全认证**: 使用 ModelScope API Token 进行身份验证
- ⚡ **异步处理**: 支持文生图任务的异步处理和状态轮询
- 🎛️ **丰富配置**: 支持温度、最大令牌数、图像尺寸等参数调节

## 安装

### 通过 npm 安装

```bash
npm install n8n-nodes-modelscope-llm
```

### 通过 n8n 社区节点安装

1. 在 n8n 界面中，转到 **Settings** > **Community Nodes**
2. 点击 **Install a community node**
3. 输入 `n8n-nodes-modelscope-llm`
4. 点击 **Install**

## 配置

### 获取 ModelScope API Token

1. 访问 [ModelScope](https://modelscope.cn/) 并注册账号
2. 登录后，进入 [个人中心 - API Token](https://modelscope.cn/my/myaccesstoken)
3. 创建新的 API Token
4. 复制生成的 Token

### 在 n8n 中配置凭据

1. 在 n8n 工作流中添加 ModelScope 节点
2. 点击 **Create New Credential**
3. 输入您的 ModelScope API Token
4. 保存凭据

## 使用方法

### 大语言模型 (LLM)

支持与大语言模型进行对话：

- **模型选择**: ZhipuAI/GLM-4.6、deepseek-ai/DeepSeek-V3.1、Qwen/Qwen3-235B-A22B-Instruct-2507 等
- **消息模板**: 自定义、代码生成、文本分析、翻译等预设模板
- **参数配置**: 温度、最大令牌数、流式输出等

**示例配置**:
```json
{
  "resource": "llm",
  "operation": "chatCompletion",
  "model": "ZhipuAI/GLM-4.6",
  "messages": [
    {
      "role": "user",
      "content": "请帮我写一个 Python 函数来计算斐波那契数列"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 2048
}
```

### 视觉模型 (Vision)

支持图像理解和视觉问答：

- **模型选择**: Qwen/Qwen3-VL-235B-A22B-Instruct、Qwen/Qwen3-VL-30B-A3B-Instruct 等
- **图像输入**: 支持图像 URL
- **视觉问答**: 对图像内容进行描述、分析、问答

**示例配置**:
```json
{
  "resource": "vision",
  "operation": "visionChat",
  "model": "Qwen/Qwen3-VL-235B-A22B-Instruct",
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "请描述这张图片的内容",
  "temperature": 0.7,
  "maxTokens": 2048
}
```

### 文生图模型 (Image)

支持根据文本描述生成图像：

- **模型选择**: FLUX.1-Krea-dev、SDXL-Lightning 等
- **提示词**: 支持正面和负面提示词
- **图像配置**: 多种尺寸选择、生成步数调节
- **异步处理**: 自动处理异步任务和状态轮询

**示例配置**:
```json
{
  "resource": "image",
  "operation": "textToImage",
  "model": "Qwen/Qwen-Image",
  "prompt": "一只可爱的小猫坐在花园里，阳光明媚，高质量，4K",
  "negativePrompt": "blurry, low quality, distorted",
  "size": "1024x1024",
  "steps": 30,
  "timeout": 5
}
```

## 支持的模型

### 大语言模型 (LLM)
- ZhipuAI/GLM-4.6
- deepseek-ai/DeepSeek-V3.1
- Qwen/Qwen3-235B-A22B-Instruct-2507

### 视觉模型 (Vision)
- Qwen/Qwen3-VL-235B-A22B-Instruct
- Qwen/Qwen3-VL-30B-A3B-Instruct

### 文生图模型 (Image)
- Qwen/Qwen-Image

## 使用限制

- 每用户每天总计 2000 次 API 调用
- 单个模型每天不超过 500 次调用
- 部分大模型限制 200 次/天
- 文生图任务为异步处理，生成时间通常为 30 秒 - 5 分钟

## 错误处理

节点包含完善的错误处理机制：

- **401 错误**: API Token 无效或过期
- **429 错误**: 请求频率超限或配额不足
- **400 错误**: 请求参数错误
- **500 错误**: 服务器内部错误

## 开发

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/xwang152-jack/n8n-nodes-modelscope-llm.git
cd n8n-nodes-modelscope-llm

# 安装依赖
npm install

# 构建
npm run build

# 链接到本地 n8n
npm link
cd ~/.n8n/nodes
npm link n8n-nodes-modelscope-llm
```

### 项目结构

```
├── credentials/
│   └── ModelScopeApi.credentials.ts    # API 认证配置
├── nodes/
│   └── ModelScope/
│       ├── ModelScope.node.ts          # 主节点文件
│       ├── modelscope.svg              # 节点图标
│       ├── resources/                  # 资源模块
│       │   ├── llm/                    # 大语言模型
│       │   ├── vision/                 # 视觉模型
│       │   └── image/                  # 文生图模型
│       └── utils/                      # 工具类
│           ├── apiClient.ts            # API 客户端
│           ├── constants.ts            # 常量定义
│           └── errorHandler.ts         # 错误处理
└── package.json
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 相关链接

- [ModelScope 官网](https://modelscope.cn/)
- [ModelScope API 文档](https://modelscope.cn/docs/api-inference/intro)
- [n8n 官网](https://n8n.io/)
- [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/)