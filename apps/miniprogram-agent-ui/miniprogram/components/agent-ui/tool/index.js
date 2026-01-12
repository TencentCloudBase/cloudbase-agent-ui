Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 工具名称
    toolName: {
      type: String,
      value: "",
    },
    // 工具状态：success/failed/running
    toolStatus: {
      type: String,
      value: "success",
    },
    // 工具参数
    toolParams: {
      type: String,
      value: "",
    },
    toolResult: {
      type: String,
      value: "",
    },
    // 是否默认展开
    defaultExpanded: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isExpanded: false,
    parsedParams: "", // 解析后的参数对象
    parsedResult: "", // 解析后的结果对象
  },

  observers: {
    toolParams: function (toolParams) {
      if (toolParams) {
        try {
          const parsed = JSON.stringify(JSON.parse(toolParams), null, 2);
          console.log(parsed);
          this.setData({ parsedParams: parsed });
        } catch (e) {
          // 解析失败返回原字符串
          this.setData({ parsedParams: toolParams });
        }
      } else {
        this.setData({ parsedParams: "" });
      }
    },
    toolResult: function (toolResult) {
      if (toolResult) {
        try {
          const parsed = JSON.stringify(JSON.parse(toolResult), null, 2);
          console.log(parsed);
          this.setData({ parsedResult: parsed });
        } catch (e) {
          // 解析失败返回原字符串
          this.setData({ parsedResult: toolResult });
        }
      } else {
        this.setData({ parsedResult: "" });
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换展开/收起
    toggleExpand() {
      this.setData({
        isExpanded: !this.data.isExpanded,
      });
    },
  },
  /**
   * 生命周期函数
   */
  attached() {
    // 初始化展开状态
    this.setData({
      isExpanded: this.properties.defaultExpanded,
    });
  },
});
