// pages/chatBot/chatBot.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    chatMode: "bot", // bot 表示使用agent，model 表示使用大模型
    showBotAvatar: true, // 是否在对话框左侧显示头像
    // envShareConfig: {
    //   // 不使用环境共享，请删除此配置或配置EnvShareConfig:null
    //   // 资源方 AppID
    //   resourceAppid: "wx7ac1bfecc7bf5f4f",
    //   // 资源方环境 ID
    //   resourceEnv: "chriscc-demo-7ghlpjf846d46d2d",
    // },
    agentConfig: {
      botId: "bot-c5167aab", // agent id,
      allowWebSearch: true, // 允许客户端选择启用联网搜索
      allowUploadFile: true, // 允许上传文件
      allowPullRefresh: true, // 允许下拉刷新
      allowUploadImage: true, // 允许上传图片
      showToolCallDetail: true, // 展示 toolCall 细节
      allowMultiConversation: true,
      allowVoice: true,
      showBotName: true
    },
    modelConfig: {
      modelProvider: "deepseek", // 大模型服务厂商
      quickResponseModel: "deepseek-v3", // 快速响应模型 （混元 turbo, gpt4 turbo版，deepseek v3等）
      logo: "", // model 头像
      welcomeMsg: "欢迎语", // model 欢迎语
    },
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
});
