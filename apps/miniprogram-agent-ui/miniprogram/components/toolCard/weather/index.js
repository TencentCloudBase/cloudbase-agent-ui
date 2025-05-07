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
    isDay: false,
    // currentTemp: 29,
    currentUnit: "°C",
    // highTemp: 33,
    // lowTemp: 21,
    // hourlyUnit: "°C",
    // hourlyData: [
    //   { time: "8AM", temp: 26 },
    //   { time: "9AM", temp: 28 },
    //   { time: "10AM", temp: 30 },
    //   { time: "11AM", temp: 32 },
    //   { time: "12PM", temp: 33 },
    // ],
    city: "",
    forecasts: [],
    today: {},
  },
  lifetimes: {
    attached() {
      // 可以在这里动态设置城市天气数据
      // 根据 name 区分处理不同 tool 调用情况
      const { name, toolData } = this.data;
      if (name === "weather") {
        const { content } = toolData;
        if (content[0].type === "text") {
          const contentData = JSON.parse(content[0].text);
          const {
            result: { forecast },
          } = contentData;
          const isDay = this.checkIsDay();
          if (forecast.length) {
            const todayForecast = forecast[0];
            const { city, district, infos } = todayForecast;
            const todayInfo = infos[0];
            this.setData({
              isDay,
              city,
              forecasts: infos.map((item) => {
                const { date, week, day, night } = item;
                const dateInfo = date.split("-");
                return {
                  // ...item,
                  dayweather: day.weather,
                  nightweather: night.weather,
                  daytemp: day.temperature,
                  nighttemp: night.temperature,
                  date: `${dateInfo[1]}/${dateInfo[2]}`,
                  dayweatherIcon: this.transformWeather(day.weather),
                  nightweatherIcon: this.transformWeather(night.weather),
                };
              }),
              today: {
                daytemp: todayInfo.day.temperature,
                nighttemp: todayInfo.night.temperature,
                dayweather: todayInfo.day.weather,
                nightweather: todayInfo.night.weather,
                dayweatherIcon: this.transformWeather(todayInfo.day.weather),
                nightweatherIcon: this.transformWeather(todayInfo.night.weather),
              },
            });
          }
          // this.setData({
          //   isDay,
          //   city,
          //   forecasts: forecasts.map((item) => {
          //     const { date } = item;
          //     const dateInfo = date.split("-");
          //     return {
          //       ...item,
          //       date: `${dateInfo[1]}/${dateInfo[2]}`,
          //       dayweatherIcon: this.transformWeather(item.dayweather),
          //       nightweatherIcon: this.transformWeather(item.nightweather),
          //     };
          //   }),
          //   today: {
          //     daytemp: forecasts[0].daytemp,
          //     nighttemp: forecasts[0].nighttemp,
          //     daywind: forecasts[0].daywind,
          //     nightwind: forecasts[0].nightwind,
          //     dayweather: forecasts[0].dayweather,
          //     nightweather: forecasts[0].nightweather,
          //     dayweatherIcon: this.transformWeather(forecasts[0].dayweather),
          //     nightweatherIcon: this.transformWeather(forecasts[0].nightweather),
          //   },
          // });
        }
      }
    },
  },
  methods: {
    checkIsDay() {
      const currentHour = new Date().getHours();
      this.setData({
        isDay: currentHour >= 6 && currentHour < 18,
      });
    },
    transformWeather(weather) {
      // 转换天气
      const weatherMap = {
        晴: "sunny",
        多云: "cloudy",
        阴: "overcast",
        雨: "rainy",
        雪: "snowy",
        雷阵雨: "thunderstorm",
        阵雨: "rainy",
        大雨: "rainy",
        中雨: "rainy",
        小雨: "rainy",
        晴间多云: "sunnyovercast",
      };

      return weatherMap[weather] || "sunny";
    },
  },
});
