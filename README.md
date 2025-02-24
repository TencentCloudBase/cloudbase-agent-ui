# TencentCloudBase Agent UI 🤖

[![WeChat MiniProgram](https://img.shields.io/badge/Platform-WeChat_MiniProgram-07C160?logo=wechat)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/TencentCloudBase/cloudbase-agent-ui/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/TencentCloudBase/cloudbase-agent-ui?style=social)](https://github.com/TencentCloudBase/cloudbase-agent-ui)

cloudbase-agent-ui 是由腾讯云开发团队推出的 AI 智能对话 UI 组件，配置简单开箱即用，助力微信小程序开发者快速集成大模型能力，打造企业级LLM应用。现已支持接入
***DeepSeek 满血版（DeepSeek-R1-671B 与 DeepSeek-V3-671B）🔥🔥🔥, 腾讯混元大模型***。

Agent UI 演示效果图

<img src="https://github.com/TencentCloudBase/cloudbase-agent-ui/blob/luke--migrate-repo/docs/modelExample.gif" width="375px">   <img src="https://github.com/TencentCloudBase/cloudbase-agent-ui/blob/luke--migrate-repo/docs/botExample.gif" width="375px">

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

可通过以下两种方式获取组件代码

1. **克隆仓库到本地，提取其中components/agent-ui 目录**
2. **下载GitHub Release 包，直接使用**

### 3. 引入组件

1. **配置云开发环境ID**
   打开 miniprogram/app.js 文件，配置云开发环境ID。

```js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "",// 环境id
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
  <agent-ui agentConfig="{{agentConfig}}"></agent-ui>
</view>
```

5. **组件所属页面 .js 文件中编写配置**

```js
Page({
  // ...
  data: {
      agentConfig: {
        type: "bot", // 值为'bot'或'model'。当type='bot'时，botId必填；当type='model'时，modelName和model必填
        botId: "bot-db3cab4a", // agent id
        modelName: "deepseek", // 大模型服务商
        model: "deepseek-v3", // 具体的模型版本
        logo: "https://docs.cloudbase.net/img/logo.svg",// 图标(只在model模式下生效)
        welcomeMessage: "欢迎语!"// 欢迎语(只在model模式下生效)
      }
  }
  // ...
})
```

## 🏗 项目结构

```bash
📦 cloudbase-agent-ui
├── 📂 components       # 组件集合
│   └── agent-ui        # 你要使用的小程序 Agent UI 组件（拷贝这个！！！）
├── 📂 docs             # 文档
└── 📂 examples         # 示例项目
│   └── miniprogram-agent-ui     # 集成 agent-ui 组件的示例项目，可直接导入微信开发者工具体验
├── CHANGELOG.md           # 版本变更记录（语义化版本规范）
├── LICENSE                # 开源协议
├── package.json           # 版本管理
└── .github/               # GitHub自动化配置
    ├── workflows/
    │   └── release.yml    # 自动打包发布
    └── ISSUE_TEMPLATE/    # Issue模板

```

## ⚙️ 配置详解

### agentConfig 属性表

| 参数               | 类型       | 必填 | 生效模式       | 说明                                                                                                                                                                                                                                                                                                  |
| ------------------ | ---------- | ---- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `String` | 是   | 全局生效       | 对话模式：`bot` - 使用Agent `model` - 直连大模型                                                                                                                                                                                                                                                  |
| `botId`          | `String` | 条件 | `type=bot`   | 配置Agent的唯一标识符（需先在[腾讯云开发平台上创建Agent](https://docs.cloudbase.net/ai/agent/)）                                                                                                                                                                                                         |
| `modelName`      | `String` | 条件 | `type=model` | 大模型服务标识：`deepseek`/`hunyuan-open`                                                                                                                                                                                                                                                         |
| `model`          | `String` | 条件 | `type=model` | 模型版本标识：modelName 为 deepseek时，支持  deepseek-r1/deepseek-v3; modelName为 hunyuan-exp （混元体验版）/ hunyuan-open（混元正式版,使用需先[配置API Key](https://tcb.cloud.tencent.com/dev?envId=luke-agent-dev-7g1nc8tqc2ab76af#/ai?tab=ai-model&model=hunyuan-open)）时，model可配置为hunyuan-lite |
| `logo`           | `String` | 否   | `type=model` | 自定义LOGO URL                                                                                                                                                                                                                                                                                        |
| `welcomeMessage` | `String` | 否   | `type=model` |                                                                                                                                                                                                                                                                                                       |

#### 配置示例

- **对接 DeepSeek 大模型**

1. 前往 miniprogram/app.js 文件配置云开发环境 ID

```javascript
wx.cloud.init({
  env: "你的环境ID",
  traceUser: true,
});
```

2. 修改组件配置，在引用 agent-ui 组件的页面配置 (也可参考examples/miniprogram-agent-ui项目 chatBot 页面配置案例)

```javascript
Page({
  //...
  data: {
    agentConfig: {
      type: "model", 
      botId: "", 
      modelName: "deepseek", 
      model: "deepseek-r1", // 值为 “deepseek-r1” 或者 “deepseek-v3”
      logo: "",
      welcomeMessage: ""
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

2. 修改组件配置，在引用 agent-ui 组件的页面配置 (也可参考examples/miniprogram-agent-ui项目 chatBot 页面配置案例)

```javascript
Page({
  //...
  data: {
    agentConfig: {
      type: "model", 
      botId: "", 
      modelName: "hunyuan-exp", // 值可以 "hunyuan-exp" 或者 "hunyuan-open"
      model: "hunyuan-lite", // 值为 "hunyuan-lite"
      logo: "",
      welcomeMessage: ""
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

2. 修改组件配置，在引用 agent-ui 组件的页面配置 (也可参考examples/miniprogram-agent-ui项目 chatBot 页面配置案例)

```javascript
Page({
  //...
  data: {
    agentConfig: {
      type: "bot", 
      botId: "bot-xxxxxx", 
      modelName: "", 
      model: "", 
      logo: "",
      welcomeMessage: ""
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
- ✅ 图片理解（暂只支持Hunyuan vision模型）
- ✅ 联网搜索 （Agent模式）

### 🚧 进行中开发

- 多模型切换调用配置化
- 多Agent切换调用配置化
- 历史会话管理，多轮对话上下文记忆
- 附件批量上传解析（文件/图片/拍照）
- UI 样式及交互优化

### 📅 未来计划

- UI 配置化，提供主题色配置与插槽系统，完美融入品牌风格
- 支持用户语音输入转文字
- 支持文字转语音播放
- 支持语音音色配置
- AI生图
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
