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
    toolParams: {
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
        width: 20,
        height: 30,
      },
    ],
    adcode: "", // 地址邮政编码
    routeSteps: [], // 路线规划步骤
    routeMode: "", // driving, bicycling, walking
    routeInfo: {},
  },
  lifetimes: {
    attached() {
      // 根据 name 区分处理不同 tool 调用情况
      const { name, toolData } = this.data;
      // 将详细的结构化地址转换为经纬度坐标
      if (name === "geocoder") {
        const { content } = toolData;
        if (content[0].type === "text") {
          const contentData = JSON.parse(content[0].text);
          const {
            result: {
              location: { lat, lng },
            },
          } = contentData;
          this.setData({
            latitude: lat,
            longitude: lng,
            markers: [
              {
                id: 1,
                latitude: lat,
                longitude: lng,
                width: 20,
                height: 30,
              },
            ],
          });
        }
      }
      // 地点搜索 查指定位置周边的点信息
      if (name === "placeSearchNearby") {
        // console.log("toolData", toolData);
        const { content } = toolData;
        if (content[0].type === "text") {
          const { location } = this.data.toolParams;
          const locationInfo = location.split(",");
          const contentData = JSON.parse(content[0].text);
          const { data } = contentData;
          this.setData({
            latitude: locationInfo[0],
            longitude: locationInfo[1],
            markers: data.map((item, index) => ({
              id: index,
              latitude: item.location.lat,
              longitude: item.location.lng,
              width: 20,
              height: 30,
            })),
            routeMode: "driving",
            scale: 13,
          });
        }
      }
      // 路线规划
      if (name === "directionDriving") {
        const { content } = toolData;
        if (content[0].type === "text") {
          const { from, to } = this.data.toolParams;
          const fromInfo = from.split(",");
          const toInfo = to.split(",");
          const contentData = JSON.parse(content[0].text);
          const {
            result: { routes },
          } = contentData;

          if (routes.length) {
            const firstRoute = routes[0];
            const { polyline, steps } = firstRoute; //TODO: 需解压转化为经纬度坐标对数组
            const transformPolyline = this.transformRawPolyline(polyline);
            const startAndEndPair = [
              {
                id: 1,
                latitude: fromInfo[0],
                longitude: fromInfo[1],
                width: 20,
                height: 30,
              },
              {
                id: 2,
                latitude: toInfo[0],
                longitude: toInfo[1],
                width: 20,
                height: 30,
              },
            ];
            this.setData({
              latitude: fromInfo[0],
              longitude: fromInfo[1],
              markers: startAndEndPair,
              polyline: [
                {
                  points: transformPolyline,
                  color: "#1AC36D",
                  width: 4,
                  dottedLine: false,
                },
              ],
              routeMode: "driving",
              routeSteps: steps.map((item) => ({
                icon: this.transformDirection(item.dir_desc),
                instruction: item.instruction,
                distance: item.distance,
              })),
            });
          }

          // const { data } = contentData;
          // this.setData({
          //   latitude: locationInfo[0],
          //   longitude: locationInfo[1],
          //   markers: data.map((item, index) => ({
          //     id: item.index,
          //     latitude: item.location.lat,
          //     longitude: item.location.lng,
          //   })),
          //   routeMode: "driving",
          // });
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
    transformRawPolyline(polyline) {
      let transformPolyline = [];
      for (let i = 2; i < polyline.length; i++) {
        polyline[i] = polyline[i - 2] + polyline[i] / 1000000;
      }
      for (let i = 0; i < polyline.length; i += 2) {
        transformPolyline.push({
          latitude: polyline[i],
          longitude: polyline[i + 1],
        });
      }
      return transformPolyline;
    },
  },
});
