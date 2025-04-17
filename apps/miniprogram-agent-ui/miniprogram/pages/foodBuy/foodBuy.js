Page({
  data: {
    selectedOption: 1,
    foodDetail: {
      id: 4,
      name: "凉面饮品单人餐",
      image: "https://6c75-luke-personal-test-new-8d0d90f5f-1259218801.tcb.qcloud.la/%E9%BE%99%E8%99%BE.png",
      price: 15.8,
      originalPrice: 24,
      shopName: "肥肥虾庄·金牌油焖大虾",
      location: "光谷之星店",
      rating: 4.5,
      sold: "5000+",
      discount: "6.6折",
      description: "肥肥的嫩嫩冰粉，料足清爽",
      validPeriod: "2024.4.11 至 2025.4.25 23:59",
      shopInfo: {
        address: "距您8.0km，高科园路18号中建光谷之星F地块商业街...",
        businessHours: "00:00-02:00 11:00-24:00",
      },
    },
  },

  onLoad: function (options) {
    const foodId = options.id;
    // 在实际应用中，这里应该从服务器或本地存储获取商品详情
    // 这里使用静态数据模拟
    console.log("加载商品ID:", foodId);
  },

  // 选择商品选项
  selectOption: function (e) {
    const optionId = e.currentTarget.dataset.id;
    this.setData({
      selectedOption: optionId,
    });

    // 根据选项更新价格
    if (optionId === 2) {
      this.setData({
        "foodDetail.price": this.data.foodDetail.price * 2,
        "foodDetail.originalPrice": this.data.foodDetail.originalPrice * 2,
        "foodDetail.name": "肥肥菜虾双人餐",
      });
    } else {
      this.setData({
        "foodDetail.price": 15.8,
        "foodDetail.originalPrice": 24,
        "foodDetail.name": "单人餐",
      });
    }
  },

  // 返回上一页
  navigateBack: function () {
    wx.navigateBack();
  },
});
