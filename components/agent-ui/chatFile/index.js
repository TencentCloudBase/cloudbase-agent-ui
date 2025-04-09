// components/agent-ui-new/chatFIle/chatFile.js
import { getCloudInstance, compareVersions } from "../tools";
Component({
  lifetimes: {
    attached: async function () {
      console.log("enableDel", this.data.enableDel);
      const { tempFileName, rawFileName, rawType, tempPath, fileId, botId, parsed } = this.data.fileData;
      const type = this.getFileType(rawFileName || tempFileName);
      console.log("type", type);
      if (!fileId) {
        this.setData({
          formatSize: "上传中",
          iconPath: "../imgs/" + type + ".svg",
        });
      }

      if (fileId && parsed) {
        this.setData({
          formatSize: this.transformSize(this.data.fileData.fileSize),
          iconPath: "../imgs/" + type + ".svg",
        });
        return;
      }
      const cloudInstance = await getCloudInstance();
      // console.log('file', cloudInstance)
      // 上传云存储获取 fileId
      // console.log('rawFileName tempFileName tempPath', rawFileName, tempFileName, tempPath)
      cloudInstance.uploadFile({
        cloudPath: this.generateCosUploadPath(
          botId,
          rawFileName ? rawFileName.split(".")[0] + "-" + tempFileName : tempFileName
        ), // 云上文件路径
        filePath: tempPath,
        success: async (res) => {
          const appBaseInfo = wx.getAppBaseInfo();
          const fileId = res.fileID;
          this.setData({
            formatSize: "解析中",
          });

          console.log("当前版本", appBaseInfo.SDKVersion);
          // 3.8.1 及以上版本走sdk 内置方法
          if (compareVersions(appBaseInfo.SDKVersion, "3.8.1") < 0) {
            const { token } = await cloudInstance.extend.AI.bot.tokenManager.getToken();
            wx.request({
              url: `https://${
                cloudInstance.env || cloudInstance.extend.AI.bot.context.env
              }.api.tcloudbasegateway.com/v1/aibot/bots/${botId}/files`,
              data: {
                fileList: [
                  {
                    fileName: rawFileName || tempFileName,
                    fileId,
                    type: rawType,
                  },
                ],
              },
              header: {
                Authorization: `Bearer ${token}`,
              },
              method: "POST",
              success: (res) => {
                console.log("old resolve agent file res", res);
                this.setData({
                  formatSize: this.transformSize(this.data.fileData.fileSize),
                });
                this.triggerEvent("changeChild", { tempId: this.data.fileData.tempId, fileId, parsed: true });
              },
              fail(e) {
                console.log("resolve agent file e", e);
              },
            });
          } else {
            const ai = cloudInstance.extend.AI;
            ai.request({
              path: `bots/${botId}/files`, // 填写 "v1/aibot/" 后面的内容
              data: {
                fileList: [
                  {
                    fileName: rawFileName || tempFileName,
                    fileId,
                    type: rawType,
                  },
                ],
              }, // any
              method: "POST",
              timeout: 30000,
              success: (res) => {
                console.log("resolve agent file res", res);
                this.setData({
                  formatSize: this.transformSize(this.data.fileData.fileSize),
                });
                this.triggerEvent("changeChild", { tempId: this.data.fileData.tempId, fileId, parsed: true });
              },
              fail: (e) => {
                console.log("e", e);
              },
              complete: () => {},
              header: {},
            });
          }
        },
        fail: (err) => {
          console.error("上传失败：", err);
        },
      });
    },
  },
  observers: {
    "fileData.fileId": function (fileId) {
      this.setData({
        formatSize: fileId ? this.transformSize(this.data.fileData.fileSize) : "上传中",
      });
    },
    "fileData.parsed": function (parsed) {
      this.setData({
        formatSize: parsed ? this.transformSize(this.data.fileData.fileSize) : "解析中",
      });
    },
  },
  /**
   * 组件的属性列表
   */
  properties: {
    enableDel: {
      type: Boolean,
      value: false,
    },
    fileData: {
      type: Object,
      value: {
        tempId: "",
        rawType: "",
        tempFileName: "",
        rawFileName: "",
        tempPath: "",
        fileSize: 0,
        fileUrl: "",
        fileId: "",
        parsed: false,
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    formatSize: "",
    iconPath: "../imgs/file.svg",
  },
  /**
   * 组件的方法列表，
   */
  methods: {
    generateCosUploadPath: function (botId, fileName) {
      return `agent_file/${botId}/${fileName}`;
    },
    // 提取文件后缀
    getFileType: function (fileName) {
      let index = fileName.lastIndexOf(".");
      const fileExt = fileName.substring(index + 1);
      if (fileExt === "docx" || fileExt === "doc") {
        return "word";
      }
      if (fileExt === "xlsx" || fileExt === "xls" || fileExt === "csv") {
        return "excel";
      }
      if (fileExt === "png" || fileExt === "jpg" || fileExt === "jpeg" || fileExt === "svg") {
        return "image";
      }

      if (fileExt === "ppt" || fileExt === "pptx") {
        return "ppt";
      }

      if (fileExt === "pdf") {
        return "pdf";
      }
      return "file";
    },
    // 转换文件大小（原始单位为B）
    transformSize: function (size) {
      if (size < 1024) {
        return size + "B";
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + "KB";
      } else {
        return (size / 1024 / 1024).toFixed(2) + "MB";
      }
    },
    removeFileFromParents: function () {
      console.log("remove", this.data.fileData);
      this.triggerEvent("removeChild", { tempId: this.data.fileData.tempId });
    },
    openFileByWx: function (tempPath) {
      const fileExt = tempPath.split(".")[1];
      if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf"].includes(fileExt)) {
        wx.openDocument({
          filePath: tempPath,
          success: function (res) {
            console.log("打开文档成功");
          },
          fail: function (err) {
            console.log("打开文档失败", err);
          },
        });
      } else {
        wx.showModal({
          content: "当前支持预览文件类型为 pdf、doc、docx、ppt、pptx、xls、xlsx",
          showCancel: false,
          confirmText: "确定",
        });
      }
    },
    previewImageByWx: function (fileId) {
      wx.previewImage({
        urls: [fileId],
        showmenu: true,
        success: function (res) {
          console.log("previewImage res", res);
        },
        fail: function (e) {
          console.log("previewImage e", e);
        },
      });
    },
    openFile: async function () {
      if (this.data.fileData.tempPath) {
        // 本地上传的文件
        if (this.data.fileData.rawType === "file") {
          this.openFileByWx(this.data.fileData.tempPath);
        } else {
          console.log("fileId", this.data.fileData.fileId);
          if (this.data.fileData.fileId) {
            this.previewImageByWx(this.data.fileData.fileId);
          }
        }
      } else if (this.data.fileData.fileId) {
        // 针对历史记录中带cloudID的处理（历史记录中附带的文件）
        const cloudInsatnce = await getCloudInstance();
        cloudInsatnce.downloadFile({
          fileID: this.data.fileData.fileId,
          success: (res) => {
            console.log("download res", res);
            if (this.data.fileData.rawType === "file") {
              this.openFileByWx(res.tempFilePath);
            } else {
              this.previewImageByWx(this.data.fileData.fileId);
            }
          },
          fail: (err) => {
            console.log("download err", err);
          },
        });
      }
    },
  },
});
