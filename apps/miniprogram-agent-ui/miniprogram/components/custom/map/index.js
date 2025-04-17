// 地图相关的组件
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
    latitude: 30,
    longitude: 114,
    scale: 10,
    markers: [
      {
        id: 1,
        latitude: 30,
        longitude: 114,
      },
    ],
    adcode: "", // 地址邮政编码
    routeSteps: [], // 路线规划步骤
    routeMode: "", // driving, bicycling, walking
  },
  lifetimes: {
    attached() {
      // 根据 name 区分处理不同 tool 调用情况
      const { name, toolData } = this.data;
      // 将详细的结构化地址转换为经纬度坐标
      if (name === "maps_geo") {
        console.log("toolData", toolData);
        const { content } = toolData;
        if (content[0].type === "text") {
          const contentData = JSON.parse(content[0].text);
          if (contentData.return && contentData.return.length > 0) {
            const { location } = contentData.return[0];
            const [longitude, latitude] = location.split(",");
            this.setData({
              latitude,
              longitude,
              markers: [
                {
                  id: 1,
                  latitude,
                  longitude,
                },
              ],
              routeMode: "driving",
            });
            return;
          }
        }
      }
      // 路径规划可以根据用户起终点经纬度坐标规划方案
      if (name === "maps_direction_driving") {
        const { content } = toolData;
        if (content[0].type === "text") {
          const contentData = JSON.parse(content[0].text);
          if (contentData.route && contentData.route.paths?.length > 0) {
            const paths = contentData.route.paths[0];
            const { steps } = paths;
            if (steps.length > 0) {
              this.setData({
                routeSteps: steps.map((item) => ({
                  ...item,
                  icon: this.transformDirection(item.orientation),
                })),
              });
            }
            // const { routeSteps } = contentData.return[0];
            // this.setData({
            //   routeSteps,
            // });
          }
        }
      }
    },
  },
  methods: {
    transformDirection(direction) {
      // 转换方向
      const directionMap = {
        北: "north",
        南: "south",
        东: "east",
        西: "west",
        东北: "northeast",
        西北: "northwest",
        东南: "southeast",
        西南: "southwest",
      };
      return directionMap[direction];
    },
  },
});
