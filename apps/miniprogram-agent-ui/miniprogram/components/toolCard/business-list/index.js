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
  methods: {
    // 点击卡片跳转到详情页
    onCardTap(e) {
      const id = e.currentTarget.dataset.id;
      // wx.navigateTo({
      //   url: `/pages/restaurant-detail/index?id=${id}`,
      // });
    },

    // 点击呼叫按钮
    onCallTap(e) {
      const phone = e.currentTarget.dataset.phone;
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          wx.showToast({
            title: "呼叫失败",
            icon: "none",
          });
        },
      });
    },
    getRandomImage() {
      const randomIndex = Math.floor(Math.random() * this.data.mockBusinessList.length);
      return this.data.mockBusinessList[randomIndex];
    },
  },
  lifetimes: {
    attached() {
      // 根据 name 区分处理不同 tool 调用情况
      const { name, toolData } = this.data;
      // 将详细的结构化地址转换为经纬度坐标
      if (name === "placeSearchNearby") {
        const { content } = toolData;
        if (content[0].type === "text") {
          const contentData = JSON.parse(content[0].text);
          const { data } = contentData;
          this.setData({
            restaurants: data.map((item, index) => ({
              // ...item,
              image: this.getRandomImage(),
              description: `私房菜 ${item.ad_info.city}${item.ad_info.district} 私房菜打卡人气榜第${index + 1}名`,
              rating: 4.2,
              reviews: 1923,
              id: item.id,
              name: item.title,
              address: item.address,
              telephone: item.tel,
              category: item.category,
              distance: item._distance,
              city: item.ad_info.city,
              area: item.ad_info.district,
            })),
            isFoodCategory: data[0].category.includes("美食"),
          });
        }
      }
    },
  },
  data: {
    mockBusinessList: [
      "https://poi-pic.cdn.bcebos.com/swd/a98b9547-20b8-3f4c-903b-51694ed27090.jpg",
      "https://poi-pic.cdn.bcebos.com/swd/8fa8c9a7-f061-3bbe-9e1c-cf370e92e814.jpg",
      "https://poi-pic.cdn.bcebos.com/swd/9c9a246a-463c-343f-8448-252edf2864ab.jpg",
      "https://photo-meituan.cdn.bcebos.com/photo/1736586257678cf0aa25fcaa1c0d86c3e009da6448",
      "https://photo-meituan.cdn.bcebos.com/photo/16922109814d07935406d27bf3e16a7844ae00fdef",
      "https://poi-pic.cdn.bcebos.com/swd/3a633f56-991f-3d0b-ba5c-6517140c72f1.jpg",
      "https://poi-pic.cdn.bcebos.com/swd/2652750e-fe5d-3827-9254-0e272ab904b2.jpg",
      "https://poi-pic.cdn.bcebos.com/swd/90a78fdc-fecc-3930-9271-8095da7ad209.jpg",
      // "https://qcloud.dpfile.com/pc/saQroau_MHTJgh_qZJ2aG…2vfCF2ubeXzk49OsGrXt_KYDCngOyCwZK-s3fqawWswzk.jpg",
      "https://poi-pic.cdn.bcebos.com/swd/4061ecf3-e403-38de-9ad4-16549f4e8269.jpg",
      "http://hiphotos.baidu.com/space/pic/item/e850352ac65c1038a7059ed5ba119313b07e89aa.jpg",
    ],
    restaurants: [],
    isFoodCategory: true, // 是否为美食分类
  },
});
