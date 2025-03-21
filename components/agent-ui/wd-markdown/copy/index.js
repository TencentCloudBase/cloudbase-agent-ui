Component({
  options: {
    virtualHost: true,
  },
  data: {
  },
  properties: {
    dataClipboardText: {
      type: String,
      value: '',
    },
  },
  methods: {
  // 复制到剪贴板
  copyClipBoard: function () {
    wx.setClipboardData({
      data: this.data.dataClipboardText,
      // success() {
      //   wx.getClipboardData({
      //     success() {},
      //   });
      // },
    });
  },
  },
});
