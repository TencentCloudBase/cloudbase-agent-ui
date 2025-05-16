import React, { useEffect, useState } from "react";
import "./index.scss";
import type { ToolCardProps } from "@cloudbase/agent-ui-react";

// 定义天气数据接口
interface WeatherData {
  dayweather: string;
  nightweather: string;
  daytemp: number;
  nighttemp: number;
  date: string;
  dayweatherIcon: string;
  nightweatherIcon: string;
}

// 定义今日天气数据接口
interface TodayWeather {
  daytemp: number;
  nighttemp: number;
  dayweather: string;
  nightweather: string;
  dayweatherIcon: string;
  nightweatherIcon: string;
}

const WeatherComponent: React.FC<ToolCardProps> = ({ name, toolData }) => {
  // 初始化状态
  const [isDay, setIsDay] = useState<boolean>(false);
  const [currentUnit, setCurrentUnit] = useState<string>("°C");
  const [city, setCity] = useState<string>("");
  const [forecasts, setForecasts] = useState<WeatherData[]>([]);
  const [today, setToday] = useState<TodayWeather>({
    daytemp: 0,
    nighttemp: 0,
    dayweather: "",
    nightweather: "",
    dayweatherIcon: "",
    nightweatherIcon: "",
  });

  // 检查当前是否为白天
  const checkIsDay = (): boolean => {
    const currentHour = new Date().getHours();
    return currentHour >= 6 && currentHour < 18;
  };

  // 转换天气类型为图标名称
  const transformWeather = (weather: string): string => {
    const weatherMap: Record<string, string> = {
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
  };

  // 组件挂载时处理数据
  useEffect(() => {
    if (name === "weather" && toolData.content[0]?.type === "text") {
      try {
        const contentData = JSON.parse(toolData.content[0].text);
        const {
          result: { forecast },
        } = contentData;

        const isDayTime = checkIsDay();
        setIsDay(isDayTime);

        if (forecast.length) {
          const todayForecast = forecast[0];
          const { city, district, infos } = todayForecast;
          const todayInfo = infos[0];

          setCity(city);

          const formattedForecasts = infos.map((item: any) => {
            const { date, week, day, night } = item;
            const dateInfo = date.split("-");
            return {
              dayweather: day.weather,
              nightweather: night.weather,
              daytemp: day.temperature,
              nighttemp: night.temperature,
              date: `${dateInfo[1]}/${dateInfo[2]}`,
              dayweatherIcon: transformWeather(day.weather),
              nightweatherIcon: transformWeather(night.weather),
            };
          });

          setForecasts(formattedForecasts);

          setToday({
            daytemp: todayInfo.day.temperature,
            nighttemp: todayInfo.night.temperature,
            dayweather: todayInfo.day.weather,
            nightweather: todayInfo.night.weather,
            dayweatherIcon: transformWeather(todayInfo.day.weather),
            nightweatherIcon: transformWeather(todayInfo.night.weather),
          });
        }
      } catch (error) {
        console.error("解析天气数据时出错:", error);
      }
    }
  }, []);

  return (
    <div className={`container ${isDay ? "day" : "night"}`}>
      <div className="header">
        <div className="temp-container">
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row" }}>
            {today.dayweatherIcon && (
              <img
                className="temp-circle"
                src={`src/components/Weather/assets/${isDay ? today.dayweatherIcon : today.nightweatherIcon}.svg`}
                alt={isDay ? today.dayweather : today.nightweather}
              />
            )}
            <span className="high-low-text">{isDay ? today.dayweather : today.nightweather}</span>
          </div>
        </div>
        <span className="city-text">
          {city} {isDay ? today.daytemp : today.nighttemp}
          {currentUnit}
        </span>
        <span className="high-low-text">
          最高:{today.daytemp}° 最低:{today.nighttemp}°
        </span>
      </div>
      <div className="hourly-container">
        {forecasts.map((item, index) => (
          <div className="hourly-item" key={index}>
            <span className="hour-text">{item.date}</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                className="hour-circle"
                src={`src/components/Weather/assets/${isDay ? item.dayweatherIcon : item.nightweatherIcon}.svg`}
                alt={isDay ? item.dayweather : item.nightweather}
              />
              <span className="hour-text">{isDay ? item.dayweather : item.nightweather}</span>
            </div>
            <span className="hour-temp">
              {item.nighttemp}°~{item.daytemp}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherComponent;
