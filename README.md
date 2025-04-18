# TencentCloudBase Agent UI 🤖

[![WeChat MiniProgram](https://img.shields.io/badge/Platform-WeChat_MiniProgram-07C160?logo=wechat)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/TencentCloudBase/cloudbase-agent-ui/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/TencentCloudBase/cloudbase-agent-ui?style=social)](https://github.com/TencentCloudBase/cloudbase-agent-ui)

cloudbase-agent-ui 是由腾讯云开发团队推出的 AI 智能对话 UI 组件，配置简单开箱即用，助力微信小程序开发者快速集成大模型能力，打造企业级LLM应用。现已支持接入
***DeepSeek 满血版（DeepSeek-R1-671B 与 DeepSeek-V3-671B）🔥🔥🔥, 腾讯混元大模型等***。

Agent UI 演示效果图

<img src="https://raw.githubusercontent.com/TencentCloudBase/cloudbase-agent-ui/luke--migrate-repo/docs/modelExample.gif" width="375px">   <img src="https://raw.githubusercontent.com/TencentCloudBase/cloudbase-agent-ui/luke--migrate-repo/docs/botExample.gif" width="375px">

## 🌟 特性亮点

- **双模式支持** `Agent模式` 与 `大模型直连` 自由选择对话策略
- **企业级功能集成** 流式输出/联网搜索/深度思考/多轮会话 开箱即用
- **多模型支持** 深度兼容 DeepSeek、Hunyuan 等主流大模型
- **配置即开发** 通过配置快速接入组件能力，无需处理复杂通信逻辑

## 📦 使用指南

### 1. 开通环境

Agent UI 微信小程序组件依赖**微信云开发**服务，需先开通云开发环境

#### 1.1 开通微信云开发

开通方式，点击开发者工具顶部“云开发” 进行开通

![](https://qcloudimg.tencent-cloud.cn/raw/f06ca4761f54ecc8ed8d9644229c92f9.png)

如已开通微信云开发服务，请跳转至[云开发平台](https://tcb.cloud.tencent.com/dev)创建AI服务。

#### 1.2、创建AI服务

- 方式一：直接使用agent智能体服务
  ![](https://qcloudimg.tencent-cloud.cn/raw/97786aaaa15aa1f23e9bbd39a7a6762f.png)
- 方式二：接入大模型
  ![](https://qcloudimg.tencent-cloud.cn/raw/876d2238b5331a7bdcbd91a1b38b8248.png)

### 2. 获取组件

可通过以下两种方式获取组件包代码

1. **克隆仓库到本地，提取其中components/agent-ui 目录使用**
2. **下载GitHub Release 包 agent-ui.zip，直接使用**

### 3. 微信小程序项目引入组件

1. **配置云开发环境ID**
   打开 miniprogram/app.js 文件，配置云开发环境ID。

```js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "your envId",// 环境id
        traceUser: true,
      });
    }

    this.globalData = {};
  },
});
```

2. **拷贝源码组件，将 agent-ui 组件放入用户项目 components 目录中**
3. **组件所属页面 .json配置文件中注册组件**

```json
{
  "usingComponents": {
    "agent-ui":"/components/agent-ui/index"
  },
}

```

4. **组件所属页面 .wxml 文件中引用组件**

```wxml
<view>
  <agent-ui agentConfig="{{agentConfig}}" showBotAvatar="{{showBotAvatar}}" chatMode="{{chatMode}}" modelConfig="{{modelConfig}}></agent-ui>
</view>
```

5. **组件所属页面 .js 文件中编写配置**

```js
Page({
  // ...
  data: {
    chatMode: "bot", // bot 表示使用agent，model 表示使用大模型，两种选一种配置即可
    showBotAvatar: true, // 是否在对话框左侧显示头像
    agentConfig: {
      botId: "bot-e7d1e736", // agent id,
      allowWebSearch: true, // 允许客户端选择启用联网搜索
      allowUploadFile: true, // 允许上传文件
      allowPullRefresh: true, // 允许下拉刷新
      allowUploadImage: true, // 允许上传图片
      allowMultiConversation: true, // 允许客户端界面展示会话列表及新建会话按钮
      showToolCallDetail: true, // 允许展示 mcp server toolcall 细节
    },
    modelConfig: {
      modelProvider: "hunyuan-open", // 大模型服务厂商
      quickResponseModel: "hunyuan-lite", // 大模型名称
      logo: "", // model 头像
      welcomeMsg: "欢迎语", // model 欢迎语
    },
  }
  // ...
})
```

## 🏗 项目结构

```bash
📦 cloudbase-agent-ui
├── 📂 components       # 组件集合
│   └── agent-ui        # 你要使用的小程序 Agent UI 组件（拷贝这个替换旧版本）
├── 📂 docs             # 文档
└── 📂 apps         # 应用列表
│   └── miniprogram-agent-ui     # 集成 agent-ui 组件的示例应用，可直接导入微信开发者工具体验
├── CHANGELOG.md           # 版本变更记录（语义化版本规范）
├── LICENSE                # 开源协议
├── package.json           # 版本管理
└── .github/               # GitHub自动化配置
    ├── workflows/
    │   └── release-main.yml    # 自动打包发布
    └── ISSUE_TEMPLATE/    # Issue模板

```

## ⚙️ 配置详解

### 配置属性表

| 参数              | 类型                     | 必填 | 说明                                                                                                   |
| ----------------- | ------------------------ | ---- | ------------------------------------------------------------------------------------------------------ |
| `chatMode`      | `String`               | 是   | 组件对接的AI类型，值为 'bot' 或者 'model'，为 'bot' 时，对接 agent 能力；为 'model' 时，对接大模型能力 |
| `showBotAvatar` | `Boolean`              | 否   | 是否展示Bot的logo头像                                                                                  |
| `agentConfig`   | [AgentConfig](#Agentconfig) | 是   | Agent 调用配置                                                                                         |
| `modelConfig`   | [ModelConfig](#Modelconfig) | 是   | Model 调用配置                                                                                         |

#### AgentConfig

| 参数                 | 类型        | 必填 | 说明                                          |
| -------------------- | ----------- | ---- | --------------------------------------------- |
| `botId`            | `String`  | 否   | Agent的唯一标识ID，当 chatMode = 'bot' 时必填 |
| `allowWebSearch`   | `Boolean` | 否   | 是否允许客户端界面展示联网搜索                |
| `allowUploadFile`  | `Boolean` | 否   | 是否允许客户端界面展示文件上传                |
| `allowPullRefresh` | `Boolean` | 否   | 是否允许客户端界面展示下拉获取历史记录        |
| `allowUploadImage` | `Boolean` | 否   | 是否允许客户端界面展示图片上传及拍照上传        |
| `allowMultiConversation` | `Boolean` | 否   | 是否允许客户端界面展示会话列表及新建会话按钮        |
| `showToolCallDetail` | `Boolean` | 否   | 是否允许展示 mcp server toolcall 细节        |

#### ModelConfig

| 参数                   | 类型       | 必填 | 说明                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ---------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelProvider`      | `String` | 是   | 大模型服务商，当 chatMode = 'model' 时，必填，值为 'hunyuan-open' 或 'deepseek'                                                                                                                                                                                                                                                                                 |
| `quickResponseModel` | `String` | 是   | 具体使用的模型，当 chatMode = 'model' 时，必填； modelProvider 为 deepseek时，支持  deepseek-r1/deepseek-v3; modelProvider 为 hunyuan-exp （混元体验版）/ hunyuan-open（混元正式版,使用需先[配置API Key](https://tcb.cloud.tencent.com/dev?envId=luke-agent-dev-7g1nc8tqc2ab76af#/ai?tab=ai-model&model=hunyuan-open)）时，quickResponseModel 可配置为hunyuan-lite |
| `logo`               | `String` | 否   | 页面 logo，当 chatMode = 'model' 时生效，选填                                                                                                                                                                                                                                                                                                                   |
| `welcomeMsg`         | `String` | 否   | 欢迎语，当 chatMode = 'model' 时生效，选填                                                                                                                                                                                                                                                                                                                      |

> [!IMPORTANT]
> 大小限制：单文件不超过10M
> 数量限制：单次最多支持 5 个文件
> 文件类型：pdf、txt、doc、docx、ppt、pptx、xls、xlsx、csv
> **request合法域名配置**：微信小程序 上传文件&多会话 需要添加云开发域名到request合法域名列表，云开发域名为：https://{your-envid}.api.tcloudbasegateway.com, 可前往[微信公众平台](https://mp.weixin.qq.com)配置request合法域名

配置示例

- **对接 DeepSeek 大模型**

1. 前往 miniprogram/app.js 文件配置云开发环境 ID

```javascript
wx.cloud.init({
  env: "你的环境ID",
  traceUser: true,
});
```

2. 修改组件配置，在引用 agent-ui 组件的页面配置 (也可参考apps/miniprogram-agent-ui项目 chatBot 页面配置案例)

```javascript
Page({
  //...
  data: {
    chatMode: 'model',
    modelConfig: {
      modelProvider: "deepseek",
      quickResponseModel: "deepseek-v3" // or deepseek-r1
      logo: "",
      welcomeMsg: ""
    }
  }
  //...
})
```

- **对接 Hunyuan 大模型**

1. 前往 miniprogram/app.js 文件配置云开发环境 ID

```javascript
wx.cloud.init({
  env: "你的环境ID",
  traceUser: true,
});
```

2. 修改组件配置，在引用 agent-ui 组件的页面配置 (也可参考apps/miniprogram-agent-ui项目 chatBot 页面配置案例)

```javascript
Page({
  //...
  data:{
    chatMode: 'model',
    modelConfig: {
      modelProvider: "hunyuan-open",
      quickResponseModel: "hunyuan-lite"
      logo: "",
      welcomeMsg: ""
    }
  }
  //...
})
```

- **对接 腾讯云开发 Agent**

1. 前往 miniprogram/app.js 文件配置云开发环境 ID

```javascript
wx.cloud.init({
  env: "你的环境ID",
  traceUser: true,
});
```

2. 修改组件配置，在引用 agent-ui 组件的页面配置 (也可参考apps/miniprogram-agent-ui项目 chatBot 页面配置案例)

```javascript
Page({
  //...
  data: {
    chatMode: "bot", // bot 表示使用agent，model 表示使用大模型
    showBotAvatar: true, // 是否在对话框左侧显示头像
    agentConfig: {
      botId: "bot-e7d1e736", // agent id,
      allowWebSearch: true, // 允许客户端选择启用联网搜索
      allowUploadFile: true, // 允许上传文件
      allowPullRefresh: true, // 允许下拉刷新
      allowUploadImage: true, // 允许上传图片及拍照上传
      allowMultiConversation: true, // 允许客户端界面展示会话列表及新建会话按钮
      showToolCallDetail: true, // 允许展示 mcp server toolcall 细节
    }
  }
  //...
})
```

## 🚀 开发路线

### ✅ 已完成功能

- ✅ 大模型调用配置化 （DeepSeek/Hunyuan）
- ✅ Agent调用配置化 (云开发平台配置)
- ✅ 流式输出
- ✅ 联网搜索 （Agent模式）
- ✅ 文档解析 （Agent模式）
- ✅ 图片上传解析（拍照/图片）

### 🚧 进行中开发

- 多模型（快速响应/深度推理）切换调用配置化
- 历史会话管理，多轮对话上下文记忆
- 支持文字转语音播放
- 支持用户语音输入转文字
- 支持语音音色配置
- agent支持环境共享下使用

### 📅 未来计划

- UI 高度配置化，提供页面结构配置化控制，CSS变量配置，完美融入品牌风格
- 文生图
- 文生视频
- 文生3D
- 图生视频
- 待补充...

## 🌍 社区支持

遇到问题？欢迎通过以下方式联系我们：

- [Github Issues](https://github.com/TencentCloudBase/cloudbase-agent-ui/issues)
- 微信开发者群 （扫码加小助手微信拉群）

## 🤝 贡献指南

我们欢迎所有形式的贡献！

## 👥 贡献者墙

https://contrib.rocks/image?repo=TencentCloudBase/cloudbase-agent-ui

![Star History Chart](https://api.star-history.com/svg?repos=TencentCloudBase/cloudbase-agent-ui&type=Date)
