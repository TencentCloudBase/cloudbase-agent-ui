// components/agent-ui/index.js
import { checkConfig, randomSelectInitquestion, getCloudInstance, commonRequest, sleep } from "./tools";
import md5 from "./md5.js";
Component({
  properties: {
    chatMode: {
      type: String,
      value: "",
    },
    envShareConfig: {
      type: Object,
      value: {},
    },
    showBotAvatar: {
      type: Boolean,
      value: false,
    },
    presentationMode: {
      type: String,
      value: "",
    },
    agentConfig: {
      type: Object,
      value: {
        botId: String,
        allowUploadFile: Boolean,
        allowWebSearch: Boolean,
        allowPullRefresh: Boolean,
        allowUploadImage: Boolean,
        allowMultiConversation: Boolean,
        allowVoice: Boolean,
        showToolCallDetail: Boolean,
        showBotName: Boolean,
      },
    },
    modelConfig: {
      type: Object,
      value: {
        modelProvider: String,
        quickResponseModel: String,
        // deepReasoningModel: String, // 待支持
        logo: String,
        welcomeMsg: String,
      },
    },
  },

  observers: {
    showWebSearchSwitch: function (showWebSearchSwitch) {
      this.setData({
        showFeatureList: showWebSearchSwitch,
      });
    },
  },

  data: {
    showMenu: false,
    tapMenuRecordId: "",
    isLoading: true, // 判断是否尚在加载中
    article: {},
    windowInfo: wx.getWindowInfo(),
    bot: {},
    inputValue: "",
    output: "",
    chatRecords: [],
    setPanelVisibility: false,
    questions: [],
    scrollTop: 0, // 文字撑起来后能滚动的最大高度
    viewTop: 0, // 根据实际情况，可能用户手动滚动，需要记录当前滚动的位置
    scrollTo: "", // 快速定位到指定元素，置底用
    scrollTimer: null, //
    manualScroll: false, // 当前为手动滚动/自动滚动
    showTools: false, // 展示底部工具栏
    showFileList: false, // 展示输入框顶部文件行
    showTopBar: false, // 展示顶部bar
    sendFileList: [],
    lastScrollTop: 0,
    showUploadFile: true,
    showUploadImg: true,
    showWebSearchSwitch: false,
    showPullRefresh: true,
    showToolCallDetail: true,
    showMultiConversation: true,
    showBotName: true,
    showVoice: true,
    useWebSearch: false,
    showFeatureList: false,
    chatStatus: 0, // 页面状态： 0-正常状态，可输入，可发送， 1-发送中 2-思考中 3-输出content中
    triggered: false,
    page: 1,
    size: 10,
    total: 0,
    refreshText: "下拉加载历史记录",
    shouldAddScrollTop: false,
    isShowFeedback: false,
    feedbackRecordId: "",
    feedbackType: "",
    textareaHeight: 50,
    defaultErrorMsg: "网络繁忙，请稍后重试!",
    curScrollHeight: 0,
    isDrawerShow: false,
    conversations: [],
    transformConversations: {},
    conversationPageOptions: {
      page: 1,
      size: 15,
      total: 0,
    },
    conversation: null,
    defaultConversation: null, // 旧结构默认会话
    fetchConversationLoading: false,
    audioContext: {}, // 只存储当前正在使用的音频context playStatus 状态 0 默认待播放 1 解析中 2 播放中
    audioSrcMap: {}, // 下载过的音频 src 缓存
    useVoice: false,
    startY: 0, // 触摸起点Y坐标
    longPressTriggered: false, // 长按是否触发
    sendStatus: 0, // 0 默认态 （还未触发长按） 1 待发送态 （触发长按，待发送） 2 待取消态 （触发长按，但超出阈值）3 发送 4 取消
    moveThreshold: 50, // 滑动阈值（单位：px）
    longPressTimer: null, // 长按定时器
    recorderManager: null,
    recordOptions: {
      duration: 60000, // 最长60s
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: "aac",
      frameSize: 50,
    },
    voiceRecognizing: false,
    speedList: [2, 1.5, 1.25, 1, 0.75],
  },
  attached: async function () {
    const chatMode = this.data.chatMode;
    // 检查配置
    const [check, message] = checkConfig(chatMode, this.data.agentConfig, this.data.modelConfig);
    if (!check) {
      wx.showModal({
        title: "提示",
        content: message,
      });
      return;
    }
    // 初始化一次cloudInstance，它是单例的，后面不传参数也可以获取到
    const cloudInstance = await getCloudInstance(this.data.envShareConfig);
    if (chatMode === "bot") {
      const { botId } = this.data.agentConfig;
      const ai = cloudInstance.extend.AI;
      const bot = await ai.bot.get({ botId });
      // 新增错误提示
      if (bot.code) {
        wx.showModal({
          title: "提示",
          content: bot.message,
        });
        return;
      }

      // 初始化第一条记录为welcomeMessage
      const record = {
        content: bot.welcomeMessage || "你好，有什么我可以帮到你？",
        record_id: "record_id" + String(+new Date() + 10),
        role: "assistant",
        hiddenBtnGround: true,
      };
      const { chatRecords } = this.data;
      // 随机选取三个初始化问题
      const questions = randomSelectInitquestion(bot.initQuestions, 3);
      let {
        allowWebSearch,
        allowUploadFile,
        allowPullRefresh,
        allowUploadImage,
        showToolCallDetail,
        allowMultiConversation,
        allowVoice,
        showBotName,
      } = this.data.agentConfig;
      allowWebSearch = allowWebSearch === undefined ? true : allowWebSearch;
      allowUploadFile = allowUploadFile === undefined ? true : allowUploadFile;
      allowPullRefresh = allowPullRefresh === undefined ? true : allowPullRefresh;
      allowUploadImage = allowUploadImage === undefined ? true : allowUploadImage;
      showToolCallDetail = showToolCallDetail === undefined ? true : showToolCallDetail;
      allowMultiConversation = allowMultiConversation === undefined ? true : allowMultiConversation;
      allowVoice = allowVoice === undefined ? true : allowVoice;
      showBotName = showBotName === undefined ? true : showBotName;
      this.setData({
        bot,
        questions,
        chatRecords: chatRecords.length > 0 ? chatRecords : [record],
        showWebSearchSwitch: allowWebSearch,
        showUploadFile: allowUploadFile,
        showUploadImg: allowUploadImage,
        showPullRefresh: allowPullRefresh,
        showToolCallDetail: showToolCallDetail,
        showMultiConversation: allowMultiConversation,
        showVoice: allowVoice,
        showBotName: showBotName,
      });
      console.log("bot", this.data.bot);
      if (chatMode === "bot" && this.data.bot.multiConversationEnable) {
        // 拉一次默认旧会话
        await this.fetchDefaultConversationList();
        // 拉一遍新会话列表
        await this.resetFetchConversationList();
      }
      // this.setData({
      //   bot: {
      //     ...this.data.bot,
      //     voiceSettings: {
      //       enable: true,
      //     },
      //   },
      // });
      if (chatMode === "bot" && this.data.bot.voiceSettings?.enable) {
        // 初始化录音管理器
        await this.initRecordManager();
        // 提前获取语音权限
        wx.getSetting({
          success(res) {
            console.log("auth settings", res);
            if (!res.authSetting["scope.record"]) {
              wx.authorize({
                scope: "scope.record",
                success() {},
                fail() {
                  // 用户拒绝授权，可以引导用户到设置页面手动开启权限
                  wx.openSetting({
                    success(res) {
                      if (res.authSetting["scope.record"]) {
                        // 用户手动开启权限，可以进行录音操作
                      }
                    },
                  });
                },
              });
            }
          },
        });
      }
    }
  },
  detached: function () {
    // 在组件实例被从页面节点树移除时执行，释放当前的音频资源
    const context = this.data.audioContext.context;
    if (context) {
      context.stop();
      context.destroy();
    }
  },
  methods: {
    initRecordManager: async function () {
      const cloudInstance = await getCloudInstance();
      const recorderManager = wx.getRecorderManager();
      recorderManager.onStart(() => {
        console.log("recorder start");
      });
      recorderManager.onPause(() => {
        console.log("recorder pause");
      });
      recorderManager.onStop((res) => {
        console.log("停止录音");
        console.log("this.data.sendStatus", this.data.sendStatus);
        if (this.data.sendStatus === 3) {
          console.log("确认发送");
          console.log("recorder stop", res);
          const { tempFilePath } = res;
          console.log("tempFilePath", tempFilePath);
          // const tempFileInfo = tempFilePath.split(".")
          const fileName = md5(tempFilePath) + ".aac";
          console.log("fileName", fileName);
          if (fileName) {
            new Promise((resolve, reject) => {
              // 上传至云存储换取 cloudId
              cloudInstance.uploadFile({
                cloudPath: `agent_file/${this.data.bot.botId}/${fileName}`, // 云上文件路径
                filePath: tempFilePath,
                success: async (res) => {
                  console.log("uploadFile res", res);
                  const fileId = res.fileID;
                  cloudInstance.getTempFileURL({
                    fileList: [fileId], // 文件唯一标识符 cloudID, 可通过上传文件接口获取
                    success: (res) => {
                      console.log("getTempFileURL", res);
                      const { fileList } = res;
                      if (fileList && fileList.length) {
                        // 调用语音转文本接口获取文本
                        console.log("开始转文字");
                        commonRequest({
                          path: `bots/${this.data.bot.botId}/speech-to-text`,
                          data: {
                            url: fileList[0].tempFileURL,
                            engSerViceType: this.data.bot.voiceSettings?.inputType,
                            voiceFormat: "aac",
                          }, //
                          method: "POST",
                          timeout: 60000,
                          success: (res) => {
                            console.log("speech-to-text res", res);
                            const { data } = res;
                            if (data && data.Result) {
                              this.sendMessage(data.Result);
                              resolve(data.Result);
                            } else {
                              resolve();
                            }
                          },
                          fail: (e) => {
                            console.log("e", e);
                            reject(e);
                          },
                          complete: () => {},
                          header: {},
                        });
                      }
                    },
                    fail: (e) => {
                      reject(e);
                    },
                  });
                },
                fail: (err) => {
                  console.error("上传失败：", err);
                  reject(err);
                },
              });
            }).finally(() => {
              this.setData({
                sendStatus: 0,
                voiceRecognizing: false,
                longPressTriggered: false,
              });
            });
          }
        } else {
          this.setData({
            sendStatus: 0,
            longPressTriggered: false,
          });
        }
        // console.log('this.data.sendStatus', this.data.sendStatus)
      });
      recorderManager.onError((err) => {
        console.log("recorder err", err);
        this.setData({
          sendStatus: 0,
        });
      });
      this.setData({
        recorderManager: recorderManager,
      });
    },
    handleChangeInputType(e) {
      // 检查当前语音能力权限
      if (!this.data.bot.voiceSettings?.enable) {
        wx.showModal({
          title: "提示",
          content: "请前往腾讯云开发平台启用语音输入输出能力",
        });
        return;
      }
      this.setData({
        useVoice: !this.data.useVoice,
      });
    },
    handleCopyAll(e) {
      const { content } = e.currentTarget.dataset;
      wx.setClipboardData({
        data: content,
        success: () => {
          wx.showToast({
            title: "复制成功",
            icon: "success",
          });
          this.hideMenu();
        },
      });
    },
    handleEdit(e) {
      const { content } = e.currentTarget.dataset;
      this.setData({
        inputValue: content,
      });
      this.hideMenu();
    },
    handleLongPress(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({
        showMenu: true,
        tapMenuRecordId: id,
      });
    },
    hideMenu() {
      this.setData({
        showMenu: false,
        tapMenuRecordId: "",
      });
    },
    // 点击页面其他地方隐藏菜单
    onTapPage() {
      if (this.data.showMenu) {
        this.hideMenu();
      }
    },
    transformToolName: function (str) {
      if (str) {
        const strArr = str.split(/\/+/);
        return strArr[strArr.length - 1];
      }
      return "";
    },
    handleClickConversation: async function (e) {
      // 清除旧的会话聊天记录
      this.clearChatRecords();
      const { conversation } = e.currentTarget.dataset;
      this.setData({
        isDrawerShow: false,
        conversation: {
          conversationId: conversation.conversationId,
          title: conversation.title,
        },
        page: 1, // 重置历史记录分页参数
        size: 10,
      });
      this.handleRefresh();
      // // 拉取当前会话聊天记录
      // const res = await wx.cloud.extend.AI.bot.getChatRecords({
      //   botId: this.data.agentConfig.botId,
      //   pageNumber: this.data.page,
      //   pageSize: this.data.size,
      //   sort: "desc",
      //   conversationId: this.data.conversation?.conversationId || undefined,
      // });
      // if (res.recordList) {
      // }
    },
    fetchDefaultConversationList: async function () {
      try {
        if (this.data.bot.botId) {
          const res = await this.fetchConversationList(true, this.data.bot.botId);
          if (res) {
            const { data } = res;
            if (data && !data.code) {
              // 区分旧的默认会话结构与新的默认会话结构
              if (data.data) {
                if (data.data.length) {
                  this.setData({
                    defaultConversation: data.data[0],
                    conversations: data.data,
                    transformConversations: this.transformConversationList(data.data),
                  });
                }
              } else {
                this.setData({
                  defaultConversation: data,
                  conversations: [data],
                  transformConversations: this.transformConversationList([data]),
                  // conversationPageOptions: {
                  //   ...this.data.conversationPageOptions,
                  //   total: data.total,
                  // },
                });
              }
            }
          }
        }
      } catch (e) {
        console.log("fetchDefaultConversationList e", e);
      }
    },
    fetchConversationList: async function (isDefault, botId) {
      // const { token } = await cloudInstance.extend.AI.bot.tokenManager.getToken();
      if (this.data.fetchConversationLoading) {
        return;
      }

      return new Promise((resolve, reject) => {
        const { page, size } = this.data.conversationPageOptions;
        const limit = size;
        const offset = (page - 1) * size;
        this.setData({
          fetchConversationLoading: true,
        });

        commonRequest({
          path: `conversation/?botId=${botId}&limit=${limit}&offset=${offset}&isDefault=${isDefault}`,
          method: "GET",
          header: {},
          success: (res) => {
            resolve(res);
          },
          fail(e) {
            console.log("conversation list e", e);
            reject(e);
          },
          complete: () => {
            this.setData({
              fetchConversationLoading: false,
            });
            // wx.hideLoading();
          },
        });
      });
    },
    createConversation: async function () {
      // const cloudInstance = await getCloudInstance();
      // const { token } = await cloudInstance.extend.AI.bot.tokenManager.getToken();
      return new Promise((resolve, reject) => {
        commonRequest({
          path: `conversation`,
          header: {
            // Authorization: `Bearer ${token}`,
          },
          data: {
            botId: this.data.agentConfig.botId,
          },
          method: "POST",
          success: (res) => {
            resolve(res);
          },
          fail(e) {
            console.log("create conversation e", e);
            reject(e);
          },
        });
      });
    },
    clickCreateInDrawer: function () {
      this.setData({
        isDrawerShow: false,
      });
      this.createNewConversation();
    },
    createNewConversation: async function () {
      if (!this.data.bot.multiConversationEnable) {
        wx.showModal({
          title: "提示",
          content: "请前往腾讯云开发平台启用 Agent 多会话模式",
        });
        return;
      }
      // // TODO: 创建新对话
      // const { data } = await this.createConversation();
      // console.log("createRes", data);
      this.clearChatRecords();
      // this.setData({
      //   conversation: {
      //     conversationId: data.conversationId,
      //     title: data.title,
      //   },
      // });
      this.setData({
        refreshText: "下拉加载历史记录",
      });
    },
    scrollConToBottom: async function (e) {
      console.log("scrollConToBottom", e);
      const { page, size } = this.data.conversationPageOptions;
      if (page * size >= this.data.conversationPageOptions.total) {
        return;
      }
      this.setData({
        conversationPageOptions: {
          ...this.data.conversationPageOptions,
          page: this.data.conversationPageOptions.page + 1,
        },
      });
      // 调用分页接口查询更多
      if (this.data.bot.botId) {
        const res = await this.fetchConversationList(false, this.data.bot.botId);
        if (res) {
          const { data } = res;
          if (data && !data.code) {
            const addConversations = [...this.data.conversations, ...data.data];
            // TODO: 临时倒序处理
            const sortConData = addConversations.sort(
              (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
            );
            this.setData({
              conversations: sortConData,
              transformConversations: this.transformConversationList(sortConData),
            });
          }
        }
      }
    },
    resetFetchConversationList: async function () {
      this.setData({
        conversationPageOptions: {
          page: 1,
          size: 15,
          total: 0,
        },
      });
      try {
        if (this.data.bot.botId) {
          const res = await this.fetchConversationList(false, this.data.bot.botId);
          if (res) {
            const { data } = res;
            if (data && !data.code) {
              // TODO: 临时倒序处理
              const sortData = data.data.sort(
                (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
              );
              const finalConData = this.data.defaultConversation
                ? sortData.concat(this.data.defaultConversation)
                : sortData;
              this.setData({
                conversations: finalConData,
                transformConversations: this.transformConversationList(finalConData),
                conversationPageOptions: {
                  ...this.data.conversationPageOptions,
                  total: data.total,
                },
              });
            }
          }
        }
      } catch (e) {
        console.log("fetchConversationList e", e);
      }
    },
    transformConversationList: function (conversations) {
      // 区分今天，本月，更早
      const todayCon = [];
      const curMonthCon = [];
      const earlyCon = [];
      const now = new Date();
      const todayDate = now.setHours(0, 0, 0, 0);
      const monthFirstDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      for (let item of conversations) {
        const itemDate = new Date(item.createTime).getTime();
        if (itemDate >= todayDate) {
          todayCon.push(item);
        } else if (itemDate >= monthFirstDate) {
          curMonthCon.push(item);
        } else {
          earlyCon.push(item);
        }
      }
      return {
        todayCon,
        curMonthCon,
        earlyCon,
      };
    },
    openDrawer: async function () {
      if (!this.data.bot.multiConversationEnable) {
        wx.showModal({
          title: "提示",
          content: "请前往腾讯云开发平台启用 Agent 多会话模式",
        });
        return;
      }
      this.setData({
        isDrawerShow: true,
        // conversationPageOptions: {
        //   ...this.data.conversationPageOptions,
        //   page: 1,
        //   size: 15,
        // },
      });

      // await this.fetchHistoryConversationData();
    },
    closeDrawer() {
      this.setData({
        isDrawerShow: false,
      });
    },
    showErrorMsg: function (e) {
      const { content, reqid } = e.currentTarget.dataset;
      // console.log("content", content);
      const transformContent =
        typeof content === "string"
          ? reqid
            ? `${content}|reqId:${reqid}`
            : content
          : JSON.stringify({ err: content, reqid });
      wx.showModal({
        title: "错误原因",
        content: transformContent,
        success() {
          wx.setClipboardData({
            data: transformContent,
            success: function (res) {
              wx.showToast({
                title: "复制错误完成",
                icon: "success",
              });
            },
          });
        },
      });
    },
    transformToolCallHistoryList: function (toolCallList) {
      const callParamsList = toolCallList.filter((item) => item.type === "tool-call");
      // const callResultList = toolCallList.filter(item => item.type === 'tool-result')
      const callContentList = toolCallList.filter((item) => item.type === "text");
      const transformToolCallList = [];
      for (let i = 0; i < callParamsList.length; i++) {
        const curParam = callParamsList[i];
        const curResult = toolCallList.find(
          (item) => item.type === "tool-result" && item.toolCallId === curParam.tool_call.id
        );
        const curContent = callContentList[i];
        const curError = toolCallList.find(
          (item) => item.finish_reason === "error" && item.error.message.toolCallId === curParam.tool_call.id
          // (item) => item.finish_reason === "error"
        );
        const transformToolCallObj = {
          id: curParam.tool_call.id,
          name: this.transformToolName(curParam.tool_call.function.name),
          rawParams: curParam.tool_call.function.arguments,
          callParams: "```json\n\n" + JSON.stringify(curParam.tool_call.function.arguments, null, 2) + "\n```",
          content: ((curContent && curContent.content) || "").replaceAll("\t", "").replaceAll("\n", "\n\n"),
        };
        if (curResult) {
          transformToolCallObj.rawResult = curResult.result;
          transformToolCallObj.callResult = "```json\n\n" + JSON.stringify(curResult.result, null, 2) + "\n```";
        }
        if (curError) {
          transformToolCallObj.error = curError;
        }

        transformToolCallList.push(transformToolCallObj);
      }
      return transformToolCallList;
    },
    handleLineChange: function (e) {
      // console.log("linechange", e.detail.lineCount);
      // 查foot-function height
      const self = this;
      const query = wx.createSelectorQuery().in(this);
      query
        .select(".foot_function")
        .boundingClientRect(function (res) {
          if (res) {
            self.setData({
              textareaHeight: res.height,
            });
          } else {
            // console.log("未找到指定元素");
          }
        })
        .exec();
    },
    openFeedback: function (e) {
      const { feedbackrecordid, feedbacktype } = e.currentTarget.dataset;
      let index = null;
      this.data.chatRecords.forEach((item, _index) => {
        if (item.record_id === feedbackrecordid) {
          index = _index;
        }
      });
      const inputRecord = this.data.chatRecords[index - 1];
      const answerRecord = this.data.chatRecords[index];
      // console.log(record)
      this.setData({
        isShowFeedback: true,
        feedbackRecordId: feedbackrecordid,
        feedbackType: feedbacktype,
        aiAnswer: answerRecord.content,
        input: inputRecord.content,
      });
    },
    closefeedback: function () {
      this.setData({ isShowFeedback: false, feedbackRecordId: "", feedbackType: "" });
    },
    // 滚动相关处理
    calculateContentHeight() {
      return new Promise((resolve) => {
        const query = wx.createSelectorQuery().in(this);
        query
          .selectAll(".main >>> .contentBox")
          .boundingClientRect((rects) => {
            let totalHeight = 0;
            rects.forEach((rect) => {
              totalHeight += rect.height;
            });
            resolve(totalHeight);
          })
          .exec();
      });
    },
    calculateContentInTop() {
      // console.log('执行top 部分计算')
      return new Promise((resolve) => {
        const query = wx.createSelectorQuery().in(this);
        query
          .selectAll(".main >>> .nav, .main >>> .tips")
          .boundingClientRect((rects) => {
            let totalHeight = 0;
            rects.forEach((rect) => {
              totalHeight += rect.height;
            });
            // console.log('top height', totalHeight);
            resolve(totalHeight);
          })
          .exec();
      });
    },
    onWheel: function (e) {
      // 解决小程序开发工具中滑动
      if (!this.data.manualScroll && e.detail.deltaY < 0) {
        this.setData({
          manualScroll: true,
        });
      }
    },
    onScroll: function (e) {
      if (e.detail.scrollTop < this.data.lastScrollTop) {
        // 鸿蒙系统上可能滚动事件，拖动事件失效，兜底处理
        this.setData({
          manualScroll: true,
        });
      }

      this.setData({
        lastScrollTop: e.detail.scrollTop,
      });

      // 针对连续滚动的最后一次进行处理，scroll-view的 scroll end事件不好判定
      if (this.data.scrollTimer) {
        clearTimeout(this.data.scrollTimer);
      }

      this.setData({
        scrollTimer: setTimeout(() => {
          const newTop = Math.max(this.data.scrollTop, e.detail.scrollTop);
          if (this.data.manualScroll) {
            this.setData({
              scrollTop: newTop,
            });
          } else {
            this.setData({
              scrollTop: newTop,
              viewTop: newTop,
            });
          }
        }, 100),
      });
    },
    handleScrollStart: function (e) {
      // console.log("drag start", e);
      if (e.detail.scrollTop > 0 && !this.data.manualScroll) {
        // 手动开始滚
        this.setData({
          manualScroll: true,
        });
      }
    },
    handleScrollToLower: function (e) {
      // console.log("scroll to lower", e);
      // 到底转自动
      this.setData({
        manualScroll: false,
      });
    },
    autoToBottom: function () {
      this.setData({
        manualScroll: false,
        scrollTo: "scroll-bottom",
      });
    },
    bindInputFocus: function (e) {
      this.setData({
        manualScroll: false,
      });
      this.autoToBottom();
    },
    bindKeyInput: function (e) {
      this.setData({
        inputValue: e.detail.value,
      });
    },
    handleRefresh: function (e) {
      if (this.data.triggered) {
        return;
      }
      console.log("开始刷新");
      this.setData(
        {
          triggered: true,
          refreshText: "刷新中",
        },
        async () => {
          // 模拟请求回数据后 停止加载
          // console.log('this.data.agentConfig.type', this.data.agentConfig.type)
          if (this.data.chatMode === "bot") {
            // 判断当前是否大于一条 （一条则为系统默认提示，直接从库里拉出最近的一页）
            if (this.data.chatRecords.length > 1) {
              const newPage = Math.floor(this.data.chatRecords.length / this.data.size) + 1;
              this.setData({
                page: newPage,
              });
            }
            const cloudInstance = await getCloudInstance(this.data.envShareConfig);
            const ai = cloudInstance.extend.AI;
            const getRecordsReq = {
              botId: this.data.agentConfig.botId,
              pageNumber: this.data.page,
              pageSize: this.data.size,
              sort: "desc",
            };
            if (this.data.conversation?.conversationId) {
              getRecordsReq.conversationId = this.data.conversation?.conversationId;
            }
            const res = await ai.bot.getChatRecords(getRecordsReq);
            if (res.recordList) {
              this.setData({
                total: res.total,
              });

              if (this.data.total === this.data.chatRecords.length - 1) {
                this.setData({
                  triggered: false,
                  refreshText: "到底啦",
                });
                return;
              }

              // 找出新获取的一页中，不在内存中的数据
              const freshNum = this.data.size - ((this.data.chatRecords.length - 1) % this.data.size);
              const freshChatRecords = res.recordList
                .reverse()
                .slice(0, freshNum)
                .map((item) => {
                  let transformItem = {
                    ...item,
                    record_id: item.recordId,
                  };
                  if (item.role === "user" && item.fileInfos) {
                    transformItem.fileList = item.fileInfos.map((item) => ({
                      status: "parsed",
                      rawFileName: item.fileName,
                      rawType: item.type,
                      fileId: item.cloudId,
                      fileSize: item.bytes,
                    }));
                  }
                  if (item.role === "assistant") {
                    if (item.content === "") {
                      transformItem.content = this.data.defaultErrorMsg;
                      transformItem.error = {};
                      transformItem.reqId = item.trace_id || "";
                    }

                    if (item.origin_msg) {
                      // console.log("toolcall origin_msg", JSON.parse(item.origin_msg));
                      const origin_msg_obj = JSON.parse(item.origin_msg);
                      if (origin_msg_obj.aiResHistory) {
                        const transformToolCallList = this.transformToolCallHistoryList(origin_msg_obj.aiResHistory);
                        transformItem.toolCallList = transformToolCallList;
                        const toolCallErr = transformToolCallList.find((item) => item.error)?.error;
                        // console.log("toolCallErr", toolCallErr);
                        if (toolCallErr?.error?.message) {
                          transformItem.error = toolCallErr.error.message;
                          transformItem.reqId = item.trace_id || "";
                        }
                      } else {
                        // 之前异常的返回
                        // return null
                      }
                    }
                  }
                  return transformItem;
                })
                .filter((item) => item);
              // 只有一条则一定是系统开头语，需要置前，否则则为真实对话，靠后
              this.setData({
                chatRecords:
                  this.data.chatRecords.length === 1
                    ? [...this.data.chatRecords, ...freshChatRecords]
                    : [...freshChatRecords, ...this.data.chatRecords],
              });
              // console.log("totalChatRecords", this.data.chatRecords);
            }
            this.setData({
              triggered: false,
              refreshText: "下拉加载历史记录",
            });
          }
        }
      );
    },
    handleTapClear: function (e) {
      this.clearChatRecords();
    },
    clearChatRecords: function () {
      console.log("执行清理");
      const chatMode = this.data.chatMode;
      const { bot } = this.data;
      this.setData({ showTools: false });
      if (chatMode === "model") {
        this.setData({
          chatRecords: [],
          chatStatus: 0,
        });
        return;
      }
      // 只有一条不需要清
      // if (this.data.chatRecords.length === 1) {
      //   return;
      // }
      const record = {
        content: bot.welcomeMessage || "你好，有什么我可以帮到你？",
        record_id: "record_id" + String(+new Date() + 10),
        role: "assistant",
        hiddenBtnGround: true,
      };
      const questions = randomSelectInitquestion(bot.initQuestions, 3);
      this.setData({
        chatRecords: [record],
        chatStatus: 0,
        questions,
        page: 1, // 重置分页页码
        conversation: null,
      });
    },
    chooseMedia: function (sourceType) {
      const self = this;
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: [sourceType],
        maxDuration: 30,
        camera: "back",
        success(res) {
          // console.log("res", res);
          // console.log("tempFiles", res.tempFiles);
          const isImageSizeValid = res.tempFiles.every((item) => item.size <= 30 * 1024 * 1024);
          if (!isImageSizeValid) {
            wx.showToast({
              title: "图片大小30M限制",
              icon: "error",
            });
            return;
          }
          const tempFiles = res.tempFiles.map((item) => {
            const tempFileInfos = item.tempFilePath.split(".");
            const tempFileName = md5(tempFileInfos[0]) + "." + tempFileInfos[1];
            return {
              tempId: tempFileName,
              rawType: item.fileType, // 微信选择默认的文件类型 image/video/file
              tempFileName: tempFileName, // 文件名
              rawFileName: "", // 图片类不带源文件名
              tempPath: item.tempFilePath,
              fileSize: item.size,
              fileUrl: "",
              fileId: "",
              botId: self.data.agentConfig.botId,
              status: "",
            };
          });

          const finalFileList = [...tempFiles];
          // console.log("final", finalFileList);
          self.setData({
            sendFileList: finalFileList, //
          });
          if (finalFileList.length) {
            self.setData({
              showTools: false,
            });
            if (!self.data.showFileList) {
              self.setData({
                showFileList: true,
              });
            }
          }
        },
      });
    },
    handleUploadImg: function (sourceType) {
      if (!this.data.bot.searchFileEnable) {
        wx.showModal({
          title: "提示",
          content: "请前往腾讯云开发平台启用 Agent 文件上传功能",
        });
        return;
      }
      if (this.data.useWebSearch) {
        wx.showModal({
          title: "提示",
          content: "联网搜索不支持上传文件/图片",
        });
        return;
      }
      const self = this;
      const isCurSendFile = this.data.sendFileList.find((item) => item.rawType === "file");
      if (isCurSendFile) {
        wx.showModal({
          title: "确认替换吗",
          content: "上传图片将替换当前文件内容",
          showCancel: "true",
          cancelText: "取消",
          confirmText: "确认",
          success(res) {
            // console.log("res", res);
            self.chooseMedia(sourceType);
          },
          fail(error) {
            // console.log("choose file e", error);
          },
        });
      } else {
        self.chooseMedia(sourceType);
      }
    },
    chooseMessageFile: function () {
      // console.log("触发choose");
      const self = this;
      const oldFileLen = this.data.sendFileList.filter((item) => item.rawType === "file").length;
      // console.log("oldFileLen", oldFileLen);
      const subFileCount = oldFileLen <= 5 ? 5 - oldFileLen : 0;
      if (subFileCount === 0) {
        wx.showToast({
          title: "文件数量限制5个",
          icon: "error",
        });
        return;
      }
      wx.chooseMessageFile({
        count: subFileCount,
        type: "file",
        success(res) {
          // tempFilePath可以作为img标签的src属性显示图片
          // const tempFilePaths = res.tempFiles;
          // console.log("res", res);
          // 检验文件后缀
          const isFileExtValid = res.tempFiles.every((item) => self.checkFileExt(item.name.split(".")[1]));
          if (!isFileExtValid) {
            wx.showModal({
              content: "当前支持文件类型为 pdf、txt、doc、docx、ppt、pptx、xls、xlsx、csv",
              showCancel: false,
              confirmText: "确定",
            });
            return;
          }
          // 校验各文件大小是否小于10M
          const isFileSizeValid = res.tempFiles.every((item) => item.size <= 10 * 1024 * 1024);
          if (!isFileSizeValid) {
            wx.showToast({
              title: "单文件10M限制",
              icon: "error",
            });
            return;
          }
          const tempFiles = res.tempFiles.map((item) => {
            const tempFileInfos = item.path.split(".");
            const tempFileName = md5(tempFileInfos[0]) + "." + tempFileInfos[1];
            return {
              tempId: tempFileName,
              rawType: item.type, // 微信选择默认的文件类型 image/video/file
              tempFileName: tempFileName, // 文件名
              rawFileName: item.name,
              tempPath: item.path,
              fileSize: item.size,
              fileUrl: "",
              fileId: "",
              botId: self.data.agentConfig.botId,
              status: "",
            };
          });
          // 过滤掉已选择中的 image 文件（保留file)
          const filterFileList = self.data.sendFileList.filter((item) => item.rawType !== "image");
          const finalFileList = [...filterFileList, ...tempFiles];
          console.log("final", finalFileList);

          self.setData({
            sendFileList: finalFileList, //
          });

          if (finalFileList.length) {
            self.setData({
              showTools: false,
            });
            if (!self.data.showFileList) {
              self.setData({
                showFileList: true,
              });
            }
          }
        },
        fail(e) {
          console.log("choose e", e);
        },
      });
    },
    handleUploadMessageFile: function () {
      // 判断agent 配置是否打开上传文件
      if (!this.data.bot.searchFileEnable) {
        wx.showModal({
          title: "提示",
          content: "请前往腾讯云开发平台启用 Agent 文件上传功能",
        });
        return;
      }
      if (this.data.useWebSearch) {
        wx.showModal({
          title: "提示",
          content: "联网搜索不支持上传文件/图片",
        });
        return;
      }

      const self = this;
      const isCurSendImage = this.data.sendFileList.find((item) => item.rawType === "image");
      if (isCurSendImage) {
        wx.showModal({
          title: "确认替换吗",
          content: "上传文件将替换当前图片内容",
          showCancel: "true",
          cancelText: "取消",
          confirmText: "确认",
          success(res) {
            console.log("res", res);
            self.chooseMessageFile();
          },
          fail(error) {
            console.log("choose file e", error);
          },
        });
      } else {
        self.chooseMessageFile();
      }
    },
    handleAlbum: function () {
      this.handleUploadImg("album");
    },
    handleCamera: function () {
      this.handleUploadImg("camera");
    },
    checkFileExt: function (ext) {
      return ["pdf", "txt", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv"].includes(ext);
    },
    stop: function () {
      this.autoToBottom();
      const { chatRecords, chatStatus } = this.data;
      const newChatRecords = [...chatRecords];
      const record = newChatRecords[newChatRecords.length - 1];
      if (chatStatus === 1) {
        record.content = "已暂停生成";
      }
      // 暂停思考
      if (chatStatus === 2) {
        record.pauseThinking = true;
      }
      this.setData({
        chatRecords: newChatRecords,
        manualScroll: false,
        chatStatus: 0, // 暂停之后切回正常状态
      });
    },
    openSetPanel: function () {
      this.setData({ setPanelVisibility: true });
    },
    closeSetPanel: function () {
      this.setData({ setPanelVisibility: false });
    },
    handleSendMessage: async function (event) {
      // 发送消息前校验所有文件上传状态
      if (this.data.sendFileList.some((item) => !item.fileId || item.status !== "parsed")) {
        wx.showToast({
          title: "文件上传解析中",
          icon: "error",
        });
        return;
      }
      await this.sendMessage(event.currentTarget.dataset.message);
    },
    sendMessage: async function (message) {
      if (this.data.showFileList) {
        this.setData({
          showFileList: !this.data.showFileList,
        });
      }
      if (this.data.showTools) {
        this.setData({
          showTools: !this.data.showTools,
        });
      }
      // const { message } = event.currentTarget.dataset;
      let { inputValue, bot, agentConfig, chatRecords, chatStatus, modelConfig } = this.data;
      // 如果正在进行对话，不让发送消息
      if (chatStatus !== 0) {
        return;
      }
      // 将传进来的消息给到inputValue
      if (message) {
        inputValue = message;
      }
      // 空消息返回
      if (!inputValue) {
        return;
      }

      const chatMode = this.data.chatMode;
      // console.log(inputValue,bot.botId)
      const userRecord = {
        content: inputValue,
        record_id: "record_id" + String(+new Date() - 10),
        role: "user",
        fileList: this.data.sendFileList,
      };
      if (this.data.sendFileList.length) {
        this.setData({
          sendFileList: [],
        });
      }
      const record = {
        content: "",
        record_id: "record_id" + String(+new Date() + 10),
        role: "assistant",
        hiddenBtnGround: true,
      };
      this.setData({
        inputValue: "",
        questions: [],
        chatRecords: [...chatRecords, userRecord, record],
        chatStatus: 1, // 聊天状态切换为1发送中
      });

      // 新增一轮对话记录时 自动往下滚底
      this.autoToBottom();
      if (chatMode === "bot") {
        const cloudInstance = await getCloudInstance(this.data.envShareConfig);
        const ai = cloudInstance.extend.AI;
        // const ai = wx.cloud.extend.AI;
        // 区分当前是旧的单会话模式 or 新的多会话模式
        let res;
        if (!this.data.bot.multiConversationEnable) {
          // 单会话
          res = await ai.bot.sendMessage({
            data: {
              botId: bot.botId,
              msg: inputValue,
              files: this.data.showUploadFile ? userRecord.fileList.map((item) => item.fileId) : undefined,
              searchEnable: this.data.useWebSearch,
            },
          });
        } else {
          // 多会话
          if (!this.data.conversation && this.data.bot.multiConversationEnable) {
            // 发消息前构造新会话
            try {
              const { data } = await this.createConversation();
              this.setData({
                conversation: {
                  conversationId: data.conversationId,
                  title: data.title,
                },
              });
            } catch (e) {
              console.log("createConversation e", e);
            }
          }

          const sendReq = {
            botId: bot.botId,
            msg: inputValue,
            files: this.data.showUploadFile ? userRecord.fileList.map((item) => item.fileId) : undefined,
            searchEnable: this.data.useWebSearch,
          };

          if (this.data.conversation?.conversationId) {
            sendReq.conversationId = this.data.conversation.conversationId;
          }

          res = await ai.bot.sendMessage({
            data: sendReq,
          });
          // 当前已产生新会话，重刷一遍
          await this.resetFetchConversationList();
        }
        let contentText = "";
        let reasoningContentText = "";
        let isManuallyPaused = false; //这个标记是为了处理手动暂停时，不要请求推荐问题，不显示下面的按钮
        let startTime = null; //记录开始思考时间
        let endTime = null; // 记录结束思考时间
        let index = 0;
        for await (let event of res.eventStream) {
          // console.log("event", event);
          const { chatStatus } = this.data;
          if (chatStatus === 0) {
            isManuallyPaused = true;
            break;
          }
          if (index % 10 === 0) {
            // 更新频率降为1/10
            this.toBottom(40);
          }
          const { data } = event;
          if (data === "[DONE]") {
            break;
          }
          try {
            const dataJson = JSON.parse(data);
            const {
              type,
              content,
              reasoning_content,
              record_id,
              search_info,
              role,
              knowledge_meta,
              knowledge_base,
              finish_reason,
              search_results,
              error,
              usage,
            } = dataJson;
            const newValue = [...this.data.chatRecords];
            // 取最后一条消息更新
            const lastValueIndex = newValue.length - 1;
            const lastValue = newValue[lastValueIndex];
            lastValue.role = role || "assistant";
            lastValue.record_id = record_id;
            // 优先处理错误,直接中断
            if (finish_reason === "error" || finish_reason === "content_filter" || error) {
              lastValue.search_info = null;
              lastValue.reasoning_content = "";
              lastValue.knowledge_meta = [];
              lastValue.content = this.data.defaultErrorMsg;
              if (error && error.message) {
                lastValue.error = error.message;
                this.setData({
                  [`chatRecords[${lastValueIndex}].error`]: lastValue.error,
                });
                if (lastValue.toolCallList && lastValue.toolCallList.length) {
                  let errToolCallObj = null;
                  if (typeof error.message === "string") {
                    errToolCallObj = lastValue.toolCallList[lastValue.toolCallList.length - 1];
                  } else {
                    if (error.message?.toolCallId) {
                      errToolCallObj = lastValue.toolCallList.find((item) => item.id === error.message.toolCallId);
                    }
                  }
                  if (errToolCallObj && !errToolCallObj.callResult) {
                    errToolCallObj.error = error;
                    this.setData({
                      [`chatRecords[${lastValueIndex}].toolCallList`]: lastValue.toolCallList,
                    });
                    this.autoToBottom();
                  }
                }
              }
              this.setData({
                [`chatRecords[${lastValueIndex}].search_info`]: lastValue.search_info,
                [`chatRecords[${lastValueIndex}].reasoning_content`]: lastValue.reasoning_content,
                [`chatRecords[${lastValueIndex}].knowledge_meta`]: lastValue.knowledge_meta,
                [`chatRecords[${lastValueIndex}].content`]: lastValue.content,
                [`chatRecords[${lastValueIndex}].record_id`]: lastValue.record_id,
              });
              // if (error) {
              //   lastValue.error = error;
              //   this.setData({
              //     [`chatRecords[${lastValueIndex}].error`]: lastValue.error,
              //   });
              // }
              break;
            }
            // 下面根据type来确定输出的内容
            // 只更新一次参考文献，后续再收到这样的消息丢弃
            if (type === "search" && !lastValue.search_info) {
              lastValue.search_info = search_info;
              this.setData({
                chatStatus: 2,
                [`chatRecords[${lastValueIndex}].search_info`]: lastValue.search_info,
                [`chatRecords[${lastValueIndex}].record_id`]: lastValue.record_id,
              }); // 聊天状态切换为思考中,展示联网的信息
            }
            // 思考过程
            if (type === "thinking") {
              if (!startTime) {
                startTime = +new Date();
                endTime = +new Date();
              } else {
                endTime = +new Date();
              }
              reasoningContentText += reasoning_content;
              lastValue.reasoning_content = reasoningContentText;
              lastValue.thinkingTime = Math.floor((endTime - startTime) / 1000);
              this.setData({
                [`chatRecords[${lastValueIndex}].reasoning_content`]: lastValue.reasoning_content,
                [`chatRecords[${lastValueIndex}].thinkingTime`]: lastValue.thinkingTime,
                [`chatRecords[${lastValueIndex}].record_id`]: lastValue.record_id,
                chatStatus: 2,
              }); // 聊天状态切换为思考中
            }
            // 内容
            if (type === "text") {
              // 区分是 toolCall 的content 还是普通的 content
              let isToolCallContent = false;
              const toolCallList = lastValue.toolCallList;
              if (toolCallList && toolCallList.length) {
                // const lastToolCallObj = toolCallList[toolCallList.length - 1];
                const findToolCallObj = toolCallList.find((item) => item.callParams && !item.callResult);
                if (findToolCallObj) {
                  isToolCallContent = true;
                  findToolCallObj.content += content.replaceAll("\t", "").replaceAll("\n", "\n\n");
                  this.setData({
                    [`chatRecords[${lastValueIndex}].toolCallList`]: lastValue.toolCallList,
                    chatStatus: 3,
                  });
                  this.autoToBottom();
                }
              }

              if (!isToolCallContent) {
                contentText += content;
                lastValue.content = contentText;
                this.setData({
                  [`chatRecords[${lastValueIndex}].content`]: lastValue.content,
                  [`chatRecords[${lastValueIndex}].record_id`]: lastValue.record_id,
                  chatStatus: 3,
                }); // 聊天状态切换为输出content中
              }
            }
            // 知识库，只更新一次
            if (type === "knowledge" && !lastValue.knowledge_meta) {
              // console.log('ryan',knowledge_base)
              lastValue.knowledge_base = knowledge_base;
              this.setData({
                [`chatRecords[${lastValueIndex}].knowledge_base`]: lastValue.knowledge_base,
                chatStatus: 2,
              });
            }
            // 数据库，只更新一次
            if (type === "db" && !lastValue.db_len) {
              lastValue.db_len = search_results.relateTables || 0;
              this.setData({
                [`chatRecords[${lastValueIndex}].db_len`]: lastValue.db_len,
                chatStatus: 2,
              });
            }
            // tool_call 场景，调用请求
            if (type === "tool-call") {
              const { tool_call } = dataJson;
              const callBody = {
                id: tool_call.id,
                name: this.transformToolName(tool_call.function.name),
                rawParams: tool_call.function.arguments,
                callParams: "```json\n" + JSON.stringify(tool_call.function.arguments, null, 2) + "\n```",
                content: "",
              };
              if (!lastValue.toolCallList) {
                lastValue.toolCallList = [callBody];
              } else {
                lastValue.toolCallList.push(callBody);
              }
              this.setData({
                [`chatRecords[${lastValueIndex}].toolCallList`]: lastValue.toolCallList,
              });
              this.autoToBottom();
            }
            // tool_call 场景，调用响应
            if (type === "tool-result") {
              const { toolCallId, result } = dataJson;
              // console.log("tool-result", result);
              if (lastValue.toolCallList && lastValue.toolCallList.length) {
                const lastToolCallObj = lastValue.toolCallList.find((item) => item.id === toolCallId);
                if (lastToolCallObj && !lastToolCallObj.callResult) {
                  lastToolCallObj.rawResult = result;
                  lastToolCallObj.callResult = "```json\n" + JSON.stringify(result, null, 2) + "\n```";
                  this.setData({
                    [`chatRecords[${lastValueIndex}].toolCallList`]: lastValue.toolCallList,
                  });
                  this.autoToBottom();
                }
              }
            }
            // 超出token数限制
            if (type === "finish" && finish_reason === "length") {
              const completionTokens = usage?.completionTokens || 0;
              lastValue.error = completionTokens
                ? `当前输出token长度为 ${completionTokens}，已超过最大限制，请重新提问`
                : "已超过最大限制，请重新提问";
              this.setData({
                [`chatRecords[${lastValueIndex}].error`]: lastValue.error,
              });
            }
          } catch (e) {
            console.log("err", event, e);
            break;
          }
          index++;
        }
        this.toBottom(40);
        const newValue = [...this.data.chatRecords];
        const lastValueIndex = newValue.length - 1;
        // 取最后一条消息更新
        const lastValue = newValue[lastValueIndex];
        lastValue.hiddenBtnGround = isManuallyPaused;
        if (lastValue.content === "") {
          lastValue.content = this.data.defaultErrorMsg;
          this.setData({
            [`chatRecords[${lastValueIndex}].content`]: lastValue.content,
          });
        }
        // console.log("this.data.chatRecords", this.data.chatRecords);
        this.setData({
          chatStatus: 0,
          [`chatRecords[${lastValueIndex}].hiddenBtnGround`]: isManuallyPaused,
        }); // 对话完成，切回0 ,并且修改最后一条消息的状态，让下面的按钮展示
        if (bot.isNeedRecommend && !isManuallyPaused) {
          const cloudInstance = await getCloudInstance(this.data.envShareConfig);
          const ai = cloudInstance.extend.AI;
          const chatRecords = this.data.chatRecords;
          const lastPairChatRecord = chatRecords.length >= 2 ? chatRecords.slice(chatRecords.length - 2) : [];
          const recommendRes = await ai.bot.getRecommendQuestions({
            data: {
              botId: bot.botId,
              history: lastPairChatRecord.map((item) => ({
                role: item.role,
                content: item.content,
              })),
              msg: inputValue,
              agentSetting: "",
              introduction: "",
              name: "",
            },
          });
          let result = "";
          for await (let str of recommendRes.textStream) {
            // this.toBottom();
            this.toBottom();
            result += str;
            this.setData({
              questions: result.split("\n").filter((item) => !!item),
            });
          }
        }
      }
      if (chatMode === "model") {
        const { modelProvider, quickResponseModel } = modelConfig;
        const cloudInstance = await getCloudInstance(this.data.envShareConfig);
        const ai = cloudInstance.extend.AI;
        const aiModel = ai.createModel(modelProvider);
        const res = await aiModel.streamText({
          data: {
            model: quickResponseModel,
            messages: [
              ...chatRecords.map((item) => ({
                role: item.role,
                content: item.content,
              })),
              {
                role: "user",
                content: inputValue,
              },
            ],
          },
        });
        let contentText = "";
        let reasoningText = "";
        let chatStatus = 2;
        let isManuallyPaused = false;
        let startTime = null; //记录开始思考时间
        let endTime = null; // 记录结束思考时间
        for await (let event of res.eventStream) {
          if (this.data.chatStatus === 0) {
            isManuallyPaused = true;
            break;
          }
          this.toBottom();

          const { data } = event;
          try {
            const dataJson = JSON.parse(data);
            const { id, choices = [] } = dataJson || {};
            const { delta, finish_reason } = choices[0] || {};
            if (finish_reason === "stop") {
              break;
            }
            const { content, reasoning_content, role } = delta;
            reasoningText += reasoning_content || "";
            contentText += content || "";
            const newValue = [...this.data.chatRecords];
            const lastValue = newValue[newValue.length - 1];
            lastValue.content = contentText;
            lastValue.reasoning_content = reasoningText;
            lastValue.record_id = "record_id" + String(id);
            if (!!reasoningText && !contentText) {
              // 推理中
              chatStatus = 2;
              if (!startTime) {
                startTime = +new Date();
                endTime = +new Date();
              } else {
                endTime = +new Date();
              }
            } else {
              chatStatus = 3;
            }
            lastValue.thinkingTime = endTime ? Math.floor((endTime - startTime) / 1000) : 0;
            this.setData({ chatRecords: newValue, chatStatus });
          } catch (e) {
            // console.log(e, event)
            break;
          }
        }
        const newValue = [...this.data.chatRecords];
        const lastValue = newValue[newValue.length - 1];
        lastValue.hiddenBtnGround = isManuallyPaused; // 用户手动暂停，不显示下面的按钮
        this.setData({ chatRecords: newValue, chatStatus: 0 }); // 回正
      }
    },
    toBottom: async function (unit) {
      const addUnit = unit === undefined ? 4 : unit;
      if (this.data.shouldAddScrollTop) {
        const newTop = this.data.scrollTop + addUnit;
        if (this.data.manualScroll) {
          this.setData({
            scrollTop: newTop,
          });
        } else {
          this.setData({
            scrollTop: newTop,
            viewTop: newTop,
          });
        }
        return;
      }
      // 只有当内容高度接近scroll 区域视口高度时才开始增加 scrollTop
      // const clientHeight =
      //   this.data.windowInfo.windowHeight - this.data.footerHeight - (this.data.chatMode === "bot" ? 40 : 0); // 视口高度
      const clientHeight = this.data.curScrollHeight; // TODO:
      // const contentHeight =
      //   (await this.calculateContentHeight()) +
      //   (this.data.contentHeightInScrollViewTop || (await this.calculateContentInTop())); // 内容总高度
      const contentHeight = await this.calculateContentHeight();
      // console.log(
      //   'contentHeight clientHeight newTop',
      //   contentHeight,
      //   clientHeight,
      //   this.data.scrollTop + 4
      // );
      if (clientHeight - contentHeight < 10) {
        this.setData({
          shouldAddScrollTop: true,
        });
      }
    },
    copyChatRecord: function (e) {
      const { content } = e.currentTarget.dataset;
      wx.setClipboardData({
        data: content,
        success: function (res) {
          wx.showToast({
            title: "复制成功",
            icon: "success",
          });
        },
      });
    },
    addFileList: function () {
      // 顶部文件行展现时，隐藏底部工具栏
      this.setData({});
    },
    subFileList: function () {},
    copyUrl: function (e) {
      const { url } = e.currentTarget.dataset;
      console.log(url);
      wx.setClipboardData({
        data: url,
        success: function (res) {
          wx.showToast({
            title: "复制成功",
            icon: "success",
          });
        },
      });
    },
    handleRemoveChild: function (e) {
      // console.log("remove", e.detail.tempId);
      if (e.detail.tempId) {
        const newSendFileList = this.data.sendFileList.filter((item) => item.tempId !== e.detail.tempId);
        console.log("newSendFileList", newSendFileList);
        this.setData({
          sendFileList: newSendFileList,
        });
        if (newSendFileList.length === 0 && this.data.showFileList) {
          this.setData({
            showFileList: false,
          });
        }
      }
    },
    handleChangeChild: function (e) {
      console.log("change", e.detail);
      const { fileId, tempId, status } = e.detail;
      // const curFile = this.data.sendFileList.find(item => item.tempId === tempId)
      // curFile.fileId = fileId
      const newSendFileList = this.data.sendFileList.map((item) => {
        if (item.tempId === tempId) {
          const obj = {};
          if (fileId) {
            obj.fileId = fileId;
          }
          if (status) {
            obj.status = status;
          }
          return {
            ...item,
            ...obj,
          };
        }
        return item;
      });
      this.setData({
        sendFileList: newSendFileList,
      });
    },
    handleClickTools: function () {
      this.setData({
        showTools: !this.data.showTools,
      });
    },
    handleClickWebSearch: function () {
      if (!this.data.useWebSearch && !this.data.bot.searchEnable) {
        wx.showModal({
          title: "提示",
          content: "请前往腾讯云开发平台启用 Agent 联网搜索功能",
        });
        return;
      }
      if (this.data.sendFileList.length) {
        wx.showModal({
          title: "提示",
          content: "上传附件后不支持联网搜索",
        });
        return;
      }
      this.setData({
        useWebSearch: !this.data.useWebSearch,
      });
    },
    fetchAudioUrlByContent: async function (recordId, content) {
      // 缓存有读缓存
      if (this.data.audioSrcMap[recordId]) {
        return this.data.audioSrcMap[recordId];
      }
      // 发起文本转语音请求
      const res = await new Promise((resolve, reject) => {
        commonRequest({
          path: `bots/${this.data.bot.botId}/text-to-speech`,
          header: {},
          data: {
            text: content,
            voiceType: this.data.bot.voiceSettings?.outputType,
          },
          method: "POST",
          success: (res) => {
            resolve(res);
          },
          fail(e) {
            console.log("create text-to-speech task e", e);
            reject(e);
          },
        });
      });
      const { data } = res;
      if (data && data.TaskId) {
        const taskId = data.TaskId;
        // 轮训获取音频url
        let loopQueryStatus = true;
        let audioUrl = "";
        while (loopQueryStatus) {
          const res = await new Promise((resolve, reject) => {
            commonRequest({
              path: `bots/${this.data.bot.botId}/text-to-speech`,
              header: {},
              data: {
                taskId,
              },
              method: "GET",
              success: (res) => {
                resolve(res);
              },
              fail(e) {
                console.log("create text-to-speech task e", e);
                reject(e);
              },
            });
          });
          const { data } = res;
          if (data.code || data.Status === 2) {
            loopQueryStatus = false;
          }
          if (data.Status === 2) {
            audioUrl = data.ResultUrl;
            this.setData({
              audioSrcMap: {
                ...this.data.audioSrcMap,
                [recordId]: audioUrl,
              },
            });
          }
          if (loopQueryStatus) {
            await sleep(1000);
          }
        }
        return audioUrl;
      }
      return "";
    },
    handlePlayAudio: async function (e) {
      console.log("handlePlayAudio e", e);
      const { recordid: botRecordId, content } = e.target.dataset;
      const audioContext = this.data.audioContext;
      if (audioContext.context) {
        // 判断当前管理的 audioContext 所属 chatRecord 是否与点击播放的 chatRecord 一致
        if (audioContext.recordId === botRecordId) {
          // 是则直接播放
          audioContext.playStatus = 2;
          audioContext.showSpeedList = false;
          // audioContext.currentSpeed = 1.25;
          this.setData({
            audioContext: audioContext,
          });
          audioContext.context.playbackRate = audioContext.currentSpeed;
          audioContext.context.play();
        } else {
          // 需销毁当前的 audioContext TODO:, 先测试复用content, 直接更换src
          audioContext.context.stop(); // 旧的停止
          audioContext.recordId = botRecordId;
          audioContext.playStatus = 1;
          audioContext.showSpeedList = false;
          audioContext.currentSpeed = 1.25;
          this.setData({
            audioContext: {
              ...audioContext,
            },
          });
          const audioUrl = await this.fetchAudioUrlByContent(botRecordId, content);
          if (audioUrl) {
            audioContext.context.src = audioUrl;
            audioContext.context.seek(0); // 播放进度拉回到0
            audioContext.context.playbackRate = audioContext.currentSpeed;
            audioContext.context.play();
            this.setData({
              audioContext: {
                ...audioContext,
                playStatus: 2,
              },
            });
          } else {
            console.log("文本转语音失败");
            this.setData({
              audioContext: {
                ...audioContext,
                playStatus: 0,
              },
            });
          }
        }
      } else {
        // 创建audioContext
        const audioContext = {
          recordId: botRecordId,
          playStatus: 1,
          showSpeedList: false,
          currentSpeed: 1.25,
        };
        const innerAudioContext = wx.createInnerAudioContext({
          useWebAudioImplement: false, // 是否使用 WebAudio 作为底层音频驱动，默认关闭。对于短音频、播放频繁的音频建议开启此选项，开启后将获得更优的性能表现。由于开启此选项后也会带来一定的内存增长，因此对于长音频建议关闭此选项
        });
        try {
          await wx.setInnerAudioOption({
            obeyMuteSwitch: false, // 是否遵循系统静音开关，默认遵循
          });
        } catch (e) {
          console.log("不遵循静音模式控制", e);
        }
        innerAudioContext.onEnded(() => {
          // 音频自然播放至结束触发
          this.setData({
            audioContext: {
              ...this.data.audioContext,
              playStatus: 0,
            },
          });
        });
        audioContext.context = innerAudioContext;
        this.setData({
          audioContext: audioContext,
        });
        const audioUrl = await this.fetchAudioUrlByContent(botRecordId, content);
        if (audioUrl) {
          audioContext.context.src = audioUrl;
          audioContext.context.playbackRate = audioContext.currentSpeed; // 播放速率，范围 0.5~2.0，默认 1.0
          audioContext.context.play();
          this.setData({
            audioContext: {
              ...audioContext,
              playStatus: 2,
            },
          });
        } else {
          console.log("文本转语音失败");
          this.setData({
            audioContext: {
              ...audioContext,
              playStatus: 0,
            },
          });
        }
      }
    },
    handlePauseAudio: function (e) {
      console.log("handlePauseAudio e", e);
      const { recordid: botRecordId } = e.target.dataset;
      const audioContext = this.data.audioContext;
      if (botRecordId === audioContext.recordId && audioContext.context) {
        audioContext.context.pause();
        audioContext.playStatus = 0;
        this.setData({
          audioContext: {
            ...audioContext,
          },
        });
      } else {
        console.log("暂停异常");
      }
    },
    toggleSpeedList(e) {
      this.setData({
        audioContext: {
          ...this.data.audioContext,
          showSpeedList: !this.data.audioContext.showSpeedList,
        },
      });
    },
    chooseSpeed(e) {
      const speed = e.currentTarget.dataset.speed;
      const audioContext = this.data.audioContext;
      audioContext.showSpeedList = !this.data.audioContext.showSpeedList;
      audioContext.currentSpeed = Number(speed);
      audioContext.context.pause();
      audioContext.context.playbackRate = audioContext.currentSpeed;
      audioContext.context.play();
      this.setData({
        audioContext: {
          ...this.data.audioContext,
          ...audioContext,
        },
      });
    },
    // 触摸开始
    handleTouchStart(e) {
      if (this.data.chatStatus !== 0 || this.data.voiceRecognizing === true) {
        wx.showToast({
          title: "请等待对话完成",
          icon: "error",
        });
        return;
      }
      console.log("touchstart e", e);
      const { clientY } = e.touches[0];
      this.setData({
        startY: clientY,
        longPressTriggered: false,
      });

      // 设置长按定时器（500ms）
      this.data.longPressTimer = setTimeout(() => {
        // 触发长按，同时进入待发送态
        this.setData({ longPressTriggered: true, sendStatus: 1 });
        // 这里可添加长按反馈（如震动）
        wx.vibrateShort();
        this.startRecord();
      }, 300);
    },
    // 触摸移动
    handleTouchMove(e) {
      if (this.data.chatStatus !== 0 || this.data.voiceRecognizing === true) {
        wx.showToast({
          title: "请等待对话完成",
          icon: "error",
        });
        return;
      }
      if (!this.data.longPressTriggered) return;
      const { clientY } = e.touches[0];
      const deltaY = clientY - this.data.startY;
      // 计算垂直滑动距离
      if (Math.abs(deltaY) > this.data.moveThreshold) {
        // 滑动超过阈值时置为待取消态
        // clearTimeout(this.data.longPressTimer);
        console.log("touchMove 待取消");
        if (this.data.sendStatus !== 2) {
          this.setData({ sendStatus: 2 });
        }
      } else {
        console.log("touchMove 待发送");
        if (this.data.sendStatus !== 1) {
          this.setData({ sendStatus: 1 });
        }
      }
    },
    // 触摸结束
    handleTouchEnd(e) {
      if (this.data.chatStatus !== 0 || this.data.voiceRecognizing === true) {
        wx.showToast({
          title: "请等待对话完成",
          icon: "error",
        });
        return;
      }
      console.log("touchEnd e", e);
      clearTimeout(this.data.longPressTimer);
      if (this.data.longPressTriggered) {
        const { clientY } = e.changedTouches[0];
        const deltaY = clientY - this.data.startY;
        // 判断是否向上滑动超过阈值
        if (deltaY < -this.data.moveThreshold) {
          this.cancelSendVoice(); // 执行滑动后的逻辑
        } else {
          this.sendVoice(); // 执行普通松开逻辑
        }
      }
      this.setData({ longPressTriggered: false });
    },
    sendVoice() {
      // 发送语音消息
      console.log("发送语音");
      if (this.data.recorderManager) {
        this.setData({
          sendStatus: 3,
          voiceRecognizing: true,
        });
        this.data.recorderManager.stop();
      }
    },
    cancelSendVoice() {
      // 取消语音发送
      console.log("取消发送");
      if (this.data.recorderManager) {
        this.setData({
          sendStatus: 4,
        });
        console.log("停止录音");
        this.data.recorderManager.stop();
      }
    },
    startRecord() {
      console.log("startRecord sendStatus", this.data.sendStatus);
      if (this.data.recorderManager && this.data.sendStatus === 1) {
        console.log("开始录音");
        this.data.recorderManager.start(this.data.recordOptions);
      }
    },
  },
});
