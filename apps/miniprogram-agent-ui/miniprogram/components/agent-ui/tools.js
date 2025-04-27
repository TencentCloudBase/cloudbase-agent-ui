export const checkConfig = (chatMode, agentConfig, modelConfig) => {
  const { botId } = agentConfig || {};
  const { modelProvider, quickResponseModel, deepReasoningModel } = modelConfig || {};
  // 检测不在微信环境，提示用户
  const appBaseInfo = wx.getAppBaseInfo();
  try {
    const systemInfo = wx.getSystemInfoSync();
    // console.log('systemInfo', systemInfo)
    if (systemInfo.environment === "wxwork") {
      return [false, "请前往微信客户端扫码打开小程序"];
    }
  } catch (e) {
    // console.log('getSystemInfoSync 接口废弃')
    // 使用 getAppBaseInfo 兜底
    // console.log('appBaseInfo', appBaseInfo)
    if (appBaseInfo.host.env === "SDK") {
      return [false, "请前往微信客户端扫码打开小程序"];
    }
  }

  // 检测AI能力，不存在提示用户
  if (compareVersions(appBaseInfo.SDKVersion, "3.7.7") < 0) {
    return [false, "使用AI能力需基础库为3.7.7及以上，请升级基础库版本或微信客户端"];
  }
  if (!["bot", "model"].includes(chatMode)) {
    return [false, "chatMode 不正确，值应为“bot”或“model”"];
  }
  if (chatMode === "bot" && !botId) {
    return [false, "当前chatMode值为bot，请配置botId"];
  }
  if (chatMode === "model" && (!modelProvider || !quickResponseModel)) {
    return [false, "当前chatMode值为model，请配置modelProvider和quickResponseModel"];
  }
  return [true, ""];
};
// 随机选取三个问题
export function randomSelectInitquestion(question = [], num = 3) {
  if (question.length <= num) {
    return [...question];
  }
  const set = new Set();
  while (set.size < num) {
    const randomIndex = Math.floor(Math.random() * question.length);
    set.add(question[randomIndex]);
  }
  return Array.from(set);
}

export const getCloudInstance = (function () {
  let cloudInstance = null;
  return async function (envShareConfig) {
    if (cloudInstance) {
      return cloudInstance;
    }
    // 如果开启了环境共享，走环境共享的ai实例
    if (envShareConfig && envShareConfig.resourceAppid && envShareConfig.resourceEnv) {
      let instance = new wx.cloud.Cloud({
        // 资源方 AppID
        resourceAppid: envShareConfig.resourceAppid,
        // 资源方环境 ID
        resourceEnv: envShareConfig.resourceEnv,
      });
      await instance.init();
      // 烦，环境共享时创建实例，没有把环境id挂在instance上，这里手动挂上去，如果你发现instance上有个env，那么这个insatnce就是环境共享的云开发实例
      instance.env = envShareConfig.resourceEnv;
      cloudInstance = instance;
      return cloudInstance;
    } else {
      cloudInstance = wx.cloud;
      return cloudInstance;
    }
  };
})();

export const compareVersions = (version1, version2) => {
  const v1Parts = version1.split(".").map(Number);
  const v2Parts = version2.split(".").map(Number);
  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = v1Parts[i] || 0;
    const num2 = v2Parts[i] || 0;

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
};

let isDomainWarn = false;

export const commonRequest = async (options) => {
  const cloudInstance = await getCloudInstance();
  const self = this;
  // 判断 当前sdk 版本是否 小于 3.8.1
  const appBaseInfo = wx.getAppBaseInfo();
  console.log("当前版本", appBaseInfo.SDKVersion);
  const { path } = options;
  if (compareVersions(appBaseInfo.SDKVersion, "3.8.1") < 0) {
    console.log("走wx request");
    const cloudInstance = await getCloudInstance();
    const { token } = await cloudInstance.extend.AI.bot.tokenManager.getToken();
    const envId = cloudInstance.env || cloudInstance.extend.AI.bot.context.env;
    console.log("envId", envId);
    return wx.request({
      ...options,
      path: undefined,
      url: `https://${envId}.api.tcloudbasegateway.com/v1/aibot/${path}`,
      header: {
        ...options.header,
        Authorization: `Bearer ${token}`,
      },
      fail: (e) => {
        if (options.fail) {
          options.fail.bind(self)(e);
          if (e.errno === 600002 || e.errMsg.includes("url not in domain list")) {
            // const { url } = options;
            let msg = `请前往微信公众平台 request 合法域名配置中添加云开发域名 https://${envId}.api.tcloudbasegateway.com`;
            // if (url) {
            //   const regex = /^(https?:\/\/[^/?#]+)/i;
            //   const matches = url.match(regex);
            //   console.log("matches", matches);
            //   if (matches[1]) {
            //     msg = `请前往微信公众平台 request 合法域名配置中添加云开发域名 ${matches[1]}`;
            //   }
            // }
            if (!isDomainWarn) {
              isDomainWarn = true;
              wx.showModal({
                title: "提示",
                content: msg,
                complete: () => {
                  isDomainWarn = false;
                },
              });
            }
          }
        }
      },
    });
  } else {
    console.log("走内部request");
    const ai = cloudInstance.extend.AI;
    return ai.request(options);
  }
};

export const sleep = (timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};
