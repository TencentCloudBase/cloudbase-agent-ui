Component({
  properties: {
    // 组件的属性列表
    name: {
      type: String,
      value: "",
    },
    toolData: {
      type: Object,
      value: {},
    },
  },
  data: {
    foodList: [
      {
        id: 1,
        name: "北京烤鸭",
        image: "https://6c75-luke-personal-test-new-8d0d90f5f-1259218801.tcb.qcloud.la/%E7%83%A4%E9%B8%AD.png",
        price: 100,
      },
      {
        id: 2,
        name: "冰糖雪梨",
        image: "https://6c75-luke-personal-test-new-8d0d90f5f-1259218801.tcb.qcloud.la/%E5%86%B0%E7%B3%96.png",
        price: 20,
      },
      {
        id: 3,
        name: "小酥肉",
        image: "https://6c75-luke-personal-test-new-8d0d90f5f-1259218801.tcb.qcloud.la/%E9%85%A5%E8%82%89.png",
        price: 19,
      },
      {
        id: 4,
        name: "麻辣小龙虾",
        image: "https://6c75-luke-personal-test-new-8d0d90f5f-1259218801.tcb.qcloud.la/%E9%BE%99%E8%99%BE.png",
        price: 299,
      },
    ],
  },
  methods: {
    // 添加点击事件处理函数
    onFoodItemTap: function (e) {
      const foodId = e.currentTarget.dataset.id;
      const foodItem = this.data.foodList.find((item) => item.id === foodId);

      // 将商品数据存储到全局数据或通过页面参数传递
      wx.navigateTo({
        url: `/pages/foodBuy/foodBuy?id=${foodId}`,
      });
    },
  },
});
