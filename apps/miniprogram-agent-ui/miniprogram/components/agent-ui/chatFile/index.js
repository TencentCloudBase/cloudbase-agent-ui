// components/agent-ui-new/chatFIle/chatFile.js
import { getCloudInstance, compareVersions, commonRequest } from "../tools";
Component({
  lifetimes: {
    attached: async function () {
      console.log("enableDel", this.data.enableDel);
      const { tempFileName, rawFileName, rawType, tempPath, fileId, botId, status } = this.data.fileData;
      const type = this.getFileType(rawFileName || tempFileName);
      console.log("type", type);
      if (!fileId) {
        this.setData({
          iconPath: "../imgs/" + type + ".svg",
        });

        this.triggerEvent("changeChild", { tempId: this.data.fileData.tempId, status: "uploading" });
      }

      if (fileId && status === "parsed") {
        this.setData({
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
          this.triggerEvent("changeChild", { tempId: this.data.fileData.tempId, status: "parsing" });
          console.log("当前版本", appBaseInfo.SDKVersion);
          commonRequest({
            path: `bots/${botId}/files`,
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
            timeout: 60000,
            success: (res) => {
              console.log("resolve agent file res", res);
              this.triggerEvent("changeChild", { tempId: this.data.fileData.tempId, fileId, status: "parsed" });
            },
            fail: (e) => {
              console.log("e", e);
              this.triggerEvent("changeChild", { tempId: this.data.fileData.tempId, fileId, status: "parseFailed" });
            },
            complete: () => {},
            header: {},
          })
        },
        fail: (err) => {
          console.error("上传失败：", err);
        },
      });
    },
  },
  observers: {
    "fileData.status": function (status) {
      this.setData({
        statusTxt: this.getFormatStatusText(status),
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
        status: "",
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    formatSize: "",
    iconPath: "../imgs/file.svg",
    statusTextMap: {
      uploading: "上传中",
      parsing: "解析中",
      parseFailed: "解析失败",
    },
    statusTxt: "",
  },
  /**
   * 组件的方法列表，
   */
  methods: {
    getFormatStatusText: function (status) {
      if (status === "parsed") {
        return this.transformSize(this.data.fileData.fileSize);
      }
      return this.data.statusTextMap[status] || "";
    },
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
